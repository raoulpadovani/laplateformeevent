// Gérer le menu burger
function toggleMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Animations au scroll
function initScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    document.querySelectorAll('.section-header, .gallery-grid, .derniers-evenements, .telechargements, .footer').forEach(el => observer.observe(el));
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Menu burger
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            document.getElementById('hamburger').classList.remove('active');
            document.getElementById('navMenu').classList.remove('active');
        });
    });
    initScrollAnimations();
    loadUpcomingEvents();
});

// Modal de contact
function openContactModal(event) {
    event.preventDefault();
    document.getElementById('contactModal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
}

window.onclick = function(event) {
    const modal = document.getElementById('contactModal');
    if (event.target === modal) modal.classList.remove('active');
}

// Charger les 3 prochains événements
function loadUpcomingEvents() {
    fetch('get-events.php')
    .then(r => r.json())
    .then(data => displayUpcomingEvents(data.slice(0, 3)))
    .catch(e => console.error('Erreur:', e));
}

function displayUpcomingEvents(events) {
    const c = document.getElementById('eventsContainer');
    if (!events || !events.length) {
        c.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">📅 Aucun événement</div>';
        return;
    }

    c.innerHTML = events.map(e => {
        const d = new Date(e.date);
        const day = String(d.getDate()).padStart(2, '0');
        const m = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOU','SEP','OCT','NOV','DÉC'][d.getMonth()];
        const img = e.image ? `background-image: url('${h(e.image)}')` : '';
        
        return `
            <div class="event-card">
                <div class="event-image" style="${img}">
                    <div class="event-date-badge">
                        <span class="day">${day}</span>
                        <span class="month">${m}</span>
                    </div>
                </div>
                <div class="event-card-content">
                    <h3>${h(e.title)}</h3>
                    ${e.time ? `<p class="event-time">🕐 ${e.time}</p>` : ''}
                    ${e.location ? `<p class="event-location">📍 ${h(e.location)}</p>` : ''}
                    ${e.price ? `<p class="event-location">💰 ${h(e.price)}</p>` : ''}
                    ${e.description ? `<p class="event-description">${h(e.description.substring(0, 100))}...</p>` : ''}
                    <div style="flex: 1;"></div>
                    ${e.ticketLink ? `<a href="${h(e.ticketLink)}" target="_blank" class="btn-reserver" style="margin-top: 15px; display: inline-block; background: #00d4ff; color: #000; padding: 10px 15px; border-radius: 3px; text-decoration: none; font-weight: 600;">🎫 RÉSERVER</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function h(t) {
    const m = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
    return String(t).replace(/[&<>"']/g, c => m[c]);
}
