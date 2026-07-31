/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Official Demande d'Intervention Form Logic (intervention.js)
 */

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
    const requests = getRequests();
    const nextNumber = requests.length + 1;
    const padNumber = String(nextNumber).padStart(4, '0');
    const newId = `INT-2026-${padNumber}`;
    if (autoIdSpan) autoIdSpan.textContent = newId;

    // 3. User Session Check & Form Lock/Prefill
    const currentUser = getCurrentUser();
    const loginReqBanner = document.getElementById('login-required-banner');
    const loggedUserBanner = document.getElementById('logged-user-banner');
    const form = document.getElementById('intervention-form');
    const printableDoc = document.getElementById('printable-document');
    const emitterInput = document.getElementById('doc-emitter');
    const deptSelect = document.getElementById('doc-department');

    if (!currentUser) {
        if (loginReqBanner) loginReqBanner.style.display = 'block';
        if (loggedUserBanner) loggedUserBanner.style.display = 'none';

        // Lock all form fields
        if (form) {
            const allElements = form.querySelectorAll('input, select, textarea, button');
            allElements.forEach(el => {
                el.disabled = true;
            });
        }

        if (emitterInput) {
            emitterInput.value = '';
            emitterInput.placeholder = 'Nom & Prénom de l\'Émetteur';
        }

        // Add visual overlay indicator / listener for locked form interaction
        if (printableDoc) {
            printableDoc.style.cursor = 'not-allowed';

            let isModalActive = false;
            const handleLockedClick = (e) => {
                if (isModalActive) return;
                isModalActive = true;

                window.showCustomAlert({
                    title: "Connexion Obligatoire",
                    message: "Connexion requise pour remplir et soumettre une demande d'intervention.\n\nVeuillez vous connecter avec votre compte employé.",
                    buttonText: "Se Connecter",
                    type: "warning"
                }).then((actionClicked) => {
                    isModalActive = false;
                    if (actionClicked === true) {
                        window.location.href = 'login.html?required=1&redirect=intervention.html';
                    }
                });
            };

            printableDoc.addEventListener('click', handleLockedClick);
        }
    } else {
        if (loginReqBanner) loginReqBanner.style.display = 'none';
        if (loggedUserBanner) {
            loggedUserBanner.style.display = 'flex';
            const bannerName = document.getElementById('banner-user-name');
            const bannerDept = document.getElementById('banner-user-dept');
            const userName = currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`;
            if (bannerName) bannerName.textContent = userName;
            if (bannerDept) bannerDept.textContent = currentUser.department || 'Non spécifié';
        }

        const userName = currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`;

        // Enable form fields
        if (form) {
            const allElements = form.querySelectorAll('input, select, textarea, button');
            allElements.forEach(el => {
                el.disabled = false;
            });
        }

        // Prefill and lock Émetteur & Department
        if (emitterInput) {
            emitterInput.value = userName;
            emitterInput.readOnly = true;
            emitterInput.style.backgroundColor = 'rgba(67, 97, 238, 0.12)';
            emitterInput.style.color = '#93C5FD';
            emitterInput.style.fontWeight = '600';
            emitterInput.style.cursor = 'not-allowed';
            emitterInput.title = 'Émetteur rempli automatiquement d\'après votre compte connecté';
        }

        if (deptSelect && currentUser.department) {
            deptSelect.value = currentUser.department;
            deptSelect.style.backgroundColor = 'rgba(67, 97, 238, 0.12)';
            deptSelect.style.color = '#93C5FD';
            deptSelect.style.fontWeight = '600';
            deptSelect.style.pointerEvents = 'none';
            deptSelect.title = 'Département rempli automatiquement d\'après votre compte connecté';
        }
    }
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

        const currentUser = getCurrentUser();
        if (!currentUser) {
            window.showCustomAlert({
                title: "Connexion Obligatoire",
                message: "Vous devez posséder un compte employé et être connecté pour soumettre une demande d'intervention.\n\nCliquez sur le bouton ci-dessous pour accéder au portail de connexion.",
                buttonText: "Se Connecter",
                type: "danger"
            }).then((actionClicked) => {
                if (actionClicked === true) {
                    window.location.href = 'login.html?required=1&redirect=intervention.html';
                }
            });
            return;
        }

        const requestId = document.getElementById('auto-request-id').textContent;
        const dateEmission = document.getElementById('doc-date').value;
        const emitter = document.getElementById('doc-emitter').value.trim();
        const department = document.getElementById('doc-department').value;
        const priority = document.getElementById('doc-priority').value;
        const anomaly = document.getElementById('doc-anomaly').value.trim();

        const emitterEmail = currentUser ? currentUser.email : `${emitter.toLowerCase().replace(/[^a-z]/g, '')}@agenceurbaine.ma`;

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

        const signatureDataUrl = signaturePadCanvas.toDataURL();
        const now = new Date();
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newRequest = {
            id: requestId,
            date: dateEmission,
            emitter: emitter,
            emitterEmail: emitterEmail,
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

        const existingRequests = getRequests();
        existingRequests.unshift(newRequest);
        saveRequests(existingRequests);

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
