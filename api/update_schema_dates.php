<?php
// api/update_schema_dates.php
require_once 'db_config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Updating schema to support DateTime for plant_arrival_date...\n";

    // Update consolidations
    $pdo->exec("ALTER TABLE consolidations MODIFY plant_arrival_date DATETIME");
    echo "Updated consolidations table.\n";

    // Update shipments
    $pdo->exec("ALTER TABLE shipments MODIFY plant_arrival_date DATETIME");
    echo "Updated shipments table.\n";

    // Update import_files
    $pdo->exec("ALTER TABLE import_files MODIFY plant_arrival_date DATETIME");
    echo "Updated import_files table.\n";

    echo "Schema update complete successfully.\n";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage() . "\n");
}
?>
