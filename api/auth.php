<?php
// Authentication API
require_once 'db_config.php';

header('Content-Type: application/json');
// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS
$allowed_origins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://sigiv.site',
    'https://sigiv.site'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins) || empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Start Session
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            echo json_encode(['status' => 'success', 'user' => ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']]]);
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
        }

    } elseif ($action === 'register') {
        $username = $input['username'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => 'User already exists']);
            exit;
        }

        // Create User
        $id = uniqid();
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)");
        
        if ($stmt->execute([$id, $username, $email, $hash])) {
            echo json_encode(['status' => 'success', 'message' => 'User registered']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Registration failed']);
        }

    } elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(['status' => 'success', 'message' => 'Logged out']);
    }

} elseif ($method === 'GET') {
    if ($action === 'me') {
        if (isset($_SESSION['user_id'])) {
            $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'user' => ['id' => $_SESSION['user_id'], 'username' => $user['username'] ?? 'User', 'role' => $_SESSION['role']]]);
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
        }
    }
}
?>
