<?php
require_once 'db_config.php';

header('Content-Type: application/json');

try {
    // Connect
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

    // Read Schema
    $sql = file_get_contents('db_schema.sql');

    // Execute
    // Note: PDO doesn't support multiple queries in one execute() call by default in some configs, 
    // but exec() usually handles it if emulation is off or depending on driver.
    // Safer to split by semicolon if needed, but for simple schemas it often works.
    // Let's try direct exec first.
    
    $pdo->exec($sql);

    echo json_encode(['status' => 'success', 'message' => 'Database schema initialized successfully.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database Error: ' . $e->getMessage(),
        'hint' => 'Check your db_config.php credentials.'
    ]);
}
?>
