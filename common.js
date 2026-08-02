/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Core Data Management & Session Utility (common.js)
 */

const STORAGE_KEY = 'au_intervention_requests';
const USERS_KEY = 'au_users';
const CURRENT_USER_KEY = 'au_current_user';

const DEFAULT_SYSTEM_ACCOUNTS = [
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
    }
];

/**
 * Initialize Baseline Seed Data if empty
 */
function initStorage() {
    try {
        const storedUsers = localStorage.getItem(USERS_KEY);
        if (storedUsers) {
            const parsed = JSON.parse(storedUsers);
            if (Array.isArray(parsed) && parsed.some(u => u.id === 'usr-emp1' || u.id === 'usr-pending-demo')) {
                const cleaned = parsed.filter(u => !['usr-emp1', 'usr-emp2', 'usr-emp3', 'usr-emp4', 'usr-pending-demo', 'usr-emp-pending-demo'].includes(u.id));
                saveUsers(cleaned);
            }
        }
    } catch(e) {}

    try {
        const storedRequests = localStorage.getItem(STORAGE_KEY);
        if (storedRequests) {
            const parsed = JSON.parse(storedRequests);
            if (Array.isArray(parsed) && parsed.some(r => r.id && r.id.startsWith('INT-2026-000'))) {
                initSeedRequests();
            }
        }
    } catch(e) {}

    getUsers();
    getRequests();
}

function getUsers() {
    let users = [];
    try {
        const data = localStorage.getItem(USERS_KEY);
        if (data !== null) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) users = parsed;
        }
    } catch(e) {}

    let updated = false;
    DEFAULT_SYSTEM_ACCOUNTS.forEach(defaultAcc => {
        const exists = users.some(u => (u.email || '').toLowerCase().trim() === defaultAcc.email.toLowerCase().trim());
        if (!exists) {
            users.push(defaultAcc);
            updated = true;
        }
    });

    if (updated || localStorage.getItem(USERS_KEY) === null) {
        saveUsers(users);
    }
    return users;
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('au_data_changed', { detail: { type: 'users' } }));
    } catch(e) {
        console.error('Erreur de sauvegarde des utilisateurs:', e);
    }
}

function initSeedUsers() {
    saveUsers([...DEFAULT_SYSTEM_ACCOUNTS]);
    return [...DEFAULT_SYSTEM_ACCOUNTS];
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
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('au_data_changed', { detail: { type: 'requests' } }));
    } catch(e) {
        console.error('Erreur de sauvegarde des demandes:', e);
    }
}

function initSeedRequests() {
    const seedRequests = [];

    saveRequests(seedRequests);
    return seedRequests;
}

function getCurrentUser() {
    try {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
            const user = JSON.parse(stored);
            if (user && user.id) {
                const users = getUsers();
                const freshUser = users.find(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
                if (freshUser) {
                    if (freshUser.status === 'disabled' || freshUser.status === 'rejected') {
                        localStorage.removeItem(CURRENT_USER_KEY);
                        return null;
                    }
                    if (JSON.stringify(freshUser) !== JSON.stringify(user)) {
                        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
                    }
                    return freshUser;
                }
            }
            return user;
        }
    } catch(e) {}
    return null;
}

function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(CURRENT_USER_KEY);
    } else {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new CustomEvent('au_data_changed', { detail: { type: 'session' } }));
}

function logoutUser() {
    const user = getCurrentUser();
    const isSuperAdmin = user && user.role === 'superadmin';
    localStorage.removeItem(CURRENT_USER_KEY);
    if (isSuperAdmin) {
        window.location.href = 'superadmin.html';
    } else {
        window.location.href = 'login.html';
    }
}

function getNormalizedStatus(rawStatus) {
    if (!rawStatus) return 'pending';
    const s = String(rawStatus).trim().toLowerCase();

    if (s === 'en attente' || s === 'pending' || s === 'nouveau' || s === 'nouvelle') {
        return 'pending';
    }

    if (s === 'en cours' || s === 'in progress' || s === 'encours' || s === 'en-cours' || s === 'traitement') {
        return 'progress';
    }

    if (
        s === 'résolue' || s === 'resolue' || s === 'resolved' ||
        s === 'approuvée' || s === 'approuvee' || s === 'approved' ||
        s === 'terminée' || s === 'terminee' || s === 'completed' ||
        s === 'traitée' || s === 'traitee' || s === 'signée' || s === 'signee' ||
        s === 'résolu' || s === 'resolu' || s === 'clôturée' || s === 'cloturee'
    ) {
        return 'resolved';
    }

    if (s === 'rejetée' || s === 'rejete' || s === 'rejetee' || s === 'rejected') {
        return 'rejected';
    }

    return 'pending';
}

function getRealtimeStats(department = 'ALL') {
    let requests = getRequests();
    if (department && department !== 'ALL') {
        requests = requests.filter(r => r.department === department);
    }
    const total = requests.length;
    let pending = 0;
    let progress = 0;
    let resolved = 0;

    requests.forEach(r => {
        const norm = getNormalizedStatus(r.status);
        if (norm === 'pending') pending++;
        else if (norm === 'progress') progress++;
        else if (norm === 'resolved') resolved++;
    });

    return { total, pending, progress, resolved };
}

/**
 * Role-Based Route Guard for Super Administrator and Department Administrators
 * Ensures Administrators are strictly restricted from Employee / Public Home pages and stay on their Dashboard page (admin.html).
 */
function checkRoleRedirects() {
    const user = getCurrentUser();
    if (!user) return;

    const path = window.location.pathname;
    const isDashboard = path.endsWith('admin.html');
    const isPrivatePortal = path.endsWith('superadmin.html');

    if (user.role === 'superadmin') {
        if (!isDashboard && !isPrivatePortal) {
            window.location.href = 'admin.html';
        }
    } else if (user.role === 'admin') {
        if (!isDashboard) {
            window.location.href = 'admin.html';
        }
    }
}

/**
 * Universal Navbar update for logged-in user state & navigation items
 */
function updateNavbar() {
    const user = getCurrentUser();
    const navLinks = document.getElementById('nav-links');

    // Update Brand Link (Admin & Superadmin point to admin.html dashboard, not index.html)
    const brandLinks = document.querySelectorAll('.brand');
    brandLinks.forEach(brand => {
        if (user && (user.role === 'superadmin' || user.role === 'admin')) {
            brand.setAttribute('href', 'admin.html');
        } else {
            brand.setAttribute('href', 'index.html');
        }
    });

    if (!navLinks) return;

    if (user && user.role === 'superadmin') {
        // Completely hide ALL navigation links for Super Administrator (no redundant panel button)
        const items = navLinks.querySelectorAll('.nav-item');
        items.forEach(item => {
            item.style.display = 'none';
        });

        const superNavBtn = navLinks.querySelector('.nav-superadmin-link');
        if (superNavBtn) superNavBtn.remove();
    } else if (user && user.role === 'admin') {
        // Completely hide ALL employee & home navigation links for Department Administrator
        const items = navLinks.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (!item.classList.contains('nav-admin-link')) {
                item.style.display = 'none';
            }
        });

        // Ensure single Department Admin Dashboard button is visible
        let adminNavBtn = navLinks.querySelector('.nav-admin-link');
        if (!adminNavBtn) {
            adminNavBtn = document.createElement('a');
            adminNavBtn.href = 'admin.html';
            adminNavBtn.className = 'nav-item nav-btn nav-admin-link active';
            adminNavBtn.style.background = 'linear-gradient(135deg, #2563EB, #1D4ED8)';
            adminNavBtn.style.color = '#FFFFFF';
            adminNavBtn.style.borderColor = 'transparent';
            adminNavBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Gestion Département ${escapeHtml(user.department || '')}
            `;
            navLinks.insertBefore(adminNavBtn, navLinks.firstChild);
        }
        adminNavBtn.style.display = 'inline-flex';
    } else {
        // Restore standard navbar for employees & guests
        const items = navLinks.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (!item.classList.contains('nav-superadmin-link') && !item.classList.contains('nav-admin-link')) {
                item.style.display = '';
            }
        });
        const superNavBtn = navLinks.querySelector('.nav-superadmin-link');
        if (superNavBtn) superNavBtn.remove();
        const adminNavBtn = navLinks.querySelector('.nav-admin-link');
        if (adminNavBtn) adminNavBtn.remove();
    }

    // Check if user badge exists or create/update it
    let userNavBtn = navLinks.querySelector('.nav-user-info');
    let loginBtn = navLinks.querySelector('.nav-btn:not(.nav-superadmin-link)');

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

/**
 * Inject Global Custom Modal Styles
 */
function injectCustomModalStyles() {
    if (document.getElementById('custom-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'custom-modal-styles';
    style.textContent = `
        .custom-modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(11, 19, 43, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.25rem;
            opacity: 0;
            animation: customModalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes customModalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .custom-modal-card {
            position: relative;
            background: linear-gradient(145deg, #1C2541, #0B132B);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(67, 97, 238, 0.15);
            border-radius: 20px;
            width: 100%;
            max-width: 440px;
            padding: 2.25rem 2rem 1.75rem 2rem;
            text-align: center;
            transform: scale(0.92) translateY(12px);
            animation: customModalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes customModalScaleUp {
            from { transform: scale(0.92) translateY(12px); }
            to { transform: scale(1) translateY(0); }
        }

        .custom-modal-close-btn {
            position: absolute;
            top: 1rem;
            right: 1.25rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #94A3B8;
            font-size: 1.25rem;
            line-height: 1;
            cursor: pointer;
            border-radius: 8px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .custom-modal-close-btn:hover {
            color: #F8FAFC;
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .custom-modal-icon-glow {
            width: 68px;
            height: 68px;
            margin: 0 auto 1.25rem auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
        }

        .custom-modal-icon-glow.danger {
            background: rgba(239, 68, 68, 0.15);
            border: 1.5px solid rgba(239, 68, 68, 0.4);
            color: #EF4444;
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.25);
        }

        .custom-modal-icon-glow.warning {
            background: rgba(245, 158, 11, 0.15);
            border: 1.5px solid rgba(245, 158, 11, 0.4);
            color: #F59E0B;
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
        }

        .custom-modal-icon-glow.success {
            background: rgba(16, 185, 129, 0.15);
            border: 1.5px solid rgba(16, 185, 129, 0.4);
            color: #10B981;
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.25);
        }

        .custom-modal-icon-glow.info {
            background: rgba(67, 97, 238, 0.15);
            border: 1.5px solid rgba(67, 97, 238, 0.4);
            color: #4361EE;
            box-shadow: 0 0 25px rgba(67, 97, 238, 0.25);
        }

        .custom-modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #F8FAFC;
            margin-bottom: 0.65rem;
            line-height: 1.35;
        }

        .custom-modal-message {
            font-size: 0.95rem;
            color: #CBD5E1;
            line-height: 1.55;
            margin-bottom: 1.75rem;
            white-space: pre-line;
        }

        .custom-modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
        }

        .custom-modal-actions .btn {
            flex: 1;
            padding: 0.75rem 1.25rem;
            font-size: 0.95rem;
            font-weight: 600;
            border-radius: 12px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Universal Modern Confirmation Modal (Promise-based)
 */
window.showCustomConfirm = function(options = {}) {
    const {
        title = "Confirmation",
        message = "Voulez-vous vraiment effectuer cette action ?",
        confirmText = "Confirmer",
        cancelText = "Annuler",
        type = "danger"
    } = typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
        injectCustomModalStyles();

        const oldModal = document.getElementById('app-custom-modal');
        if (oldModal) oldModal.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'app-custom-modal';
        backdrop.className = 'custom-modal-backdrop';

        let iconSvg = '';
        if (type === 'danger') {
            iconSvg = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>`;
        } else if (type === 'warning') {
            iconSvg = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`;
        } else {
            iconSvg = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>`;
        }

        const btnClass = type === 'danger' ? 'btn-danger' : 'btn-primary';

        backdrop.innerHTML = `
            <div class="custom-modal-card">
                <button type="button" class="custom-modal-close-btn" id="custom-modal-close-x" aria-label="Fermer">&times;</button>
                <div class="custom-modal-icon-glow ${type}">
                    ${iconSvg}
                </div>
                <h3 class="custom-modal-title">${escapeHtml(title)}</h3>
                <div class="custom-modal-message">${escapeHtml(message)}</div>
                <div class="custom-modal-actions">
                    <button type="button" class="btn btn-secondary" id="custom-modal-cancel-btn">${escapeHtml(cancelText)}</button>
                    <button type="button" class="btn ${btnClass}" id="custom-modal-confirm-btn">${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        let resolved = false;
        const close = (result) => {
            if (resolved) return;
            resolved = true;
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.2s ease';
            setTimeout(() => {
                if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                resolve(result);
            }, 200);
        };

        document.getElementById('custom-modal-confirm-btn').addEventListener('click', () => close(true));
        document.getElementById('custom-modal-cancel-btn').addEventListener('click', () => close(false));
        document.getElementById('custom-modal-close-x').addEventListener('click', () => close(false));

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close(false);
        });

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                close(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    });
};

/**
 * Universal Modern Alert Modal (Promise-based)
 */
window.showCustomAlert = function(options = {}) {
    const {
        title = "Information",
        message = "",
        buttonText = "Compris",
        type = "info"
    } = typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
        injectCustomModalStyles();

        const oldModal = document.getElementById('app-custom-modal');
        if (oldModal) oldModal.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'app-custom-modal';
        backdrop.className = 'custom-modal-backdrop';

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`;
        } else if (type === 'danger') {
            iconSvg = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>`;
        } else {
            iconSvg = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>`;
        }

        const btnClass = type === 'danger' ? 'btn-danger' : 'btn-primary';

        backdrop.innerHTML = `
            <div class="custom-modal-card">
                <button type="button" class="custom-modal-close-btn" id="custom-modal-close-x" aria-label="Fermer">&times;</button>
                <div class="custom-modal-icon-glow ${type}">
                    ${iconSvg}
                </div>
                <h3 class="custom-modal-title">${escapeHtml(title)}</h3>
                <div class="custom-modal-message">${escapeHtml(message)}</div>
                <div class="custom-modal-actions">
                    <button type="button" class="btn ${btnClass}" id="custom-modal-ok-btn">${escapeHtml(buttonText)}</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        let resolved = false;
        const close = (actionClicked = false) => {
            if (resolved) return;
            resolved = true;
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.2s ease';
            setTimeout(() => {
                if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                resolve(actionClicked);
            }, 200);
        };

        document.getElementById('custom-modal-ok-btn').addEventListener('click', () => close(true));
        document.getElementById('custom-modal-close-x').addEventListener('click', () => close(false));

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close(false);
        });

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                close(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    });
};

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    checkRoleRedirects();
    updateNavbar();
    injectCustomModalStyles();
});
