

const roleRoutes = {
    Paciente: 'paciente/panel.html',
    Cuidador: 'cuidador/panel.html',
    Especialista: 'especialista/panel.html'
};


// Detectar el rol que viene por URL (?rol=Paciente, Cuidador o Especialista)
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const rol = params.get('rol') || 'Paciente';
    const roleBadge = document.getElementById('selected-role-badge');

    if (roleRoutes[rol] && roleBadge) {
        roleBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Perfil seleccionado: ${rol}`;
        roleBadge.classList.remove('hidden');
        localStorage.setItem('qero_rol_activo', rol);
    }
});

// Cambiar entre Iniciar Sesión y Recuperar Acceso
function switchAuthView(view) {
    const loginView = document.getElementById('view-login');
    const recoverView = document.getElementById('view-recover');

    loginView.classList.add('hidden');
    recoverView.classList.add('hidden');

    if (view === 'login') {
        loginView.classList.remove('hidden');
    } else if (view === 'recover') {
        recoverView.classList.remove('hidden');
    }
}

// Simular Inicio de Sesión (100% Frontend)
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('login-email');
    const errorEl = document.getElementById('email-error');
    const successMsg = document.getElementById('login-success-msg');

    if (!emailInput.checkValidity()) {
        emailInput.setAttribute('aria-invalid', 'true');
        errorEl.textContent = 'Ingresa un correo válido, ej. marta@correo.com';
        return;
    }

    emailInput.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';

    // Guardamos sesión simulada
    const rolActivo = localStorage.getItem('qero_rol_activo') || 'Paciente';
    localStorage.setItem('qero_user_email', emailInput.value);
    localStorage.setItem('qero_logged_in', 'true');

    successMsg.classList.remove('hidden');

    if (rolActivo === 'Paciente' || rolActivo === 'Cuidador') {
        sessionStorage.removeItem('qero_paciente_actual_id');
    }

    setTimeout(() => {
        window.location.href = roleRoutes[rolActivo] || roleRoutes.Paciente;
    }, 900);
});

// Simular envío de código de recuperación
document.getElementById('recover-form').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('recover-code-sent').classList.remove('hidden');
});