/**
 * AGENCE URBAINE - PORTAIL D'INTERVENTION
 * Authentication Logic (login.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initRoleTabs();
    initAdminPresets();
    initForms();
});

function initRoleTabs() {
    const tabEmployee = document.getElementById('tab-employee');
    const tabAdmin = document.getElementById('tab-admin');
    const formEmployee = document.getElementById('form-employee');
    const formAdmin = document.getElementById('form-admin');

    if (!tabEmployee || !tabAdmin) return;

    tabEmployee.addEventListener('click', () => {
        tabEmployee.classList.add('active');
        tabAdmin.classList.remove('active');
        formEmployee.classList.add('active');
        formAdmin.classList.remove('active');
    });

    tabAdmin.addEventListener('click', () => {
        tabAdmin.classList.add('active');
        tabEmployee.classList.remove('active');
        formAdmin.classList.add('active');
        formEmployee.classList.remove('active');
    });
}

function initAdminPresets() {
    const presetBtns = document.querySelectorAll('.preset-btn');
    const adminDept = document.getElementById('admin-dept');
    const adminEmail = document.getElementById('admin-email');

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active-preset'));
            btn.classList.add('active-preset');

            const dept = btn.getAttribute('data-dept');
            const email = btn.getAttribute('data-email');

            if (adminDept) adminDept.value = dept;
            if (adminEmail) adminEmail.value = email;
        });
    });
}

function initForms() {
    const formEmployee = document.getElementById('form-employee');
    const formAdmin = document.getElementById('form-admin');

    if (formEmployee) {
        formEmployee.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('emp-name').value;
            const dept = document.getElementById('emp-dept').value;
            const email = document.getElementById('emp-email').value;

            const session = {
                role: 'employee',
                name: name,
                department: dept,
                email: email
            };

            localStorage.setItem('au_current_user', JSON.stringify(session));
            window.location.href = 'intervention.html';
        });
    }

    if (formAdmin) {
        formAdmin.addEventListener('submit', (e) => {
            e.preventDefault();
            const dept = document.getElementById('admin-dept').value;
            const email = document.getElementById('admin-email').value;

            const session = {
                role: 'admin',
                name: `Chef de Département (${dept})`,
                department: dept,
                email: email
            };

            localStorage.setItem('au_current_user', JSON.stringify(session));
            window.location.href = 'admin.html';
        });
    }
}
