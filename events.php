<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ⚠️ REMPLACEZ CES VALEURS PAR LES VÔTRES ⚠️
$API_KEY = 'AIzaSyA-RjXfg1Jw9mbIKoBirK6gXJBAcQJwhFk'; // Voir instructions ci-dessous
$CALENDAR_ID = 'padovaniraoul@gmail.com'; // Votre email Gmail

// Récupérer les événements depuis Google Calendar API
function getGoogleCalendarEvents() {
    global $API_KEY, $CALENDAR_ID;
    
    $now = date('Y-m-d\TH:i:s\Z', time());
    $future = date('Y-m-d\TH:i:s\Z', time() + (60 * 60 * 24 * 90)); // +90 jours
    
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
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return array("error" => "Erreur curl: " . $error, "items" => array());
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['error'])) {
        return array("error" => "API Error: " . $data['error']['message'], "items" => array());
    }
    
    return $data;
}

// Essayer de récupérer les vrais événements
if ($API_KEY !== 'METTEZ_VOTRE_API_KEY_ICI') {
    $events = getGoogleCalendarEvents();
    echo json_encode($events);
} else {
    // Sinon, retourner des événements d'exemple
    $events = array(
        "items" => array(
            array(
                "id" => "1",
                "summary" => "🎤 Concert - La Plateforme Events",
                "description" => "Un concert live extraordinaire avec les meilleurs artistes de la région.",
                "location" => "Salle principale - La Plateforme",
                "start" => array(
                    "dateTime" => date('Y-m-d\TH:i:s', strtotime('+3 days')) . "Z"
                ),
                "htmlLink" => "#"
            ),
            array(
                "id" => "2",
                "summary" => "🎭 Soirée Théâtre",
                "description" => "Une soirée théâtre mémorable avec des acteurs professionnels.",
                "location" => "Théâtre communal",
                "start" => array(
                    "dateTime" => date('Y-m-d\TH:i:s', strtotime('+5 days 19:00')) . "Z"
                ),
                "htmlLink" => "#"
            )
        ),
        "warning" => "ℹ️ Événements d'exemple. Mettez à jour events.php avec votre API_KEY pour voir vos vrais événements!"
    );
    echo json_encode($events);
}
?>
