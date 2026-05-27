// Gérer le menu burger
function toggleMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Observer pour animations au scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer les sections
    document.querySelectorAll('.section-header, .gallery-grid, .derniers-evenements, .telechargements, .footer').forEach(el => {
        observer.observe(el);
    });
}

// Fermer le menu burger en cliquant sur un lien
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            document.getElementById('hamburger').classList.remove('active');
            document.getElementById('navMenu').classList.remove('active');
        });
    });

    // Initier les animations au scroll
    initScrollAnimations();
});

// Gérer le modal de contact
function openContactModal(event) {
    event.preventDefault();
    document.getElementById('contactModal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
}

// Fermer le modal en cliquant en dehors
window.onclick = function(event) {
    const modal = document.getElementById('contactModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
}

// Charger les 3 prochains événements de l'agenda
function loadUpcomingEvents() {
    fetch('events.php')
    .then(response => response.json())
    .then(data => {
        const events = data.items || [];
        displayUpcomingEvents(events.slice(0, 3)); // Prendre les 3 premiers
    })
    .catch(error => {
        console.error('Erreur chargement événements:', error);
    });
}

function displayUpcomingEvents(events) {
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
            
            // Chercher l'image (cloudinary ou contient /image)
            for (let url of allUrls) {
                if (url.includes('cloudinary') || url.includes('/image/')) {
                    imageUrl = url;
                    break;
                }
            }
            
            // Chercher le billet Shotgun (contient /events/)
            for (let url of allUrls) {
                if (url.includes('/events/')) {
                    detailLink = url;
                    break;
                }
            }
            
            // Fallback: si pas trouvé par domaine, prendre première et dernière
            if (!imageUrl && allUrls.length > 0) {
                imageUrl = allUrls[0];
            }
            if (detailLink === event.htmlLink && allUrls.length > 1) {
                detailLink = allUrls[allUrls.length - 1];
            }
            if (detailLink === event.htmlLink && allUrls.length === 1) {
                detailLink = allUrls[0];
            }
            
            // Extraire la description - enlever les lignes avec URLs et 📷
            const lines = desc.split('\n');
            const descLines = lines.filter(line => 
                !line.includes('📷') && !line.includes('https') && line.trim()
            );
            description = descLines.join(' ').substring(0, 150);
            if (descLines.join(' ').length > 150) description += '...';
        }
        
        // Placeholder si pas d'image
        if (!imageUrl) {
            imageUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(event.summary || 'Événement')}`;
        }

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

// Charger les événements au démarrage
document.addEventListener('DOMContentLoaded', function() {
    loadUpcomingEvents();
});
