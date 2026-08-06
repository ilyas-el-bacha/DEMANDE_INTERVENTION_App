/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Home Page Logic (index.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize System Components
    initNavigation();
    initCurrentYear();
    updateHomePageAuthUI();
    loadAndAnimateStatistics();
});

window.addEventListener('storage', () => {
    updateHomePageAuthUI();
    loadAndAnimateStatistics();
});

window.addEventListener('au_data_changed', () => {
    updateHomePageAuthUI();
    loadAndAnimateStatistics();
});

/**
 * Toggles visibility of employee-only features vs public visitor UI
 */
function updateHomePageAuthUI() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const statsSection = document.getElementById('stats-section');
    const heroAuthOnly = document.querySelectorAll('.hero-auth-only');
    const heroGuestOnly = document.querySelectorAll('.hero-guest-only');
    const footerAuthOnly = document.querySelectorAll('.footer-auth-only');

    if (user) {
        // Authenticated user (Employee / Admin)
        if (statsSection) statsSection.style.display = 'block';
        heroAuthOnly.forEach(el => el.style.display = 'inline-flex');
        heroGuestOnly.forEach(el => el.style.display = 'none');
        footerAuthOnly.forEach(el => el.style.display = 'inline-block');
    } else {
        // Unauthenticated visitor
        if (statsSection) statsSection.style.display = 'none';
        heroAuthOnly.forEach(el => el.style.display = 'none');
        heroGuestOnly.forEach(el => el.style.display = 'inline-flex');
        footerAuthOnly.forEach(el => el.style.display = 'none');
    }
}

/**
 * Mobile Navigation Toggle
 */
function initNavigation() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
}

/**
 * Update Footer Copyright Year Automatically
 */
function initCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Reads requests from LocalStorage via common.js and updates statistic counters dynamically
 */
function loadAndAnimateStatistics() {
    const stats = typeof getRealtimeStats === 'function' ? getRealtimeStats() : { total: 0, pending: 0, progress: 0, resolved: 0 };

    // Animate Statistics Counter Displays
    animateValue('stat-total', 0, stats.total, 1000);
    animateValue('stat-pending', 0, stats.pending, 1000);
    animateValue('stat-progress', 0, stats.progress, 1000);
    animateValue('stat-resolved', 0, stats.resolved, 1000);
}

/**
 * Smooth Numerical Counter Animation
 */
function animateValue(elementId, start, end, duration) {
    const obj = document.getElementById(elementId);
    if (!obj) return;

    if (start === end) {
        obj.textContent = end;
        return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Ease-out cubic animation formula
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.floor(easeOut * (end - start) + start);
        obj.textContent = currentCount;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Seeds baseline realistic sample requests if LocalStorage is empty.
 * Guarantees that the system immediately displays official Agence Urbaine workflow.
 */
function seedSampleData() {
    const initialRequests = [
        {
            id: 'INT-2026-0001',
            date: '2026-07-28',
            emitter: 'M. Karim ALAMI',
            department: 'SI',
            category: 'Matériel informatique',
            anomaly: 'Poste de travail principal ne démarre plus (bloc d\'alimentation défectueux) au bureau N° 104.',
            status: 'En cours',
            priority: 'Haute',
            code: 'FM-SI-04',
            version: '02',
            appDate: '01/02/2026',
            verification: {
                dateAnalyse: '2026-07-28',
                verifiedBy: 'Technicien SI - Y. Berrada',
                recommendation: 'Remplacement du bloc d\'alimentation ATX 500W',
                type: 'Interne',
                signed: true
            },
            history: [
                { date: '2026-07-28 09:15', label: 'Demande créée par M. Karim ALAMI' },
                { date: '2026-07-28 09:30', label: 'Transmise au Service Informatique (SI)' },
                { date: '2026-07-28 11:00', label: 'Diagnostic réalisé par Y. Berrada' }
            ]
        },
        {
            id: 'INT-2026-0002',
            date: '2026-07-29',
            emitter: 'Mme. Sophia BENNANI',
            department: 'DAF',
            category: 'Mobilier de bureau et matériel de bureau',
            anomaly: 'Fauteuil ergonomique de direction endommagé au niveau du vérin hydraulique.',
            status: 'En attente',
            priority: 'Moyenne',
            code: 'FM-SI-04',
            version: '02',
            appDate: '01/02/2026',
            history: [
                { date: '2026-07-29 14:20', label: 'Demande créée par Mme. Sophia BENNANI' },
                { date: '2026-07-29 14:22', label: 'Transmise à la Direction Administrative et Financière (DAF)' }
            ]
        },
        {
            id: 'INT-2026-0003',
            date: '2026-07-25',
            emitter: 'M. Tarik CHRAIBI',
            department: 'DET',
            category: 'Matériel informatique',
            anomaly: 'Traceur de cartes A0 (HP DesignJet) bloqué lors de l\'impression des plans d\'aménagement.',
            status: 'Résolue',
            priority: 'Haute',
            code: 'FM-SI-04',
            version: '02',
            appDate: '01/02/2026',
            verification: {
                dateAnalyse: '2026-07-25',
                verifiedBy: 'Chef DET - H. Mansouri',
                recommendation: 'Nettoyage des têtes d\'impression et mise à jour du pilote',
                type: 'Interne',
                signed: true
            },
            intervention: {
                date: '2026-07-26',
                type: 'Maintenance préventive et corrective',
                observations: 'Débourrage papier effectif et réalignement des têtes.'
            },
            result: {
                effective: true,
                notes: 'Imprimante et traceur A0 100% opérationnels.'
            },
            history: [
                { date: '2026-07-25 10:00', label: 'Demande créée par M. Tarik CHRAIBI' },
                { date: '2026-07-25 10:05', label: 'Transmise à la Direction des Études Techniques (DET)' },
                { date: '2026-07-25 14:00', label: 'Diagnostic validé' },
                { date: '2026-07-26 16:30', label: 'Intervention finalisée avec succès' }
            ]
        },
        {
            id: 'INT-2026-0004',
            date: '2026-07-27',
            emitter: 'M. Ahmed TAZI',
            department: 'DGUR',
            category: 'Voiture de service',
            anomaly: 'Voyant de révision moteur allumé sur le véhicule de service N° 12-A-2024.',
            status: 'En attente',
            priority: 'Urgente',
            code: 'FM-SI-04',
            version: '02',
            appDate: '01/02/2026',
            history: [
                { date: '2026-07-27 08:45', label: 'Demande créée par M. Ahmed TAZI' },
                { date: '2026-07-27 08:47', label: 'Transmise à la Direction de la Gestion Urbaine (DGUR)' }
            ]
        }
    ];

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests));
    } catch (e) {
        console.error("Impossible de sauvegarder les données initiales:", e);
    }

    return initialRequests;
}
