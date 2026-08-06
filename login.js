/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Authentication Controller (login.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initPresets();
    checkUrlParams();
});

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('portal') === 'superadmin' || urlParams.get('access') === 'superadmin') {
        window.location.href = 'superadmin.html';
        return;
    }

    if (urlParams.get('registered') === '1') {
        const email = urlParams.get('email');
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        if (emailInput && email) {
            emailInput.value = email;
        }
        if (passInput) {
            passInput.value = '';
        }
        showLoginAlert("Votre compte a été créé avec succès ! Veuillez saisir votre mot de passe pour vous connecter.", 'success');
    } else if (urlParams.get('required') === '1') {
        showLoginAlert("Connexion requise : Veuillez vous connecter avec vos identifiants pour accéder à cet espace.", 'warning');
    }
}

function initLoginForm() {
    const form = document.getElementById('form-login');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const users = getUsers();
        const user = users.find(u => (u.email || '').toLowerCase().trim() === email);

        if (!user || user.password !== password) {
            showLoginAlert("Adresse email ou mot de passe incorrect.", 'danger');
            return;
        }

        // CHECK APPROVAL STATUS
        if (user.status === 'pending') {
            if (user.role === 'admin') {
                showLoginAlert("Votre compte administrateur est en attente d'approbation par le Super Administrateur.", 'warning');
            } else {
                showLoginAlert(`Votre compte employé est en attente d'approbation par l'Administrateur du Département (${user.department || 'votre département'}).`, 'warning');
            }
            return;
        }

        if (user.status === 'rejected') {
            showLoginAlert("Votre demande d'inscription a été rejetée par l'administration.", 'danger');
            return;
        }

        if (user.status === 'disabled') {
            showLoginAlert("Votre compte a été désactivé par l'administration.", 'danger');
            return;
        }

        // Set Active Session
        setCurrentUser(user);

        // AUTO-DETECT ROLE AND REDIRECT
        if (user.role === 'admin' || user.role === 'superadmin') {
            showLoginAlert(`Connexion réussie en tant qu'Administrateur (${user.department || 'Général'}). Redirection vers l'espace administration...`, 'success');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 800);
        } else {
            showLoginAlert(`Connexion réussie. Bienvenue ${user.name || user.firstName} !`, 'success');
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || 'my_requests.html';
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 800);
        }
    });
}

function initPresets() {
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active-preset'));
            btn.classList.add('active-preset');

            const email = btn.getAttribute('data-email');
            const pass = btn.getAttribute('data-pass') || 'admin';
            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-password');
            if (emailInput && email) emailInput.value = email;
            if (passInput && pass) passInput.value = pass;
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

