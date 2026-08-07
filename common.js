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
    // Ensure default system accounts exist
    getUsers();
    // Ensure requests array exists
    getRequests();
}

function getUsers() {
    let users = [];
    const rawData = localStorage.getItem(USERS_KEY) || localStorage.getItem('au_users');

    if (rawData === null) {
        // First-time initialization of central au_users database:
        // Includes system admins and initial employee account (Ilyas El Bacha)
        const initialSeed = [
            ...DEFAULT_SYSTEM_ACCOUNTS,
            {
                id: 'usr-emp-si-ilyas',
                firstName: 'Ilyas',
                lastName: 'El Bacha',
                name: 'Ilyas El Bacha',
                email: 'ilyas.elbacha@agenceurbaine.ma',
                password: 'user123',
                role: 'employee',
                department: 'SI',
                status: 'approved',
                createdAt: '2026-01-15'
            }
        ];
        saveUsers(initialSeed);
        return initialSeed;
    }

    try {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) users = parsed;
    } catch(e) {}

    // Clean up old legacy mock employee default accounts if present
    const mockIds = ['usr-emp-daf', 'usr-emp-dgur', 'usr-emp-det', 'usr-emp-si', 'usr-emp-si-youssef'];
    if (users.some(u => mockIds.includes(u.id))) {
        users = users.filter(u => !mockIds.includes(u.id));
        saveUsers(users);
    }

    // Ensure core system administrator accounts exist in au_users (Superadmin and 4 Dept Admins)
    let updated = false;
    DEFAULT_SYSTEM_ACCOUNTS.forEach(acc => {
        const idx = users.findIndex(u => u.id === acc.id || (u.email || '').toLowerCase().trim() === acc.email.toLowerCase().trim());
        if (idx === -1) {
            users.push(acc);
            updated = true;
        } else {
            const u = users[idx];
            let changed = false;
            if (!u.role) {
                u.role = acc.role;
                changed = true;
            }
            if (!u.department) {
                u.department = acc.department;
                changed = true;
            }
            if (changed) updated = true;
        }
    });

    // Ensure initial employee account exists if no employees found
    const hasEmployee = users.some(u => u && u.role !== 'admin' && u.role !== 'superadmin');
    if (!hasEmployee) {
        users.push({
            id: 'usr-emp-si-ilyas',
            firstName: 'Ilyas',
            lastName: 'El Bacha',
            name: 'Ilyas El Bacha',
            email: 'ilyas.elbacha@agenceurbaine.ma',
            password: 'user123',
            role: 'employee',
            department: 'SI',
            status: 'approved',
            createdAt: '2026-01-15'
        });
        updated = true;
    }

    if (updated) {
        saveUsers(users);
    }

    return users;
}

function saveUsers(users) {
    try {
        const json = JSON.stringify(users);
        localStorage.setItem(USERS_KEY, json);
        localStorage.setItem('au_users', json);
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
        const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('au_requests');
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch(e) {}
    return initSeedRequests();
}

function saveRequests(requests) {
    try {
        const json = JSON.stringify(requests);
        localStorage.setItem(STORAGE_KEY, json);
        localStorage.setItem('au_requests', json);
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
            if (user && (user.id || user.email || user.role)) {
                const users = getUsers();
                const freshUser = users.find(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
                if (freshUser) {
                    if (freshUser.status === 'disabled' || freshUser.status === 'rejected' || freshUser.status === 'pending') {
                        localStorage.removeItem(CURRENT_USER_KEY);
                        return null;
                    }
                    if (JSON.stringify(freshUser) !== JSON.stringify(user)) {
                        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
                    }
                    return freshUser;
                }
                return user;
            }
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
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new CustomEvent('au_data_changed', { detail: { type: 'session' } }));
    window.location.href = 'index.html';
}

function getNormalizedStatus(rawStatus) {
    if (!rawStatus) return 'pending';
    const s = String(rawStatus).trim().toLowerCase();

    if (s === 'en attente' || s === 'pending' || s === 'nouveau' || s === 'nouvelle') {
        return 'pending';
    }

    if (s === 'acceptée' || s === 'acceptee' || s === 'accepted' || s === 'approuvée' || s === 'approuvee' || s === 'validée' || s === 'validee') {
        return 'accepted';
    }

    if (s === 'en cours' || s === 'in progress' || s === 'encours' || s === 'en-cours' || s === 'traitement') {
        return 'progress';
    }

    if (
        s === 'résolue' || s === 'resolue' || s === 'resolved' ||
        s === 'terminée' || s === 'terminee' || s === 'completed' ||
        s === 'traitée' || s === 'traitee' || s === 'signée' || s === 'signee' ||
        s === 'résolu' || s === 'resolu' || s === 'clôturée' || s === 'cloturee'
    ) {
        return 'resolved';
    }

    if (s === 'rejetée' || s === 'rejete' || s === 'rejetee' || s === 'rejected') {
        return 'rejected';
    }

    if (s === 'infos requises' || s === 'info_requested' || s === 'information demandée' || s === 'infos demandées') {
        return 'info_requested';
    }

    return 'pending';
}

function getTimelineData(req) {
    if (!req) return { currentStep: 1, percent: 0, statusKey: 'pending' };
    const norm = getNormalizedStatus(req.status);

    if (norm === 'rejected') {
        return {
            currentStep: -1,
            percent: 25,
            statusKey: 'rejected',
            statusLabel: 'Rejetée',
            badgeClass: 'rejected'
        };
    }

    if (norm === 'info_requested') {
        return {
            currentStep: 2,
            percent: 35,
            statusKey: 'info_requested',
            statusLabel: 'Infos Requises',
            badgeClass: 'pending'
        };
    }

    if (norm === 'pending') {
        return {
            currentStep: 2,
            percent: 25,
            statusKey: 'pending',
            statusLabel: 'En attente',
            badgeClass: 'pending'
        };
    }

    if (norm === 'accepted') {
        return {
            currentStep: 3,
            percent: 50,
            statusKey: 'accepted',
            statusLabel: 'Acceptée',
            badgeClass: 'total'
        };
    }

    if (norm === 'progress') {
        return {
            currentStep: 4,
            percent: 75,
            statusKey: 'progress',
            statusLabel: 'En cours',
            badgeClass: 'progress'
        };
    }

    if (norm === 'resolved') {
        return {
            currentStep: 5,
            percent: 100,
            statusKey: 'resolved',
            statusLabel: 'Résolue',
            badgeClass: 'resolved'
        };
    }

    return {
        currentStep: 2,
        percent: 25,
        statusKey: 'pending',
        statusLabel: 'En attente',
        badgeClass: 'pending'
    };
}

function getRealtimeStats(department = 'ALL') {
    let requests = getRequests();
    if (department && department !== 'ALL') {
        requests = requests.filter(r => r && r.department && r.department.trim().toUpperCase() === department.trim().toUpperCase());
    }
    const total = requests.length;
    let pending = 0;
    let progress = 0;
    let resolved = 0;

    requests.forEach(r => {
        const norm = getNormalizedStatus(r.status);
        if (norm === 'pending' || norm === 'accepted' || norm === 'info_requested') pending++;
        else if (norm === 'progress') progress++;
        else if (norm === 'resolved') resolved++;
    });

    return { total, pending, progress, resolved };
}

/**
 * Role-Based Route Guard for Super Administrator and Department Administrators
 * Ensures Administrators are strictly restricted from Employee / Public Home pages.
 */
function checkRoleRedirects() {
    const user = getCurrentUser();
    if (!user) return;

    const path = window.location.pathname;
    const isDashboard = path.endsWith('admin.html');
    const isPrivatePortal = path.endsWith('superadmin.html');

    if (user.role === 'superadmin') {
        if (!isPrivatePortal) {
            window.location.href = 'superadmin.html';
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
    const navLinks = document.getElementById('nav-links') || document.querySelector('.nav-links');

    // Update Brand Link (Superadmin points to superadmin.html, Admin points to admin.html, Employee points to index.html)
    const brandLinks = document.querySelectorAll('.brand');
    brandLinks.forEach(brand => {
        if (user && user.role === 'superadmin') {
            brand.setAttribute('href', 'superadmin.html');
        } else if (user && user.role === 'admin') {
            brand.setAttribute('href', 'admin.html');
        } else {
            brand.setAttribute('href', 'index.html');
        }
    });

    if (!navLinks) return;

    if (user && user.role === 'superadmin') {
        // Super Admin navigation items
        const items = navLinks.querySelectorAll('.nav-item');
        items.forEach(item => {
            const href = item.getAttribute('href') || '';
            if (href.includes('superadmin.html')) {
                item.style.display = 'inline-flex';
            } else {
                item.style.display = 'none';
            }
        });
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
                const href = item.getAttribute('href') || '';
                if (!user && (href.includes('intervention.html') || href.includes('my_requests.html') || item.classList.contains('nav-auth-only'))) {
                    item.style.display = 'none';
                } else if (user && href.includes('login.html')) {
                    item.style.display = 'none';
                } else {
                    item.style.display = '';
                }
            }
        });
        const superNavBtn = navLinks.querySelector('.nav-superadmin-link');
        if (superNavBtn) superNavBtn.remove();
        const adminNavBtn = navLinks.querySelector('.nav-admin-link');
        if (adminNavBtn) adminNavBtn.remove();
    }

    // Always hide any login links/buttons if user is logged in
    const allLoginLinks = document.querySelectorAll('a[href*="login.html"]');
    allLoginLinks.forEach(loginBtn => {
        if (user) {
            loginBtn.style.setProperty('display', 'none', 'important');
        } else {
            loginBtn.style.display = '';
        }
    });

    // Check if user badge / logout section exists or create/update it
    let userNavBtn = navLinks.querySelector('.nav-user-info');

    if (user) {
        if (!userNavBtn) {
            userNavBtn = document.createElement('div');
            userNavBtn.className = 'nav-user-info';
            navLinks.appendChild(userNavBtn);
        }

        let roleBadge = 'EMPLOYÉ';
        if (user.role === 'superadmin') roleBadge = 'SUPER ADMIN';
        else if (user.role === 'admin') roleBadge = `ADMIN ${user.department || ''}`;

        const displayName = user.name || (user.firstName ? (user.firstName + (user.lastName ? ' ' + user.lastName : '')) : 'Utilisateur');

        userNavBtn.innerHTML = `
            <div class="user-pill">
                <span class="user-role-badge ${user.role}">${escapeHtml(roleBadge)}</span>
                <span class="user-name-text">${escapeHtml(displayName)}</span>
                <button type="button" class="btn-logout" title="Se déconnecter de la session" onclick="logoutUser()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sortir
                </button>
            </div>
        `;
        userNavBtn.style.display = 'inline-flex';
    } else {
        if (userNavBtn) userNavBtn.remove();
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

function getInitials(name) {
    if (!name || typeof name !== 'string') return 'AU';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AU';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

        .custom-prompt-input {
            width: 100%;
            background: rgba(15, 23, 42, 0.75);
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            color: #F8FAFC;
            font-size: 0.95rem;
            line-height: 1.5;
            padding: 0.85rem 1rem;
            outline: none;
            transition: all 0.2s ease;
            resize: vertical;
            min-height: 85px;
            font-family: inherit;
            box-sizing: border-box;
        }

        .custom-prompt-input:focus {
            border-color: #EF4444;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
            background: rgba(15, 23, 42, 0.95);
        }

        .custom-prompt-chip {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #CBD5E1;
            font-size: 0.78rem;
            padding: 0.32rem 0.7rem;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            user-select: none;
        }

        .custom-prompt-chip:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
            color: #FFFFFF;
            transform: translateY(-1px);
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

/**
 * Universal Modern Prompt Modal (Promise-based) for inputting rejection reasons, notes, etc.
 */
window.showCustomPrompt = function(options = {}) {
    const {
        title = "Motif du rejet",
        subtitle = "Veuillez préciser la raison du rejet de cette demande d'intervention :",
        defaultValue = "Demande non conforme ou non éligible",
        placeholder = "Saisissez le motif du rejet...",
        confirmText = "Confirmer le rejet",
        cancelText = "Annuler",
        type = "danger",
        suggestions = ["Demande non conforme", "Informations incomplètes", "Hors périmètre du service", "Doublon / Déjà traitée"]
    } = typeof options === 'string' ? { subtitle: options } : options;

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
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>`;
        } else if (type === 'warning') {
            iconSvg = `
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`;
        } else {
            iconSvg = `
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>`;
        }

        const confirmBtnStyle = type === 'danger'
            ? 'background: linear-gradient(135deg, #EF4444, #DC2626); color: #FFFFFF; border: none; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);'
            : 'background: linear-gradient(135deg, #3B82F6, #2563EB); color: #FFFFFF; border: none; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);';

        const chipsHtml = (suggestions && suggestions.length > 0) ? `
            <div style="margin-top: 0.85rem; text-align: left;">
                <span style="font-size: 0.78rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.4rem;">Suggestions rapides :</span>
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                    ${suggestions.map(s => `
                        <button type="button" class="custom-prompt-chip" data-val="${escapeHtml(s)}">${escapeHtml(s)}</button>
                    `).join('')}
                </div>
            </div>
        ` : '';

        backdrop.innerHTML = `
            <div class="custom-modal-card" style="max-width: 500px; text-align: left; padding: 2rem 2rem 1.75rem 2rem;">
                <button type="button" class="custom-modal-close-btn" id="custom-modal-close-x" aria-label="Fermer">&times;</button>
                
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                    <div class="custom-modal-icon-glow ${type}" style="margin: 0; flex-shrink: 0; width: 56px; height: 56px;">
                        ${iconSvg}
                    </div>
                    <div>
                        <h3 class="custom-modal-title" style="margin: 0; font-size: 1.2rem; line-height: 1.3;">${escapeHtml(title)}</h3>
                        <p style="margin: 0.25rem 0 0 0; font-size: 0.88rem; color: #94A3B8; line-height: 1.4;">${escapeHtml(subtitle)}</p>
                    </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                    <label for="custom-prompt-textarea" style="display: block; font-size: 0.82rem; font-weight: 700; color: #CBD5E1; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Motif / Explication :</label>
                    <textarea id="custom-prompt-textarea" class="custom-prompt-input" rows="3" placeholder="${escapeHtml(placeholder)}">${escapeHtml(defaultValue)}</textarea>
                    ${chipsHtml}
                </div>

                <div class="custom-modal-actions" style="margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" id="custom-prompt-cancel-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #CBD5E1; border-radius: 12px; font-weight: 600; padding: 0.75rem 1.25rem; font-size: 0.92rem;">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button type="button" class="btn" id="custom-prompt-confirm-btn" style="${confirmBtnStyle} border-radius: 12px; font-weight: 700; padding: 0.75rem 1.4rem; font-size: 0.92rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${escapeHtml(confirmText)}</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        const textarea = document.getElementById('custom-prompt-textarea');
        if (textarea) {
            textarea.focus();
            textarea.select();
        }

        // Attach Chip Click Listeners
        const chips = backdrop.querySelectorAll('.custom-prompt-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const val = chip.getAttribute('data-val');
                if (textarea && val) {
                    textarea.value = val;
                    textarea.focus();
                }
            });
        });

        let resolved = false;
        const close = (resultVal) => {
            if (resolved) return;
            resolved = true;
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.2s ease';
            setTimeout(() => {
                if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                resolve(resultVal);
            }, 200);
        };

        document.getElementById('custom-prompt-confirm-btn').addEventListener('click', () => {
            const val = textarea ? textarea.value.trim() : '';
            close(val || defaultValue || "Motif non précisé");
        });

        document.getElementById('custom-prompt-cancel-btn').addEventListener('click', () => close(null));
        document.getElementById('custom-modal-close-x').addEventListener('click', () => close(null));

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close(null);
        });

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                close(null);
            } else if (e.key === 'Enter' && e.ctrlKey) {
                document.removeEventListener('keydown', handleKeyDown);
                const val = textarea ? textarea.value.trim() : '';
                close(val || defaultValue || "Motif non précisé");
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

window.addEventListener('load', () => {
    updateNavbar();
});

window.addEventListener('au_data_changed', () => {
    updateNavbar();
});

window.addEventListener('storage', () => {
    updateNavbar();
});
