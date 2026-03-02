<?php
// api/update_schema_savings_entries.php
require_once 'db_config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Updating schema for Realized Savings Entries...\n<br>";

    $sql = "
    CREATE TABLE IF NOT EXISTS savings_entries (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        date DATE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES savings_projects(id) ON DELETE CASCADE,
        INDEX (project_id)
    )";

    $pdo->exec($sql);
    echo "✅ Table 'savings_entries' created successfully.\n<br>"; 

} catch (PDOException $e) {
    die("❌ DB Error: " . $e->getMessage() . "\n");
}
?>
