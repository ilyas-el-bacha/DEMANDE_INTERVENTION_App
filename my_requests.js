/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * My Requests List Controller (my_requests.js)
 */

let allRequests = [];
let userRequests = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    renderUserContextBanner();
    loadRequests();
    initFilterAndSearch();
});

window.addEventListener('storage', () => {
    loadRequests();
});

function updateGlobalStats() {
    const stats = typeof getRealtimeStats === 'function' ? getRealtimeStats() : { total: 0, pending: 0, progress: 0, resolved: 0 };
    
    const totalEl = document.getElementById('stat-total');
    const pendingEl = document.getElementById('stat-pending');
    const progressEl = document.getElementById('stat-progress');
    const resolvedEl = document.getElementById('stat-resolved');

    if (totalEl) totalEl.textContent = stats.total;
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (progressEl) progressEl.textContent = stats.progress;
    if (resolvedEl) resolvedEl.textContent = stats.resolved;
}

function renderUserContextBanner() {
    const container = document.getElementById('user-context-container');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = `
            <div class="user-banner-card" style="border-left-color: #F59E0B; background: rgba(245, 158, 11, 0.1);">
                <div class="user-banner-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <strong style="color: #FDE68A;">Mode Déconnecté / Invité</strong>
                        <p style="font-size: 0.85rem; color: #CBD5E1; margin: 0;">Connectez-vous avec un compte employé pour afficher et gérer uniquement vos propres demandes d'intervention.</p>
                    </div>
                </div>
                <div>
                    <a href="login.html" class="btn btn-primary btn-sm">Se Connecter</a>
                    <a href="signup.html" class="btn btn-secondary btn-sm">S'inscrire</a>
                </div>
            </div>
        `;
    } else if (currentUser.role === 'employee') {
        container.innerHTML = `
            <div class="user-banner-card">
                <div class="user-banner-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <div>
                        <span style="font-size: 0.8rem; color: var(--accent-cyan); text-transform: uppercase; font-weight: 700;">Compte Employé Connecté</span>
                        <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary);">${escapeHtml(currentUser.name || currentUser.firstName + ' ' + currentUser.lastName)} (${escapeHtml(currentUser.email)})</h4>
                        <span style="font-size: 0.82rem; color: var(--text-secondary);">Département : <strong>${escapeHtml(currentUser.department)}</strong> ${currentUser.employeeId ? '| Matricule: ' + escapeHtml(currentUser.employeeId) : ''}</span>
                    </div>
                </div>
                <div>
                    <a href="intervention.html" class="btn btn-primary btn-sm">
                        + Nouvelle Demande
                    </a>
                </div>
            </div>
        `;
    } else {
        // Admin or Super Admin viewing
        container.innerHTML = `
            <div class="user-banner-card" style="border-left-color: #8B5CF6;">
                <div class="user-banner-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <div>
                        <strong style="color: #C084FC;">Espace Administrateur (${currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin ' + currentUser.department})</strong>
                        <p style="font-size: 0.85rem; color: #CBD5E1; margin: 0;">Pour gérer les interventions des équipes et valider les dossiers, accédez au Tableau de Bord Admin.</p>
                    </div>
                </div>
                <div>
                    <a href="admin.html" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, var(--primary-purple), var(--primary-indigo));">Accéder au Tableau de Bord Admin</a>
                </div>
            </div>
        `;
    }
}

function loadRequests() {
    allRequests = getRequests();
    updateGlobalStats();

    if (currentUser && currentUser.role === 'employee') {
        // STRICT FILTERING: Logged-in employee sees ONLY their own intervention requests!
        const userEmail = (currentUser.email || '').toLowerCase().trim();
        const userName = (currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`).toLowerCase().trim();
        const userLastName = (currentUser.lastName || '').toLowerCase().trim();

        userRequests = allRequests.filter(req => {
            const reqEmail = (req.emitterEmail || '').toLowerCase().trim();
            const reqEmitter = (req.emitter || '').toLowerCase().trim();

            if (reqEmail && userEmail && reqEmail === userEmail) return true;
            if (reqEmitter && userName && reqEmitter === userName) return true;
            if (reqEmitter && userLastName && reqEmitter.includes(userLastName)) return true;
            return false;
        });
    } else if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
        // Admins viewing this page see all requests
        userRequests = [...allRequests];
    } else {
        // Unauthenticated guest: Private personal list is empty
        userRequests = [];
    }

    renderTable(userRequests);
}

function renderTable(requests) {
    const tbody = document.getElementById('requests-tbody');
    const emptyState = document.getElementById('empty-state');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (requests.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            const emptyText = emptyState.querySelector('p');
            const emptyTitle = emptyState.querySelector('h3');
            if (!currentUser) {
                if (emptyTitle) emptyTitle.textContent = "Accès restreint aux demandes";
                if (emptyText) emptyText.textContent = "Vous devez vous connecter avec votre compte employé pour consulter vos demandes d'intervention personnelles.";
            } else {
                if (emptyTitle) emptyTitle.textContent = "Aucune demande trouvée";
                if (emptyText) emptyText.textContent = "Vous n'avez actuellement aucune demande d'intervention enregistrée.";
            }
        }
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
            <td>${escapeHtml(req.date || '2026-07-30')}</td>
            <td><strong>${escapeHtml(req.emitter || 'Émetteur')}</strong></td>
            <td><span class="dept-badge">${escapeHtml(req.department || 'SI')}</span></td>
            <td>${escapeHtml(req.category || 'Intervention technique')}</td>
            <td><span class="status-badge ${statusClass}">● ${escapeHtml(req.status)}</span></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                    <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="btn btn-secondary btn-sm" title="Consulter la fiche complète">
                        Détails
                    </a>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteMyRequest('${escapeHtml(req.id)}')" title="Supprimer définitivement la demande">
                        🗑️ Supprimer
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

window.deleteMyRequest = async function(reqId) {
    const target = allRequests.find(r => r.id === reqId);
    if (!target) return;

    const confirmed = await window.showCustomConfirm({
        title: "Confirmer la suppression",
        message: `Voulez-vous vraiment supprimer la demande ${reqId} ?\n\nCette opération est irréversible et mettra automatiquement à jour les statistiques en temps réel.`,
        confirmText: "🗑️ Oui, Supprimer",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    // Filter out deleted request
    const updated = allRequests.filter(r => r.id !== reqId);
    saveRequests(updated);

    // Refresh memory list & UI
    loadRequests();

    await window.showCustomAlert({
        title: "Demande supprimée",
        message: `La demande N° ${reqId} a été supprimée avec succès.`,
        buttonText: "D'accord",
        type: "success"
    });
};

function initFilterAndSearch() {
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterDept = document.getElementById('filter-dept');

    const filterHandler = () => {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusVal = filterStatus ? filterStatus.value : 'ALL';
        const deptVal = filterDept ? filterDept.value : 'ALL';

        const filtered = userRequests.filter(req => {
            const matchQuery = !query || 
                req.id.toLowerCase().includes(query) ||
                req.emitter.toLowerCase().includes(query) ||
                (req.anomaly && req.anomaly.toLowerCase().includes(query)) ||
                (req.category && req.category.toLowerCase().includes(query));

            const matchStatus = (statusVal === 'ALL') || (req.status === statusVal);
            const matchDept = (deptVal === 'ALL') || (req.department === deptVal);

            return matchQuery && matchStatus && matchDept;
        });

        renderTable(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterHandler);
    if (filterStatus) filterStatus.addEventListener('change', filterHandler);
    if (filterDept) filterDept.addEventListener('change', filterHandler);
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
