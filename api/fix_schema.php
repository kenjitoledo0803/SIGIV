<?php
require_once 'db_config.php';

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fix documents table
    $pdo->exec("ALTER TABLE documents MODIFY url LONGTEXT");
    
    // Fix costs table (pdf_url)
    $pdo->exec("ALTER TABLE costs MODIFY pdf_url LONGTEXT");

    echo json_encode(['status' => 'success', 'message' => 'Schema updated: url columns changed to LONGTEXT']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
