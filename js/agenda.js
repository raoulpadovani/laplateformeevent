const CLIENT_ID = '737594074048-k723hi0vajife7c7mdn1ps0962r3q1t6.apps.googleusercontent.com';
let accessToken = null;
let tokenClient = null;
let eventConfig = {}; // Stockage de la config

// Attendre que Google soit chargé
window.onload = function() {
    console.log('Page chargée');
    
    // Charger la config des événements
    loadEventConfig();
    
    // Charger les événements au démarrage
    loadEventsFromPHP();
    
    if (window.google) {
        console.log('Google API disponible');
        initGoogleSignIn();
    } else {
        console.error('Google API non disponible');
    }

    // Bouton de fallback
    const btn = document.getElementById('googleSignInBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            if (tokenClient) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                console.error('Token client non initialisé');
            }
        });
    }
};

// Charger la configuration des événements
function loadEventConfig() {
    fetch('event-config.json')
    .then(response => response.json())
    .then(data => {
        eventConfig = {};
        data.events.forEach(event => {
            eventConfig[event.title] = {
                image: event.image,
                detailLink: event.detailLink
            };
        });
        console.log('Config chargée:', eventConfig);
    })
    .catch(error => console.warn('Config non trouvée:', error));
}

// Charger les événements depuis PHP
function loadEventsFromPHP() {
    console.log('Chargement des événements depuis PHP...');
    
    fetch('events.php')
    .then(response => response.json())
    .then(data => {
        console.log('Événements chargés:', data);
        displayEvents(data.items || []);
        
        // Montrer les contrôles
        document.getElementById('eventsContainer').style.display = 'grid';
        document.getElementById('toggleBtn').style.display = 'block';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'none';
    })
    .catch(error => {
        console.error('Erreur:', error);
        document.getElementById('eventsContainer').innerHTML = '<div style="grid-column: 1/-1; background: #3a2a2a; border: 1px solid #8a4a4a; color: #ff9999; padding: 20px; border-radius: 5px;">⚠️ Erreur chargement événements</div>';
    });
}

function initGoogleSignIn() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            callback: handleTokenResponse,
        });
        console.log('Token client initialisé');
    } catch (err) {
        console.error('Erreur initTokenClient:', err);
    }
}

function handleTokenResponse(response) {
    console.log('Token reçu');
    if (response.access_token) {
        accessToken = response.access_token;
        onSignIn();
    }
}

function onSignIn() {
    console.log('SignIn réussi');
    // Récupérer les infos utilisateur
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Infos utilisateur:', data);
        document.getElementById('userName').textContent = data.name || data.email;
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('loginContainer').style.display = 'none';
        
        loadEvents();
    })
    .catch(err => {
        console.error('Erreur userinfo:', err);
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('loginContainer').style.display = 'none';
        loadEvents();
    });
}

function logout() {
    accessToken = null;
    google.accounts.id.revoke('', () => {
        console.log('Déconnexion réussie');
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'block';
        // Recharger les événements publics
        loadEventsFromPHP();
    });
}

function loadEvents() {
    if (!accessToken) {
        console.error('Pas de token d\'accès');
        return;
    }

    console.log('Chargement des événements Google...');
    const container = document.getElementById('eventsContainer');
    const now = new Date().toISOString();
    
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20&orderBy=startTime&singleEvents=true&timeMin=' + encodeURIComponent(now), {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        console.log('Réponse API:', response.status);
        if (!response.ok) throw new Error('Erreur HTTP ' + response.status);
        return response.json();
    })
    .then(data => {
        console.log('Événements reçus:', data);
        displayEvents(data.items || []);
    })
    .catch(error => {
        console.error('Erreur chargement:', error);
        container.innerHTML = `<div style="grid-column: 1/-1; background: #3a2a2a; border: 1px solid #8a4a4a; color: #ff9999; padding: 20px; border-radius: 5px;">
            ⚠️ Erreur: ${error.message}
        </div>`;
    });
}

function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">📅 Aucun événement prévu</div>';
        return;
    }

    container.innerHTML = events.map(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        const day = String(start.getDate()).padStart(2, '0');
        const monthIndex = start.getMonth();
        const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DÉC'];
        const month = months[monthIndex];
        
        const time = event.start.dateTime 
            ? start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
            : 'Toute la journée';
        
        // Extraire l'image et le lien de la description
        let description = '';
        let imageUrl = '';
        let detailLink = event.htmlLink;
        
        if (event.description) {
            const desc = event.description;
            
            // Extraire TOUTES les URLs avec un regex amélioré
            const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\]]*)/g;
            const allUrls = [];
            let urlMatch;
            
            while ((urlMatch = urlRegex.exec(desc)) !== null) {
                let url = urlMatch[1].trim();
                
                // Enlever les caractères spéciaux à la fin
                while (url && /[,\)\]\}'"]$/.test(url)) {
                    url = url.slice(0, -1);
                }
                
                // Vérifier que c'est une URL valide
                if (url && url.startsWith('http')) {
                    allUrls.push(url);
                }
            }
            
            console.log('URLs trouvées:', allUrls);
            console.log('Nombre d\'URLs:', allUrls.length);
            
            // Chercher l'image (cloudinary ou contient /image)
            for (let url of allUrls) {
                if (url.includes('cloudinary') || url.includes('/image/')) {
                    imageUrl = url;
                    console.log('✓ Image trouvée:', imageUrl);
                    break;
                }
            }
            
            // Chercher le billet Shotgun (contient /events/)
            for (let url of allUrls) {
                if (url.includes('/events/')) {
                    detailLink = url;
                    console.log('✓ Lien billet trouvé:', detailLink);
                    break;
                }
            }
            
            // Fallback: si pas trouvé par domaine, prendre première et dernière
            if (!imageUrl && allUrls.length > 0) {
                imageUrl = allUrls[0];
                console.log('⚠ Image (fallback 1ère):', imageUrl);
            }
            if (detailLink === event.htmlLink && allUrls.length > 1) {
                detailLink = allUrls[allUrls.length - 1];
                console.log('⚠ Lien billet (fallback dernière):', detailLink);
            }
            if (detailLink === event.htmlLink && allUrls.length === 1) {
                detailLink = allUrls[0];
                console.log('⚠ Lien billet (fallback unique):', detailLink);
            }
            
            // Extraire la description - enlever les lignes avec URLs et 📷
            const lines = desc.split('\n');
            const descLines = lines.filter(line => 
                !line.includes('📷') && !line.includes('https') && line.trim()
            );
            description = descLines.join(' ').substring(0, 150);
            if (descLines.join(' ').length > 150) description += '...';
        }
        
        // Si pas d'image trouvée, utiliser placeholder
        if (!imageUrl) {
            imageUrl = `https://via.placeholder.com/400x250?text=${encodeURIComponent(event.summary || 'Événement')}`;
        }

        console.log('=== ÉVÉNEMENT:', event.summary, '===');
        console.log('Image:', imageUrl);
        console.log('Lien:', detailLink);
        console.log('Description:', description);
        
        // Échapper l'URL pour l'utiliser en HTML
        const safeLink = (detailLink || '#').replace(/"/g, '%22');
        
        return `
            <div class="event-card">
                <div class="event-image" style="background-image: url('${imageUrl}');">
                    <div class="event-date-badge">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                </div>
                <div class="event-card-content">
                    <h3>${event.summary || 'Événement sans titre'}</h3>
                    <p class="event-time">⏰ ${time}</p>
                    ${event.location ? `<p class="event-location">📍 ${event.location}</p>` : ''}
                    ${description ? `<p class="event-description">${description}</p>` : ''}
                    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="btn-reserver">BILLET →</a>
                </div>
            </div>
        `;
    }).join('');
}

// Gérer le bouton afficher/masquer calendrier
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const calendar = document.getElementById('calendarContainer');
            
            calendar.classList.toggle('active');
            
            if (calendar.classList.contains('active')) {
                toggleBtn.textContent = '🔽 MASQUER LE CALENDRIER';
            } else {
                toggleBtn.textContent = '📅 AFFICHER TOUT LE CALENDRIER';
            }
        });
    }
});
