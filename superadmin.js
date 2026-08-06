/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Super Administrator Controller (superadmin.js)
 * Fully synchronized with au_users and au_requests database functions.
 */

let activeTab = 'admins';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Guard
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'superadmin') {
        window.location.href = 'login.html';
        return;
    }

    // Set user email in header
    const emailElem = document.getElementById('sa-user-email');
    if (emailElem) {
        emailElem.textContent = currentUser.email || 'superadmin@agenceurbaine.ma';
    }

    // 2. Initial Render
    refreshAllSuperAdminData();

    // 3. Realtime Event Synchronization
    window.addEventListener('au_data_changed', refreshAllSuperAdminData);
    window.addEventListener('storage', refreshAllSuperAdminData);

    // Continuous state polling to ensure instant sync across tabs
    let lastUsersJson = '';
    let lastRequestsJson = '';

    setInterval(() => {
        try {
            const uJson = localStorage.getItem('au_users') || '';
            const rJson = localStorage.getItem('au_intervention_requests') || '';
            if (uJson !== lastUsersJson || rJson !== lastRequestsJson) {
                lastUsersJson = uJson;
                lastRequestsJson = rJson;
                refreshAllSuperAdminData();
            }
        } catch(e) {}
    }, 1000);
});

/**
 * Main Refresh Function
 * Reads fresh data from central getters and updates all stats & active tables.
 */
function refreshAllSuperAdminData() {
    renderGlobalStats();
    renderAdminsTable();
    renderEmployeesTable();
    renderRequestsTable();
}

/**
 * 1. Calculate & Render 8 Global Realtime Statistics Cards
 */
function renderGlobalStats() {
    const users = getUsers();
    const requests = getRequests();

    // 1. Total Employees
    const employees = users.filter(u => u && u.role !== 'admin' && u.role !== 'superadmin');
    const totalEmployees = employees.length;

    // 2. Total Department Admins
    const admins = users.filter(u => u && (u.role === 'admin' || u.role === 'department_admin'));
    const totalAdmins = admins.length;

    // 3. Total Requests
    const totalRequests = requests.length;

    // Request Status Counters
    let pendingRequests = 0;
    let acceptedRequests = 0;
    let inProgressRequests = 0;
    let resolvedRequests = 0;
    let rejectedRequests = 0;

    requests.forEach(r => {
        const norm = getNormalizedStatus(r.status);
        if (norm === 'pending' || norm === 'info_requested') pendingRequests++;
        else if (norm === 'accepted') acceptedRequests++;
        else if (norm === 'progress') inProgressRequests++;
        else if (norm === 'resolved') resolvedRequests++;
        else if (norm === 'rejected') rejectedRequests++;
    });

    setElemText('sa-stat-total-employees', totalEmployees);
    setElemText('sa-stat-total-admins', totalAdmins);
    setElemText('sa-stat-total-requests', totalRequests);
    setElemText('sa-stat-pending-requests', pendingRequests);
    setElemText('sa-stat-accepted-requests', acceptedRequests);
    setElemText('sa-stat-progress-requests', inProgressRequests);
    setElemText('sa-stat-resolved-requests', resolvedRequests);
    setElemText('sa-stat-rejected-requests', rejectedRequests);
}

function setElemText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/**
 * Tab Navigation Handler
 */
window.switchTab = function(tabName) {
    activeTab = tabName;
    const tabBtns = document.querySelectorAll('.sa-tab-btn');
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const contentAdmins = document.getElementById('tab-content-admins');
    const contentEmployees = document.getElementById('tab-content-employees');
    const contentRequests = document.getElementById('tab-content-requests');

    if (contentAdmins) contentAdmins.style.display = tabName === 'admins' ? 'block' : 'none';
    if (contentEmployees) contentEmployees.style.display = tabName === 'employees' ? 'block' : 'none';
    if (contentRequests) contentRequests.style.display = tabName === 'requests' ? 'block' : 'none';
};

/**
 * 2. GESTION DES ADMINISTRATEURS (Table & Actions)
 */
function renderAdminsTable() {
    const tbody = document.getElementById('tbody-admins');
    if (!tbody) return;

    const users = getUsers();
    const admins = users.filter(u => u && (u.role === 'admin' || u.role === 'department_admin'));

    if (admins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--sa-text-muted); padding: 2rem;">
                    Aucun administrateur de département trouvé.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = admins.map(adm => {
        const isApproved = adm.status === 'approved';
        const statusBadge = isApproved 
            ? '<span class="sa-badge sa-badge-resolved">Actif</span>' 
            : '<span class="sa-badge sa-badge-pending">Désactivé</span>';

        const nameStr = escapeHtml(adm.name || `${adm.firstName || ''} ${adm.lastName || ''}`);
        const emailStr = escapeHtml(adm.email || '');
        const deptStr = escapeHtml(adm.department || 'GLOBAL');
        const dateStr = escapeHtml(adm.createdAt || 'System');

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #FFF;">${nameStr}</div>
                    <div style="font-size: 0.78rem; color: var(--sa-text-muted);">${emailStr}</div>
                </td>
                <td>
                    <span class="sa-badge-dept">${deptStr}</span>
                </td>
                <td>${statusBadge}</td>
                <td style="color: var(--sa-text-muted); font-size: 0.82rem;">${dateStr}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center;">
                        <button type="button" class="sa-btn sa-btn-secondary" onclick="openEditAdminModal('${adm.id}')" title="Modifier">
                            Modifier
                        </button>
                        <button type="button" class="sa-btn sa-btn-warning" onclick="resetAdminPassword('${adm.id}')" title="Réinitialiser MDP">
                            Reset MDP
                        </button>
                        <button type="button" class="sa-btn ${isApproved ? 'sa-btn-secondary' : 'sa-btn-success'}" onclick="toggleAdminStatus('${adm.id}')">
                            ${isApproved ? 'Désactiver' : 'Activer'}
                        </button>
                        <button type="button" class="sa-btn sa-btn-danger" onclick="deleteAdmin('${adm.id}')" title="Supprimer">
                            Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Modal Handlers for Admins
window.openCreateAdminModal = function() {
    const modal = document.getElementById('sa-modal-admin');
    const title = document.getElementById('sa-modal-admin-title');
    const editId = document.getElementById('admin-edit-id');
    const form = document.getElementById('form-super-admin');

    if (!modal || !form) return;

    form.reset();
    if (editId) editId.value = '';
    if (title) title.textContent = 'Créer un Administrateur de Département';

    const emailInput = document.getElementById('admin-email');
    if (emailInput) emailInput.disabled = false;

    modal.classList.add('active');
};

window.openEditAdminModal = function(adminId) {
    const users = getUsers();
    const admin = users.find(u => u.id === adminId);
    if (!admin) return;

    const modal = document.getElementById('sa-modal-admin');
    const title = document.getElementById('sa-modal-admin-title');

    document.getElementById('admin-edit-id').value = admin.id;
    document.getElementById('admin-name').value = admin.name || `${admin.firstName || ''} ${admin.lastName || ''}`;
    
    const emailInput = document.getElementById('admin-email');
    emailInput.value = admin.email || '';
    emailInput.disabled = true; // Protect email during edit

    document.getElementById('admin-password').value = admin.password || '';
    document.getElementById('admin-department').value = admin.department || 'DAF';
    document.getElementById('admin-status').value = admin.status || 'approved';

    if (title) title.textContent = 'Modifier l\'Administrateur';
    if (modal) modal.classList.add('active');
};

window.closeAdminModal = function() {
    const modal = document.getElementById('sa-modal-admin');
    if (modal) modal.classList.remove('active');
};

window.handleAdminFormSubmit = function(e) {
    e.preventDefault();

    const editId = document.getElementById('admin-edit-id').value;
    const name = document.getElementById('admin-name').value.trim();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-password').value.trim();
    const department = document.getElementById('admin-department').value;
    const status = document.getElementById('admin-status').value;

    if (!name || !email || !password || !department) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({ title: "Champ Requis", message: "Veuillez remplir tous les champs obligatoires.", type: "warning" });
        } else {
            alert("Veuillez remplir tous les champs obligatoires.");
        }
        return;
    }

    let users = getUsers();

    if (editId) {
        // Edit existing admin
        const idx = users.findIndex(u => u.id === editId);
        if (idx !== -1) {
            users[idx].name = name;
            users[idx].password = password;
            users[idx].department = department;
            users[idx].status = status;
        }
    } else {
        // Check email uniqueness
        if (users.some(u => u.email && u.email.toLowerCase().trim() === email)) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert({ title: "Email existant", message: "Un compte avec cette adresse email existe déjà.", type: "danger" });
            } else {
                alert("Un compte avec cette adresse email existe déjà.");
            }
            return;
        }

        const nameParts = name.split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || '';

        const newAdmin = {
            id: 'usr-admin-' + Date.now(),
            firstName: firstName,
            lastName: lastName,
            name: name,
            email: email,
            password: password,
            role: 'admin',
            department: department,
            status: status,
            createdAt: new Date().toISOString().split('T')[0]
        };

        users.push(newAdmin);
    }

    saveUsers(users);
    closeAdminModal();
    refreshAllSuperAdminData();

    if (typeof showCustomAlert === 'function') {
        showCustomAlert({
            title: editId ? "Compte Modifié" : "Administrateur Créé",
            message: editId ? `Le compte admin ${name} a été mis à jour.` : `L'administrateur ${name} pour le département ${department} a été créé avec succès.`,
            type: "success"
        });
    }
};

window.toggleAdminStatus = function(adminId) {
    let users = getUsers();
    const idx = users.findIndex(u => u.id === adminId);
    if (idx !== -1) {
        users[idx].status = users[idx].status === 'approved' ? 'disabled' : 'approved';
        saveUsers(users);
        refreshAllSuperAdminData();
    }
};

window.resetAdminPassword = async function(adminId) {
    let users = getUsers();
    const user = users.find(u => u.id === adminId);
    if (!user) return;

    let confirmed = false;
    if (typeof showCustomConfirm === 'function') {
        confirmed = await showCustomConfirm({
            title: "Réinitialiser le mot de passe ?",
            message: `Réinitialiser le mot de passe de l'administrateur ${user.name || user.email} à "admin" ?`,
            confirmText: "Réinitialiser",
            type: "warning"
        });
    } else {
        confirmed = confirm(`Réinitialiser le mot de passe de l'administrateur ${user.name || user.email} à "admin" ?`);
    }

    if (confirmed) {
        user.password = 'admin';
        saveUsers(users);
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Mot de Passe Réinitialisé",
                message: `Le nouveau mot de passe pour ${user.name || user.email} est : admin`,
                type: "success"
            });
        }
    }
};

window.deleteAdmin = async function(adminId) {
    let users = getUsers();
    const user = users.find(u => u.id === adminId);
    if (!user) return;

    let confirmed = false;
    if (typeof showCustomConfirm === 'function') {
        confirmed = await showCustomConfirm({
            title: "Supprimer l'Administrateur ?",
            message: `Êtes-vous sûr de vouloir supprimer définitivement le compte administrateur ${user.name || user.email} ?`,
            confirmText: "Supprimer",
            type: "danger"
        });
    } else {
        confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le compte ${user.name || user.email} ?`);
    }

    if (confirmed) {
        users = users.filter(u => u.id !== adminId);
        saveUsers(users);
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Compte Supprimé",
                message: "Le compte administrateur a été supprimé avec succès.",
                type: "success"
            });
        }
    }
};

/**
 * 3. GESTION DES EMPLOYÉS (Table & Actions)
 */
function renderEmployeesTable() {
    const tbody = document.getElementById('tbody-employees');
    if (!tbody) return;

    const deptFilter = (document.getElementById('filter-emp-dept')?.value || 'ALL').toUpperCase();
    const searchText = (document.getElementById('filter-emp-search')?.value || '').toLowerCase().trim();

    const users = getUsers();
    let employees = users.filter(u => u && u.role !== 'admin' && u.role !== 'superadmin');

    // Apply Department Filter
    if (deptFilter !== 'ALL') {
        employees = employees.filter(e => e.department && e.department.toUpperCase() === deptFilter);
    }

    // Apply Search Filter
    if (searchText) {
        employees = employees.filter(e => {
            const name = (e.name || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase();
            const email = (e.email || '').toLowerCase();
            return name.includes(searchText) || email.includes(searchText);
        });
    }

    if (employees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--sa-text-muted); padding: 2rem;">
                    Aucun employé correspondant aux critères de recherche.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = employees.map(emp => {
        const status = emp.status || 'pending';
        let statusBadge = '<span class="sa-badge sa-badge-pending">En attente</span>';
        if (status === 'approved') statusBadge = '<span class="sa-badge sa-badge-resolved">Approuvé</span>';
        if (status === 'disabled') statusBadge = '<span class="sa-badge sa-badge-rejected">Désactivé</span>';

        const nameStr = escapeHtml(emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`);
        const emailStr = escapeHtml(emp.email || '');
        const deptStr = escapeHtml(emp.department || 'N/A');
        const dateStr = escapeHtml(emp.createdAt || 'Standard');

        const isPending = status === 'pending';
        const isApproved = status === 'approved';

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #FFF;">${nameStr}</div>
                    <div style="font-size: 0.78rem; color: var(--sa-text-muted);">${emailStr}</div>
                </td>
                <td>
                    <span class="sa-badge-dept">${deptStr}</span>
                </td>
                <td>${statusBadge}</td>
                <td style="color: var(--sa-text-muted); font-size: 0.82rem;">${dateStr}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center;">
                        ${isPending ? `
                            <button type="button" class="sa-btn sa-btn-success" onclick="approveEmployee('${emp.id}')">
                                Approuver
                            </button>
                        ` : ''}
                        <button type="button" class="sa-btn ${isApproved ? 'sa-btn-secondary' : 'sa-btn-success'}" onclick="toggleEmployeeStatus('${emp.id}')">
                            ${isApproved ? 'Désactiver' : 'Activer'}
                        </button>
                        <button type="button" class="sa-btn sa-btn-warning" onclick="resetEmployeePassword('${emp.id}')">
                            Reset MDP
                        </button>
                        <button type="button" class="sa-btn sa-btn-danger" onclick="deleteEmployee('${emp.id}')">
                            Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.approveEmployee = function(empId) {
    let users = getUsers();
    const idx = users.findIndex(u => u.id === empId);
    if (idx !== -1) {
        users[idx].status = 'approved';
        saveUsers(users);
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Compte Approuvé",
                message: `Le compte de l'employé ${users[idx].name || users[idx].email} est désormais approuvé.`,
                type: "success"
            });
        }
    }
};

window.toggleEmployeeStatus = function(empId) {
    let users = getUsers();
    const idx = users.findIndex(u => u.id === empId);
    if (idx !== -1) {
        users[idx].status = users[idx].status === 'approved' ? 'disabled' : 'approved';
        saveUsers(users);
        refreshAllSuperAdminData();
    }
};

window.resetEmployeePassword = async function(empId) {
    let users = getUsers();
    const user = users.find(u => u.id === empId);
    if (!user) return;

    let confirmed = false;
    if (typeof showCustomConfirm === 'function') {
        confirmed = await showCustomConfirm({
            title: "Réinitialiser le mot de passe ?",
            message: `Réinitialiser le mot de passe de ${user.name || user.email} à "user123" ?`,
            confirmText: "Réinitialiser",
            type: "warning"
        });
    } else {
        confirmed = confirm(`Réinitialiser le mot de passe de ${user.name || user.email} à "user123" ?`);
    }

    if (confirmed) {
        user.password = 'user123';
        saveUsers(users);
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Mot de Passe Réinitialisé",
                message: `Nouveau mot de passe pour ${user.name || user.email} : user123`,
                type: "success"
            });
        }
    }
};

window.deleteEmployee = async function(empId) {
    let users = getUsers();
    const user = users.find(u => u.id === empId);
    if (!user) return;

    let confirmed = false;
    if (typeof showCustomConfirm === 'function') {
        confirmed = await showCustomConfirm({
            title: "Supprimer le Compte Employé ?",
            message: `Êtes-vous sûr de vouloir supprimer définitivement le compte employé ${user.name || user.email} ?`,
            confirmText: "Supprimer",
            type: "danger"
        });
    } else {
        confirmed = confirm(`Supprimer définitivement le compte de ${user.name || user.email} ?`);
    }

    if (confirmed) {
        users = users.filter(u => u.id !== empId);
        saveUsers(users);
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Compte Supprimé",
                message: "Le compte employé a été supprimé avec succès.",
                type: "success"
            });
        }
    }
};

/**
 * 4. GESTION DES DEMANDES D'INTERVENTION (Table & Actions)
 */
function renderRequestsTable() {
    const tbody = document.getElementById('tbody-requests');
    if (!tbody) return;

    const deptFilter = (document.getElementById('filter-req-dept')?.value || 'ALL').toUpperCase();
    const statusFilter = (document.getElementById('filter-req-status')?.value || 'ALL').toLowerCase();
    const searchText = (document.getElementById('filter-req-search')?.value || '').toLowerCase().trim();

    let requests = getRequests();

    // Department filter
    if (deptFilter !== 'ALL') {
        requests = requests.filter(r => r.department && r.department.toUpperCase() === deptFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
        requests = requests.filter(r => getNormalizedStatus(r.status) === statusFilter);
    }

    // Search filter
    if (searchText) {
        requests = requests.filter(r => {
            const code = (r.code || r.id || '').toLowerCase();
            const title = (r.title || r.type || '').toLowerCase();
            const author = (r.authorName || r.authorEmail || '').toLowerCase();
            return code.includes(searchText) || title.includes(searchText) || author.includes(searchText);
        });
    }

    if (requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--sa-text-muted); padding: 2rem;">
                    Aucune demande d'intervention trouvée.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = requests.map(req => {
        const normStatus = getNormalizedStatus(req.status);
        let badgeHtml = '<span class="sa-badge sa-badge-pending">En attente</span>';
        if (normStatus === 'accepted') badgeHtml = '<span class="sa-badge sa-badge-accepted">Acceptée</span>';
        if (normStatus === 'progress') badgeHtml = '<span class="sa-badge sa-badge-progress">En cours</span>';
        if (normStatus === 'resolved') badgeHtml = '<span class="sa-badge sa-badge-resolved">Résolue</span>';
        if (normStatus === 'rejected') badgeHtml = '<span class="sa-badge sa-badge-rejected">Rejetée</span>';

        const codeStr = escapeHtml(req.code || req.id || 'N/A');
        const titleStr = escapeHtml(req.title || req.type || 'Demande sans titre');
        const authorStr = escapeHtml(req.authorName || req.authorEmail || 'Employé');
        const deptStr = escapeHtml(req.department || 'N/A');
        const dateStr = escapeHtml(req.createdAt || req.date || 'Récents');

        return `
            <tr>
                <td><strong style="color: #60A5FA;">#${codeStr}</strong></td>
                <td>
                    <div style="font-weight: 700; color: #FFF;">${titleStr}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: #E2E8F0;">${authorStr}</div>
                </td>
                <td><span class="sa-badge-dept">${deptStr}</span></td>
                <td style="color: var(--sa-text-muted); font-size: 0.82rem;">${dateStr}</td>
                <td>${badgeHtml}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                        <button type="button" class="sa-btn sa-btn-primary" onclick="openRequestDetailsModal('${req.id}')">
                            Consulter
                        </button>
                        <button type="button" class="sa-btn sa-btn-danger" onclick="deleteRequest('${req.id}')">
                            Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openRequestDetailsModal = function(reqId) {
    const requests = getRequests();
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const modal = document.getElementById('sa-modal-request-details');
    const modalBody = document.getElementById('sa-request-modal-body');
    if (!modal || !modalBody) return;

    const normStatus = getNormalizedStatus(req.status);
    const codeStr = escapeHtml(req.code || req.id || 'N/A');
    const titleStr = escapeHtml(req.title || req.type || 'Intervention');
    const descStr = escapeHtml(req.description || 'Aucune description fournie.');
    const authorStr = escapeHtml(req.authorName || 'Non spécifié');
    const emailStr = escapeHtml(req.authorEmail || 'Non spécifié');
    const deptStr = escapeHtml(req.department || 'GLOBAL');
    const dateStr = escapeHtml(req.createdAt || req.date || 'Maintenant');

    modalBody.innerHTML = `
        <div style="margin-bottom: 1.25rem; background: rgba(15, 23, 42, 0.6); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.82rem; font-weight: 800; color: #60A5FA;">CODE: #${codeStr}</span>
                <span class="sa-badge-dept">${deptStr}</span>
            </div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: #FFF; margin-bottom: 0.5rem;">${titleStr}</h4>
            <div style="font-size: 0.85rem; color: var(--sa-text-muted);">
                Demandeur : <strong style="color: #FFF;">${authorStr}</strong> (${emailStr})<br>
                Date de création : ${dateStr}
            </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
            <label class="sa-form-label">Description de la demande :</label>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 0.85rem; font-size: 0.88rem; color: #E2E8F0; line-height: 1.5; max-height: 150px; overflow-y: auto;">
                ${descStr}
            </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <label class="sa-form-label">Changer le Statut de l'Intervention (Super Admin) :</label>
            <select id="sa-change-status-select" class="sa-form-select" style="font-weight: 700;">
                <option value="pending" ${normStatus === 'pending' ? 'selected' : ''}>⏳ En attente</option>
                <option value="accepted" ${normStatus === 'accepted' ? 'selected' : ''}>✔ Acceptée</option>
                <option value="progress" ${normStatus === 'progress' ? 'selected' : ''}>🔄 En cours d'intervention</option>
                <option value="resolved" ${normStatus === 'resolved' ? 'selected' : ''}>✅ Résolue / Terminée</option>
                <option value="rejected" ${normStatus === 'rejected' ? 'selected' : ''}>❌ Rejetée</option>
            </select>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
            <button type="button" class="sa-btn sa-btn-danger" onclick="deleteRequest('${req.id}'); closeRequestDetailsModal();">
                Supprimer la demande
            </button>
            <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="sa-btn sa-btn-secondary" onclick="closeRequestDetailsModal()">Fermer</button>
                <button type="button" class="sa-btn sa-btn-primary" onclick="saveRequestStatusChange('${req.id}')">Enregistrer Modifications</button>
            </div>
        </div>
    `;

    modal.classList.add('active');
};

window.closeRequestDetailsModal = function() {
    const modal = document.getElementById('sa-modal-request-details');
    if (modal) modal.classList.remove('active');
};

window.saveRequestStatusChange = function(reqId) {
    const select = document.getElementById('sa-change-status-select');
    if (!select) return;

    const newStatus = select.value;
    let requests = getRequests();
    const idx = requests.findIndex(r => r.id === reqId);

    if (idx !== -1) {
        requests[idx].status = newStatus;
        saveRequests(requests);
        closeRequestDetailsModal();
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Statut Mis à Jour",
                message: "Le statut de l'intervention a été mis à jour avec succès.",
                type: "success"
            });
        }
    }
};

window.deleteRequest = async function(reqId) {
    let requests = getRequests();
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    let confirmed = false;
    if (typeof showCustomConfirm === 'function') {
        confirmed = await showCustomConfirm({
            title: "Supprimer la Demande ?",
            message: "Êtes-vous sûr de vouloir supprimer définitivement cette demande d'intervention ?",
            confirmText: "Supprimer",
            type: "danger"
        });
    } else {
        confirmed = confirm("Supprimer définitivement cette demande d'intervention ?");
    }

    if (confirmed) {
        requests = requests.filter(r => r.id !== reqId);
        saveRequests(requests);
        refreshAllSuperAdminData();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert({
                title: "Demande Supprimée",
                message: "La demande d'intervention a été supprimée.",
                type: "success"
            });
        }
    }
};

/**
 * Utility HTML Escaper
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
