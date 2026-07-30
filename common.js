/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Core Data Management & Session Utility (common.js)
 */

const STORAGE_KEY = 'au_intervention_requests';
const USERS_KEY = 'au_users';
const CURRENT_USER_KEY = 'au_current_user';

/**
 * Initialize Baseline Seed Data if empty
 */
function initStorage() {
    getUsers();
    getRequests();
}

function getUsers() {
    try {
        const data = localStorage.getItem(USERS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch(e) {}
    return initSeedUsers();
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch(e) {
        console.error('Erreur de sauvegarde des utilisateurs:', e);
    }
}

function initSeedUsers() {
    const seedUsers = [
        {
            id: 'usr-super',
            firstName: 'Super',
            lastName: 'Administrateur',
            name: 'Super Administrateur',
            email: 'superadmin@agenceurbaine.ma',
            password: 'admin',
            role: 'superadmin',
            department: 'ALL',
            status: 'approved',
            createdAt: '2026-01-01'
        },
        {
            id: 'usr-daf',
            firstName: 'Admin',
            lastName: 'DAF',
            name: 'Administrateur DAF',
            email: 'daf.admin@agenceurbaine.ma',
            password: 'admin',
            role: 'admin',
            department: 'DAF',
            status: 'approved',
            createdAt: '2026-01-01'
        },
        {
            id: 'usr-dgur',
            firstName: 'Admin',
            lastName: 'DGUR',
            name: 'Administrateur DGUR',
            email: 'dgur.admin@agenceurbaine.ma',
            password: 'admin',
            role: 'admin',
            department: 'DGUR',
            status: 'approved',
            createdAt: '2026-01-01'
        },
        {
            id: 'usr-det',
            firstName: 'Admin',
            lastName: 'DET',
            name: 'Administrateur DET',
            email: 'det.admin@agenceurbaine.ma',
            password: 'admin',
            role: 'admin',
            department: 'DET',
            status: 'approved',
            createdAt: '2026-01-01'
        },
        {
            id: 'usr-si',
            firstName: 'Admin',
            lastName: 'SI',
            name: 'Administrateur SI',
            email: 'si.admin@agenceurbaine.ma',
            password: 'admin',
            role: 'admin',
            department: 'SI',
            status: 'approved',
            createdAt: '2026-01-01'
        },
        {
            id: 'usr-pending-demo',
            firstName: 'Omar',
            lastName: 'BENJELLOUN',
            name: 'M. Omar BENJELLOUN',
            email: 'omar.benjelloun@agenceurbaine.ma',
            password: 'admin',
            role: 'admin',
            department: 'SI',
            status: 'pending',
            createdAt: '2026-07-30'
        },
        {
            id: 'usr-emp1',
            firstName: 'Karim',
            lastName: 'ALAMI',
            name: 'M. Karim ALAMI',
            employeeId: 'EMP-0104',
            email: 'karim.alami@agenceurbaine.ma',
            password: 'user123',
            role: 'employee',
            department: 'SI',
            status: 'approved',
            createdAt: '2026-01-15'
        },
        {
            id: 'usr-emp2',
            firstName: 'Sophia',
            lastName: 'BENNANI',
            name: 'Mme. Sophia BENNANI',
            employeeId: 'EMP-0205',
            email: 'sophia.bennani@agenceurbaine.ma',
            password: 'user123',
            role: 'employee',
            department: 'DAF',
            status: 'approved',
            createdAt: '2026-01-20'
        },
        {
            id: 'usr-emp3',
            firstName: 'Tarik',
            lastName: 'CHRAIBI',
            name: 'M. Tarik CHRAIBI',
            employeeId: 'EMP-0308',
            email: 'tarik.chraibi@agenceurbaine.ma',
            password: 'user123',
            role: 'employee',
            department: 'DET',
            status: 'approved',
            createdAt: '2026-02-01'
        },
        {
            id: 'usr-emp4',
            firstName: 'Ahmed',
            lastName: 'TAZI',
            name: 'M. Ahmed TAZI',
            employeeId: 'EMP-0412',
            email: 'ahmed.tazi@agenceurbaine.ma',
            password: 'user123',
            role: 'employee',
            department: 'DGUR',
            status: 'approved',
            createdAt: '2026-02-10'
        }
    ];

    saveUsers(seedUsers);
    return seedUsers;
}

function getRequests() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch(e) {}
    return initSeedRequests();
}

function saveRequests(requests) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch(e) {
        console.error('Erreur de sauvegarde des demandes:', e);
    }
}

function initSeedRequests() {
    const initialRequests = [
        {
            id: 'INT-2026-0001',
            date: '2026-07-28',
            emitter: 'M. Karim ALAMI',
            emitterEmail: 'karim.alami@agenceurbaine.ma',
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
            emitterEmail: 'sophia.bennani@agenceurbaine.ma',
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
            emitterEmail: 'tarik.chraibi@agenceurbaine.ma',
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
            emitterEmail: 'ahmed.tazi@agenceurbaine.ma',
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

    saveRequests(initialRequests);
    return initialRequests;
}

function getCurrentUser() {
    try {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) return JSON.parse(stored);
    } catch(e) {}
    return null;
}

function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(CURRENT_USER_KEY);
    } else {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
}

function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = 'login.html';
}

function getRealtimeStats() {
    const requests = getRequests();
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'En attente' || r.status === 'Pending').length;
    const progress = requests.filter(r => r.status === 'En cours' || r.status === 'In Progress').length;
    const resolved = requests.filter(r => r.status === 'Résolue' || r.status === 'Resolved').length;

    return { total, pending, progress, resolved };
}

/**
 * Universal Navbar update for logged-in user state & navigation items
 */
function updateNavbar() {
    const user = getCurrentUser();
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    // Check if user badge exists or create/update it
    let userNavBtn = navLinks.querySelector('.nav-user-info');
    let loginBtn = navLinks.querySelector('.nav-btn');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';

        if (!userNavBtn) {
            userNavBtn = document.createElement('div');
            userNavBtn.className = 'nav-user-info';
            navLinks.appendChild(userNavBtn);
        }

        let roleBadge = 'Employé';
        if (user.role === 'superadmin') roleBadge = 'Super Admin';
        else if (user.role === 'admin') roleBadge = `Admin ${user.department}`;

        userNavBtn.innerHTML = `
            <div class="user-pill">
                <span class="user-role-badge ${user.role}">${escapeHtml(roleBadge)}</span>
                <span class="user-name-text">${escapeHtml(user.name || user.firstName + ' ' + user.lastName)}</span>
                <button type="button" class="btn-logout" title="Déconnexion" onclick="logoutUser()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sortir
                </button>
            </div>
        `;
    } else {
        if (userNavBtn) userNavBtn.remove();
        if (loginBtn) loginBtn.style.display = 'inline-flex';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    updateNavbar();
});
