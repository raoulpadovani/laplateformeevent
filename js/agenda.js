// Charger au démarrage
window.addEventListener('load', loadEvents);

function loadEvents() {
    fetch('get-events.php')
    .then(r => r.json())
    .then(data => {
        displayEvents(data);
        document.getElementById('eventsContainer').style.display = 'grid';
    })
    .catch(e => {
        console.error('Erreur:', e);
        document.getElementById('eventsContainer').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">⚠️ Erreur chargement</div>';
    });
}

function displayEvents(events) {
    const c = document.getElementById('eventsContainer');
    if (!events || !events.length) {
        c.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">📭 Aucun événement</div>';
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
                    ${e.description ? `<p class="event-description">${h(e.description)}</p>` : ''}
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
