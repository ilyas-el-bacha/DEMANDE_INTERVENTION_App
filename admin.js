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
    renderSuperAdminPanel();
});

let lastUsersJsonState = '';
let lastRequestsJsonState = '';

function refreshAdminDataAndUI() {
    currentUser = getCurrentUser();
    allRequests = getRequests();
    filterAndRenderAdminTable();
    renderEmployeeManagementPanel();
    renderSuperAdminPanel();
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
        if (superPanel) superPanel.style.display = 'none';
        const adminTopBar = document.getElementById('admin-top-bar');
        if (adminTopBar) adminTopBar.style.display = 'flex';
        const statsGridContainer = document.getElementById('stats-grid-container');
        if (statsGridContainer) statsGridContainer.style.display = 'grid';
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
        // SUPER ADMIN DASHBOARD - PARENT CONTROLLER
        currentAdminDepartment = 'ALL';
        if (superPanel) superPanel.style.display = 'block';

        const adminTopBar = document.getElementById('admin-top-bar');
        if (adminTopBar) adminTopBar.style.display = 'flex';

        const statsGridContainer = document.getElementById('stats-grid-container');
        if (statsGridContainer) statsGridContainer.style.display = 'grid';

        // Hide department switcher for requests
        const deptSwitcherBox = document.getElementById('dept-switcher-container');
        if (deptSwitcherBox) deptSwitcherBox.style.display = 'none';

        // Keep department employee management card hidden for superadmin (superadmin uses dedicated supervision view)
        const empCard = document.getElementById('emp-management-card');
        if (empCard) empCard.style.display = 'none';

        // HIDE INTERVENTION REQUESTS TABLE & FILTERS FOR SUPER ADMIN
        const filtersCard = document.querySelector('.filters-card');
        if (filtersCard) filtersCard.style.display = 'none';

        const tableCard = document.querySelector('.table-container-card');
        if (tableCard) tableCard.style.display = 'none';
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
        const deptLabel = currentAdminDepartment === 'ALL' ? 'TOUTES DIRECTIONS (Supervision Globale)' : `DIRECTION ${currentAdminDepartment}`;
        if (codeElem) codeElem.textContent = currentAdminDepartment === 'ALL' ? 'GLOBAL' : currentAdminDepartment;
        if (tagElem) tagElem.textContent = currentAdminDepartment === 'ALL' ? 'GLOBAL' : currentAdminDepartment;
        if (labelTotal) labelTotal.textContent = currentAdminDepartment === 'ALL' ? 'Demandes Globales' : `Demandes ${currentAdminDepartment}`;
        if (nameElem) nameElem.textContent = `Supervision hiérarchique en temps réel : ${deptLabel}`;
        if (topBadge) {
            topBadge.textContent = '★ Contrôle Central — Super Administrateur (Parent Controller)';
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

    document.querySelectorAll('#dept-tabs-wrapper [data-dept]').forEach(tab => {
        if (tab.getAttribute('data-dept') === currentAdminDepartment) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function initDeptTabs() {
    document.querySelectorAll('#dept-tabs-wrapper [data-dept]').forEach(tab => {
        tab.addEventListener('click', () => {
            // If department admin, prevent changing to unassigned dept
            if (currentUser && currentUser.role === 'admin') {
                if (tab.getAttribute('data-dept') !== currentUser.department) return;
            }

            const dept = tab.getAttribute('data-dept');
            if (dept) {
                currentAdminDepartment = dept;
                updateAdminUIHeader();
                filterAndRenderAdminTable();
                renderEmployeeManagementPanel();
            }
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
        deptRequests = allRequests.filter(r => r && r.department && r.department.trim().toUpperCase() === currentAdminDepartment.trim().toUpperCase());
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

    // Always update Super Admin Global Requests Statistics indicators
    const globalStats = typeof getRealtimeStats === 'function' ? getRealtimeStats('ALL') : { total: 0, pending: 0, progress: 0, resolved: 0 };
    setElemText('super-stat-req-total', globalStats.total);
    setElemText('super-stat-req-pending', globalStats.pending);
    setElemText('super-stat-req-progress', globalStats.progress);
    setElemText('super-stat-req-resolved', globalStats.resolved);
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
        if (norm === 'accepted') statusClass = 'accepted';
        if (norm === 'progress') statusClass = 'progress';
        if (norm === 'resolved') statusClass = 'resolved';
        if (norm === 'rejected') statusClass = 'rejected';

        // Contextual Workflow Action Buttons depending strictly on status:
        let workflowBtns = '';

        if (norm === 'pending' || norm === 'info_requested') {
            workflowBtns = `
                <div class="workflow-btn-stack" style="display: inline-flex; flex-direction: column; gap: 0.35rem; width: 115px;">
                    <button type="button" class="btn btn-sm btn-action-approve" onclick="acceptRequest('${escapeHtml(req.id)}')" title="Accepter la demande" style="background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.38rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); width: 100%;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Accepter
                    </button>
                    <button type="button" class="btn btn-sm btn-action-reject" onclick="rejectRequest('${escapeHtml(req.id)}')" title="Rejeter la demande" style="background: rgba(239, 68, 68, 0.12); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.35); padding: 0.38rem 0.65rem; font-size: 0.78rem; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); width: 100%;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Rejeter
                    </button>
                </div>
            `;
        } else if (norm === 'accepted') {
            workflowBtns = `
                <button type="button" class="btn btn-sm" onclick="startIntervention('${escapeHtml(req.id)}')" title="Démarrer l'intervention" style="background: linear-gradient(135deg, #F97316, #EA580C); color: #FFFFFF; border: none; padding: 0.45rem 0.9rem; font-size: 0.8rem; border-radius: 8px; font-weight: 700; cursor: pointer; box-shadow: 0 3px 10px rgba(249, 115, 22, 0.35); display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s; white-space: nowrap;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Démarrer l'intervention
                </button>
            `;
        } else if (norm === 'progress') {
            workflowBtns = `
                <button type="button" class="btn btn-sm" onclick="openAdminEditModal('${escapeHtml(req.id)}')" title="Clôturer l'intervention et compléter le PV" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 0.45rem 0.9rem; font-size: 0.8rem; border-radius: 8px; font-weight: 700; cursor: pointer; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35); display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s; white-space: nowrap;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m9 15 2 2 4-4"></path></svg>
                    Clôturer (PV)
                </button>
            `;
        } else if (norm === 'resolved') {
            workflowBtns = `
                <button type="button" class="btn btn-sm btn-pv-link" onclick="openViewPVModal('${escapeHtml(req.id)}')" title="Consulter le Procès-Verbal" style="background: rgba(59, 130, 246, 0.12); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.35); padding: 0.45rem 0.9rem; font-size: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15); white-space: nowrap;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    Voir le PV
                </button>
            `;
        } else if (norm === 'rejected') {
            workflowBtns = `
                <span style="font-size: 0.8rem; color: #FCA5A5; font-weight: 600; background: rgba(239, 68, 68, 0.12); padding: 0.38rem 0.8rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Demande Rejetée
                </span>
            `;
        }

        const emitterName = req.emitter || 'Émetteur';
        const rawEmail = req.emitterEmail || req.userEmail || (req.emitter ? `${req.emitter.toLowerCase().trim().replace(/[^a-z0-9.]/g, '').replace(/\s+/g, '.')}@agenceurbaine.ma` : 'employe@agenceurbaine.ma');

        tr.innerHTML = `
            <td style="white-space: nowrap;">
                <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="req-id" title="Voir la fiche détaillée" style="color: #60A5FA; text-decoration: none; font-weight: 700; font-family: monospace; font-size: 0.88rem;">${escapeHtml(req.id)}</a>
            </td>
            <td style="white-space: nowrap; font-size: 0.85rem; color: #CBD5E1; font-weight: 500;">${escapeHtml(req.date)}</td>
            <td style="white-space: nowrap;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600; color: #F8FAFC; font-size: 0.88rem; text-transform: capitalize; letter-spacing: 0.01em;">${escapeHtml(emitterName)}</span>
                    <span style="font-size: 0.75rem; color: #94A3B8; margin-top: 2px;">${escapeHtml(rawEmail)}</span>
                </div>
            </td>
            <td style="white-space: nowrap;"><span class="dept-badge">${escapeHtml(req.department || 'SI')}</span></td>
            <td style="white-space: nowrap;"><span class="stat-badge ${req.priority === 'Urgente' ? 'rejected' : 'total'}">${escapeHtml(req.priority || 'Moyenne')}</span></td>
            <td style="white-space: nowrap; font-size: 0.85rem; color: #E2E8F0; font-weight: 500;">${escapeHtml(req.category)}</td>
            <td style="white-space: nowrap;"><span class="status-badge ${statusClass}">● ${escapeHtml(req.status)}</span></td>
            <td style="text-align: right; white-space: nowrap;">
                <div class="action-btns" style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                    ${workflowBtns}
                    <button type="button" onclick="deleteRequest('${escapeHtml(req.id)}')" title="Supprimer la demande" style="background: transparent; color: #9CA3AF; border: none; padding: 0.4rem; cursor: pointer; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; opacity: 0.5; transition: all 0.2s;" onmouseover="this.style.opacity='1'; this.style.color='#EF4444'; this.style.background='rgba(239, 68, 68, 0.12)';" onmouseout="this.style.opacity='0.5'; this.style.color='#9CA3AF'; this.style.background='transparent';">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
    const deptAdminsTable = users.filter(u => u && u.role === 'admin');
    const pendingAdmins = deptAdminsTable.filter(u => u.status === 'pending');
    const approvedDeptAdmins = deptAdminsTable.filter(u => u.status === 'approved' || !u.status);

    // 2. Employees: All user accounts with employee role (or non-admin/superadmin)
    const rawEmployees = users.filter(u => u && u.role !== 'admin' && u.role !== 'superadmin');
    const totalEmpCount = rawEmployees.length;

    // Independent Stat Counters & Badges (Calculated dynamically from real storage)
    const pendingEmployees = rawEmployees.filter(u => u && u.status === 'pending');
    const totalPendingAccounts = pendingAdmins.length + pendingEmployees.length;
    const globalStats = getRealtimeStats('ALL');

    // 1. Department Administrators Count
    setElemText('super-stat-admins-count', deptAdminsTable.length);
    setElemText('super-admins-total-badge', `${approvedDeptAdmins.length} actifs (${pendingAdmins.length} en attente)`);
    setElemText('super-total-badge', `${deptAdminsTable.length} administrateurs`);
    setElemText('super-pending-badge', `${pendingAdmins.length} en attente`);

    // 2. Registered Employees Count
    setElemText('super-stat-employees-count', totalEmpCount);
    setElemText('super-employees-total-badge', `${totalEmpCount} employés enregistrés`);

    // 3. Pending Accounts Count (Admins + Employees)
    setElemText('super-stat-pending-accounts-count', totalPendingAccounts);
    setElemText('super-pending-accounts-badge', `${totalPendingAccounts} en attente (${pendingAdmins.length} admin, ${pendingEmployees.length} emp)`);

    // 4. Total Intervention Requests
    setElemText('super-stat-req-total', globalStats.total);

    // 5. Interventions in Progress
    setElemText('super-stat-req-progress', globalStats.progress);

    // 6. Interventions Resolved
    setElemText('super-stat-req-resolved', globalStats.resolved);

    // Update Hierarchy Architecture Tree Node live counts
    const allReqs = getRequests();
    ['DAF', 'DGUR', 'DET', 'SI'].forEach(deptKey => {
        const dEmps = users.filter(u => u && u.role !== 'admin' && u.role !== 'superadmin' && u.department && u.department.toUpperCase().includes(deptKey));
        const dReqs = allReqs.filter(r => r && r.department && r.department.toUpperCase().includes(deptKey));
        setElemText(`tree-${deptKey.toLowerCase()}-count`, `${dEmps.length} employé(s) | ${dReqs.length} demande(s)`);
    });

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
                const initials = getInitials(fullName);
                tr.innerHTML = `
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-inline" style="background: linear-gradient(135deg, #F59E0B, #D97706);">${escapeHtml(initials)}</div>
                            <div style="min-width: 0;">
                                <strong style="color: #F8FAFC; font-size: 0.9rem; display: block; line-height: 1.2;">${escapeHtml(fullName)}</strong>
                                <small style="color: #94A3B8; font-size: 0.78rem; display: block; margin-top: 2px;">${escapeHtml(adm.email)}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(adm.department)}</span></td>
                    <td><span style="font-size: 0.82rem; color: #94A3B8; white-space: nowrap;">${escapeHtml(adm.createdAt || '2026-07-30')}</span></td>
                    <td style="text-align: right;">
                        <div class="action-btns-wrap">
                            <button type="button" class="btn-action btn-action-approve" onclick="approveAdminUser('${adm.id}')" title="Approuver le compte">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>Approuver</span>
                            </button>
                            <button type="button" class="btn-action btn-action-reject" onclick="rejectAdminUser('${adm.id}')" title="Rejeter la demande">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                if (adm.status === 'disabled') badge = `<span class="stat-badge disabled" style="background: rgba(107, 114, 128, 0.2); color: #9CA3AF; border: 1px solid rgba(156, 163, 175, 0.3);">Désactivé</span>`;

                const isDisabled = adm.status === 'disabled';
                const toggleBtnHtml = isDisabled
                    ? `<button type="button" class="btn-action btn-action-enable" onclick="toggleAdminStatus('${adm.id}')" title="Activer le compte">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span>Activer</span>
                       </button>`
                    : `<button type="button" class="btn-action btn-action-disable" onclick="toggleAdminStatus('${adm.id}')" title="Désactiver le compte">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <span>Désactiver</span>
                       </button>`;

                const deleteBtnHtml = `
                    <button type="button" class="btn-action btn-action-delete" onclick="deleteAdminUser('${adm.id}')" title="Supprimer le compte">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        <span>Supprimer</span>
                    </button>
                `;

                const fullName = adm.name || `${adm.firstName || ''} ${adm.lastName || ''}`.trim() || 'Administrateur';
                const initials = getInitials(fullName);

                tr.innerHTML = `
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-inline" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8);">${escapeHtml(initials)}</div>
                            <div style="min-width: 0;">
                                <strong style="color: #F8FAFC; font-size: 0.9rem; display: block; line-height: 1.2;">${escapeHtml(fullName)}</strong>
                                <small style="color: #94A3B8; font-size: 0.78rem; display: block; margin-top: 2px;">${escapeHtml(adm.email)}</small>
                            </div>
                        </div>
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

    // 3. Registered Employees Table for Super Admin (Real-Time Supervision View Only)
    const empTbody = document.getElementById('all-super-employees-tbody');
    if (empTbody) {
        empTbody.innerHTML = '';

        let filteredEmployees = rawEmployees;
        if (superEmpFilterDept !== 'ALL') {
            filteredEmployees = rawEmployees.filter(u => u && u.department && u.department.trim().toUpperCase() === superEmpFilterDept.trim().toUpperCase());
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

                tr.innerHTML = `
                    <td>
                        <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                    </td>
                    <td>
                        <span style="color: var(--text-secondary); font-size: 0.88rem;">${escapeHtml(emp.email)}</span>
                    </td>
                    <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
                    <td>${badge}</td>
                    <td style="text-align: right;"><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(emp.createdAt || '-')}</span></td>
                `;
                empTbody.appendChild(tr);
            });
        }
    }
}

function normalizeDeptCode(dept) {
    if (!dept) return '';
    const d = dept.trim().toUpperCase();
    if (d === 'SI' || d.startsWith('SI ') || d.startsWith('SI-') || d.includes('INFORMATIQUE')) return 'SI';
    if (d === 'DAF' || d.startsWith('DAF ') || d.startsWith('DAF-') || d.includes('FINANCIERE') || d.includes('FINANCIÈRE')) return 'DAF';
    if (d === 'DGUR' || d.startsWith('DGUR ') || d.startsWith('DGUR-') || d.includes('GESTION URBAINE')) return 'DGUR';
    if (d === 'DET' || d.startsWith('DET ') || d.startsWith('DET-') || d.includes('ETUDES') || d.includes('ÉTUDES')) return 'DET';
    return d;
}

if (typeof getInitials !== 'function') {
    window.getInitials = function(name) {
        if (!name || typeof name !== 'string') return 'AU';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'AU';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
}

function renderEmployeeManagementPanel() {
    const card = document.getElementById('emp-management-card');
    if (!card) return;

    if (currentUser && currentUser.role === 'superadmin') {
        card.style.display = 'none';
        return;
    }

    const users = getUsers();
    const targetDeptCode = normalizeDeptCode(currentAdminDepartment || (currentUser ? currentUser.department : 'SI'));

    setElemText('emp-dept-title', targetDeptCode === 'ALL' ? 'Toutes Directions' : targetDeptCode);

    // Fetch all employee accounts matching the target department directly from au_users
    const allDeptEmps = users.filter(u => {
        if (!u) return false;
        const role = (u.role || '').toLowerCase();
        const isEmp = role === 'employee' || (role !== 'admin' && role !== 'superadmin');
        if (!isEmp) return false;

        if (!targetDeptCode || targetDeptCode === 'ALL') return true;
        const userDeptCode = normalizeDeptCode(u.department);
        return userDeptCode === targetDeptCode;
    });

    // 1. Pending registration requests
    const pendingEmp = allDeptEmps.filter(u => u.status === 'pending');

    // 2. Approved and registered department employees
    const registeredEmp = allDeptEmps.filter(u => u.status === 'approved' || u.status === 'disabled' || !u.status || u.status === 'active');

    setElemText('emp-pending-badge', `${pendingEmp.length} en attente`);
    setElemText('emp-total-badge', `${registeredEmp.length} employé${registeredEmp.length > 1 ? 's' : ''}`);

    // 1. Pending Employees Table
    const pendingTbody = document.getElementById('pending-employees-tbody');
    if (pendingTbody) {
        pendingTbody.innerHTML = '';
        if (pendingEmp.length === 0) {
            pendingTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">Aucune demande d'inscription d'employé en attente pour ce département.</td></tr>`;
        } else {
            pendingEmp.forEach(emp => {
                const tr = document.createElement('tr');
                const fullName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employé';
                const initials = getInitials(fullName);
                
                tr.innerHTML = `
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-inline">${escapeHtml(initials)}</div>
                            <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        </div>
                    </td>
                    <td><span style="color: var(--text-muted); font-size: 0.88rem;">${escapeHtml(emp.email)}</span></td>
                    <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">${escapeHtml(emp.createdAt || '2026-08-02')}</span></td>
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

    // 2. All Registered Employees Table
    const allTbody = document.getElementById('all-employees-tbody');
    if (allTbody) {
        allTbody.innerHTML = '';
        if (registeredEmp.length === 0) {
            allTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">Aucun employé enregistré pour ce département.</td></tr>`;
        } else {
            registeredEmp.forEach(emp => {
                const tr = document.createElement('tr');

                let badge = `<span class="stat-badge resolved">Approuvé</span>`;
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
                const initials = getInitials(fullName);

                tr.innerHTML = `
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-inline">${escapeHtml(initials)}</div>
                            <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(fullName)}</strong>
                        </div>
                    </td>
                    <td><span style="color: var(--text-muted); font-size: 0.88rem;">${escapeHtml(emp.email)}</span></td>
                    <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
                    <td>${badge}</td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">${escapeHtml(emp.createdAt || '2026-08-02')}</span></td>
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
    const target = users.find(u => u && (u.id === userId || (u.email && u.email.toLowerCase().trim() === String(userId).toLowerCase().trim())));
    if (!target) return;

    target.status = 'approved';
    saveUsers(users);
    renderEmployeeManagementPanel();
    renderSuperAdminPanel();

    await window.showCustomAlert({
        title: "Compte Employé Approuvé",
        message: `Le compte employé de ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) a été APPROUVÉ par l'Administrateur.\n\nL'employé peut désormais se connecter et soumettre ses demandes d'intervention.`,
        buttonText: "D'accord",
        type: "success"
    });
};

window.rejectEmployeeUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u && (u.id === userId || (u.email && u.email.toLowerCase().trim() === String(userId).toLowerCase().trim())));
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
    renderSuperAdminPanel();
};

window.toggleEmployeeStatus = function(userId) {
    const users = getUsers();
    const target = users.find(u => u && (u.id === userId || (u.email && u.email.toLowerCase().trim() === String(userId).toLowerCase().trim())));
    if (!target) return;

    target.status = target.status === 'disabled' ? 'approved' : 'disabled';
    saveUsers(users);
    renderEmployeeManagementPanel();
    renderSuperAdminPanel();
};

window.deleteEmployeeUser = async function(userId) {
    const users = getUsers();
    const target = users.find(u => u && (u.id === userId || (u.email && u.email.toLowerCase().trim() === String(userId).toLowerCase().trim())));
    if (!target) return;

    const confirmed = await window.showCustomConfirm({
        title: "Supprimer l'employé",
        message: `Voulez-vous vraiment supprimer définitivement le compte de l'employé ${target.name || target.firstName + ' ' + target.lastName} (${target.department}) ?`,
        confirmText: "Supprimer le compte",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    const updated = users.filter(u => u && u.id !== target.id && (u.email || '').toLowerCase().trim() !== (target.email || '').toLowerCase().trim());
    saveUsers(updated);
    renderEmployeeManagementPanel();
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

    const closeViewPvBtn = document.getElementById('close-view-pv-modal');
    const closeViewPvBtnBottom = document.getElementById('close-view-pv-btn');
    const viewPvModal = document.getElementById('view-pv-modal');

    const closeViewPv = () => {
        if (viewPvModal) viewPvModal.style.display = 'none';
    };

    if (closeViewPvBtn) closeViewPvBtn.addEventListener('click', closeViewPv);
    if (closeViewPvBtnBottom) closeViewPvBtnBottom.addEventListener('click', closeViewPv);

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAdminEdit();
        });
    }
}

window.openViewPVModal = function(id) {
    const req = allRequests.find(r => r.id === id);
    if (!req) return;

    const modal = document.getElementById('view-pv-modal');
    const titleElem = document.getElementById('view-pv-modal-title');
    const bodyElem = document.getElementById('view-pv-modal-body');
    const fullLink = document.getElementById('view-pv-full-link');

    if (titleElem) titleElem.textContent = `Procès-Verbal d'Intervention - N° ${req.id}`;
    if (fullLink) fullLink.href = `request_details.html?id=${encodeURIComponent(req.id)}`;

    const verif = req.verification || {};
    const interv = req.intervention || {};
    const result = req.result || {};
    const sig = req.signature || {};

    const sigHtml = (sig.signed || (req.signatures && req.signatures.admin)) ? `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 0.85rem; text-align: center;">
            <div style="color: #34D399; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Visa Officiel Apposé
            </div>
            <div style="color: #F8FAFC; font-weight: 700; font-size: 0.9rem;">${escapeHtml(sig.signer || req.signatures?.adminName || 'Chef de Département')}</div>
            <div style="color: #94A3B8; font-size: 0.78rem; margin-top: 2px;">Département ${escapeHtml(sig.department || req.department)} • Date : ${escapeHtml(sig.date || req.signatures?.adminDate || req.date)}</div>
        </div>
    ` : `
        <div style="background: rgba(100, 116, 139, 0.1); border: 1px dashed rgba(100, 116, 139, 0.3); border-radius: 8px; padding: 0.85rem; text-align: center; color: #94A3B8; font-style: italic;">
            En attente de visa officiel
        </div>
    `;

    const emitterSigHtml = (req.signatures && req.signatures.emitter) ? `
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0.5rem; text-align: center; max-height: 80px; display: flex; align-items: center; justify-content: center;">
            <img src="${req.signatures.emitter}" style="max-height: 60px; max-width: 100%; object-fit: contain;" alt="Visa Émetteur">
        </div>
    ` : `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0.85rem; text-align: center; color: #94A3B8; font-size: 0.8rem;">
            Signature manuscrite enregistrée lors de l'émission
        </div>
    `;

    bodyElem.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; font-family: system-ui, -apple-system, sans-serif;">
            
            <!-- Summary Banner -->
            <div style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(30, 64, 175, 0.4)); border: 1px solid rgba(59, 130, 246, 0.3); padding: 1rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <div style="font-size: 0.75rem; color: #93C5FD; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Référence Officielle</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF;">Demande N° ${escapeHtml(req.id)}</div>
                    <div style="font-size: 0.8rem; color: #CBD5E1;">Réf. Code : ${escapeHtml(req.code || 'FM-SI-04')} • Ver. ${escapeHtml(req.version || '02')}</div>
                </div>
                <div style="text-align: right;">
                    <span style="background: #10B981; color: #FFFFFF; font-weight: 800; padding: 0.4rem 0.9rem; border-radius: 9999px; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);">
                        ● ${escapeHtml(req.status)}
                    </span>
                    <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 0.4rem;">Émise le ${escapeHtml(req.date || '—')}</div>
                </div>
            </div>

            <!-- Section 1: Demandeur & Anomaly -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem;">
                    1. Information Générale de la Demande
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; font-size: 0.88rem;">
                    <div><span style="color: #94A3B8;">Émetteur :</span> <strong style="color: #F8FAFC;">${escapeHtml(req.emitter || '—')}</strong></div>
                    <div><span style="color: #94A3B8;">Email :</span> <strong style="color: #F8FAFC;">${escapeHtml(req.emitterEmail || '—')}</strong></div>
                    <div><span style="color: #94A3B8;">Département :</span> <strong style="color: #60A5FA;">${escapeHtml(req.department || '—')}</strong></div>
                    <div><span style="color: #94A3B8;">Priorité :</span> <strong style="color: ${req.priority === 'Urgente' ? '#FCA5A5' : '#F8FAFC'};">${escapeHtml(req.priority || 'Moyenne')}</strong></div>
                    <div style="grid-column: 1 / -1;"><span style="color: #94A3B8;">Nature d'intervention :</span> <strong style="color: #38BDF8;">${escapeHtml(req.category || '—')}</strong></div>
                </div>
                <div style="margin-top: 0.75rem; background: rgba(0, 0, 0, 0.2); padding: 0.75rem; border-radius: 8px; border-left: 3px solid #60A5FA;">
                    <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 600; margin-bottom: 0.2rem;">Anomalie / Problème signalé :</div>
                    <div style="font-size: 0.88rem; color: #E2E8F0; white-space: pre-wrap;">${escapeHtml(req.anomaly || 'Aucune description fournie.')}</div>
                </div>
            </div>

            <!-- Section 2: Verification (Diagnostic) -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem;">
                    2. Diagnostic Technicien & Vérification
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; font-size: 0.88rem;">
                    <div><span style="color: #94A3B8;">Date d'analyse :</span> <strong style="color: #F8FAFC;">${escapeHtml(verif.dateAnalyse || req.date || '—')}</strong></div>
                    <div><span style="color: #94A3B8;">Analyste / Technicien :</span> <strong style="color: #F8FAFC;">${escapeHtml(verif.verifiedBy || 'Technicien')}</strong></div>
                    <div><span style="color: #94A3B8;">Mode d'intervention :</span> <strong style="color: #34D399;">${escapeHtml(verif.type || 'Interne')}</strong></div>
                </div>
                <div style="margin-top: 0.75rem; background: rgba(0, 0, 0, 0.2); padding: 0.75rem; border-radius: 8px; border-left: 3px solid #34D399;">
                    <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 600; margin-bottom: 0.2rem;">Diagnostic & Recommandations :</div>
                    <div style="font-size: 0.88rem; color: #E2E8F0; white-space: pre-wrap;">${escapeHtml(verif.recommendation || 'Diagnostic complété par le technicien.')}</div>
                </div>
            </div>

            <!-- Section 3: Travaux Réalisés -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: #A78BFA; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem;">
                    3. Travaux Réalisés & Clôture
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; font-size: 0.88rem;">
                    <div><span style="color: #94A3B8;">Date de réalisation :</span> <strong style="color: #F8FAFC;">${escapeHtml(interv.date || verif.dateAnalyse || req.date || '—')}</strong></div>
                    <div><span style="color: #94A3B8;">Service effectué :</span> <strong style="color: #A78BFA;">${escapeHtml(interv.type || 'Dépannage & Maintenance')}</strong></div>
                    <div><span style="color: #94A3B8;">Résultat :</span> <strong style="color: ${result.effective !== false ? '#34D399' : '#FCA5A5'};">${result.effective !== false ? 'EFFICACE (100%)' : 'NON EFFICACE'}</strong></div>
                </div>
                <div style="margin-top: 0.75rem; background: rgba(0, 0, 0, 0.2); padding: 0.75rem; border-radius: 8px; border-left: 3px solid #A78BFA;">
                    <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 600; margin-bottom: 0.2rem;">Observations & Notes du Technicien :</div>
                    <div style="font-size: 0.88rem; color: #E2E8F0; white-space: pre-wrap;">${escapeHtml(interv.observations || result.notes || 'Intervention exécutée et clôturée avec succès.')}</div>
                </div>
            </div>

            <!-- Section 4: Signatures Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                <div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: #94A3B8; margin-bottom: 0.4rem;">Visa Émetteur :</div>
                    ${emitterSigHtml}
                </div>
                <div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: #94A3B8; margin-bottom: 0.4rem;">Visa Chef de Département / Signataire :</div>
                    ${sigHtml}
                </div>
            </div>

        </div>
    `;

    if (modal) modal.style.display = 'flex';
};

window.openAdminEditModal = function(id) {
    const req = allRequests.find(r => r.id === id);
    if (!req) return;

    setElemText('modal-req-id', `Clôturer l'intervention & Valider le PV - N° ${req.id}`);
    document.getElementById('modal-target-id').value = req.id;

    // Prefill Existing Data
    const statusSelect = document.getElementById('edit-status');
    const prioritySelect = document.getElementById('edit-priority');
    if (statusSelect) statusSelect.value = req.status === 'En cours' ? 'Résolue' : req.status;
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

async function saveAdminEdit() {
    const reqId = document.getElementById('modal-target-id').value;
    const reqIndex = allRequests.findIndex(r => r.id === reqId);

    if (reqIndex === -1) return;

    // Upon PV completion & signature validation, status automatically becomes 'Résolue'
    const selectedStatus = document.getElementById('edit-status')?.value;
    const newStatus = (selectedStatus && selectedStatus !== 'En cours') ? selectedStatus : 'Résolue';
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

    if (!req.signatures) {
        req.signatures = {};
    }
    req.signatures.admin = true;
    req.signatures.adminName = signerName;
    req.signatures.adminDate = signatureDate;

    if (!req.history) req.history = [];
    req.history.push({
        date: formattedTime,
        label: `Procès-Verbal complété, validé et signé par ${signerName} (${currentAdminDepartment}) — Statut automatique : "${newStatus}"`
    });

    // Save back to LocalStorage
    saveRequests(allRequests);

    document.getElementById('admin-modal').style.display = 'none';
    filterAndRenderAdminTable();

    await window.showCustomAlert({
        title: "Intervention Clôturée & PV Validé",
        message: `Le Procès-Verbal pour la demande N° ${reqId} a été entièrement validé et signé.\n\nLe statut est désormais "Résolue" et le bouton de consultation "Voir le PV" est disponible.`,
        buttonText: "D'accord",
        type: "success"
    });
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

window.openCreateAdminModal = function() {
    const modal = document.getElementById('create-admin-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeCreateAdminModal = function() {
    const modal = document.getElementById('create-admin-modal');
    if (modal) modal.style.display = 'none';
};

window.handleCreateAdmin = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = document.getElementById('new-admin-name').value.trim();
    const email = document.getElementById('new-admin-email').value.trim().toLowerCase();
    const department = document.getElementById('new-admin-dept').value;
    const password = document.getElementById('new-admin-password').value;

    if (!name || !email || !password) return;

    const users = getUsers();
    const existing = users.find(u => u.email && u.email.toLowerCase().trim() === email);
    if (existing) {
        await window.showCustomAlert({
            title: "Email déjà utilisé",
            message: `Un compte existe déjà avec l'adresse email ${email}.`,
            buttonText: "Compris",
            type: "danger"
        });
        return;
    }

    const newAdmin = {
        id: 'usr-adm-' + Date.now(),
        name: name,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        password: password,
        role: 'admin',
        department: department,
        status: 'approved',
        createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newAdmin);
    saveUsers(users);
    closeCreateAdminModal();
    const form = document.getElementById('create-admin-form');
    if (form) form.reset();

    refreshAdminDataAndUI();

    await window.showCustomAlert({
        title: "Administrateur Créé",
        message: `Le compte administrateur pour ${name} (${department}) a été créé et approuvé avec succès.`,
        buttonText: "D'accord",
        type: "success"
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
