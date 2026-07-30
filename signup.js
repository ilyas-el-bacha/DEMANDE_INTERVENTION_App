/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * User & Administrator Registration Logic (signup.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initSignupTabs();
    initEmployeeSignup();
    initAdminSignup();
});

function initSignupTabs() {
    const tabEmp = document.getElementById('tab-signup-employee');
    const tabAdm = document.getElementById('tab-signup-admin');
    const formEmp = document.getElementById('form-register-employee');
    const formAdm = document.getElementById('form-register-admin');

    if (!tabEmp || !tabAdm) return;

    tabEmp.addEventListener('click', () => {
        tabEmp.classList.add('active');
        tabAdm.classList.remove('active');
        formEmp.classList.add('active');
        formAdm.classList.remove('active');
        hideAlert();
    });

    tabAdm.addEventListener('click', () => {
        tabAdm.classList.add('active');
        tabEmp.classList.remove('active');
        formAdm.classList.add('active');
        formEmp.classList.remove('active');
        hideAlert();
    });
}

function initEmployeeSignup() {
    const form = document.getElementById('form-register-employee');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const firstName = document.getElementById('emp-firstname').value.trim();
        const lastName = document.getElementById('emp-lastname').value.trim();
        const empId = document.getElementById('emp-id').value.trim();
        const department = document.getElementById('emp-department').value;
        const email = document.getElementById('emp-email-signup').value.trim().toLowerCase();
        const pass = document.getElementById('emp-pass-signup').value;
        const confirmPass = document.getElementById('emp-pass-confirm').value;

        if (pass !== confirmPass) {
            showAlert("Les mots de passe ne correspondent pas.", 'danger');
            return;
        }

        const users = getUsers();
        const existing = users.find(u => u.email.toLowerCase() === email);
        if (existing) {
            showAlert("Cet adresse email est déjà utilisée par un autre compte.", 'danger');
            return;
        }

        const newUser = {
            id: 'usr-emp-' + Date.now(),
            firstName,
            lastName,
            name: `M. ${firstName} ${lastName}`,
            employeeId: empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            email,
            password: pass,
            role: 'employee',
            department,
            status: 'approved',
            createdAt: new Date().toISOString().split('T')[0]
        };

        users.push(newUser);
        saveUsers(users);

        // Auto Login Employee
        setCurrentUser(newUser);

        showAlert(`Compte Employé créé avec succès ! Bienvenue ${firstName}. Redirection vers vos demandes...`, 'success');

        setTimeout(() => {
            window.location.href = 'my_requests.html';
        }, 1500);
    });
}

function initAdminSignup() {
    const form = document.getElementById('form-register-admin');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const firstName = document.getElementById('adm-firstname').value.trim();
        const lastName = document.getElementById('adm-lastname').value.trim();
        const department = document.getElementById('adm-department').value;
        const email = document.getElementById('adm-email-signup').value.trim().toLowerCase();
        const pass = document.getElementById('adm-pass-signup').value;
        const confirmPass = document.getElementById('adm-pass-confirm').value;

        if (pass !== confirmPass) {
            showAlert("Les mots de passe ne correspondent pas.", 'danger');
            return;
        }

        const users = getUsers();
        const existing = users.find(u => u.email.toLowerCase() === email);
        if (existing) {
            showAlert("Cette adresse email est déjà enregistrée dans le système.", 'danger');
            return;
        }

        const newAdmin = {
            id: 'usr-adm-' + Date.now(),
            firstName,
            lastName,
            name: `M. ${firstName} ${lastName}`,
            email,
            password: pass,
            role: 'admin',
            department,
            status: 'pending', // Pending approval by Super Admin!
            createdAt: new Date().toISOString().split('T')[0]
        };

        users.push(newAdmin);
        saveUsers(users);

        form.reset();

        showAlert(
            `Inscription Administrateur enregistrée avec succès ! Votre compte pour le département ${department} est en ATTENTE D'APPROBATION par le Super Administrateur. Seul le Super Administrateur peut valider votre accès.`,
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
