let toastTimeout;
function showFeedbackToast(message) {
    const toast = document.getElementById('ux-toast');
    const msgEl = document.getElementById('ux-toast-message');
    msgEl.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3200);
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('mobile-menu-btn');
    const isHidden = menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', !isHidden);
}

function switchProfile(profile) {
    const profiles = ['paciente', 'cuidador', 'especialista'];
    const names = { paciente: 'Paciente', cuidador: 'Cuidador', especialista: 'Especialista' };

    profiles.forEach(p => {
        const tab = document.getElementById(`tab-${p}`);
        const badge = document.getElementById(`badge-${p}`);
        const panel = document.getElementById(`panel-${p}`);

        if (p === profile) {
            tab.classList.add('active-tab');
            tab.setAttribute('aria-selected', 'true');
            badge.classList.remove('hidden');
            panel.classList.remove('hidden');
        } else {
            tab.classList.remove('active-tab');
            tab.setAttribute('aria-selected', 'false');
            badge.classList.add('hidden');
            panel.classList.add('hidden');
        }
    });

    showFeedbackToast(`Vista cambiada a perfil: ${names[profile]}`);
}

function toggleFaq(index) {
    const content = document.getElementById(`faq-content-${index}`);
    const icon = document.getElementById(`faq-icon-${index}`);
    const isHidden = content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
    
    const btn = content.previousElementSibling;
    if(btn) btn.setAttribute('aria-expanded', !isHidden);
}

function openModal(view, role = null) {
    const modal = document.getElementById('auth-modal');
    const roleLabel = document.getElementById('selected-role-label');
    modal.classList.remove('hidden');

    if (role) {
        roleLabel.textContent = `✓ Perfil seleccionado: ${role}`;
        roleLabel.classList.remove('hidden');
    } else {
        roleLabel.classList.add('hidden');
    }

    switchModalView('login');
}

function closeModal() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('login-success-msg').classList.add('hidden');
    document.getElementById('recover-code-sent').classList.add('hidden');
}

function switchModalView(view) {
    document.getElementById('modal-view-login').classList.add('hidden');
    document.getElementById('modal-view-recover').classList.add('hidden');

    if (view === 'login') {
        document.getElementById('modal-view-login').classList.remove('hidden');
    } else if (view === 'recover') {
        document.getElementById('modal-view-recover').classList.remove('hidden');
    }
}

function handleLoginSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById("login-email");
    const error = document.getElementById("email-error");
    const valid = input.checkValidity();
    
    input.setAttribute("aria-invalid", String(!valid));
    
    if (!valid) {
        error.textContent = "Ingresa un correo válido, ej. ana@example.com.";
    } else {
        error.textContent = "";
        document.getElementById('login-success-msg').classList.remove('hidden');
        showFeedbackToast('Sesión iniciada correctamente');
    }
}

function handleRecoverSubmit(e) {
    e.preventDefault();
    document.getElementById('recover-code-sent').classList.remove('hidden');
    showFeedbackToast('Código de 6 dígitos enviado a tu correo');
}

function handleSupportSubmit(e) {
    e.preventDefault();
    document.getElementById('support-feedback').classList.remove('hidden');
    showFeedbackToast('Consulta enviada al equipo de soporte');
    e.target.reset();
}