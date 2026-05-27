<?php
header('Content-Type: application/json; charset=utf-8');

$API_KEY = 'AIzaSyD34pXr2PiQO-dYz7wCFDAakEn3JZWQv3I';
$CALENDAR_ID = 'primary';

$now = date('Y-m-d\TH:i:s\Z', time());
$future = date('Y-m-d\TH:i:s\Z', time() + (60 * 60 * 24 * 90));

$url = "https://www.googleapis.com/calendar/v3/calendars/" . urlencode($CALENDAR_ID) . "/events?"
    . "key=" . $API_KEY
    . "&maxResults=20"
    . "&orderBy=startTime"
    . "&singleEvents=true"
    . "&timeMin=" . urlencode($now)
    . "&timeMax=" . urlencode($future);

echo json_encode(array(
    "debug" => array(
        "calendar_id" => $CALENDAR_ID,
        "api_key_first_chars" => substr($API_KEY, 0, 20) . "...",
        "timeMin" => $now,
        "timeMax" => $future,
        "url" => $url
    )
), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

echo "\n\n=== RÉPONSE DE L'API ===\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "Erreur CURL: " . $error;
} else {
    echo "HTTP Code: " . $http_code . "\n\n";
    echo $response;
}
?>
