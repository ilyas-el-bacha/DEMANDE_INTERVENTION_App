/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Official Demande d'Intervention Form Logic (intervention.js)
 */

const STORAGE_KEY = 'au_intervention_requests';
let signaturePadCanvas = null;
let signaturePadCtx = null;
let isDrawing = false;
let hasSigned = false;

document.addEventListener('DOMContentLoaded', () => {
    initFormDefaults();
    initSignaturePad();
    initFormSubmission();
});

/**
 * Prefills current date, auto-generates Request ID, and loads user session data if available
 */
function initFormDefaults() {
    // 1. Current Date
    const dateInput = document.getElementById('doc-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // 2. Generate Next Request ID
    const autoIdSpan = document.getElementById('auto-request-id');
    let requests = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) requests = JSON.parse(stored);
    } catch(e) {}

    const nextNumber = requests.length + 1;
    const padNumber = String(nextNumber).padStart(4, '0');
    const newId = `INT-2026-${padNumber}`;
    if (autoIdSpan) autoIdSpan.textContent = newId;

    // 3. User Session Prefill
    try {
        const currentUserStr = localStorage.getItem('au_current_user');
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const emitterInput = document.getElementById('doc-emitter');
            const deptSelect = document.getElementById('doc-department');

            if (emitterInput && user.name) emitterInput.value = user.name;
            if (deptSelect && user.department) deptSelect.value = user.department;
        }
    } catch(e) {}
}

/**
 * Initializes HTML5 Canvas Signature Pad
 */
function initSignaturePad() {
    signaturePadCanvas = document.getElementById('signature-pad-emitter');
    const clearBtn = document.getElementById('clear-sig-emitter');

    if (!signaturePadCanvas) return;
    signaturePadCtx = signaturePadCanvas.getContext('2d');

    // Context styles
    signaturePadCtx.strokeStyle = '#1E3A8A';
    signaturePadCtx.lineWidth = 2.5;
    signaturePadCtx.lineCap = 'round';
    signaturePadCtx.lineJoin = 'round';

    // Mouse Events
    signaturePadCanvas.addEventListener('mousedown', startDrawing);
    signaturePadCanvas.addEventListener('mousemove', draw);
    signaturePadCanvas.addEventListener('mouseup', stopDrawing);
    signaturePadCanvas.addEventListener('mouseleave', stopDrawing);

    // Touch Events
    signaturePadCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = signaturePadCanvas.getBoundingClientRect();
        isDrawing = true;
        hasSigned = true;
        signaturePadCtx.beginPath();
        signaturePadCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    signaturePadCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const rect = signaturePadCanvas.getBoundingClientRect();
        signaturePadCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        signaturePadCtx.stroke();
    });

    signaturePadCanvas.addEventListener('touchend', stopDrawing);

    // Clear Button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            signaturePadCtx.clearRect(0, 0, signaturePadCanvas.width, signaturePadCanvas.height);
            hasSigned = false;
        });
    }
}

function startDrawing(e) {
    isDrawing = true;
    hasSigned = true;
    const rect = signaturePadCanvas.getBoundingClientRect();
    signaturePadCtx.beginPath();
    signaturePadCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = signaturePadCanvas.getBoundingClientRect();
    signaturePadCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    signaturePadCtx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

/**
 * Form Submission Handling
 */
function initFormSubmission() {
    const form = document.getElementById('intervention-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const alertBox = document.getElementById('alert-box');
        const requestId = document.getElementById('auto-request-id').textContent;
        const dateEmission = document.getElementById('doc-date').value;
        const emitter = document.getElementById('doc-emitter').value.trim();
        const department = document.getElementById('doc-department').value;
        const priority = document.getElementById('doc-priority').value;
        const anomaly = document.getElementById('doc-anomaly').value.trim();

        // Selected Nature Checkboxes
        const checkboxes = document.querySelectorAll('input[name="nature"]:checked');
        const natureList = Array.from(checkboxes).map(cb => cb.value);

        if (natureList.length === 0) {
            showAlert('Veuillez cocher au moins une option pour la nature de l\'intervention.', 'danger');
            return;
        }

        if (!hasSigned) {
            showAlert('Veuillez apposer votre signature dans le cadre "Visa Émetteur" avant de valider.', 'danger');
            return;
        }

        // Get signature image data URL
        const signatureDataUrl = signaturePadCanvas.toDataURL();

        // Build Official Request Object
        const now = new Date();
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const newRequest = {
            id: requestId,
            date: dateEmission,
            emitter: emitter,
            department: department,
            category: natureList.join(', '),
            natureList: natureList,
            priority: priority,
            anomaly: anomaly,
            status: 'En attente',
            code: 'FM-SI-04',
            version: '02',
            appDate: '01/02/2026',
            signatures: {
                emitter: signatureDataUrl,
                emitterDate: dateEmission
            },
            history: [
                {
                    date: `${dateEmission} ${formattedTime}`,
                    label: `Demande émise par ${emitter} (${department})`
                },
                {
                    date: `${dateEmission} ${formattedTime}`,
                    label: `Demande transmise automatiquement à l'Administrateur du Département ${department}`
                }
            ]
        };

        // Save to LocalStorage
        let existingRequests = [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) existingRequests = JSON.parse(stored);
        } catch(err) {}

        existingRequests.unshift(newRequest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRequests));

        // Show Success Alert
        showAlert(`Demande ${requestId} enregistrée avec succès ! Redirection vers vos demandes en cours...`, 'success');

        setTimeout(() => {
            window.location.href = 'my_requests.html';
        }, 1500);
    });
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    if (!alertBox) return;

    alertBox.textContent = message;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
