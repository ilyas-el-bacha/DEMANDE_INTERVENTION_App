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
});

window.addEventListener('storage', () => {
    currentUser = getCurrentUser();
    renderUserContextBanner();
    loadRequests();
});

window.addEventListener('au_data_changed', () => {
    currentUser = getCurrentUser();
    renderUserContextBanner();
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
            if (currentUser.id && req.emitterId && req.emitterId === currentUser.id) return true;

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
        const trMain = document.createElement('tr');

        const norm = getNormalizedStatus(req.status);
        let statusClass = 'pending';
        if (norm === 'accepted') statusClass = 'accepted';
        if (norm === 'progress') statusClass = 'progress';
        if (norm === 'resolved') statusClass = 'resolved';
        if (norm === 'rejected') statusClass = 'rejected';

        const isPending = norm === 'pending';
        const deleteButtonHtml = isPending ? `
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteMyRequest('${escapeHtml(req.id)}')" title="Supprimer la demande en attente">
                🗑️ Supprimer
            </button>
        ` : `
            <button type="button" class="btn btn-secondary btn-sm" disabled style="opacity: 0.55; cursor: not-allowed;" title="Traitement engagé : cette demande est un dossier administratif officiel et ne peut plus être supprimée.">
                🔒 Dossier Officiel
            </button>
        `;

        const timelineHtml = generateTimelineHtml(req);

        trMain.innerHTML = `
            <td colspan="7" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <div>
                        <span class="req-id" style="font-size: 1.05rem;">${escapeHtml(req.id)}</span>
                        <span style="color: var(--text-muted); margin: 0 0.5rem;">•</span>
                        <span style="font-size: 0.88rem; color: var(--text-secondary);">Émise le ${escapeHtml(req.date || '2026-07-30')} par <strong>${escapeHtml(req.emitter || 'Émetteur')}</strong></span>
                        <span style="color: var(--text-muted); margin: 0 0.5rem;">•</span>
                        <span class="dept-badge">${escapeHtml(req.department || 'SI')}</span>
                        <span style="font-size: 0.88rem; color: var(--text-secondary); margin-left: 0.5rem;">(${escapeHtml(req.category || 'Intervention technique')})</span>
                    </div>

                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="btn btn-secondary btn-sm" title="Consulter la fiche complète">
                            📄 Fiche PV
                        </a>
                        ${deleteButtonHtml}
                    </div>
                </div>

                <!-- Live Progress Timeline -->
                ${timelineHtml}
            </td>
        `;

        tbody.appendChild(trMain);
    });
}

function generateTimelineHtml(req) {
    const tData = typeof getTimelineData === 'function' ? getTimelineData(req) : { currentStep: 2, percent: 25, statusKey: 'pending', badgeClass: 'pending' };

    if (tData.statusKey === 'rejected') {
        return `
            <div class="timeline-rejected-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <div>
                    <strong>Demande Rejetée par le Chef de Département</strong>
                    <p style="margin: 0.15rem 0 0 0; font-size: 0.82rem; color: #CBD5E1;">Cette demande n'a pas été validée par la direction. Consultez les détails de la fiche pour plus d'informations.</p>
                </div>
            </div>
        `;
    }

    if (tData.statusKey === 'info_requested') {
        return `
            <div class="timeline-rejected-box" style="background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3); color: #FDE68A;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                    <strong>Informations Complémentaires Demandées par l'Administrateur</strong>
                    <p style="margin: 0.15rem 0 0 0; font-size: 0.82rem; color: #CBD5E1;">L'administrateur a besoin de précisions sur cette demande avant de lancer l'intervention.</p>
                </div>
            </div>
        `;
    }

    const cur = tData.currentStep; // 1 (submitted), 2 (pending), 3 (accepted), 4 (progress), 5 (resolved)

    const step1Class = cur >= 1 ? (cur === 1 ? 'active step-submitted' : 'completed') : '';
    const step2Class = cur > 2 ? 'completed' : (cur === 2 ? 'active step-pending' : '');
    const step3Class = cur > 3 ? 'completed' : (cur === 3 ? 'active step-accepted' : '');
    const step4Class = cur > 4 ? 'completed' : (cur === 4 ? 'active step-progress' : '');
    const step5Class = cur >= 5 ? 'active step-resolved completed' : '';

    const percent = typeof tData.percent === 'number' ? tData.percent : 25;
    // Calculate track fill distance (track runs from 10% to 90%, total span 80%)
    const fillWidth = Math.min(80, Math.max(0, (percent / 100) * 80));

    const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const icon1 = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
    const icon2 = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    const icon3 = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    const icon4 = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

    return `
        <div class="timeline-card-wrapper">
            <div class="timeline-header-bar">
                <div class="timeline-header-title">
                    <span class="live-pulse-indicator"></span>
                    <span>Suivi de l'Intervention en Temps Réel</span>
                </div>
                <span class="status-badge ${tData.badgeClass}">
                    ● Statut Actuel : ${escapeHtml(req.status)}
                </span>
            </div>
            <div class="timeline-track-container">
                <div class="timeline-progress-bg"></div>
                <div class="timeline-progress-fill" style="width: ${fillWidth}%;"></div>

                <div class="timeline-node ${step1Class}">
                    <div class="timeline-node-circle">${cur > 1 ? checkSvg : icon1}</div>
                    <div class="timeline-node-title">Demande Soumise</div>
                    <div class="timeline-node-sub">${escapeHtml(req.date || 'Émise')}</div>
                </div>

                <div class="timeline-node ${step2Class}">
                    <div class="timeline-node-circle">${cur > 2 ? checkSvg : (cur === 2 ? icon2 : '2')}</div>
                    <div class="timeline-node-title">En Attente</div>
                    <div class="timeline-node-sub">Validation Admin</div>
                </div>

                <div class="timeline-node ${step3Class}">
                    <div class="timeline-node-circle">${cur > 3 ? checkSvg : (cur === 3 ? icon3 : '3')}</div>
                    <div class="timeline-node-title">Acceptée</div>
                    <div class="timeline-node-sub">Prise en Charge</div>
                </div>

                <div class="timeline-node ${step4Class}">
                    <div class="timeline-node-circle">${cur > 4 ? checkSvg : (cur === 4 ? icon4 : '4')}</div>
                    <div class="timeline-node-title">En Cours</div>
                    <div class="timeline-node-sub">Intervention</div>
                </div>

                <div class="timeline-node ${step5Class}">
                    <div class="timeline-node-circle">${cur >= 5 ? checkSvg : '5'}</div>
                    <div class="timeline-node-title">Résolue</div>
                    <div class="timeline-node-sub">Clôture & PV</div>
                </div>
            </div>
        </div>
    `;
}

window.deleteMyRequest = async function(reqId) {
    const target = allRequests.find(r => r.id === reqId);
    if (!target) return;

    // Restrict deletion to pending requests only
    const isPending = target.status === 'En attente' || target.status === 'Pending';
    if (!isPending) {
        await window.showCustomAlert({
            title: "Suppression Impossible",
            message: `La demande N° ${reqId} est actuellement en statut "${target.status}".\n\nUne fois le traitement engagé par l'Administrateur du Département, la demande devient un dossier administratif officiel et ne peut plus être supprimée par l'émetteur.`,
            buttonText: "Compris",
            type: "warning"
        });
        return;
    }

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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
