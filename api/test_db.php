<?php
require_once 'db_config.php';

header('Content-Type: text/plain');

echo "Testing Database Connection...\n";
echo "Host: " . DB_HOST . "\n";
echo "User: " . DB_USER . "\n";
echo "DB Name: " . DB_NAME . "\n";

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5, // 5 seconds timeout
    ];

    $start = microtime(true);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $end = microtime(true);

    echo "✅ Connection Successful!\n";
    echo "Time taken: " . round(($end - $start) * 1000, 2) . " ms\n";
    
    // Test query
    $stmt = $pdo->query("SELECT VERSION()");
    $version = $stmt->fetchColumn();
    echo "MySQL Version: " . $version . "\n";

} catch (PDOException $e) {
    echo "❌ Connection Failed!\n";
    echo "Error Code: " . $e->getCode() . "\n";
    echo "Error Message: " . $e->getMessage() . "\n";
}
?>
