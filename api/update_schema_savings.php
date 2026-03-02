<?php
// api/update_schema_savings.php
require_once 'db_config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Initialing schema update for Savings Projects module...\n<br>";

    $sql = "
    CREATE TABLE IF NOT EXISTS savings_projects (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'IDEA', -- IDEA, PLAN, EXECUTION, COMPLETED
        estimated_savings DECIMAL(15, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        owner VARCHAR(100),
        progress INT DEFAULT 0,
        start_date DATE,
        end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
    )";

    $pdo->exec($sql);
    echo "✅ Table 'savings_projects' created or already exists.\n<br>";
    echo "Schema update completed successfully.";

} catch (PDOException $e) {
    die("❌ DB Error: " . $e->getMessage() . "\n");
}
?>
