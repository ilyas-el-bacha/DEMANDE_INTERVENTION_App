/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * My Requests List Logic (my_requests.js)
 */

const STORAGE_KEY = 'au_intervention_requests';
let allRequests = [];

document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    initFilterAndSearch();
});

function loadRequests() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            allRequests = JSON.parse(stored);
        } else {
            allRequests = [];
        }
    } catch (e) {
        console.error("Erreur de chargement:", e);
        allRequests = [];
    }

    renderTable(allRequests);
}

function renderTable(requests) {
    const tbody = document.getElementById('requests-tbody');
    const emptyState = document.getElementById('empty-state');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (requests.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    requests.forEach(req => {
        const tr = document.createElement('tr');

        // Status badge class mapping
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
                <a href="request_details.html?id=${encodeURIComponent(req.id)}" class="btn btn-secondary btn-sm">
                    Voir Détails
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function initFilterAndSearch() {
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterDept = document.getElementById('filter-dept');

    const filterHandler = () => {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusVal = filterStatus ? filterStatus.value : 'ALL';
        const deptVal = filterDept ? filterDept.value : 'ALL';

        const filtered = allRequests.filter(req => {
            // Text search
            const matchQuery = !query || 
                req.id.toLowerCase().includes(query) ||
                req.emitter.toLowerCase().includes(query) ||
                req.anomaly.toLowerCase().includes(query) ||
                req.category.toLowerCase().includes(query);

            // Status filter
            const matchStatus = (statusVal === 'ALL') || (req.status === statusVal);

            // Dept filter
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
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
