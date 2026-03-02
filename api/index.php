<?php
// IMS API - MySQL Backend
require_once 'db_config.php';

header('Content-Type: application/json');
// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS
$allowed_origins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://sigiv.site',
    'https://sigiv.site'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins) || empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Start Session & Check Auth
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow Login/Register/Logout without auth (handled in auth.php, but this is index.php for DATA)
// So ALL requests to index.php MUST be authenticated.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // If connection fails, return 500 but don't expose credentials
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $action = $_GET['action'] ?? '';

        if ($action === 'downloadDocument') {
            $id = $_GET['id'] ?? '';
            if (!$id) throw new Exception("Missing document ID");
            
            $stmt = $pdo->prepare("SELECT url FROM documents WHERE id = ?");
            $stmt->execute([$id]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($doc) {
                echo json_encode(['status' => 'success', 'url' => $doc['url']]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Document not found']);
            }
            exit;
        }

        // Fetch all data and reconstruct JSON structure
        // Helper to convert snake_case keys to camelCase
        function mapRowsToCamel($rows) {
            return array_map(function($row) {
                $newRow = [];
                foreach ($row as $key => $value) {
                    // Convert key: snake_case -> camelCase
                    $camelKey = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $key))));
                    $newRow[$camelKey] = $value;
                }
                return $newRow;
            }, $rows);
        }

        // Fetch and Convert ALL data
        $data = [
            'suppliers' => mapRowsToCamel($pdo->query("SELECT * FROM suppliers")->fetchAll(PDO::FETCH_ASSOC)),
            'materials' => mapRowsToCamel($pdo->query("SELECT * FROM materials")->fetchAll(PDO::FETCH_ASSOC)),
            'consolidations' => mapRowsToCamel($pdo->query("SELECT * FROM consolidations")->fetchAll(PDO::FETCH_ASSOC)),
            'shipments' => mapRowsToCamel($pdo->query("SELECT * FROM shipments")->fetchAll(PDO::FETCH_ASSOC)),
            'importFiles' => mapRowsToCamel($pdo->query("SELECT * FROM import_files")->fetchAll(PDO::FETCH_ASSOC)),
            'documents' => [], // Will be attached
            'financials' => [],
            'savingsProjects' => mapRowsToCamel($pdo->query("SELECT * FROM savings_projects")->fetchAll(PDO::FETCH_ASSOC)),
            'savingsEntries' => mapRowsToCamel($pdo->query("SELECT * FROM savings_entries")->fetchAll(PDO::FETCH_ASSOC)),
            'savingsLogs' => mapRowsToCamel($pdo->query("SELECT * FROM savings_logs")->fetchAll(PDO::FETCH_ASSOC)),
            'savingsDocuments' => mapRowsToCamel($pdo->query("SELECT * FROM savings_documents")->fetchAll(PDO::FETCH_ASSOC))
        ];

        $allCosts = mapRowsToCamel($pdo->query("SELECT * FROM costs")->fetchAll(PDO::FETCH_ASSOC));
        // OPTIMIZATION: Do NOT fetch 'url' (Base64 content) here. It's too heavy.
        $allDocs = mapRowsToCamel($pdo->query("SELECT id, parent_id, parent_type, name, type, date FROM documents")->fetchAll(PDO::FETCH_ASSOC));

        // Fetch Items
        $allItems = [];
        try {
            $allItems = mapRowsToCamel($pdo->query("SELECT * FROM import_items")->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {}

        // Helper to attach children (using camelCase keys now)
        foreach ($data['importFiles'] as &$file) {
            $file['costs'] = array_filter($allCosts, fn($c) => $c['parentId'] === $file['id'] && $c['parentType'] === 'FILE');
            $file['documents'] = array_filter($allDocs, fn($d) => $d['parentId'] === $file['id'] && $d['parentType'] === 'FILE');
            
            // Attach Items
            $fileItems = array_filter($allItems, fn($i) => $i['importFileId'] === $file['id']);
            $file['items'] = array_map(fn($i) => [
                'materialId' => $i['materialId'],
                'quantity' => (float)$i['quantity'],
                'netPrice' => (float)$i['netPrice'],
                'uom' => $i['uom']
            ], $fileItems);

            // Re-index arrays
            $file['costs'] = array_values($file['costs']);
            $file['documents'] = array_values($file['documents']);
            $file['items'] = array_values($file['items']);
        }
        unset($file);

        foreach ($data['shipments'] as &$shipment) {
            $shipment['costs'] = array_filter($allCosts, fn($c) => $c['parentId'] === $shipment['id'] && $c['parentType'] === 'SHIPMENT');
            $shipment['documents'] = array_filter($allDocs, fn($d) => $d['parentId'] === $shipment['id'] && $d['parentType'] === 'SHIPMENT');
            $shipment['costs'] = array_values($shipment['costs']);
            $shipment['documents'] = array_values($shipment['documents']);
        }
        unset($shipment);

        foreach ($data['consolidations'] as &$consolidation) {
             $consolidation['costs'] = array_filter($allCosts, fn($c) => $c['parentId'] === $consolidation['id'] && $c['parentType'] === 'CONSOLIDATION');
             $consolidation['costs'] = array_values($consolidation['costs']);
        }
        unset($consolidation);

        // Attach Entries to Projects
        foreach ($data['savingsProjects'] as &$project) {
            $project['entries'] = array_filter($data['savingsEntries'], fn($e) => $e['projectId'] === $project['id']);
            $project['entries'] = array_values($project['entries']);
            
            $project['logs'] = array_filter($data['savingsLogs'], fn($l) => $l['projectId'] === $project['id']);
            $project['logs'] = array_values($project['logs']);

            $project['documents'] = array_filter($data['savingsDocuments'], fn($d) => $d['projectId'] === $project['id']);
            $project['documents'] = array_values($project['documents']);
        }
        unset($project);

        echo json_encode($data);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // GRANULAR CRUD OPERATIONS
    
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);
    
    $resource = $_GET['resource'] ?? '';
    $action = $_GET['action'] ?? ''; // create, update, delete

    if (!$resource && !$action) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing resource or action']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        switch ($action) {
            case 'create':
                handleCreate($pdo, $resource, $payload);
                break;
            case 'update':
                handleUpdate($pdo, $resource, $payload);
                break;
            case 'delete':
                handleDelete($pdo, $resource, $payload);
                break;
            case 'addDocument':
                handleAddDocument($pdo, $payload);
                break;
            case 'deleteDocument':
                handleDeleteDocument($pdo, $payload);
                break;
            case 'addCost':
                handleAddCost($pdo, $payload);
                break;
            case 'deleteCost':
                handleDeleteCost($pdo, $payload);
                break;
            case 'batch':
                // Batch Creation
                if (!is_array($payload)) {
                    throw new Exception("Batch payload must be an array");
                }
                foreach ($payload as $item) {
                    handleCreate($pdo, $resource, $item);
                }
                break;
            case 'reset':
                // Reset Database
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
                $pdo->exec("TRUNCATE TABLE suppliers");
                $pdo->exec("TRUNCATE TABLE materials");
                $pdo->exec("TRUNCATE TABLE import_files");
                $pdo->exec("TRUNCATE TABLE shipments");
                $pdo->exec("TRUNCATE TABLE consolidations");
                $pdo->exec("TRUNCATE TABLE documents");
                $pdo->exec("TRUNCATE TABLE costs");
                $pdo->exec("TRUNCATE TABLE import_items");
                $pdo->exec("TRUNCATE TABLE savings_projects");
                $pdo->exec("TRUNCATE TABLE savings_entries");
                $pdo->exec("TRUNCATE TABLE savings_logs");
                $pdo->exec("TRUNCATE TABLE savings_documents");
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                break;
            default:
                throw new Exception("Invalid action: $action");
        }

        $pdo->commit();
        echo json_encode(['status' => 'success']);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

// --- HANDLER FUNCTIONS ---

function handleCreate($pdo, $resource, $data) {
    switch ($resource) {
        case 'importFiles':
            $stmt = $pdo->prepare("INSERT INTO import_files (id, reference_number, shipment_id, supplier_id, status, eta, ata, pedimento, customs_broker, regulatory_status, created_at, incoterms, incoterms_place, country_origin, net_order_value, currency, gross_weight, document_date, mot, plant_arrival_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reference_number=VALUES(reference_number), status=VALUES(status), net_order_value=VALUES(net_order_value)");
            $stmt->execute([
                $data['id'], $data['referenceNumber'], $data['shipmentId'], $data['supplierId'], $data['status'], 
                $data['eta'], $data['ata'], $data['pedimento'], $data['customsBroker'], $data['regulatoryStatus'], 
                $data['createdAt'], $data['incoterms'], $data['incotermsPlace'], $data['countryOrigin'], 
                $data['netOrderValue'], $data['currency'], $data['grossWeight'], $data['documentDate'], $data['mot'], $data['plantArrivalDate'] ?? null
            ]);
            
            updateCosts($pdo, $data['id'], 'FILE', $data['costs'] ?? []);
            updateItems($pdo, $data['id'], $data['items'] ?? []);
            break;

        case 'shipments':
            $stmt = $pdo->prepare("INSERT INTO shipments (id, reference, status, consolidation_id, created_at, plant_arrival_date) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reference=VALUES(reference), status=VALUES(status)");
            $stmt->execute([$data['id'], $data['reference'], $data['status'], $data['consolidationId'], $data['createdAt'], $data['plantArrivalDate'] ?? null]);
            updateCosts($pdo, $data['id'], 'SHIPMENT', $data['costs'] ?? []);
            break;
            
        case 'consolidations':
            $stmt = $pdo->prepare("INSERT INTO consolidations (id, reference, status, description, created_at, plant_arrival_date) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reference=VALUES(reference), status=VALUES(status)");
            $stmt->execute([$data['id'], $data['reference'], $data['status'], $data['description'], $data['createdAt'], $data['plantArrivalDate'] ?? null]);
            updateCosts($pdo, $data['id'], 'CONSOLIDATION', $data['costs'] ?? []);
            break;

        case 'suppliers':
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, tax_id, payment_terms, bank_details) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)");
            $stmt->execute([$data['id'], $data['name'], $data['taxId'], $data['paymentTerms'], $data['bankDetails']]);
            break;

        case 'materials':
            $stmt = $pdo->prepare("INSERT INTO materials (id, sku, description, hs_code, nico, cas_number, is_hazardous, uom, supplier_id, regulations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE sku=VALUES(sku)");
            $stmt->execute([
                $data['id'], $data['sku'], $data['description'], $data['hsCode'], $data['nico'], 
                $data['casNumber'], $data['isHazardous'] ? 1 : 0, $data['uom'], $data['supplierId'],
                $data['regulations'] ?? null
            ]);
            break;

        case 'savingsProjects':
            $stmt = $pdo->prepare("INSERT INTO savings_projects (id, name, description, category, status, estimated_savings, currency, owner, progress, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)");
            $stmt->execute([
                $data['id'], $data['name'], $data['description'], $data['category'] ?? 'General', $data['status'], 
                $data['estimatedSavings'], $data['currency'], $data['owner'], 
                $data['progress'], $data['startDate'], $data['endDate'], $data['createdAt']
            ]);
            break;

        case 'savingsEntries':
            $stmt = $pdo->prepare("INSERT INTO savings_entries (id, project_id, amount, currency, date, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], $data['projectId'], $data['amount'], $data['currency'], 
                $data['date'], $data['description'], $data['createdAt']
            ]);
            break;

        case 'savingsLogs':
            $stmt = $pdo->prepare("INSERT INTO savings_logs (id, project_id, action, details, user, created_at) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], $data['projectId'], $data['action'], $data['details'],
                $data['user'] ?? 'System', $data['createdAt']
            ]);
            break;

        case 'savingsDocuments':
            $stmt = $pdo->prepare("INSERT INTO savings_documents (id, project_id, filename, file_url, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], $data['projectId'], $data['filename'], $data['fileUrl'],
                $data['uploadedBy'] ?? 'System', $data['createdAt']
            ]);
            break;
    }
}

function handleUpdate($pdo, $resource, $data) {
    $id = $data['id'];
    switch ($resource) {
        case 'materials':
            $stmt = $pdo->prepare("UPDATE materials SET sku=?, description=?, hs_code=?, nico=?, cas_number=?, is_hazardous=?, uom=?, supplier_id=?, regulations=? WHERE id=?");
            $stmt->execute([
                $data['sku'], $data['description'], $data['hsCode'], $data['nico'], 
                $data['casNumber'], $data['isHazardous'] ? 1 : 0, $data['uom'], $data['supplierId'], 
                $data['regulations'] ?? null,
                $id
            ]);
            break;

        case 'savingsProjects':
            $stmt = $pdo->prepare("UPDATE savings_projects SET name=?, description=?, category=?, status=?, estimated_savings=?, currency=?, owner=?, progress=?, start_date=?, end_date=? WHERE id=?");
            $stmt->execute([
                $data['name'], $data['description'], $data['category'] ?? 'General', $data['status'], 
                $data['estimatedSavings'], $data['currency'], $data['owner'], 
                $data['progress'], $data['startDate'], $data['endDate'],
                $id
            ]);
            break;

        case 'importFiles':
            $stmt = $pdo->prepare("UPDATE import_files SET reference_number=?, shipment_id=?, supplier_id=?, status=?, eta=?, ata=?, pedimento=?, customs_broker=?, regulatory_status=?, incoterms=?, incoterms_place=?, country_origin=?, net_order_value=?, currency=?, gross_weight=?, document_date=?, mot=?, plant_arrival_date=? WHERE id=?");
            $stmt->execute([
                $data['referenceNumber'], $data['shipmentId'], $data['supplierId'], $data['status'], 
                $data['eta'], $data['ata'], $data['pedimento'], $data['customsBroker'], $data['regulatoryStatus'], 
                $data['incoterms'], $data['incotermsPlace'], $data['countryOrigin'], 
                $data['netOrderValue'], $data['currency'], $data['grossWeight'], $data['documentDate'], $data['mot'], $data['plantArrivalDate'] ?? null,
                $id
            ]);
            updateCosts($pdo, $id, 'FILE', $data['costs'] ?? []);
            updateItems($pdo, $id, $data['items'] ?? []);
            break;

        case 'shipments':
            $stmt = $pdo->prepare("UPDATE shipments SET reference=?, status=?, consolidation_id=?, plant_arrival_date=? WHERE id=?");
            $stmt->execute([$data['reference'], $data['status'], $data['consolidationId'], $data['plantArrivalDate'] ?? null, $id]);
            updateCosts($pdo, $id, 'SHIPMENT', $data['costs'] ?? []);
            break;

        case 'consolidations':
            $stmt = $pdo->prepare("UPDATE consolidations SET reference=?, status=?, description=?, plant_arrival_date=? WHERE id=?");
            $stmt->execute([$data['reference'], $data['status'], $data['description'], $data['plantArrivalDate'] ?? null, $id]);
            updateCosts($pdo, $id, 'CONSOLIDATION', $data['costs'] ?? []);
            break;
            
        case 'suppliers':
            $stmt = $pdo->prepare("UPDATE suppliers SET name=?, tax_id=?, payment_terms=?, bank_details=? WHERE id=?");
            $stmt->execute([$data['name'], $data['taxId'], $data['paymentTerms'], $data['bankDetails'], $id]);
            break;
    }
}

function handleDelete($pdo, $resource, $data) {
    $id = $data['id'];
    // Manual Cascade Delete for children tables
    if ($resource === 'importFiles') {
        $pdo->prepare("DELETE FROM costs WHERE parent_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM documents WHERE parent_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM import_items WHERE import_file_id = ?")->execute([$id]); 
        $pdo->prepare("DELETE FROM import_files WHERE id = ?")->execute([$id]);
    } 
    elseif ($resource === 'shipments') {
        $pdo->prepare("DELETE FROM costs WHERE parent_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM documents WHERE parent_id = ?")->execute([$id]);
        // Unlink children POs
        $pdo->prepare("UPDATE import_files SET shipment_id = NULL WHERE shipment_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM shipments WHERE id = ?")->execute([$id]);
    }
    elseif ($resource === 'consolidations') {
        $pdo->prepare("DELETE FROM costs WHERE parent_id = ?")->execute([$id]);
        // Unlink children Shipments
        $pdo->prepare("UPDATE shipments SET consolidation_id = NULL WHERE consolidation_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM consolidations WHERE id = ?")->execute([$id]);
    }
    elseif ($resource === 'suppliers') {
        $pdo->prepare("DELETE FROM suppliers WHERE id = ?")->execute([$id]);
    }
    elseif ($resource === 'materials') {
        $pdo->prepare("DELETE FROM materials WHERE id = ?")->execute([$id]);
    }
    elseif ($resource === 'savingsProjects') {
        $pdo->prepare("DELETE FROM savings_entries WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM savings_logs WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM savings_documents WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM savings_projects WHERE id = ?")->execute([$id]);
    }
    elseif ($resource === 'savingsEntries') {
        $pdo->prepare("DELETE FROM savings_entries WHERE id = ?")->execute([$id]);
    }
    elseif ($resource === 'savingsDocuments') {
        $pdo->prepare("DELETE FROM savings_documents WHERE id = ?")->execute([$id]);
    }
}

function handleAddDocument($pdo, $data) {
    $stmt = $pdo->prepare("INSERT INTO documents (id, parent_id, parent_type, name, url, type, date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['id'], $data['parentId'], $data['parentType'], 
        $data['name'], $data['url'], $data['type'], $data['date']
    ]);
}

function handleDeleteDocument($pdo, $data) {
    $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
    $stmt->execute([$data['id']]);
}

function handleAddCost($pdo, $data) {
    $stmt = $pdo->prepare("INSERT INTO costs (id, parent_id, parent_type, type, amount, currency, exchange_rate, description, pdf_url, file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['id'], $data['parentId'], $data['parentType'], 
        $data['type'], $data['amount'], $data['currency'], 
        $data['exchangeRate'], $data['description'], 
        $data['pdfUrl'], $data['fileName']
    ]);
}

function handleDeleteCost($pdo, $data) {
    $stmt = $pdo->prepare("DELETE FROM costs WHERE id = ?");
    $stmt->execute([$data['id']]);
}

function updateCosts($pdo, $parentId, $parentType, $costs) {
    // 1. Delete existing costs
    $pdo->prepare("DELETE FROM costs WHERE parent_id = ? AND parent_type = ?")->execute([$parentId, $parentType]);

    // 2. Insert new costs
    $stmtCost = $pdo->prepare("INSERT INTO costs (id, parent_id, parent_type, type, amount, currency, exchange_rate, description, pdf_url, file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($costs as $c) {
        $stmtCost->execute([$c['id'], $parentId, $parentType, $c['type'], $c['amount'], $c['currency'], $c['exchangeRate'], $c['description'], $c['pdfUrl'], $c['fileName']]);
    }
}

function updateItems($pdo, $fileId, $items) {
    $pdo->prepare("DELETE FROM import_items WHERE import_file_id = ?")->execute([$fileId]);

    $stmt = $pdo->prepare("INSERT INTO import_items (import_file_id, material_id, quantity, net_price, uom) VALUES (?, ?, ?, ?, ?)");
    foreach ($items as $item) {
        $stmt->execute([$fileId, $item['materialId'], $item['quantity'], $item['netPrice'] ?? 0, $item['uom'] ?? 'EA']);
    }
}
?>
