/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * User Registration Logic (signup.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initEmployeeSignup();
});

function initEmployeeSignup() {
    const form = document.getElementById('form-register-employee');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emitter = document.getElementById('emp-emitter').value.trim();
        const department = document.getElementById('emp-department').value;
        const email = document.getElementById('emp-email-signup').value.trim().toLowerCase();
        const pass = document.getElementById('emp-pass-signup').value;
        const confirmPass = document.getElementById('emp-pass-confirm').value;

        if (pass !== confirmPass) {
            showAlert("Les mots de passe ne correspondent pas.", 'danger');
            return;
        }

        const users = getUsers();
        const existing = users.find(u => (u.email || '').toLowerCase().trim() === email);
        if (existing) {
            showAlert("Cette adresse email est déjà utilisée par un autre compte.", 'danger');
            return;
        }

        // Split name cleanly if needed
        const nameParts = emitter.replace(/^(M\.|Mme\.|Dr\.)\s+/i, '').split(' ');
        const firstName = nameParts[0] || emitter;
        const lastName = nameParts.slice(1).join(' ') || '';

        const newUser = {
            id: 'usr-emp-' + Date.now(),
            firstName,
            lastName,
            name: emitter,
            employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            email,
            password: pass,
            role: 'employee',
            department,
            status: 'pending', // Pending approval by Department Admin!
            createdAt: new Date().toISOString().split('T')[0]
        };

        users.push(newUser);
        saveUsers(users);

        form.reset();

        showAlert(
            `Demande d'inscription enregistrée avec succès pour ${emitter} ! Votre compte pour le département ${department} est en ATTENTE D'APPROBATION par l'Administrateur du département ${department}. Vous ne pourrez vous connecter qu'une fois votre compte approuvé par votre Administrateur de Département.`,
            'warning'
        );
    });
}

function showAlert(msg, type) {
    const box = document.getElementById('signup-alert');
    if (!box) return;
    box.textContent = msg;
    box.className = `alert-box alert-${type}`;
    box.style.display = 'block';
}

function hideAlert() {
    const box = document.getElementById('signup-alert');
    if (box) box.style.display = 'none';
}
