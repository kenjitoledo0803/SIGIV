<?php
// api/update_schema_savings_robust.php
require_once 'db_config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Updating schema for Robust Features (Categories, Logs, Documents)...\n<br>";

    // 1. Add Category to savings_projects
    try {
        $pdo->exec("ALTER TABLE savings_projects ADD COLUMN category VARCHAR(50) DEFAULT 'General' AFTER description");
        echo "✅ Added 'category' column to 'savings_projects'.\n<br>";
    } catch (PDOException $e) {
        // Column likely exists
        echo "ℹ️ Column 'category' checks out (or already exists).\n<br>";
    }

    // 2. savings_logs
    $sqlLogs = "
    CREATE TABLE IF NOT EXISTS savings_logs (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        user VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES savings_projects(id) ON DELETE CASCADE,
        INDEX (project_id)
    )";
    $pdo->exec($sqlLogs);
    echo "✅ Table 'savings_logs' ready.\n<br>";

    // 3. savings_documents
    $sqlDocs = "
    CREATE TABLE IF NOT EXISTS savings_documents (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        uploaded_by VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES savings_projects(id) ON DELETE CASCADE,
        INDEX (project_id)
    )";
    $pdo->exec($sqlDocs);
    echo "✅ Table 'savings_documents' ready.\n<br>";

    echo "Schema update completed successfully.";

} catch (PDOException $e) {
    die("❌ DB Error: " . $e->getMessage() . "\n");
}
?>
