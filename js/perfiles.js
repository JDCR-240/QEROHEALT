let selectedRole = 'Paciente';

const roleConfig = {
    Paciente: {
        badge: 'Vista de Paciente',
        img: '../img/ejercicio-paciente.webp',
        alt: 'Paciente realizando su rutina de rehabilitación',
        caption: 'Accede a tu rutina diaria con videos guiados, temporizador y pausas seguras.'
    },
    Cuidador: {
        badge: 'Vista de Cuidador',
        img: '../img/guia-cuidador.webp',
        alt: 'Cuidador acompañando a un adulto mayor en su rutina',
        caption: 'Supervisa cada ejercicio paso a paso y lleva el control del tiempo y repeticiones.'
    },
    Especialista: {
        badge: 'Vista de Especialista',
        img: '../img/panel-especialista.webp',
        alt: 'Especialista revisando el panel clínico de pacientes',
        caption: 'Crea rutinas personalizadas, asigna ejercicios y monitorea la continuidad semanal.'
    }
};

function selectRole(role) {
    selectedRole = role;
    const roles = ['Paciente', 'Cuidador', 'Especialista'];

    roles.forEach(r => {
        const card = document.getElementById(`card-${r.toLowerCase()}`);
        if (!card) return;

        if (r === role) {
            card.classList.add('active-role');
            card.setAttribute('aria-checked', 'true');
        } else {
            card.classList.remove('active-role');
            card.setAttribute('aria-checked', 'false');
        }
    });

    const data = roleConfig[role];
    const imgEl = document.getElementById('preview-img');
    const badgeEl = document.getElementById('preview-badge');
    const captionEl = document.getElementById('preview-caption');
    const btnTextEl = document.getElementById('btn-continue-text');

    badgeEl.textContent = data.badge;
    imgEl.src = data.img;
    imgEl.alt = data.alt;
    captionEl.textContent = data.caption;
    btnTextEl.textContent = `Continuar como ${role}`;
}

function confirmRoleSelection() {
    localStorage.setItem('qero_rol_pendiente', selectedRole);

    setTimeout(() => {
        window.location.href = `iniciar-sesion.html?rol=${selectedRole}`;
    }, 600);
}
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const origen = params.get('origen');

    if (origen === 'cuenta') {
        const btnVolver = document.querySelector('.btn-volver');
        if (btnVolver) {
            btnVolver.setAttribute('href', 'cuenta.html');
            btnVolver.setAttribute('aria-label', 'Volver a mi cuenta');
        }
    }
});