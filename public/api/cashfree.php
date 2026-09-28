<?php
/**
 * Cashfree Payment Gateway Backend Router for Singlaji (MilesWeb Hosting)
 * Handles secure order creation and verification without exposing secret keys to frontend
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-api-version');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load secure config
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Cashfree configuration file missing on server.']);
    exit;
}
require_once $configFile;

$appId = defined('CASHFREE_APP_ID') ? CASHFREE_APP_ID : '';
$secretKey = defined('CASHFREE_SECRET_KEY') ? CASHFREE_SECRET_KEY : '';
$env = defined('CASHFREE_ENV') ? CASHFREE_ENV : 'TEST';
$apiVersion = defined('CASHFREE_API_VERSION') ? CASHFREE_API_VERSION : '2023-08-01';

$baseUrl = ($env === 'PROD') ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

$action = $_GET['action'] ?? '';
$requestUri = $_SERVER['REQUEST_URI'] ?? '';

// Determine action from URI or query param
if (strpos($requestUri, 'create-order') !== false || $action === 'create-order') {
    $action = 'create-order';
} elseif (strpos($requestUri, 'verify-order') !== false || $action === 'verify-order') {
    $action = 'verify-order';
}

/**
 * Helper to perform secure cURL to Cashfree
 */
function callCashfree($url, $method, $headers, $payload = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $httpHeaders = [];
    foreach ($headers as $k => $v) {
        $httpHeaders[] = "$k: $v";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $httpHeaders);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($payload) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($payload) ? $payload : json_encode($payload));
        }
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['status' => 500, 'data' => ['error' => 'cURL error: ' . $curlErr]];
    }

    $json = json_decode($response, true);
    return ['status' => $httpCode, 'data' => $json !== null ? $json : ['raw' => $response]];
}

$commonHeaders = [
    'x-client-id' => $appId,
    'x-client-secret' => $secretKey,
    'x-api-version' => $apiVersion,
    'Content-Type' => 'application/json',
];

// 1. Create Order
if ($action === 'create-order') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed. Use POST.']);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);

    if (!$body || empty($body['order_amount']) || empty($body['order_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid order payload. Missing order_id or order_amount.']);
        exit;
    }

    $result = callCashfree("$baseUrl/orders", 'POST', $commonHeaders, $body);
    http_response_code($result['status']);
    echo json_encode($result['data']);
    exit;
}

// 2. Verify Order
if ($action === 'verify-order') {
    $orderId = $_GET['order_id'] ?? '';
    if (empty($orderId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing order_id query parameter.']);
        exit;
    }

    $result = callCashfree("$baseUrl/orders/" . urlencode($orderId), 'GET', $commonHeaders);
    http_response_code($result['status']);
    echo json_encode($result['data']);
    exit;
}

// Fallback if neither route matched
http_response_code(404);
echo json_encode(['error' => 'Cashfree API endpoint not found. Use action=create-order or action=verify-order.']);
exit;
