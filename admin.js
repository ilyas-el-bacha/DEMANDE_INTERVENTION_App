/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Administration & Super Administrator Controller (admin.js)
 */

let currentAdminDepartment = 'SI';
let allRequests = [];
let currentFilteredRequests = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    initAdminSession();
    initDeptTabs();
    initFilterHandlers();
    initModalEvents();
    loadAdminRequests();
    if (currentUser && currentUser.role === 'superadmin') {
        renderSuperAdminPanel();
    }
});

/**
 * Initializes session permissions & department restrictions
 */
function initAdminSession() {
    const bannerBox = document.getElementById('admin-access-banner');
    const superPanel = document.getElementById('superadmin-panel');
    const deptSwitcherLabel = document.getElementById('dept-switcher-label');
    const btnTabAll = document.getElementById('btn-tab-all');

    if (!currentUser) {
        if (bannerBox) {
            bannerBox.style.display = 'block';
            bannerBox.innerHTML = `
                <div class="user-banner-card" style="border-left-color: #EF4444; background: rgba(239, 68, 68, 0.1);">
                    <div class="user-banner-info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                            <strong style="color: #FCA5A5;">Accès Restreint aux Administrateurs</strong>
                            <p style="font-size: 0.85rem; color: #CBD5E1; margin: 0;">Seuls les Chefs de Département ou le Super Administrateur peuvent accéder à ce panneau. Veuillez vous connecter.</p>
                        </div>
                    </div>
                    <div>
                        <a href="login.html" class="btn btn-primary btn-sm">Se Connecter comme Admin</a>
                    </div>
                </div>
            `;
        }
    } else if (currentUser.role === 'employee') {
        if (bannerBox) {
            bannerBox.style.display = 'block';
            bannerBox.innerHTML = `
                <div class="user-banner-card" style="border-left-color: #F59E0B; background: rgba(245, 158, 11, 0.1);">
                    <div class="user-banner-info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                            <strong style="color: #FDE68A;">Profil Employé Détecté</strong>
                            <p style="font-size: 0.85rem; color: #CBD5E1; margin: 0;">Vous êtes actuellement connecté en tant qu'employé (${currentUser.name}). Vous pouvez consulter vos demandes sur l'espace dédié.</p>
                        </div>
                    </div>
                    <div>
                        <a href="my_requests.html" class="btn btn-primary btn-sm">Consulter Mes Demandes</a>
                    </div>
                </div>
            `;
        }
    } else if (currentUser.role === 'admin') {
        // LOCK DEPARTMENT FOR DEPARTMENT ADMINS!
        currentAdminDepartment = currentUser.department;
        if (deptSwitcherLabel) {
            deptSwitcherLabel.textContent = `Département Assigné Exclusif (${currentUser.department}) :`;
        }

        // Hide other department switcher tabs for department admin!
        document.querySelectorAll('.dept-tab').forEach(tab => {
            const dept = tab.getAttribute('data-dept');
            if (dept !== currentUser.department) {
                tab.style.display = 'none';
            } else {
                tab.style.display = 'inline-block';
                tab.classList.add('active');
            }
        });
    } else if (currentUser.role === 'superadmin') {
        // SUPER ADMIN HAS FULL MULTI-DEPT ACCESS
        if (superPanel) superPanel.style.display = 'block';
        if (btnTabAll) btnTabAll.style.display = 'inline-block';
        if (deptSwitcherLabel) deptSwitcherLabel.textContent = 'Sélection du Département à Superviser :';
    }

    updateAdminUIHeader();
}

function updateAdminUIHeader() {
    const codeElem = document.getElementById('active-dept-code');
    const nameElem = document.getElementById('active-dept-name');
    const tagElem = document.getElementById('admin-stat-dept-tag');

    if (codeElem) codeElem.textContent = currentAdminDepartment === 'ALL' ? 'TOUTES DIRECTIONS' : currentAdminDepartment;
    if (tagElem) tagElem.textContent = currentAdminDepartment;

    if (nameElem) {
        switch(currentAdminDepartment) {
            case 'DAF': nameElem.textContent = 'Direction Administrative et Financière'; break;
            case 'DGUR': nameElem.textContent = 'Direction de la Gestion Urbaine & Réglementation'; break;
            case 'DET': nameElem.textContent = 'Direction des Études Techniques'; break;
            case 'SI': nameElem.textContent = 'Service Informatique et Systèmes d\'Information'; break;
            case 'ALL': nameElem.textContent = 'Supervision Générale de Toutes les Directions'; break;
        }
    }

    document.querySelectorAll('.dept-tab').forEach(tab => {
        if (tab.getAttribute('data-dept') === currentAdminDepartment) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function initDeptTabs() {
    document.querySelectorAll('.dept-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // If department admin, prevent changing to unassigned dept
            if (currentUser && currentUser.role === 'admin') {
                if (tab.getAttribute('data-dept') !== currentUser.department) return;
            }

            currentAdminDepartment = tab.getAttribute('data-dept');
            updateAdminUIHeader();
            filterAndRenderAdminTable();
        });
    });
}

function loadAdminRequests() {
    allRequests = getRequests();
    filterAndRenderAdminTable();
}

/**
 * Filter requests by department permission and user criteria
 */
function filterAndRenderAdminTable() {
    const searchVal = document.getElementById('admin-search')?.value.toLowerCase().trim() || '';
    const statusVal = document.getElementById('admin-filter-status')?.value || 'ALL';
    const priorityVal = document.getElementById('admin-filter-priority')?.value || 'ALL';
    const dateVal = document.getElementById('admin-filter-date')?.value || '';

    // 1. Department Filter
    let deptRequests = [];
    if (currentAdminDepartment === 'ALL') {
        deptRequests = [...allRequests];
    } else {
        deptRequests = allRequests.filter(r => r.department === currentAdminDepartment);
    }

    // 2. Update Stats
    updateAdminStats(deptRequests);

    // 3. User Criteria
    currentFilteredRequests = deptRequests.filter(req => {
        const matchSearch = !searchVal || 
            req.id.toLowerCase().includes(searchVal) ||
            req.emitter.toLowerCase().includes(searchVal) ||
            (req.anomaly && req.anomaly.toLowerCase().includes(searchVal));

        const matchStatus = (statusVal === 'ALL') || (req.status === statusVal);
        const matchPriority = (priorityVal === 'ALL') || (req.priority === priorityVal);
        const matchDate = !dateVal || (req.date === dateVal);

        return matchSearch && matchStatus && matchPriority && matchDate;
    });

    renderAdminTable(currentFilteredRequests);
}

function updateAdminStats(deptRequests) {
    const total = deptRequests.length;
    const pending = deptRequests.filter(r => r.status === 'En attente' || r.status === 'Pending').length;
    const progress = deptRequests.filter(r => r.status === 'En cours' || r.status === 'In Progress').length;
    const resolved = deptRequests.filter(r => r.status === 'Résolue' || r.status === 'Resolved').length;

    setElemText('admin-stat-total', total);
    setElemText('admin-stat-pending', pending);
    setElemText('admin-stat-progress', progress);
    setElemText('admin-stat-resolved', resolved);
}

function renderAdminTable(requests) {
    const tbody = document.getElementById('admin-tbody');
    const emptyState = document.getElementById('admin-empty-state');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (requests.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    requests.forEach(req => {
        const tr = document.createElement('tr');

        let statusClass = 'pending';
        if (req.status === 'En cours' || req.status === 'In Progress') statusClass = 'progress';
        if (req.status === 'Résolue' || req.status === 'Resolved') statusClass = 'resolved';
        if (req.status === 'Rejetée' || req.status === 'Rejected') statusClass = 'rejected';

        tr.innerHTML = `
            <td><span class="req-id">${escapeHtml(req.id)}</span></td>
            <td>${escapeHtml(req.date)}</td>
            <td><strong>${escapeHtml(req.emitter)}</strong></td>
            <td><span class="dept-badge">${escapeHtml(req.department || 'SI')}</span></td>
            <td><span class="stat-badge ${req.priority === 'Urgente' ? 'rejected' : 'total'}">${escapeHtml(req.priority || 'Moyenne')}</span></td>
            <td>${escapeHtml(req.category)}</td>
            <td><span class="status-badge ${statusClass}">● ${escapeHtml(req.status)}</span></td>
            <td style="text-align: right;">
                <div class="action-btns">
                    <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="btn btn-secondary btn-icon" title="Voir PV">
                        👁 PV
                    </a>
                    <button type="button" class="btn btn-primary btn-icon" onclick="openAdminEditModal('${escapeHtml(req.id)}')" title="Traiter la demande">
                        ✏️ Traiter
                    </button>
                    <button type="button" class="btn btn-danger btn-icon" onclick="deleteRequest('${escapeHtml(req.id)}')" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function renderSuperAdminPanel() {
    const users = getUsers();
    const pendingAdmins = users.filter(u => u.role === 'admin' && u.status === 'pending');
    const allAdmins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');

    setElemText('super-pending-badge', `${pendingAdmins.length} en attente`);
    setElemText('super-total-badge', `${allAdmins.length} administrateurs`);

    // 1. Pending Admins Table
    const pendingTbody = document.getElementById('pending-admins-tbody');
    if (pendingTbody) {
        pendingTbody.innerHTML = '';
        if (pendingAdmins.length === 0) {
            pendingTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1rem;">Aucune demande d'inscription d'administrateur en attente.</td></tr>`;
        } else {
            pendingAdmins.forEach(adm => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${escapeHtml(adm.name || adm.firstName + ' ' + adm.lastName)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(adm.email)}</small></td>
                    <td><span class="dept-badge">${escapeHtml(adm.department)}</span></td>
                    <td>${escapeHtml(adm.createdAt || '2026-07-30')}</td>
                    <td style="text-align: right;">
                        <button type="button" class="btn-approve" onclick="approveAdminUser('${adm.id}')" title="Approuver le compte"> Approuver</button>
                        <button type="button" class="btn-reject" onclick="rejectAdminUser('${adm.id}')" title="Rejeter la demande"> Rejeter</button>
                    </td>
                `;
                pendingTbody.appendChild(tr);
            });
        }
    }

    // 2. All Admins Table
    const allTbody = document.getElementById('all-admins-tbody');
    if (allTbody) {
        allTbody.innerHTML = '';
        allAdmins.forEach(adm => {
            const tr = document.createElement('tr');

            let badge = `<span class="stat-badge resolved">Approuvé</span>`;
            if (adm.status === 'pending') badge = `<span class="stat-badge pending">En attente</span>`;
            if (adm.status === 'rejected') badge = `<span class="stat-badge rejected">Rejeté</span>`;

            tr.innerHTML = `
                <td><strong>${escapeHtml(adm.name || adm.firstName + ' ' + adm.lastName)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(adm.email)}</small></td>
                <td><span class="dept-badge">${escapeHtml(adm.department)}</span></td>
                <td>${badge}</td>
            `;
            allTbody.appendChild(tr);
        });
    }
}

window.approveAdminUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    target.status = 'approved';
    saveUsers(users);
    renderSuperAdminPanel();

    await window.showCustomAlert({
        title: "Compte Administrateur Approuvé",
        message: `Le compte administrateur de ${target.name || target.firstName + ' ' + target.lastName} pour le département ${target.department} a été APPROUVÉ.\n\nL'administrateur peut maintenant se connecter.`,
        buttonText: "D'accord",
        type: "success"
    });
};

window.rejectAdminUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const confirmed = await window.showCustomConfirm({
        title: "Rejeter l'administrateur",
        message: `Voulez-vous vraiment rejeter la demande d'inscription de ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) ?`,
        confirmText: "Rejeter la demande",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    target.status = 'rejected';
    saveUsers(users);
    renderSuperAdminPanel();
};

function initFilterHandlers() {
    ['admin-search', 'admin-filter-status', 'admin-filter-priority', 'admin-filter-date'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('input', filterAndRenderAdminTable);
            elem.addEventListener('change', filterAndRenderAdminTable);
        }
    });
}

/**
 * Modal Handling for Completing Official Intervention Section
 */
function initModalEvents() {
    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');
    const modalBackdrop = document.getElementById('admin-modal');
    const editForm = document.getElementById('admin-edit-form');

    const closeModal = () => {
        if (modalBackdrop) modalBackdrop.style.display = 'none';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAdminEdit();
        });
    }
}

window.openAdminEditModal = function(id) {
    const req = allRequests.find(r => r.id === id);
    if (!req) return;

    setElemText('modal-req-id', `Compléter le PV - N° ${req.id}`);
    document.getElementById('modal-target-id').value = req.id;

    // Prefill Existing Data
    const statusSelect = document.getElementById('edit-status');
    const prioritySelect = document.getElementById('edit-priority');
    if (statusSelect) statusSelect.value = req.status;
    if (prioritySelect) prioritySelect.value = req.priority || 'Moyenne';

    // Verification Section
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('verif-date').value = req.verification?.dateAnalyse || today;
    document.getElementById('verif-by').value = req.verification?.verifiedBy || `Technicien ${currentAdminDepartment}`;
    document.getElementById('verif-recom').value = req.verification?.recommendation || '';

    // Radio
    const verifType = req.verification?.type || 'Interne';
    const radioElem = document.querySelector(`input[name="verif-type"][value="${verifType}"]`);
    if (radioElem) radioElem.checked = true;

    // Intervention Section
    document.getElementById('interv-date').value = req.intervention?.date || today;
    document.getElementById('interv-type').value = req.intervention?.type || '';
    document.getElementById('interv-obs').value = req.intervention?.observations || '';

    // Result Section
    const resultEff = document.getElementById('result-eff');
    if (resultEff) resultEff.value = req.result?.effective !== false ? 'true' : 'false';
    document.getElementById('result-notes').value = req.result?.notes || '';

    document.getElementById('admin-modal').style.display = 'flex';
};

function saveAdminEdit() {
    const reqId = document.getElementById('modal-target-id').value;
    const reqIndex = allRequests.findIndex(r => r.id === reqId);

    if (reqIndex === -1) return;

    const newStatus = document.getElementById('edit-status').value;
    const newPriority = document.getElementById('edit-priority').value;

    const verifDate = document.getElementById('verif-date').value;
    const verifBy = document.getElementById('verif-by').value.trim();
    const verifRecom = document.getElementById('verif-recom').value.trim();
    const verifType = document.querySelector('input[name="verif-type"]:checked')?.value || 'Interne';

    const intervDate = document.getElementById('interv-date').value;
    const intervType = document.getElementById('interv-type').value.trim();
    const intervObs = document.getElementById('interv-obs').value.trim();

    const isEffective = document.getElementById('result-eff').value === 'true';
    const resultNotes = document.getElementById('result-notes').value.trim();

    const now = new Date();
    const formattedTime = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Update Request Object
    const req = allRequests[reqIndex];
    req.status = newStatus;
    req.priority = newPriority;

    req.verification = {
        dateAnalyse: verifDate,
        verifiedBy: verifBy,
        recommendation: verifRecom,
        type: verifType,
        signed: true
    };

    req.intervention = {
        date: intervDate,
        type: intervType,
        observations: intervObs,
        intervenant: verifBy
    };

    req.result = {
        effective: isEffective,
        notes: resultNotes
    };

    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `Mise à jour par ${currentUser ? currentUser.name : 'Admin'} : Statut passé à "${newStatus}"`
    });

    // Save back to LocalStorage
    saveRequests(allRequests);

    document.getElementById('admin-modal').style.display = 'none';
    filterAndRenderAdminTable();
}

window.deleteRequest = async function(id) {
    const confirmed = await window.showCustomConfirm({
        title: "Confirmer la suppression",
        message: `Voulez-vous vraiment supprimer la demande ${id} ? Cette action est irréversible et mettra à jour les statistiques en temps réel.`,
        confirmText: "🗑️ Supprimer",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    allRequests = allRequests.filter(r => r.id !== id);
    saveRequests(allRequests);
    filterAndRenderAdminTable();
};

function setElemText(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = text;
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
