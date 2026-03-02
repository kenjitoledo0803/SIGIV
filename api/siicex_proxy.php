<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$code = $_GET['code'] ?? '';

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'No tariff code provided.']);
    exit;
}

// Ensure the code is strictly numbers and exactly 8 digits if possible, or allow the dot format 0101.21.01
// SIICEX usually takes it without dots for searching in some of its databases, 
// but let's query the specific Notes database URL based on observed patterns or a generic search.

// The SIICEX portal's generic search URL for tariffs (TIGIE2020)
// Warning: SIICEX URLs and architecture change periodically and are legacy.
// We will query the CAAAREM TIGIE 2020 database search endpoint.
$clean_code = str_replace('.', '', $code); // e.g., 01012101

if (strlen($clean_code) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid tariff code format. Minimum 8 digits required.']);
    exit;
}

// Build URL for the specific tariff item in TIGIE 2020/2022
// CAAAREM uses Lotus Domino. The general search format is often something like:
// http://www.siicex-caaarem.org.mx/Bases/TIGIE2020.nsf/4caa80bd19e9258406256b050078593c/$searchForm?SearchView&Query=01012101
$url = "http://www.siicex-caaarem.org.mx/Bases/TIGIE2020.nsf/4caa80bd19e9258406256b050078593c/\$searchForm?SearchView&Query=" . urlencode('"' . $clean_code . '"');

if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(['error' => 'La extensión cURL no está instalada o habilitada en tu servidor PHP.']);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// Mask as a regular browser to avoid blocks
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_TIMEOUT, 20); // Increased timeout
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Ignore SSL errors just in case
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language: es-MX,es;q=0.8,en-US;q=0.5,en;q=0.3',
    'Connection: keep-alive'
]);

$html = curl_exec($ch);

if ($html === false) {
    $curl_error = curl_error($ch);
    http_response_code(500);
    echo json_encode(['error' => 'Fallo de conexión (cURL) hacia SIICEX. Detalles: ' . $curl_error]);
    curl_close($ch);
    exit;
}

$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code(502); // Return 502 Bad Gateway to our frontend if SIICEX fails
    echo json_encode([
        'error' => "SIICEX rechazó la conexión o no está disponible.",
        'siicex_http_code' => $http_code
    ]);
    exit;
}

// Let's create a basic parser using DOMDocument
$dom = new DOMDocument();
libxml_use_internal_errors(true); // Suppress HTML5 parsing warnings for old HTML
$dom->loadHTML($html);
libxml_clear_errors();

$xpath = new DOMXPath($dom);

$response = [
    'query' => $code,
    'sourceUrl' => $url,
    'results' => []
];

// In a Domino SearchView, results are usually in links inside specific font/td tags.
// This is a naive extraction focusing on finding links to specific fraccion pages.
$links = $xpath->query("//a[contains(@href, 'TIGIE2020.nsf')]");

if ($links && $links->length > 0) {
    foreach ($links as $link) {
        $href = $link->getAttribute('href');
        $text = trim(preg_replace('/\s+/', ' ', $link->nodeValue));
        
        // Only grab links that seem to correspond to tariff results (often just the code and description)
        // If it starts with the code, it's a good match.
        if (strpos(str_replace('.', '', $text), $clean_code) !== false) {
            
            // To provide *real* value, we need to fetch the detail page of this specific link.
            $detail_url = "http://www.siicex-caaarem.org.mx" . $href;
            
            // Let's fetch the actual detail page to grab the Arancel and Restrictions
            $ch_detail = curl_init();
            curl_setopt($ch_detail, CURLOPT_URL, $detail_url);
            curl_setopt($ch_detail, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch_detail, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch_detail, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            $detail_html = curl_exec($ch_detail);
            curl_close($ch_detail);
            
            // Parse Detail
            $detail_dom = new DOMDocument();
            libxml_use_internal_errors(true);
            $detail_dom->loadHTML($detail_html);
            libxml_clear_errors();
            $detail_xpath = new DOMXPath($detail_dom);
            
            // Extract the big description blocks (often in a cell with "MERCANCIA")
            $description_node = $detail_xpath->query("//td[contains(text(), 'Descripción')]/following-sibling::td");
            $description = $description_node->length > 0 ? trim($description_node->item(0)->nodeValue) : $text;
            
            // Extract IGI (Import tariff) - SIICEX often uses specific text matching like "Arancel(IVA)" or tables
            $arancel_nodes = $detail_xpath->query("//td[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'arancel (igi)')]/following-sibling::td");
            $arancel = $arancel_nodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $arancel_nodes->item(0)->nodeValue)) : 'No encontrado/Exento';

            // Extract IVA
            $iva_nodes = $detail_xpath->query("//td[contains(text(), 'I.V.A')]/following-sibling::td");
            $iva = $iva_nodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $iva_nodes->item(0)->nodeValue)) : '16%';

            // Extract Non-Tariff Regulations (REST.Y REG. NO ARANC.) loosely
            // Often inside bold tags or specific tables. We'll grab text blocks that look like regulations
            $rrna_nodes = $detail_xpath->query("//b[contains(text(), 'ARANCELES')]/ancestor::table/following-sibling::table//tr");
            $rrnas = [];
            foreach ($rrna_nodes as $row) {
                 $row_text = trim(preg_replace('/\s+/', ' ', $row->nodeValue));
                 if (!empty($row_text) && strlen($row_text) > 20) {
                     // Very naive extraction given the chaotic nature of Lotus Domino HTML
                     $rrnas[] = $row_text;
                 }
            }

            $currentResult = [
                'code' => $text,
                'description' => $description,
                'arancel_igi' => $arancel,
                'iva' => $iva,
                'raw_rrna_snippets' => array_slice($rrnas, 0, 5), // Take top 5 snippets block
                'siicex_url' => $detail_url
            ];
            
            $response['results'][] = $currentResult;
            
            // If we found a perfect match, break. SIICEX search is slow, doing 1 deep dive is enough.
            break;
        }
    }
}

// If no precise results through the search form, return a mock or not found
if (empty($response['results'])) {
     $response['message'] = "No se encontraron resultados exactos en SIICEX para: " . $code;
}

echo json_encode($response);
?>
