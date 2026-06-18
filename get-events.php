<?php
header('Content-Type: application/json; charset=utf-8');

$eventsFile = 'events.json';
$events = file_exists($eventsFile) ? json_decode(file_get_contents($eventsFile), true) : [];

// Trier les événements par date
usort($events, function($a, $b) {
    return strtotime($a['date']) - strtotime($b['date']);
});

echo json_encode($events);
?>
