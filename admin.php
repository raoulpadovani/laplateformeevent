<?php
session_start();

$adminPassword = "admin123";
$eventsFile = 'events.json';
$isAuthenticated = isset($_SESSION['admin_authenticated']) && $_SESSION['admin_authenticated'] === true;

// Login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    if ($_POST['password'] === $adminPassword) {
        $_SESSION['admin_authenticated'] = true;
        $isAuthenticated = true;
    } else {
        $loginError = "Mot de passe incorrect";
    }
}

// Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// Load events
$events = file_exists($eventsFile) ? json_decode(file_get_contents($eventsFile), true) : [];
if (!is_array($events)) $events = [];

// Save event
if ($isAuthenticated && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_event') {
    $eventId = isset($_POST['event_id']) && $_POST['event_id'] !== '' ? intval($_POST['event_id']) : null;
    
    $eventData = [
        'title' => $_POST['title'] ?? '',
        'date' => $_POST['date'] ?? '',
        'time' => $_POST['time'] ?? '',
        'location' => $_POST['location'] ?? '',
        'description' => $_POST['description'] ?? '',
        'ticketLink' => $_POST['ticketLink'] ?? '',
        'price' => $_POST['price'] ?? ''
    ];

    // Handle image upload
    if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
        $uploadDir = 'asset/galerie/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = uniqid('event_') . '.' . $ext;
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
            $eventData['image'] = $filepath;
        }
    }

    if ($eventId === null) {
        $newId = count($events) > 0 ? max(array_column($events, 'id')) + 1 : 1;
        $eventData['id'] = $newId;
        $events[] = $eventData;
    } else {
        $key = array_search($eventId, array_column($events, 'id'));
        if ($key !== false) {
            if (!isset($_FILES['image']) || $_FILES['image']['size'] === 0) {
                $eventData['image'] = $events[$key]['image'] ?? '';
            }
            $eventData['id'] = $eventId;
            $events[$key] = $eventData;
        }
    }

    file_put_contents($eventsFile, json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    header('Location: admin.php');
    exit;
}

// Delete event
if ($isAuthenticated && isset($_GET['delete'])) {
    $eventId = intval($_GET['delete']);
    $events = array_filter($events, function($e) use ($eventId) {
        return $e['id'] !== $eventId;
    });
    $events = array_values($events);
    file_put_contents($eventsFile, json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    header('Location: admin.php');
    exit;
}

// Edit event
$editingEvent = null;
if ($isAuthenticated && isset($_GET['edit'])) {
    $eventId = intval($_GET['edit']);
    foreach ($events as $event) {
        if ($event['id'] === $eventId) {
            $editingEvent = $event;
            break;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Laplateforme Events</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .admin-container { max-width: 1200px; margin: 100px auto; padding: 20px; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #00d4ff; }
        .admin-header h1 { font-size: 32px; letter-spacing: 2px; }
        .admin-header a { background: #ff6b6b; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; }
        .login-box { max-width: 400px; margin: 100px auto; padding: 40px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .login-box h2 { margin-bottom: 30px; text-align: center; }
        .login-box input { width: 100%; padding: 12px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 5px; color: white; }
        .login-box button { width: 100%; padding: 12px; background: #00d4ff; color: #000; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; }
        .error-msg { background: #ff6b6b; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .form-box { background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 40px; max-width: 600px; }
        .form-box h2 { margin-bottom: 30px; color: #00d4ff; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
        .form-group input, .form-group textarea { width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 5px; color: white; font-family: inherit; }
        .form-group textarea { resize: vertical; min-height: 100px; }
        .file-label { display: block; padding: 20px; border: 2px dashed rgba(255, 255, 255, 0.3); border-radius: 5px; text-align: center; cursor: pointer; }
        .file-input { display: none; }
        .image-preview { margin-top: 15px; max-width: 100%; max-height: 200px; border-radius: 5px; }
        .btn-submit, .btn-back { padding: 12px 24px; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; }
        .btn-submit { background: #00d4ff; color: #000; }
        .btn-back { background: #666; color: white; margin-left: 10px; }
        .events-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 40px; }
        .event-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; overflow: hidden; }
        .event-card img { width: 100%; height: 200px; object-fit: cover; }
        .event-card-content { padding: 20px; }
        .event-card-content h3 { margin-bottom: 10px; color: #00d4ff; }
        .event-card-content p { font-size: 13px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px; }
        .event-actions { display: flex; gap: 10px; margin-top: 15px; }
        .event-actions a { flex: 1; padding: 8px; text-align: center; text-decoration: none; border-radius: 5px; font-size: 12px; font-weight: 600; }
        .btn-edit { background: #00d4ff; color: #000; }
        .btn-delete { background: #ff6b6b; color: white; }
    </style>
</head>
<body>
    <div class="admin-container">
        <?php if (!$isAuthenticated): ?>
            <div class="login-box">
                <h2>🔐 Admin</h2>
                <?php if (isset($loginError)): ?>
                    <div class="error-msg"><?php echo $loginError; ?></div>
                <?php endif; ?>
                <form method="POST">
                    <input type="password" name="password" placeholder="Mot de passe" required autofocus>
                    <input type="hidden" name="action" value="login">
                    <button type="submit">Connexion</button>
                </form>
                <p style="margin-top: 20px; text-align: center; color: rgba(255, 255, 255, 0.5);">
                    <a href="index.html" style="color: #00d4ff; text-decoration: none;">← Retour</a>
                </p>
            </div>
        <?php else: ?>
            <header class="header">
  <div class="header-container">
    <div class="logo">
      <img src="asset/logo/event.jpg" alt="Logo Laplateforme Events" class="logo-img">
      <span>LAPLATEFORME<br><small>EVENTS</small></span>
    </div>
    <nav class="nav" id="navMenu">
      <a href="index.html">ACCUEIL</a>
      <a href="agenda.html">AGENDA</a>
      <a href="index.html#telechargements">TÉLÉCHARGEMENTS</a>
      <a href="galerie.html">GALERIE</a>
      <a href="https://www.instagram.com/laplateforme_events/" class="nav-social" title="Instagram">INSTAGRAM</a>
      <a href="#" class="nav-contact" onclick="openContactModal(event)">NOUS CONTACTER</a>
    </nav>
    
      <span></span>
      <span></span>
      <span></span>
    
  
</header>

            <div class="form-box">
                <h2><?php echo $editingEvent ? '✏️ Modifier' : '➕ Créer'; ?></h2>
                <form method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="save_event">
                    <?php if ($editingEvent): ?>
                        <input type="hidden" name="event_id" value="<?php echo $editingEvent['id']; ?>">
                    <?php else: ?>
                        <input type="hidden" name="event_id" value="">
                    <?php endif; ?>

                    <div class="form-group">
                        <label>Titre</label>
                        <input type="text" name="title" required value="<?php echo htmlspecialchars($editingEvent['title'] ?? ''); ?>">
                    </div>

                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="date" required value="<?php echo $editingEvent['date'] ?? ''; ?>">
                    </div>

                    <div class="form-group">
                        <label>Heure</label>
                        <input type="time" name="time" value="<?php echo $editingEvent['time'] ?? ''; ?>">
                    </div>

                    <div class="form-group">
                        <label>Lieu</label>
                        <input type="text" name="location" value="<?php echo htmlspecialchars($editingEvent['location'] ?? ''); ?>">
                    </div>

                    <div class="form-group">
                        <label>Prix</label>
                        <input type="text" name="price" value="<?php echo htmlspecialchars($editingEvent['price'] ?? ''); ?>">
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description"><?php echo htmlspecialchars($editingEvent['description'] ?? ''); ?></textarea>
                    </div>

                    <div class="form-group">
                        <label>Lien billeterie</label>
                        <input type="url" name="ticketLink" value="<?php echo htmlspecialchars($editingEvent['ticketLink'] ?? ''); ?>">
                    </div>

                    <div class="form-group">
                        <label>Photo</label>
                        <label class="file-label">
                            📸 Cliquez
                            <input type="file" name="image" accept="image/*" class="file-input" onchange="previewImage(event)">
                        </label>
                        <div id="imagePreview">
                            <?php if ($editingEvent && isset($editingEvent['image']) && !empty($editingEvent['image'])): ?>
                                <img src="<?php echo htmlspecialchars($editingEvent['image']); ?>" class="image-preview">
                            <?php endif; ?>
                        </div>
                    </div>

                    <div style="margin-top: 30px;">
                        <button type="submit" class="btn-submit">💾 <?php echo $editingEvent ? 'Mettre à jour' : 'Créer'; ?></button>
                        <?php if ($editingEvent): ?>
                            <a href="admin.php" class="btn-back">← Retour</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <h2 style="margin: 40px 0 20px;">📅 Événements (<?php echo count($events); ?>)</h2>
            <?php if (count($events) > 0): ?>
                <div class="events-list">
                    <?php foreach ($events as $event): ?>
                        <div class="event-card">
                            <?php if (isset($event['image']) && !empty($event['image']) && file_exists($event['image'])): ?>
                                <img src="<?php echo htmlspecialchars($event['image']); ?>">
                            <?php else: ?>
                                <div style="width: 100%; height: 200px; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; font-size: 40px;">📸</div>
                            <?php endif; ?>
                            <div class="event-card-content">
                                <h3><?php echo htmlspecialchars($event['title']); ?></h3>
                                <p>📅 <?php echo date('d/m/Y', strtotime($event['date'])); ?></p>
                                <?php if ($event['time']): ?><p>🕐 <?php echo $event['time']; ?></p><?php endif; ?>
                                <div class="event-actions">
                                    <a href="admin.php?edit=<?php echo $event['id']; ?>" class="btn-edit">✏️ Éditer</a>
                                    <a href="admin.php?delete=<?php echo $event['id']; ?>" class="btn-delete" onclick="return confirm('Supprimer?')">🗑️</a>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <p style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 40px;">Aucun événement</p>
            <?php endif; ?>

            
        <?php endif; ?>
    </div>

    <script>
        function previewImage(e) {
            const f = e.target.files[0];
            if (f) {
                const r = new FileReader();
                r.onload = x => document.getElementById('imagePreview').innerHTML = '<img src="' + x.target.result + '" class="image-preview">';
                r.readAsDataURL(f);
            }
        }
    </script>
    <script src="js/admin.js"></script>
</body>
</html>
