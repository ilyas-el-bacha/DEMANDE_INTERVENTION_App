/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Administration Dashboard Logic (admin.js)
 */

const STORAGE_KEY = 'au_intervention_requests';
let currentAdminDepartment = 'SI';
let allRequests = [];
let currentFilteredRequests = [];

document.addEventListener('DOMContentLoaded', () => {
    initAdminSession();
    initDeptTabs();
    initFilterHandlers();
    initModalEvents();
    loadAdminRequests();
});

/**
 * Reads user session or defaults to SI
 */
function initAdminSession() {
    try {
        const userStr = localStorage.getItem('au_current_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'admin' && user.department) {
                currentAdminDepartment = user.department;
            }
        }
    } catch(e) {}

    updateAdminUIHeader();
}

function updateAdminUIHeader() {
    const codeElem = document.getElementById('active-dept-code');
    const nameElem = document.getElementById('active-dept-name');
    const tagElem = document.getElementById('admin-stat-dept-tag');

    if (codeElem) codeElem.textContent = currentAdminDepartment;
    if (tagElem) tagElem.textContent = currentAdminDepartment;

    if (nameElem) {
        switch(currentAdminDepartment) {
            case 'DAF': nameElem.textContent = 'Direction Administrative et Financière'; break;
            case 'DGUR': nameElem.textContent = 'Direction de la Gestion Urbaine & Réglementation'; break;
            case 'DET': nameElem.textContent = 'Direction des Études Techniques'; break;
            case 'SI': nameElem.textContent = 'Service Informatique et Systèmes d\'Information'; break;
        }
    }

    // Update Dept Tab Buttons Active state
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
            currentAdminDepartment = tab.getAttribute('data-dept');
            updateAdminUIHeader();
            filterAndRenderAdminTable();
        });
    });
}

function loadAdminRequests() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            allRequests = JSON.parse(stored);
        } else {
            allRequests = [];
        }
    } catch (e) {
        allRequests = [];
    }

    filterAndRenderAdminTable();
}

/**
 * Enforces Strict Departmental Isolation:
 * An admin ONLY sees requests matching currentAdminDepartment.
 */
function filterAndRenderAdminTable() {
    const searchVal = document.getElementById('admin-search')?.value.toLowerCase().trim() || '';
    const statusVal = document.getElementById('admin-filter-status')?.value || 'ALL';
    const priorityVal = document.getElementById('admin-filter-priority')?.value || 'ALL';
    const dateVal = document.getElementById('admin-filter-date')?.value || '';

    // 1. Strict Department Filter
    const deptRequests = allRequests.filter(r => r.department === currentAdminDepartment);

    // 2. Departmental Stats
    updateAdminStats(deptRequests);

    // 3. User Sub-Filters
    currentFilteredRequests = deptRequests.filter(req => {
        const matchSearch = !searchVal || 
            req.id.toLowerCase().includes(searchVal) ||
            req.emitter.toLowerCase().includes(searchVal) ||
            req.anomaly.toLowerCase().includes(searchVal);

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
            <td><span class="stat-badge ${req.priority === 'Urgente' ? 'rejected' : 'total'}">${escapeHtml(req.priority || 'Moyenne')}</span></td>
            <td>${escapeHtml(req.category)}</td>
            <td><span class="status-badge ${statusClass}">● ${escapeHtml(req.status)}</span></td>
            <td style="text-align: right;">
                <div class="action-btns">
                    <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="btn btn-secondary btn-icon" title="Voir PV">
                        👁 PV
                    </a>
                    <button type="button" class="btn btn-primary btn-icon" onclick="openAdminEditModal('${req.id}')" title="Traiter la demande">
                        ✏️ Traiter
                    </button>
                    <button type="button" class="btn btn-danger btn-icon" onclick="deleteRequest('${req.id}')" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

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
        label: `Mise à jour par Chef ${currentAdminDepartment} : Statut passé à "${newStatus}"`
    });

    // Save back to LocalStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRequests));

    document.getElementById('admin-modal').style.display = 'none';
    filterAndRenderAdminTable();
}

window.deleteRequest = function(id) {
    if (!confirm(`Voulez-vous vraiment supprimer la demande ${id} ? Cette action est irréversible.`)) {
        return;
    }

    allRequests = allRequests.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRequests));
    filterAndRenderAdminTable();
};

function setElemText(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = text;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
}
