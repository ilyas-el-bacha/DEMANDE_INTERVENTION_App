/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Administration & Super Administrator Controller (admin.js)
 */

let currentAdminDepartment = 'SI';
let allRequests = [];
let currentFilteredRequests = [];
let currentUser = null;
let superEmpFilterDept = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    initAdminSession();
    initDeptTabs();
    initSuperEmpDeptFilter();
    initFilterHandlers();
    initModalEvents();
    loadAdminRequests();
    renderEmployeeManagementPanel();
    if (currentUser && currentUser.role === 'superadmin') {
        renderSuperAdminPanel();
    }
});

let lastUsersJsonState = '';
let lastRequestsJsonState = '';

function refreshAdminDataAndUI() {
    currentUser = getCurrentUser();
    allRequests = getRequests();
    filterAndRenderAdminTable();
    renderEmployeeManagementPanel();
    if (currentUser && currentUser.role === 'superadmin') {
        renderSuperAdminPanel();
    }
}

window.addEventListener('storage', () => {
    refreshAdminDataAndUI();
});

window.addEventListener('au_data_changed', () => {
    refreshAdminDataAndUI();
});

setInterval(() => {
    try {
        const uJson = localStorage.getItem('au_users') || '';
        const rJson = localStorage.getItem('au_intervention_requests') || '';
        if (uJson !== lastUsersJsonState || rJson !== lastRequestsJsonState) {
            lastUsersJsonState = uJson;
            lastRequestsJsonState = rJson;
            refreshAdminDataAndUI();
        }
    } catch(e) {}
}, 1000);

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
        const deptSwitcherBox = document.getElementById('dept-switcher-container');
        if (deptSwitcherBox) {
            deptSwitcherBox.style.display = 'none';
        }
        const empCard = document.getElementById('emp-management-card');
        if (empCard) empCard.style.display = 'block';
        const filtersCard = document.querySelector('.filters-card');
        if (filtersCard) filtersCard.style.display = 'flex';
        const tableCard = document.querySelector('.table-container-card');
        if (tableCard) tableCard.style.display = 'block';
    } else if (currentUser.role === 'superadmin') {
        // SUPER ADMIN DASHBOARD - ONLY GLOBAL REAL-TIME STATS & ADMIN MANAGEMENT
        currentAdminDepartment = 'ALL';
        if (superPanel) superPanel.style.display = 'block';

        // Hide all non-superadmin elements
        const deptSwitcherBox = document.getElementById('dept-switcher-container');
        if (deptSwitcherBox) deptSwitcherBox.style.display = 'none';

        const empCard = document.getElementById('emp-management-card');
        if (empCard) empCard.style.display = 'none';

        const filtersCard = document.querySelector('.filters-card');
        if (filtersCard) filtersCard.style.display = 'none';

        const tableCard = document.querySelector('.table-container-card');
        if (tableCard) tableCard.style.display = 'none';

        const topBadge = document.getElementById('admin-top-badge');
        if (topBadge) {
            topBadge.textContent = '★ Direction Générale — Super Administrateur';
            topBadge.style.background = 'rgba(220, 38, 38, 0.2)';
            topBadge.style.color = '#FCA5A5';
            topBadge.style.borderColor = 'rgba(220, 38, 38, 0.4)';
        }

        const welcomeTitle = document.getElementById('admin-welcome-title');
        if (welcomeTitle) {
            welcomeTitle.innerHTML = `Tableau de Bord Général Super Administrateur`;
        }
    }

    updateAdminUIHeader();
}

function updateAdminUIHeader() {
    const codeElem = document.getElementById('active-dept-code');
    const nameElem = document.getElementById('active-dept-name');
    const tagElem = document.getElementById('admin-stat-dept-tag');
    const labelTotal = document.getElementById('admin-stat-label-total');
    const topBadge = document.getElementById('admin-top-badge');

    if (currentUser && currentUser.role === 'superadmin') {
        if (codeElem) codeElem.textContent = 'GLOBAL';
        if (tagElem) tagElem.textContent = 'GLOBAL';
        if (labelTotal) labelTotal.textContent = 'Demandes Globales';
        if (nameElem) nameElem.textContent = 'Statistiques globales de l\'Agence Urbaine en temps réel et gestion centrale des administrateurs.';
        if (topBadge) {
            topBadge.textContent = '★ Direction Générale — Super Administrateur';
            topBadge.style.background = 'rgba(220, 38, 38, 0.2)';
            topBadge.style.color = '#FCA5A5';
            topBadge.style.borderColor = 'rgba(220, 38, 38, 0.4)';
        }
    } else if (currentUser && currentUser.role === 'admin') {
        if (codeElem) codeElem.textContent = currentUser.department;
        if (tagElem) tagElem.textContent = currentUser.department;
        if (labelTotal) labelTotal.textContent = 'Demandes à Traiter';
        if (topBadge) {
            topBadge.textContent = `Gestionnaire Départemental — ${currentUser.department}`;
            topBadge.style.background = 'rgba(59, 130, 246, 0.2)';
            topBadge.style.color = '#93C5FD';
            topBadge.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        }

        const deptNames = {
            'DAF': 'Direction Administrative et Financière',
            'DGUR': 'Direction de la Gestion Urbaine & Réglementation',
            'DET': 'Direction des Études Techniques',
            'SI': 'Service Informatique et Systèmes d\'Information'
        };
        if (nameElem) {
            const fullName = deptNames[currentUser.department] || `Département ${currentUser.department}`;
            nameElem.textContent = `${fullName} — Module de gestion, affectation et résolution des interventions.`;
        }
    } else {
        if (codeElem) codeElem.textContent = currentAdminDepartment === 'ALL' ? 'TOUTES DIRECTIONS' : currentAdminDepartment;
        if (tagElem) tagElem.textContent = currentAdminDepartment;
        if (labelTotal) labelTotal.textContent = 'Demandes Affectées';

        if (nameElem) {
            switch(currentAdminDepartment) {
                case 'DAF': nameElem.textContent = 'Direction Administrative et Financière'; break;
                case 'DGUR': nameElem.textContent = 'Direction de la Gestion Urbaine & Réglementation'; break;
                case 'DET': nameElem.textContent = 'Direction des Études Techniques'; break;
                case 'SI': nameElem.textContent = 'Service Informatique et Systèmes d\'Information'; break;
                case 'ALL': nameElem.textContent = 'Supervision Générale de Toutes les Directions'; break;
            }
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
            renderEmployeeManagementPanel();
        });
    });
}

function initSuperEmpDeptFilter() {
    const tabs = document.querySelectorAll('#super-emp-dept-filter-tabs [data-super-emp-dept]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            superEmpFilterDept = tab.getAttribute('data-super-emp-dept') || 'ALL';
            if (currentUser && currentUser.role === 'superadmin') {
                renderSuperAdminPanel();
            }
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
    updateAdminStats();

    if (currentUser && currentUser.role === 'superadmin') {
        const filtersCard = document.querySelector('.filters-card');
        if (filtersCard) filtersCard.style.display = 'none';
        const tableCard = document.querySelector('.table-container-card');
        if (tableCard) tableCard.style.display = 'none';
        return;
    }

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

function updateAdminStats() {
    const deptForStats = (currentUser && currentUser.role === 'superadmin') ? 'ALL' : (currentAdminDepartment || 'ALL');
    const stats = typeof getRealtimeStats === 'function' ? getRealtimeStats(deptForStats) : { total: 0, pending: 0, progress: 0, resolved: 0 };

    setElemText('admin-stat-total', stats.total);
    setElemText('admin-stat-pending', stats.pending);
    setElemText('admin-stat-progress', stats.progress);
    setElemText('admin-stat-resolved', stats.resolved);
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

        const norm = getNormalizedStatus(req.status);
        let statusClass = 'pending';
        if (norm === 'accepted') statusClass = 'total';
        if (norm === 'progress') statusClass = 'progress';
        if (norm === 'resolved') statusClass = 'resolved';
        if (norm === 'rejected') statusClass = 'rejected';

        // Workflow Action Buttons depending on status:
        let workflowBtns = '';

        if (norm === 'pending' || norm === 'info_requested') {
            workflowBtns = `
                <button type="button" class="btn btn-sm btn-action-approve" onclick="acceptRequest('${escapeHtml(req.id)}')" title="Accepter la demande" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.35rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ✓ Accepter
                </button>
                <button type="button" class="btn btn-sm" onclick="startIntervention('${escapeHtml(req.id)}')" title="Démarrer l'intervention immédiatement" style="background: rgba(249, 115, 22, 0.2); color: #FB923C; border: 1px solid rgba(249, 115, 22, 0.4); padding: 0.35rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ▶ Démarrer
                </button>
                <button type="button" class="btn btn-sm" onclick="requestInfo('${escapeHtml(req.id)}')" title="Demander des informations complémentaires" style="background: rgba(245, 158, 11, 0.2); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 0.35rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    💬 Info
                </button>
                <button type="button" class="btn btn-sm btn-action-reject" onclick="rejectRequest('${escapeHtml(req.id)}')" title="Rejeter la demande" style="background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.35rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ✕ Rejeter
                </button>
            `;
        } else if (norm === 'accepted') {
            workflowBtns = `
                <button type="button" class="btn btn-sm" onclick="startIntervention('${escapeHtml(req.id)}')" title="Démarrer l'intervention" style="background: linear-gradient(135deg, #F97316, #EA580C); color: #FFFFFF; border: none; padding: 0.35rem 0.75rem; font-size: 0.78rem; border-radius: 6px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3);">
                    ▶ Démarrer Intervention
                </button>
                <button type="button" class="btn btn-sm btn-action-reject" onclick="rejectRequest('${escapeHtml(req.id)}')" title="Rejeter la demande" style="background: rgba(239, 68, 68, 0.15); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.35rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ✕ Rejeter
                </button>
            `;
        } else if (norm === 'progress') {
            workflowBtns = `
                <button type="button" class="btn btn-sm" onclick="openAdminEditModal('${escapeHtml(req.id)}')" title="Clôturer l'intervention et signer le PV" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 0.35rem 0.75rem; font-size: 0.78rem; border-radius: 6px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);">
                    ✅ Clôturer Intervention
                </button>
            `;
        } else if (norm === 'resolved') {
            workflowBtns = `
                <span style="font-size: 0.78rem; color: #34D399; font-weight: 600; background: rgba(16, 185, 129, 0.15); padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3);">
                    ✓ PV Signé & Clôturé
                </span>
            `;
        } else if (norm === 'rejected') {
            workflowBtns = `
                <span style="font-size: 0.78rem; color: #FCA5A5; font-weight: 600; background: rgba(239, 68, 68, 0.15); padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3);">
                    ✕ Demande Rejetée
                </span>
            `;
        }

        tr.innerHTML = `
            <td><span class="req-id">${escapeHtml(req.id)}</span></td>
            <td>${escapeHtml(req.date)}</td>
            <td><strong>${escapeHtml(req.emitter)}</strong></td>
            <td><span class="dept-badge">${escapeHtml(req.department || 'SI')}</span></td>
            <td><span class="stat-badge ${req.priority === 'Urgente' ? 'rejected' : 'total'}">${escapeHtml(req.priority || 'Moyenne')}</span></td>
            <td>${escapeHtml(req.category)}</td>
            <td><span class="status-badge ${statusClass}">● ${escapeHtml(req.status)}</span></td>
            <td style="text-align: right;">
                <div class="action-btns" style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                    ${workflowBtns}
                    <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="btn btn-secondary btn-icon" title="Voir Fiche / PV" style="padding: 0.35rem 0.6rem; font-size: 0.78rem;">
                        📄 PV
                    </a>
                    <button type="button" class="btn btn-primary btn-icon" onclick="openAdminEditModal('${escapeHtml(req.id)}')" title="Traiter / Éditer PV complet" style="padding: 0.35rem 0.6rem; font-size: 0.78rem;">
                        ✏️ Éditer
                    </button>
                    <button type="button" class="btn btn-danger btn-icon" onclick="deleteRequest('${escapeHtml(req.id)}')" title="Supprimer" style="padding: 0.35rem 0.6rem; font-size: 0.78rem;">
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

    // 1. Department Administrators: ONLY role === 'admin'
    const deptAdminsTable = users.filter(u => u.role === 'admin');
    const pendingAdmins = deptAdminsTable.filter(u => u.status === 'pending');
    const approvedDeptAdmins = deptAdminsTable.filter(u => u.status === 'approved' || !u.status);

    // 2. Employees: ONLY role === 'employee'
    const rawEmployees = users.filter(u => u.role === 'employee');
    const totalEmpCount = rawEmployees.length;

    // Independent Stat Counters & Badges
    setElemText('super-stat-admins-count', approvedDeptAdmins.length);
    setElemText('super-admins-total-badge', `${approvedDeptAdmins.length} administrateurs actifs`);
    setElemText('super-total-badge', `${approvedDeptAdmins.length} administrateurs actifs`);
    setElemText('super-pending-badge', `${pendingAdmins.length} en attente`);

    setElemText('super-stat-employees-count', totalEmpCount);
    setElemText('super-employees-total-badge', `${totalEmpCount} employés enregistrés`);

    // Ensure Global Requests Statistics reflect live stored intervention requests
    updateAdminStats();

    // 1. Pending Admins Table
    const pendingTbody = document.getElementById('pending-admins-tbody');
    if (pendingTbody) {
        pendingTbody.innerHTML = '';
        if (pendingAdmins.length === 0) {
            pendingTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1rem;">Aucune demande d'inscription d'administrateur en attente.</td></tr>`;
        } else {
            pendingAdmins.forEach(adm => {
                const tr = document.createElement('tr');
                const fullName = adm.name || `${adm.firstName || ''} ${adm.lastName || ''}`.trim() || 'Administrateur';
                tr.innerHTML = `
                    <td>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 2px;">${escapeHtml(adm.email)}</small>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(adm.department)}</span></td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(adm.createdAt || '2026-07-30')}</span></td>
                    <td style="text-align: right;">
                        <div class="action-btns-wrap">
                            <button type="button" class="btn-action btn-action-approve" onclick="approveAdminUser('${adm.id}')" title="Approuver le compte">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>Approuver</span>
                            </button>
                            <button type="button" class="btn-action btn-action-reject" onclick="rejectAdminUser('${adm.id}')" title="Rejeter la demande">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                <span>Rejeter</span>
                            </button>
                        </div>
                    </td>
                `;
                pendingTbody.appendChild(tr);
            });
        }
    }

    // 2. Registered Department Admins Table
    const allTbody = document.getElementById('all-admins-tbody');
    if (allTbody) {
        allTbody.innerHTML = '';
        if (deptAdminsTable.length === 0) {
            allTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1rem;">Aucun administrateur enregistré.</td></tr>`;
        } else {
            deptAdminsTable.forEach(adm => {
                const tr = document.createElement('tr');

                let badge = `<span class="stat-badge resolved">Approuvé</span>`;
                if (adm.status === 'pending') badge = `<span class="stat-badge pending">En attente</span>`;
                if (adm.status === 'rejected') badge = `<span class="stat-badge rejected">Rejeté</span>`;
                if (adm.status === 'disabled') badge = `<span class="stat-badge disabled" style="background: #6B7280; color: #FFF;">Désactivé</span>`;

                const isDisabled = adm.status === 'disabled';
                const toggleBtnHtml = isDisabled
                    ? `<button type="button" class="btn-action btn-action-enable" onclick="toggleAdminStatus('${adm.id}')" title="Activer le compte">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span>Activer</span>
                       </button>`
                    : `<button type="button" class="btn-action btn-action-disable" onclick="toggleAdminStatus('${adm.id}')" title="Désactiver le compte">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <span>Désactiver</span>
                       </button>`;

                const deleteBtnHtml = `
                    <button type="button" class="btn-action btn-action-delete" onclick="deleteAdminUser('${adm.id}')" title="Supprimer le compte">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        <span>Supprimer</span>
                    </button>
                `;

                const fullName = adm.name || `${adm.firstName || ''} ${adm.lastName || ''}`.trim() || 'Administrateur';

                tr.innerHTML = `
                    <td>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 2px;">${escapeHtml(adm.email)}</small>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(adm.department)}</span></td>
                    <td>${badge}</td>
                    <td style="text-align: right;">
                        <div class="action-btns-wrap">
                            ${toggleBtnHtml}
                            ${deleteBtnHtml}
                        </div>
                    </td>
                `;
                allTbody.appendChild(tr);
            });
        }
    }

    // 3. Registered Employees Table for Super Admin (Real-Time Supervision & Management)
    const empTbody = document.getElementById('all-super-employees-tbody');
    if (empTbody) {
        empTbody.innerHTML = '';

        let filteredEmployees = rawEmployees;
        if (superEmpFilterDept !== 'ALL') {
            filteredEmployees = rawEmployees.filter(u => u.department === superEmpFilterDept);
        }

        const badgeText = superEmpFilterDept === 'ALL'
            ? `${totalEmpCount} employés enregistrés`
            : `${filteredEmployees.length} / ${totalEmpCount} employés (${superEmpFilterDept})`;

        setElemText('super-emp-table-badge', badgeText);

        if (filteredEmployees.length === 0) {
            empTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.25rem;">Aucun employé trouvé pour le département sélectionné.</td></tr>`;
        } else {
            filteredEmployees.forEach(emp => {
                const tr = document.createElement('tr');

                let badge = `<span class="stat-badge resolved">Approuvé</span>`;
                if (emp.status === 'pending') badge = `<span class="stat-badge pending">En attente</span>`;
                if (emp.status === 'rejected') badge = `<span class="stat-badge rejected">Rejeté</span>`;
                if (emp.status === 'disabled') badge = `<span class="stat-badge disabled" style="background: #6B7280; color: #FFF;">Désactivé</span>`;

                const fullName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employé';

                let actionBtns = '';
                if (emp.status === 'pending') {
                    actionBtns = `
                        <button type="button" class="btn-action btn-action-approve" onclick="approveEmployeeUser('${emp.id}')" title="Approuver le compte employé">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Approuver</span>
                        </button>
                        <button type="button" class="btn-action btn-action-reject" onclick="rejectEmployeeUser('${emp.id}')" title="Rejeter l'inscription">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            <span>Rejeter</span>
                        </button>
                        <button type="button" class="btn-action btn-action-delete" onclick="deleteEmployeeUser('${emp.id}')" title="Supprimer le compte">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            <span>Supprimer</span>
                        </button>
                    `;
                } else {
                    const isDisabled = emp.status === 'disabled';
                    const toggleBtnHtml = isDisabled
                        ? `<button type="button" class="btn-action btn-action-enable" onclick="toggleEmployeeStatus('${emp.id}')" title="Activer l'employé">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span>Activer</span>
                           </button>`
                        : `<button type="button" class="btn-action btn-action-disable" onclick="toggleEmployeeStatus('${emp.id}')" title="Désactiver l'employé">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            <span>Désactiver</span>
                           </button>`;

                    const deleteBtnHtml = `
                        <button type="button" class="btn-action btn-action-delete" onclick="deleteEmployeeUser('${emp.id}')" title="Supprimer le compte">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            <span>Supprimer</span>
                        </button>
                    `;

                    actionBtns = `
                        ${toggleBtnHtml}
                        ${deleteBtnHtml}
                    `;
                }

                tr.innerHTML = `
                    <td>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 2px;">${escapeHtml(emp.email)}</small>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
                    <td>${badge}</td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(emp.createdAt || '-')}</span></td>
                    <td style="text-align: right;">
                        <div class="action-btns-wrap">
                            ${actionBtns}
                        </div>
                    </td>
                `;
                empTbody.appendChild(tr);
            });
        }
    }
}

function renderEmployeeManagementPanel() {
    const card = document.getElementById('emp-management-card');
    if (!card) return;

    if (currentUser && currentUser.role === 'superadmin') {
        card.style.display = 'none';
        return;
    }

    const users = getUsers();

    setElemText('emp-dept-title', currentAdminDepartment === 'ALL' ? 'Toutes Directions' : currentAdminDepartment);

    let deptEmployees = [];
    if (currentAdminDepartment === 'ALL') {
        deptEmployees = users.filter(u => u.role === 'employee');
    } else {
        deptEmployees = users.filter(u => u.role === 'employee' && u.department === currentAdminDepartment);
    }

    const pendingEmp = deptEmployees.filter(u => u.status === 'pending');

    setElemText('emp-pending-badge', `${pendingEmp.length} en attente`);
    setElemText('emp-total-badge', `${deptEmployees.length} employés`);

    // 1. Pending Employees Table
    const pendingTbody = document.getElementById('pending-employees-tbody');
    if (pendingTbody) {
        pendingTbody.innerHTML = '';
        if (pendingEmp.length === 0) {
            pendingTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1rem;">Aucune demande d'inscription d'employé en attente pour ce département.</td></tr>`;
        } else {
            pendingEmp.forEach(emp => {
                const tr = document.createElement('tr');
                const fullName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employé';
                tr.innerHTML = `
                    <td>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 2px;">${escapeHtml(emp.email)}</small>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(emp.createdAt || '2026-07-31')}</span></td>
                    <td style="text-align: right;">
                        <div class="action-btns-wrap">
                            <button type="button" class="btn-action btn-action-approve" onclick="approveEmployeeUser('${emp.id}')" title="Approuver l'employé">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>Approuver</span>
                            </button>
                            <button type="button" class="btn-action btn-action-reject" onclick="rejectEmployeeUser('${emp.id}')" title="Rejeter l'inscription">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                <span>Rejeter</span>
                            </button>
                        </div>
                    </td>
                `;
                pendingTbody.appendChild(tr);
            });
        }
    }

    // 2. All Employees Table
    const allTbody = document.getElementById('all-employees-tbody');
    if (allTbody) {
        allTbody.innerHTML = '';
        if (deptEmployees.length === 0) {
            allTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1rem;">Aucun employé enregistré pour ce département.</td></tr>`;
        } else {
            deptEmployees.forEach(emp => {
                const tr = document.createElement('tr');

                let badge = `<span class="stat-badge resolved">Approuvé</span>`;
                if (emp.status === 'pending') badge = `<span class="stat-badge pending">En attente</span>`;
                if (emp.status === 'rejected') badge = `<span class="stat-badge rejected">Rejeté</span>`;
                if (emp.status === 'disabled') badge = `<span class="stat-badge disabled" style="background: #6B7280; color: #FFF;">Désactivé</span>`;

                const isDisabled = emp.status === 'disabled';
                const toggleBtnHtml = isDisabled
                    ? `<button type="button" class="btn-action btn-action-enable" onclick="toggleEmployeeStatus('${emp.id}')" title="Activer l'employé">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span>Activer</span>
                       </button>`
                    : `<button type="button" class="btn-action btn-action-disable" onclick="toggleEmployeeStatus('${emp.id}')" title="Désactiver l'employé">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <span>Désactiver</span>
                       </button>`;

                const deleteBtnHtml = `
                    <button type="button" class="btn-action btn-action-delete" onclick="deleteEmployeeUser('${emp.id}')" title="Supprimer l'employé">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        <span>Supprimer</span>
                    </button>
                `;

                const fullName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employé';

                tr.innerHTML = `
                    <td>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 2px;">${escapeHtml(emp.email)}</small>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
                    <td>${badge}</td>
                    <td style="text-align: right;">
                        <div class="action-btns-wrap">
                            ${toggleBtnHtml}
                            ${deleteBtnHtml}
                        </div>
                    </td>
                `;
                allTbody.appendChild(tr);
            });
        }
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

window.toggleAdminStatus = function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target || target.role === 'superadmin') return;

    target.status = target.status === 'disabled' ? 'approved' : 'disabled';
    saveUsers(users);
    renderSuperAdminPanel();
};

window.deleteAdminUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target || target.role === 'superadmin') return;

    const confirmed = await window.showCustomConfirm({
        title: "Supprimer l'administrateur",
        message: `Voulez-vous vraiment supprimer définitivement le compte administrateur de ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) ?`,
        confirmText: "Supprimer",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    renderSuperAdminPanel();
};

window.approveEmployeeUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    target.status = 'approved';
    saveUsers(users);
    renderEmployeeManagementPanel();
    if (currentUser && currentUser.role === 'superadmin') renderSuperAdminPanel();

    await window.showCustomAlert({
        title: "Compte Employé Approuvé",
        message: `Le compte employé de ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) a été APPROUVÉ par l'Administrateur.\n\nL'employé peut désormais se connecter et soumettre ses demandes d'intervention.`,
        buttonText: "D'accord",
        type: "success"
    });
};

window.rejectEmployeeUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const confirmed = await window.showCustomConfirm({
        title: "Rejeter l'employé",
        message: `Voulez-vous vraiment rejeter la demande d'inscription de l'employé ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) ?`,
        confirmText: "Rejeter l'inscription",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    target.status = 'rejected';
    saveUsers(users);
    renderEmployeeManagementPanel();
    if (currentUser && currentUser.role === 'superadmin') renderSuperAdminPanel();
};

window.toggleEmployeeStatus = function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    target.status = target.status === 'disabled' ? 'approved' : 'disabled';
    saveUsers(users);
    renderEmployeeManagementPanel();
    if (currentUser && currentUser.role === 'superadmin') renderSuperAdminPanel();
};

window.deleteEmployeeUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const confirmed = await window.showCustomConfirm({
        title: "Supprimer l'employé",
        message: `Voulez-vous vraiment supprimer définitivement le compte de l'employé ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) ?`,
        confirmText: "Supprimer le compte",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    renderEmployeeManagementPanel();
    if (currentUser && currentUser.role === 'superadmin') renderSuperAdminPanel();
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

    // Signature Section
    const signerInput = document.getElementById('signer-name');
    if (signerInput) signerInput.value = req.signature?.signer || (currentUser ? currentUser.name : `Admin ${currentAdminDepartment}`);
    const sigDateInput = document.getElementById('signature-date');
    if (sigDateInput) sigDateInput.value = req.signature?.date || today;
    const signCheck = document.getElementById('sign-approval-check');
    if (signCheck) signCheck.checked = true;

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

    const signerName = document.getElementById('signer-name')?.value.trim() || (currentUser ? currentUser.name : 'Admin');
    const signatureDate = document.getElementById('signature-date')?.value || new Date().toISOString().split('T')[0];

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

    req.signature = {
        signer: signerName,
        date: signatureDate,
        department: req.department || currentAdminDepartment,
        signed: true
    };

    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `PV Officiel complété et signé par ${signerName} (${currentAdminDepartment}) : Statut "${newStatus}"`
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

window.acceptRequest = async function(reqId) {
    const req = allRequests.find(r => r.id === reqId);
    if (!req) return;

    req.status = 'Acceptée';
    const now = new Date();
    const formattedTime = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `Demande N° ${reqId} ACCEPTÉE par l'Administrateur du département ${req.department || currentAdminDepartment}`
    });

    saveRequests(allRequests);
    filterAndRenderAdminTable();

    await window.showCustomAlert({
        title: "Demande Acceptée",
        message: `La demande N° ${reqId} a été acceptée avec succès.\n\nLe statut a été mis à jour à "Acceptée" en temps réel.`,
        buttonText: "Continuer",
        type: "success"
    });
};

window.startIntervention = async function(reqId) {
    const req = allRequests.find(r => r.id === reqId);
    if (!req) return;

    const today = new Date().toISOString().split('T')[0];
    req.status = 'En cours';
    if (!req.intervention) req.intervention = {};
    req.intervention.date = req.intervention.date || today;
    req.intervention.intervenant = req.intervention.intervenant || (currentUser ? currentUser.name : `Technicien ${req.department}`);

    const now = new Date();
    const formattedTime = `${today} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `Intervention technique DÉMARRÉE par ${req.intervention.intervenant} (${req.department || currentAdminDepartment})`
    });

    saveRequests(allRequests);
    filterAndRenderAdminTable();

    await window.showCustomAlert({
        title: "Intervention Démarrée",
        message: `L'intervention sur la demande N° ${reqId} est désormais "En cours".\n\nL'émetteur verra immédiatement le démarrage de l'intervention dans son suivi en temps réel.`,
        buttonText: "D'accord",
        type: "success"
    });
};

window.rejectRequest = async function(reqId) {
    const req = allRequests.find(r => r.id === reqId);
    if (!req) return;

    const reason = prompt(`Motif du rejet pour la demande N° ${reqId} (optionnel) :`, "Demande non conforme ou non éligible");
    if (reason === null) return; // User cancelled prompt

    req.status = 'Rejetée';
    const now = new Date();
    const formattedTime = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `Demande REJETÉE par l'Administrateur ${req.department}. Motif : ${reason}`
    });

    saveRequests(allRequests);
    filterAndRenderAdminTable();

    await window.showCustomAlert({
        title: "Demande Rejetée",
        message: `La demande N° ${reqId} a été marquée comme "Rejetée".`,
        buttonText: "Compris",
        type: "warning"
    });
};

window.requestInfo = async function(reqId) {
    const req = allRequests.find(r => r.id === reqId);
    if (!req) return;

    const infoText = prompt(`Précisez les informations complémentaires requises pour la demande N° ${reqId} :`, "Veuillez apporter des précisions sur la localisation exacte du problème.");
    if (!infoText) return;

    req.status = 'Infos requises';
    const now = new Date();
    const formattedTime = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `Informations complémentaires demandées : ${infoText}`
    });

    saveRequests(allRequests);
    filterAndRenderAdminTable();

    await window.showCustomAlert({
        title: "Demande d'informations transmise",
        message: `Statut mis à jour à "Infos requises" pour la demande N° ${reqId}.`,
        buttonText: "D'accord",
        type: "info"
    });
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
