<?php
require_once 'db_config.php';

header('Content-Type: application/json');

$response = [
    'post_max_size' => ini_get('post_max_size'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time')
];

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['max_allowed_packet'] = $row ? $row['Value'] : 'Unknown';
} catch (Exception $e) {
    $response['db_error'] = $e->getMessage();
}

echo json_encode($response);
?>
