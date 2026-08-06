/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Super Administrator Controller (superadmin.js)
 */

let activeSuperEmpDeptFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
    // Session Guard
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'superadmin') {
        window.location.href = 'login.html';
        return;
    }

    initSuperAdminView();
    setupSuperAdminEventListeners();
});

function initSuperAdminView() {
    renderSuperAdminPanel();
}

function setupSuperAdminEventListeners() {
    // Create Admin Form Submit
    const formCreateAdmin = document.getElementById('form-create-admin');
    if (formCreateAdmin) {
        formCreateAdmin.addEventListener('submit', handleCreateAdminSubmit);
    }

    // Employee Department Filter Tabs
    const superEmpTabs = document.querySelectorAll('#super-emp-dept-filter-tabs .dept-tab');
    superEmpTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            superEmpTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeSuperEmpDeptFilter = tab.getAttribute('data-super-emp-dept') || 'ALL';
            renderSuperEmployeesTable();
        });
    });

    // Real-time synchronization events
    window.addEventListener('au_data_changed', () => {
        renderSuperAdminPanel();
    });

    window.addEventListener('storage', () => {
        renderSuperAdminPanel();
    });

    let lastUsersJsonState = '';
    let lastRequestsJsonState = '';

    setInterval(() => {
        try {
            const uJson = localStorage.getItem('au_users') || '';
            const rJson = localStorage.getItem('au_intervention_requests') || '';
            if (uJson !== lastUsersJsonState || rJson !== lastRequestsJsonState) {
                lastUsersJsonState = uJson;
                lastRequestsJsonState = rJson;
                renderSuperAdminPanel();
            }
        } catch(e) {}
    }, 1000);
}

function renderSuperAdminPanel() {
    const users = getUsers();

    // 1. Approved & Total Department Admins
    const deptAdminsTable = users.filter(u => u && u.role === 'admin');
    const approvedDeptAdmins = deptAdminsTable.filter(u => u.status === 'approved');

    // 2. Registered Employees
    const rawEmployees = users.filter(u => u && u.role !== 'admin' && u.role !== 'superadmin');
    const totalEmpCount = rawEmployees.length;

    // Stat Counters & Badges
    setElemText('super-stat-admins-count', deptAdminsTable.length);
    setElemText('super-admins-total-badge', `${approvedDeptAdmins.length} administrateurs actifs`);
    setElemText('super-total-badge', `${deptAdminsTable.length} administrateurs`);

    setElemText('super-stat-employees-count', totalEmpCount);
    setElemText('super-employees-total-badge', `${totalEmpCount} employés enregistrés`);

    // 3. Intervention Requests Statistics (Global - exact same function & logic as Admin Dashboard)
    const globalStats = typeof getRealtimeStats === 'function' ? getRealtimeStats('ALL') : { total: 0, pending: 0, progress: 0, resolved: 0 };
    setElemText('super-stat-req-total', globalStats.total);
    setElemText('super-stat-req-pending', globalStats.pending);
    setElemText('super-stat-req-progress', globalStats.progress);
    setElemText('super-stat-req-resolved', globalStats.resolved);

    // Update Hierarchy Architecture Tree Node live counts using getRealtimeStats per department
    ['DAF', 'DGUR', 'DET', 'SI'].forEach(deptKey => {
        const empCount = users.filter(u => u && u.role === 'employee' && u.department === deptKey).length;
        const deptStats = typeof getRealtimeStats === 'function' ? getRealtimeStats(deptKey) : { total: 0 };
        setElemText(`tree-${deptKey.toLowerCase()}-count`, `${empCount} employé(s) | ${deptStats.total} demande(s)`);
    });

    // Render Department Admins Table
    renderDeptAdminsTable(deptAdminsTable);

    // Render Supervised Employees Table
    renderSuperEmployeesTable();
}

function setElemText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

function renderDeptAdminsTable(deptAdminsTable) {
    const tbody = document.getElementById('all-admins-tbody');
    if (!tbody) return;

    if (deptAdminsTable.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #94A3B8; padding: 2rem;">
                    Aucun administrateur de département trouvé.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = deptAdminsTable.map(adm => {
        const statusBadge = adm.status === 'approved' 
            ? '<span class="stat-badge total">Actif</span>' 
            : '<span class="stat-badge pending">Inactif / En attente</span>';

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #F8FAFC;">${escapeHtml(adm.name || (adm.firstName + ' ' + adm.lastName))}</div>
                    <div style="font-size: 0.8rem; color: #94A3B8;">${escapeHtml(adm.email)}</div>
                </td>
                <td>
                    <span class="badge-dept" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">
                        ${escapeHtml(adm.department || 'N/A')}
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleAdminStatus('${adm.id}')" title="Changer le statut" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                            ${adm.status === 'approved' ? 'Désactiver' : 'Activer'}
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="resetAdminPassword('${adm.id}')" title="Réinitialiser mot de passe" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                            Reset Pass
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteAdminAccount('${adm.id}')" title="Supprimer le compte" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #FCA5A5;">
                            Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderSuperEmployeesTable() {
    const tbody = document.getElementById('all-super-employees-tbody');
    const tableBadge = document.getElementById('super-emp-table-badge');
    if (!tbody) return;

    const users = getUsers();
    let rawEmployees = users.filter(u => u && u.role !== 'admin' && u.role !== 'superadmin');

    if (activeSuperEmpDeptFilter !== 'ALL') {
        rawEmployees = rawEmployees.filter(u => u.department === activeSuperEmpDeptFilter);
    }

    if (tableBadge) {
        tableBadge.textContent = `${rawEmployees.length} employé(s)`;
    }

    if (rawEmployees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #94A3B8; padding: 2rem;">
                    Aucun employé enregistré dans ce département.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = rawEmployees.map(emp => {
        let statusBadge = '<span class="stat-badge resolved">Validé / Actif</span>';
        if (emp.status === 'pending') {
            statusBadge = '<span class="stat-badge pending">En attente d\'approbation</span>';
        } else if (emp.status === 'rejected' || emp.status === 'disabled') {
            statusBadge = '<span class="stat-badge rejected">Inactif / Rejeté</span>';
        }

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #F8FAFC;">${escapeHtml(emp.name || (emp.firstName + ' ' + emp.lastName))}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: #CBD5E1;">${escapeHtml(emp.email)}</div>
                </td>
                <td>
                    <span class="badge-dept" style="background: rgba(147, 51, 234, 0.2); color: #C084FC; border: 1px solid rgba(147, 51, 234, 0.3); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">
                        ${escapeHtml(emp.department || 'N/A')}
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td style="text-align: right; color: #94A3B8; font-size: 0.82rem;">
                    ${escapeHtml(emp.createdAt || 'Standard')}
                </td>
            </tr>
        `;
    }).join('');
}

// Global Actions for Super Admin
window.openCreateAdminModal = function() {
    const modal = document.getElementById('modal-create-admin');
    if (modal) modal.style.display = 'flex';
};

window.closeCreateAdminModal = function() {
    const modal = document.getElementById('modal-create-admin');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('form-create-admin');
    if (form) form.reset();
};

function handleCreateAdminSubmit(e) {
    e.preventDefault();

    const firstName = document.getElementById('new-admin-firstname').value.trim();
    const lastName = document.getElementById('new-admin-lastname').value.trim();
    const email = document.getElementById('new-admin-email').value.trim().toLowerCase();
    const department = document.getElementById('new-admin-dept').value;
    const password = document.getElementById('new-admin-password').value;

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
        showCustomAlert({
            title: "Adresse Email Déjà Utilisée",
            message: `Un compte existe déjà avec l'adresse email "${email}".`,
            type: "warning"
        });
        return;
    }

    const newAdmin = {
        id: 'usr-admin-' + Date.now(),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        password,
        role: 'admin',
        department,
        status: 'approved',
        createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newAdmin);
    saveUsers(users);
    closeCreateAdminModal();
    renderSuperAdminPanel();

    showCustomAlert({
        title: "Administrateur Créé",
        message: `Le compte administrateur pour ${firstName} ${lastName} (${department}) a été créé et activé avec succès.`,
        type: "success"
    });
}

window.toggleAdminStatus = function(adminId) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === adminId);
    if (idx !== -1) {
        users[idx].status = users[idx].status === 'approved' ? 'disabled' : 'approved';
        saveUsers(users);
        renderSuperAdminPanel();
    }
};

window.resetAdminPassword = async function(adminId) {
    const users = getUsers();
    const user = users.find(u => u.id === adminId);
    if (!user) return;

    const confirmReset = await showCustomConfirm({
        title: "Réinitialiser le mot de passe ?",
        message: `Voulez-vous réinitialiser le mot de passe de ${user.name} à "admin123" ?`,
        confirmText: "Réinitialiser",
        type: "warning"
    });

    if (confirmReset) {
        user.password = 'admin123';
        saveUsers(users);
        showCustomAlert({
            title: "Mot de passe réinitialisé",
            message: `Le nouveau mot de passe pour ${user.name} est : admin123`,
            type: "success"
        });
    }
};

window.deleteAdminAccount = async function(adminId) {
    const users = getUsers();
    const user = users.find(u => u.id === adminId);
    if (!user) return;

    const confirmDelete = await showCustomConfirm({
        title: "Supprimer l'administrateur ?",
        message: `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${user.name} (${user.department}) ? Cette action est irréversible.`,
        confirmText: "Supprimer",
        type: "danger"
    });

    if (confirmDelete) {
        const updatedUsers = users.filter(u => u.id !== adminId);
        saveUsers(updatedUsers);
        renderSuperAdminPanel();
        showCustomAlert({
            title: "Compte Supprimé",
            message: `Le compte administrateur a été supprimé.`,
            type: "success"
        });
    }
};
