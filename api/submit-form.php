<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Детальное логирование
file_put_contents('/home/fattoriaby/public_html/form-debug.log', 
    "=== БИТРИКС ОТПРАВКА ===\n" .
    date('Y-m-d H:i:s') . " - RAW DATA: " . print_r($data, true) . "\n",
    FILE_APPEND | LOCK_EX
);

if (empty($data['name']) || empty($data['contact'])) {
    echo json_encode(['success' => false, 'message' => 'Заполните имя и телефон']);
    exit;
}

// Bitrix24 configuration
$bitrixWebhookUrl = 'https://b24-7f121e.bitrix24.by/rest/1/p1a3njih5vb5x0oj/';

// Альтернативная структура данных для Битрикса
$leadData = [
    'TITLE' => 'Заявка с сайта: ' . ($data['name'] ?? 'Клиент'),
    'NAME' => $data['name'] ?? 'Не указано',
    'SECOND_NAME' => '',
    'LAST_NAME' => '',
    'STATUS_ID' => 'NEW',
    'OPENED' => 'Y',
    'ASSIGNED_BY_ID' => 1,
    'CURRENCY_ID' => 'BYN',
    'OPPORTUNITY' => 0,
    'SOURCE_ID' => 'WEB',
    'SOURCE_DESCRIPTION' => $data['source'] ?? 'Главная страница',
    'COMMENTS' => $data['message'] ?? 'Запрос с сайта'
];

// Добавляем телефон правильно
if (!empty($data['contact'])) {
    $leadData['PHONE'] = [['VALUE' => $data['contact'], 'VALUE_TYPE' => 'WORK']];
}

// Добавляем email если есть
if (!empty($data['email'])) {
    $leadData['EMAIL'] = [['VALUE' => $data['email'], 'VALUE_TYPE' => 'WORK']];
}

file_put_contents('/home/fattoriaby/public_html/form-debug.log', 
    date('Y-m-d H:i:s') . " - BITRIX FIELDS: " . print_r($leadData, true) . "\n",
    FILE_APPEND | LOCK_EX
);

$requestData = [
    'method' => 'crm.lead.add',
    'params' => ['fields' => $leadData],
    'id' => 1
];

$ch = curl_init($bitrixWebhookUrl . 'crm.lead.add.json');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

file_put_contents('/home/fattoriaby/public_html/form-debug.log', 
    date('Y-m-d H:i:s') . " - BITRIX RESPONSE: " . $response . " (HTTP: $httpCode)\n\n",
    FILE_APPEND | LOCK_EX
);

$bitrixResponse = json_decode($response, true);

if ($bitrixResponse && isset($bitrixResponse['result'])) {
    echo json_encode(['success' => true, 'message' => 'Заявка #' . $bitrixResponse['result'] . ' отправлена!', 'leadId' => $bitrixResponse['result']]);
} else {
    $error = $bitrixResponse['error_description'] ?? 'Unknown error';
    echo json_encode(['success' => false, 'message' => 'Ошибка CRM: ' . $error]);
}
?>
