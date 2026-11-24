const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';

const NAV_POR_ROL = {
    Paciente: {
        home: 'paciente/panel.html',
        ariaLabel: 'Navegación de paciente',
        links: [
            { href: 'paciente/panel.html', icon: 'fa-solid fa-house', label: 'Inicio' },
            { href: 'paciente/mi-rutina.html', icon: 'fa-solid fa-play', label: 'Mi rutina' },
            { href: 'paciente/avance.html', icon: 'fa-solid fa-chart-line', label: 'Avance' },
            { href: 'paciente/recursos.html', icon: 'fa-solid fa-book-open', label: 'Guias' },
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda', active: true }
        ]
    },
    Especialista: {
        home: 'especialista/panel.html',
        ariaLabel: 'Navegación de especialista',
        links: [
            { href: 'especialista/panel.html', icon: 'fa-solid fa-house', label: 'Panel' },
            { href: 'especialista/paciente.html', icon: 'fa-solid fa-users', label: 'Pacientes' },
            { href: 'especialista/catalogo.html', icon: 'fa-solid fa-clipboard-list', label: 'Rutinas' },
            { href: 'especialista/seguimiento.html', icon: 'fa-solid fa-chart-line', label: 'Seguimiento' },
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda', active: true }
        ]
    },
    Cuidador: {
        home: 'cuidador/panel.html',
        ariaLabel: 'Navegación de cuidador',
        links: [
            { href: 'cuidador/panel.html', icon: 'fa-solid fa-house', label: 'Inicio' },
            { href: 'cuidador/seguimiento.html', icon: 'fa-solid fa-chart-line', label: 'Seguimiento' },
            { href: 'cuidador/especialista.html', icon: 'fa-solid fa-user-doctor', label: 'Especialista' },
            { href: 'cuidador/guias.html', icon: 'fa-solid fa-book-open', label: 'Guías' },
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda', active: true }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const rolGuardado = localStorage.getItem('qero_rol_activo') || 'Paciente';
    const rol = NAV_POR_ROL[rolGuardado] ? rolGuardado : 'Paciente';
    const navConfig = NAV_POR_ROL[rol];

    // 1. Inyectar navegación según el rol activo
    document.getElementById('sob-brand-link').setAttribute('href', navConfig.home);
    const navEl = document.getElementById('sob-dynamic-nav');
    navEl.setAttribute('aria-label', navConfig.ariaLabel);
    navEl.innerHTML = navConfig.links.map(item => `
        <a href="${item.href}" class="app-nav-link ${item.active ? 'active' : ''}">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </a>
    `).join('');

    // 2. Modal: Cerrar sesión
    const logoutModal = document.getElementById('logout-modal');
    const btnOpenLogout = document.getElementById('btn-open-logout');
    const btnCancelLogout = document.getElementById('btn-cancel-logout');
    const btnConfirmLogout = document.getElementById('btn-confirm-logout');

    btnOpenLogout.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
        btnCancelLogout.focus();
    });

    btnCancelLogout.addEventListener('click', () => logoutModal.classList.add('hidden'));
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) logoutModal.classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') logoutModal.classList.add('hidden');
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        sessionStorage.removeItem(QERO_SESSION_PATIENT_KEY);
        window.location.href = '../index.html';
    });
});