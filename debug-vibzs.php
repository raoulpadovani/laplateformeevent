<?php
header('Content-Type: application/json; charset=utf-8');

$API_KEY = 'AIzaSyA-RjXfg1Jw9mbIKoBirK6gXJBAcQJwhFk';
$CALENDAR_ID = 'padovaniraoul@gmail.com';

$now = date('Y-m-d\TH:i:s\Z', time());
$future = date('Y-m-d\TH:i:s\Z', time() + (60 * 60 * 24 * 90));

$url = "https://www.googleapis.com/calendar/v3/calendars/" . urlencode($CALENDAR_ID) . "/events?"
    . "key=" . $API_KEY
    . "&maxResults=20"
    . "&orderBy=startTime"
    . "&singleEvents=true"
    . "&timeMin=" . urlencode($now)
    . "&timeMax=" . urlencode($future);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

// Afficher uniquement l'événement "vibzs"
if (isset($data['items'])) {
    foreach ($data['items'] as $event) {
        if (strtolower($event['summary']) === 'vibzs') {
            echo "=== DESCRIPTION BRUTE ===\n";
            echo $event['description'] ?? 'Pas de description';
            echo "\n\n=== JSON ===\n";
            echo json_encode(array(
                "title" => $event['summary'],
                "description" => $event['description'] ?? null
            ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }
}

echo json_encode(array("error" => "Événement 'vibzs' non trouvé"));
?>
