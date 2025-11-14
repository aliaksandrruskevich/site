<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$unid = $_GET['unid'] ?? 'TEST';

echo json_encode([
    'success' => true, 
    'data' => [
        'unid' => $unid,
        'title' => 'Тест из PHP: ' . $unid,
        'price' => 100000,
        'currency' => 'USD',
        'type' => 'Квартира',
        'rooms' => '3',
        'area' => '85',
        'location' => 'Минск',
        'description' => 'Тестовое описание из PHP API',
        'images' => ['/images/property1.jpg', '/images/property2.jpg']
    ]
]);
?>
