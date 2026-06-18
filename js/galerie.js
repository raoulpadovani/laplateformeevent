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