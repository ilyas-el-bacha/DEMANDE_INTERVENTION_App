/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Request Details & Official PV Render Logic (request_details.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');

    if (!requestId) {
        window.location.href = 'my_requests.html';
        return;
    }

    loadAndRenderRequest(requestId);
});

function loadAndRenderRequest(id) {
    const requests = getRequests();
    const cleanId = (id || '').trim().toLowerCase();
    const req = requests.find(r => r && r.id && (
        r.id.trim().toLowerCase() === cleanId || 
        decodeURIComponent(r.id).trim().toLowerCase() === cleanId
    ));

    if (!req) {
        alert("Demande introuvable dans le système.");
        window.location.href = 'my_requests.html';
        return;
    }

    // 1. Header & Title
    const titleElem = document.getElementById('req-detail-title');
    if (titleElem) titleElem.textContent = `Procès-Verbal d'Intervention N° ${req.id}`;

    // 2. Document Fields
    setElemText('pv-id', req.id);
    setElemText('pv-code', req.code || 'FM-SI-04');
    setElemText('pv-version', req.version || '02');
    setElemText('pv-appdate', req.appDate || '01/02/2026');

    setElemText('pv-date', req.date || '—');
    setElemText('pv-priority', req.priority || 'Moyenne');
    setElemText('pv-emitter', req.emitter || '—');
    setElemText('pv-dept', getDeptFullName(req.department));
    setElemText('pv-category', req.category || '—');
    setElemText('pv-anomaly', req.anomaly || '—');

    // Status Badge
    const statusBadge = document.getElementById('pv-status-badge');
    if (statusBadge) {
        statusBadge.textContent = (req.status || 'En attente').toUpperCase();
        if (req.status === 'Résolue') statusBadge.style.background = '#10B981';
        else if (req.status === 'En cours') statusBadge.style.background = '#8B5CF6';
        else if (req.status === 'Rejetée') statusBadge.style.background = '#EF4444';
        else statusBadge.style.background = '#F59E0B';
    }

    // 3. Verification Data (Diagnostic)
    if (req.verification) {
        setElemText('pv-verif-date', req.verification.dateAnalyse || req.date || '—');
        setElemText('pv-verif-by', req.verification.verifiedBy || `Technicien ${req.department}`);
        setElemText('pv-verif-recom', req.verification.recommendation || 'Diagnostic complété par l\'administrateur.');
        setElemText('pv-verif-type', req.verification.type || 'Interne');
    }

    // 4. Intervention Data (Travaux Réalisés)
    if (req.intervention) {
        setElemText('pv-interv-date', req.intervention.date || req.verification?.dateAnalyse || req.date || '—');
        setElemText('pv-interv-by', req.intervention.intervenant || req.verification?.verifiedBy || `Technicien ${req.department}`);
        setElemText('pv-interv-type', req.intervention.type || 'Dépannage & Maintenance');
        setElemText('pv-interv-obs', req.intervention.observations || 'Intervention exécutée conformément aux exigences.');
    } else if (req.status === 'Résolue') {
        setElemText('pv-interv-date', req.verification?.dateAnalyse || req.date || '—');
        setElemText('pv-interv-by', req.verification?.verifiedBy || `Technicien ${req.department}`);
        setElemText('pv-interv-type', 'Dépannage & Maintenance');
        setElemText('pv-interv-obs', 'Intervention complétée et clôturée.');
    }

    // 5. Result Data
    if (req.result) {
        setElemText('pv-result-eff', req.result.effective !== false ? 'EFFICACE (100%)' : 'NON EFFICACE');
        setElemText('pv-result-status', req.status);
        setElemText('pv-result-notes', req.result.notes || 'Procès-verbal validé sans réserve.');
    } else {
        setElemText('pv-result-status', req.status);
        if (req.status === 'Résolue') {
            setElemText('pv-result-eff', 'EFFICACE (100%)');
            setElemText('pv-result-notes', 'Procès-verbal d\'intervention validé et signé.');
        }
    }

    // 6. Signatures Render
    if (req.signatures && req.signatures.emitter) {
        const sigContainer = document.getElementById('pv-sig-emitter-render');
        if (sigContainer) {
            sigContainer.innerHTML = `<img src="${req.signatures.emitter}" alt="Visa Émetteur Signature">`;
        }
    }

    const sigAdminContainer = document.getElementById('pv-sig-admin-render');
    if (sigAdminContainer) {
        if (req.signature && req.signature.signed) {
            sigAdminContainer.innerHTML = `
                <div style="text-align: center; color: #059669; font-family: sans-serif; padding: 0.25rem;">
                    <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.35rem; color: #059669; margin-bottom: 0.25rem;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Visa Officiel Apposé
                    </div>
                    <div style="font-size: 0.88rem; font-weight: 800; color: #1E293B;">${escapeHtml(req.signature.signer || 'Administrateur')}</div>
                    <div style="font-size: 0.78rem; color: #475569; margin-top: 2px;">Département ${escapeHtml(req.signature.department || req.department)} • Date : ${escapeHtml(req.signature.date)}</div>
                </div>
            `;
        } else if (req.signatures && req.signatures.admin) {
            if (typeof req.signatures.admin === 'string' && req.signatures.admin.startsWith('data:image')) {
                sigAdminContainer.innerHTML = `<img src="${req.signatures.admin}" alt="Visa Chef Dept Signature">`;
            } else {
                sigAdminContainer.innerHTML = `
                    <div style="text-align: center; color: #059669; font-family: sans-serif; padding: 0.25rem;">
                        <div style="font-weight: 800; font-size: 0.95rem; color: #059669;">✓ Visa Numérique Apposé</div>
                        <div style="font-size: 0.88rem; font-weight: 800; color: #1E293B;">${escapeHtml(req.signatures.adminName || 'Chef de Département')}</div>
                        <div style="font-size: 0.78rem; color: #475569;">Le ${escapeHtml(req.signatures.adminDate || req.date)}</div>
                    </div>
                `;
            }
        } else if (req.verification && req.verification.signed) {
            sigAdminContainer.innerHTML = `
                <div style="text-align: center; color: #059669; font-family: sans-serif; padding: 0.25rem;">
                    <div style="font-weight: 800; font-size: 0.95rem; color: #059669;">✓ Visa Numérique Validé</div>
                    <div style="font-size: 0.88rem; font-weight: 800; color: #1E293B;">Chef du Département ${escapeHtml(req.department)}</div>
                </div>
            `;
        } else {
            sigAdminContainer.innerHTML = `<span class="text-muted" style="color: #94A3B8; font-style: italic;">En attente de clôture et signature</span>`;
        }
    }

    // 7. Timeline Sidebar Render
    const timelineElem = document.getElementById('timeline-events');
    if (timelineElem && req.history) {
        timelineElem.innerHTML = '';
        req.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = `
                <div class="timeline-date">${escapeHtml(item.date)}</div>
                <div class="timeline-label">${escapeHtml(item.label)}</div>
            `;
            timelineElem.appendChild(div);
        });
    }

    // 8. Dept Sidebar
    setElemText('dept-large', req.department);
    setElemText('dept-fullname', getDeptFullName(req.department));
    setElemText('dept-manager', `Chef du Département ${req.department}`);
}

function getDeptFullName(code) {
    switch(code) {
        case 'DAF': return 'Direction Administrative et Financière';
        case 'DGUR': return 'Direction de la Gestion Urbaine et Réglementation';
        case 'DET': return 'Direction des Études Techniques';
        case 'SI': return 'Service Informatique et Systèmes d\'Information';
        default: return code;
    }
}

function setElemText(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = text;
}

window.deleteCurrentRequest = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    if (!requestId) return;

    const requests = getRequests();
    const target = requests.find(r => r.id === requestId);
    if (!target) return;

    const currentUser = getCurrentUser();
    const isPending = target.status === 'En attente' || target.status === 'Pending';
    if (currentUser && currentUser.role === 'employee' && !isPending) {
        await window.showCustomAlert({
            title: "Suppression Impossible",
            message: `La demande N° ${requestId} est actuellement en statut "${target.status}".\n\nUne fois le traitement engagé par l'Administrateur du Département, la demande devient un dossier administratif officiel et ne peut plus être supprimée par l'émetteur.`,
            buttonText: "Compris",
            type: "warning"
        });
        return;
    }

    const confirmed = await window.showCustomConfirm({
        title: "Confirmer la suppression",
        message: `Voulez-vous vraiment supprimer définitivement la demande d'intervention N° ${requestId} ?\n\nCette action est irréversible.`,
        confirmText: "🗑️ Oui, Supprimer",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    const updated = requests.filter(r => r.id !== requestId);
    saveRequests(updated);

    await window.showCustomAlert({
        title: "Demande supprimée",
        message: `La demande N° ${requestId} a été supprimée avec succès.`,
        buttonText: "Continuer",
        type: "success"
    });

    window.location.href = 'my_requests.html';
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
}
