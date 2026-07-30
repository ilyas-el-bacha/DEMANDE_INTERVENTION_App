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
    const req = requests.find(r => r.id === id);

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
        statusBadge.textContent = req.status.toUpperCase();
        if (req.status === 'Résolue') statusBadge.style.background = '#10B981';
        else if (req.status === 'En cours') statusBadge.style.background = '#8B5CF6';
        else if (req.status === 'Rejetée') statusBadge.style.background = '#EF4444';
        else statusBadge.style.background = '#F59E0B';
    }

    // 3. Verification Data
    if (req.verification) {
        setElemText('pv-verif-date', req.verification.dateAnalyse || '—');
        setElemText('pv-verif-by', req.verification.verifiedBy || '—');
        setElemText('pv-verif-recom', req.verification.recommendation || '—');
        setElemText('pv-verif-type', req.verification.type || 'Interne');
    }

    // 4. Intervention Data
    if (req.intervention) {
        setElemText('pv-interv-date', req.intervention.date || '—');
        setElemText('pv-interv-by', req.intervention.intervenant || req.verification?.verifiedBy || 'Technicien');
        setElemText('pv-interv-type', req.intervention.type || '—');
        setElemText('pv-interv-obs', req.intervention.observations || '—');
    }

    // 5. Result Data
    if (req.result) {
        setElemText('pv-result-eff', req.result.effective ? 'EFFICACE (100%)' : 'NON EFFICACE');
        setElemText('pv-result-status', req.status);
        setElemText('pv-result-notes', req.result.notes || 'Rien à signaler.');
    } else {
        setElemText('pv-result-status', req.status);
    }

    // 6. Signatures Render
    if (req.signatures && req.signatures.emitter) {
        const sigContainer = document.getElementById('pv-sig-emitter-render');
        if (sigContainer) {
            sigContainer.innerHTML = `<img src="${req.signatures.emitter}" alt="Visa Émetteur Signature">`;
        }
    }

    if (req.signatures && req.signatures.admin) {
        const sigAdminContainer = document.getElementById('pv-sig-admin-render');
        if (sigAdminContainer) {
            sigAdminContainer.innerHTML = `<img src="${req.signatures.admin}" alt="Visa Chef Dept Signature">`;
        }
    } else if (req.verification && req.verification.signed) {
        const sigAdminContainer = document.getElementById('pv-sig-admin-render');
        if (sigAdminContainer) {
            sigAdminContainer.innerHTML = `<div style="font-weight:700; color:#1E3A8A;">Signé Numériquement par Chef ${req.department}</div>`;
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

    const confirmed = await window.showCustomConfirm({
        title: "Confirmer la suppression",
        message: `Voulez-vous vraiment supprimer définitivement la demande d'intervention N° ${requestId} ?\n\nCette action est irréversible.`,
        confirmText: "🗑️ Oui, Supprimer",
        cancelText: "Annuler",
        type: "danger"
    });

    if (!confirmed) return;

    const requests = getRequests();
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
