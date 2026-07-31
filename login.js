/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Authentication Controller (login.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initEmployeeLoginForm();
    initAdminLoginForm();
    initSuperAdminLoginForm();
    initPresets();
    checkUrlParams();
});

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('registered') === '1') {
        const email = urlParams.get('email');
        const empEmailInput = document.getElementById('emp-email');
        const empPassInput = document.getElementById('emp-password');
        if (empEmailInput && email) {
            empEmailInput.value = email;
        }
        if (empPassInput) {
            empPassInput.value = '';
        }
        showLoginAlert("Votre compte employé a été créé avec succès ! Veuillez saisir votre mot de passe pour vous connecter.", 'success');
    } else if (urlParams.get('required') === '1' || urlParams.get('redirect') === 'intervention.html') {
        showLoginAlert("Connexion requise : Vous devez être connecté avec votre compte employé avant de pouvoir soumettre une demande d'intervention.", 'warning');
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.role-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            const role = tab.getAttribute('data-role');
            const targetForm = document.getElementById(`form-${role}`);
            if (targetForm) targetForm.classList.add('active');

            hideLoginAlert();
        });
    });
}

function initEmployeeLoginForm() {
    const form = document.getElementById('form-employee');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('emp-email').value.trim().toLowerCase();
        const password = document.getElementById('emp-password').value;

        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email);

        if (!user || user.password !== password) {
            showLoginAlert("Email ou mot de passe incorrect pour le compte employé.", 'danger');
            return;
        }

        if (user.role !== 'employee') {
            showLoginAlert("Ce compte n'est pas un compte employé. Veuillez utiliser l'onglet correspondant à votre rôle.", 'warning');
            return;
        }

        // Set Active Session
        setCurrentUser(user);

        showLoginAlert(`Connexion réussie. Bienvenue ${user.name || user.firstName}!`, 'success');

        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'intervention.html';

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 800);
    });
}

function initAdminLoginForm() {
    const form = document.getElementById('form-admin');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('admin-email').value.trim().toLowerCase();
        const password = document.getElementById('admin-pass').value;

        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email);

        if (!user || user.password !== password) {
            showLoginAlert("Identifiants administrateur incorrects.", 'danger');
            return;
        }

        if (user.role !== 'admin') {
            showLoginAlert("Ce compte n'est pas un compte administrateur de département.", 'warning');
            return;
        }

        // CHECK APPROVAL STATUS FOR ADMINS
        if (user.status === 'pending') {
            showLoginAlert("Votre compte administrateur est en attente d'approbation par le Super Administrateur.", 'warning');
            return;
        }

        if (user.status === 'rejected') {
            showLoginAlert("Votre demande d'inscription en tant qu'administrateur a été rejetée.", 'danger');
            return;
        }

        // Set Active Session
        setCurrentUser(user);

        showLoginAlert(`Connexion Administrateur réussie. Direction ${user.department}.`, 'success');

        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 800);
    });
}

function initSuperAdminLoginForm() {
    const form = document.getElementById('form-superadmin');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('superadmin-email').value.trim().toLowerCase();
        const password = document.getElementById('superadmin-pass').value;

        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email && u.role === 'superadmin');

        if (!user || user.password !== password) {
            showLoginAlert("Identifiants Super Administrateur incorrects.", 'danger');
            return;
        }

        setCurrentUser(user);
        showLoginAlert("Connexion Super Administrateur réussie. Redirection...", 'success');

        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 800);
    });
}

function initPresets() {
    // Admin presets
    const adminPresets = document.querySelectorAll('.preset-btn');
    adminPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            adminPresets.forEach(b => b.classList.remove('active-preset'));
            btn.classList.add('active-preset');

            const email = btn.getAttribute('data-email');
            const emailInput = document.getElementById('admin-email');
            const passInput = document.getElementById('admin-pass');
            if (emailInput) emailInput.value = email;
            if (passInput) passInput.value = 'admin';
            hideLoginAlert();
        });
    });

    // Employee presets
    const empPresets = document.querySelectorAll('.preset-emp-btn');
    empPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            empPresets.forEach(b => b.classList.remove('active-preset'));
            btn.classList.add('active-preset');

            const email = btn.getAttribute('data-email');
            const pass = btn.getAttribute('data-pass');
            const emailInput = document.getElementById('emp-email');
            const passInput = document.getElementById('emp-password');
            if (emailInput) emailInput.value = email;
            if (passInput) passInput.value = pass;
            hideLoginAlert();
        });
    });
}

function showLoginAlert(msg, type) {
    const box = document.getElementById('login-alert');
    if (!box) return;
    box.textContent = msg;
    box.className = `alert-box alert-${type}`;
    box.style.display = 'block';
}

function hideLoginAlert() {
    const box = document.getElementById('login-alert');
    if (box) box.style.display = 'none';
}
