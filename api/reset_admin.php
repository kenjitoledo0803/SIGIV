<?php
require_once 'db_config.php';

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $username = 'admin';
    $password = 'admin123';
    $email = 'admin@example.com';
    $role = 'ADMIN';
    
    // Generate secure hash
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Check if admin exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $exists = $stmt->fetch();

    if ($exists) {
        // Update existing
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = ?");
        $stmt->execute([$hash, $username]);
        echo json_encode(['status' => 'success', 'message' => "Password for user '$username' updated to '$password'"]);
    } else {
        // Insert new
        $id = uniqid();
        $stmt = $pdo->prepare("INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $username, $email, $hash, $role]);
        echo json_encode(['status' => 'success', 'message' => "User '$username' created with password '$password'"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
