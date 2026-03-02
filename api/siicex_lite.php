<?php
// Hostinger / Web Application Firewall (WAF) sometimes blocks cURL requests 
// or scripts that look like proxies (e.g. named *_proxy.php). 
// This script uses file_get_contents as a lighter alternative.

error_reporting(0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$code = $_GET['code'] ?? '';

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'No tariff code provided.']);
    exit;
}

$clean_code = str_replace('.', '', $code);

if (strlen($clean_code) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid tariff code format. Minimum 8 digits required.']);
    exit;
}

$url = "http://www.siicex-caaarem.org.mx/Bases/TIGIE2020.nsf/4caa80bd19e9258406256b050078593c/\$searchForm?SearchView&Query=" . urlencode('"' . $clean_code . '"');

// Use stream context instead of cURL to be stealthier against local WAF
$options = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n" .
                    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n",
        'timeout' => 3, // Reduced from 15s to fail quickly when SIICEX is down.
        'ignore_errors' => true
    ]
];

$context = stream_context_create($options);
$html = @file_get_contents($url, false, $context);

if ($html === false) {
    http_response_code(502);
    echo json_encode(['error' => 'No se pudo leer la página de SIICEX (stream_context falló). Revisa que "allow_url_fopen" esté activo en tu PHP.']);
    exit;
}

// Check HTTP response headers from stream
$status_line = $http_response_header[0];
preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
$http_code = $match[1];

if ($http_code != 200) {
    http_response_code(502);
    echo json_encode(['error' => "SIICEX rechazó la conexión (HTTP $http_code)."]);
    exit;
}

// Parse DOM
$dom = new DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML($html);
libxml_clear_errors();

$xpath = new DOMXPath($dom);

$response = [
    'query' => $code,
    'sourceUrl' => $url,
    'results' => []
];

$links = $xpath->query("//a[contains(@href, 'TIGIE2020.nsf')]");

if ($links && $links->length > 0) {
    foreach ($links as $link) {
        $href = $link->getAttribute('href');
        $text = trim(preg_replace('/\s+/', ' ', $link->nodeValue));
        
        if (strpos(str_replace('.', '', $text), $clean_code) !== false) {
            
            $detail_url = "http://www.siicex-caaarem.org.mx" . $href;
            
            // Fetch Detail
            $detail_html = @file_get_contents($detail_url, false, $context);
            if ($detail_html === false) continue;
            
            $detail_dom = new DOMDocument();
            libxml_use_internal_errors(true);
            $detail_dom->loadHTML($detail_html);
            libxml_clear_errors();
            $detail_xpath = new DOMXPath($detail_dom);
            
            // Extract Description
            $description_node = $detail_xpath->query("//td[contains(text(), 'Descripción')]/following-sibling::td");
            $description = $description_node->length > 0 ? trim($description_node->item(0)->nodeValue) : $text;
            
            // Extract IGI
            $arancel_nodes = $detail_xpath->query("//td[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'arancel (igi)')]/following-sibling::td");
            $arancel = $arancel_nodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $arancel_nodes->item(0)->nodeValue)) : 'No encontrado/Exento';

            // Extract IVA
            $iva_nodes = $detail_xpath->query("//td[contains(text(), 'I.V.A')]/following-sibling::td");
            $iva = $iva_nodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $iva_nodes->item(0)->nodeValue)) : '16%';

            // Extract RRNAs
            $rrna_nodes = $detail_xpath->query("//b[contains(text(), 'ARANCELES')]/ancestor::table/following-sibling::table//tr");
            $rrnas = [];
            foreach ($rrna_nodes as $row) {
                 $row_text = trim(preg_replace('/\s+/', ' ', $row->nodeValue));
                 if (!empty($row_text) && strlen($row_text) > 20) {
                     $rrnas[] = $row_text;
                 }
            }

            $response['results'][] = [
                'code' => $text,
                'description' => $description,
                'arancel_igi' => $arancel,
                'iva' => $iva,
                'raw_rrna_snippets' => array_slice($rrnas, 0, 5),
                'siicex_url' => $detail_url
            ];
            
            break;
        }
    }
}

if (empty($response['results'])) {
     $response['message'] = "No se encontraron resultados exactos en SIICEX para: " . $code;
}

echo json_encode($response);
?>
