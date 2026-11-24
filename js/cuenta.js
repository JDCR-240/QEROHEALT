const QERO_ACCOUNTS_KEY = 'qero_cuentas_usuarios_v2';
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
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda' }
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
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda' }
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
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda' }
        ]
    }
};

function obtenerIniciales(texto) {
    const palabras = String(texto || 'QH')
        .replace(/^(Lic\.|Dr\.|Dra\.)\s+/i, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    return palabras.slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'QH';
}

function generarCorreo(nombre, dominio = 'correo.com') {
    const limpio = String(nombre || 'usuario')
        .replace(/^(Lic\.|Dr\.|Dra\.)\s+/i, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 2)
        .join('.');
    return `${limpio || 'usuario'}@${dominio}`;
}

function obtenerPacienteActivo(data) {
    const pacientes = (data && data.pacientes) ? data.pacientes : [];
    if (pacientes.length === 0) return null;

    const idGuardado = sessionStorage.getItem(QERO_SESSION_PATIENT_KEY);
    let paciente = pacientes.find(p => p.id === idGuardado);

    if (!paciente) {
        paciente = pacientes[0];
        sessionStorage.setItem(QERO_SESSION_PATIENT_KEY, paciente.id);
    }
    return paciente;
}

function cargarMapaCuentas() {
    try {
        return JSON.parse(localStorage.getItem(QERO_ACCOUNTS_KEY)) || {};
    } catch {
        return {};
    }
}

function construirPerfilActivo(rol, data, pacienteActual, mapaCuentas) {
    const esp = (data && data.especialista) ? data.especialista : { nombre: 'Lic. Elena Vargas', iniciales: 'EV' };
    const pacId = pacienteActual ? pacienteActual.id : 'QH-1001';

    let accountKey = 'Especialista_main';
    let base = {};

    if (rol === 'Paciente') {
        accountKey = `Paciente_${pacId}`;
        const nombrePac = pacienteActual ? pacienteActual.nombre : 'Marta González';
        base = {
            nombre: nombrePac,
            extraLabel: 'Edad / Referencia',
            extraValor: pacienteActual && pacienteActual.edad ? `${pacienteActual.edad} años` : '64 años',
            correo: generarCorreo(nombrePac, 'correo.com'),
            telefono: '+51 987 654 321',
            password: '••••••••',
            ciudad: 'Lima, Perú',
            textoGrande: false,
            lecturaVoz: false
        };
    } else if (rol === 'Cuidador') {
        accountKey = `Cuidador_${pacId}`;
        const nombreCuid = (pacienteActual && (pacienteActual.cuidadora || pacienteActual.cuidador)) || 'Sofía González';
        base = {
            nombre: nombreCuid,
            extraLabel: 'Vínculo con el paciente',
            extraValor: 'Familiar / Cuidador principal',
            correo: generarCorreo(nombreCuid, 'correo.com'),
            telefono: '+51 944 754 618',
            password: '••••••••',
            ciudad: 'Lima, Perú',
            textoGrande: false,
            lecturaVoz: false
        };
    } else {
        accountKey = 'Especialista_main';
        const nombreEsp = esp.nombre || 'Lic. Elena Vargas';
        base = {
            nombre: nombreEsp,
            extraLabel: 'Especialidad clínica',
            extraValor: 'Especialista en Rehabilitación',
            correo: generarCorreo(nombreEsp, 'qerohealth.com'),
            telefono: '+51 912 345 678',
            password: '••••••••',
            ciudad: 'Clínica QeroHealth · Sede Central',
            textoGrande: false,
            lecturaVoz: false
        };
    }

    const guardado = mapaCuentas[accountKey] || {};
    // El nombre y edad siempre se sincronizan con data.js como fuente principal
    const perfil = {
        ...base,
        ...guardado,
        nombre: base.nombre
    };

    if (rol === 'Paciente' && pacienteActual && pacienteActual.edad) {
        perfil.extraValor = `${pacienteActual.edad} años`;
    }

    return { accountKey, perfil };
}

document.addEventListener('DOMContentLoaded', () => {
    const rolGuardado = localStorage.getItem('qero_rol_activo') || 'Paciente';
    const rol = NAV_POR_ROL[rolGuardado] ? rolGuardado : 'Paciente';

    const data = typeof getQeroData === 'function' ? getQeroData() : { especialista: { nombre: 'Lic. Elena Vargas', iniciales: 'EV' }, pacientes: [] };
    const pacienteActual = obtenerPacienteActivo(data);
    const mapaCuentas = cargarMapaCuentas();

    let { accountKey, perfil } = construirPerfilActivo(rol, data, pacienteActual, mapaCuentas);

    // 1. Construir navegación según el rol activo
    const navConfig = NAV_POR_ROL[rol];
    document.getElementById('cnt-brand-link').setAttribute('href', navConfig.home);
    document.getElementById('cnt-dynamic-nav').innerHTML = navConfig.links.map(item => `
        <a href="${item.href}" class="app-nav-link">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </a>
    `).join('');

    // 2. Cabecera y tarjeta de contexto (siempre muestra el nombre del rol activo)
    document.getElementById('cnt-role-subtitle').textContent = `Vista de ${rol}`;
    document.getElementById('cnt-role-badge').innerHTML =
        `<i class="fa-solid fa-circle"></i> <span>${rol}</span>`;

    const ctxAvatar = document.getElementById('cnt-context-avatar');
    const ctxKicker = document.getElementById('cnt-context-kicker');
    const ctxTitle = document.getElementById('cnt-context-title');
    const ctxMeta = document.getElementById('cnt-context-meta');

    function actualizarTarjetaContexto() {
        ctxAvatar.textContent = obtenerIniciales(perfil.nombre);
        ctxTitle.textContent = perfil.nombre;

        if (rol === 'Cuidador') {
            const pacNombre = pacienteActual ? pacienteActual.nombre : 'Marta González';
            const pacId = pacienteActual ? pacienteActual.id : 'QH-1001';
            ctxKicker.textContent = 'Perfil de cuidador';
            ctxMeta.textContent = `Acompañando a ${pacNombre} · ${pacId}`;
        } else if (rol === 'Especialista') {
            ctxKicker.textContent = 'Cuenta profesional verificada';
            ctxMeta.textContent = `${perfil.extraValor} · Colegiatura activa`;
        } else {
            const pacId = pacienteActual ? pacienteActual.id : 'QH-1001';
            const rutinaNom = pacienteActual ? (pacienteActual.nombreRutina || 'Rutina activa') : 'Rutina activa';
            ctxKicker.textContent = 'Perfil de paciente';
            ctxMeta.textContent = `ID ${pacId} · ${rutinaNom}`;
        }
    }

    actualizarTarjetaContexto();

    // 3. Cargar campos del formulario
    const inpNombre = document.getElementById('cnt-nombre');
    const inpExtra = document.getElementById('cnt-extra');
    const lblExtra = document.getElementById('cnt-extra-label');
    const inpCorreo = document.getElementById('cnt-correo');
    const inpTelefono = document.getElementById('cnt-telefono');
    const inpPassword = document.getElementById('cnt-password');
    const inpCiudad = document.getElementById('cnt-ciudad');
    const formInputs = [inpNombre, inpExtra, inpCorreo, inpTelefono, inpPassword, inpCiudad];

    const toggleLargeText = document.getElementById('toggle-large-text');
    const toggleVoiceRead = document.getElementById('toggle-voice-read');

    function llenarFormulario() {
        lblExtra.textContent = perfil.extraLabel;
        inpNombre.value = perfil.nombre;
        inpExtra.value = perfil.extraValor;
        inpCorreo.value = perfil.correo;
        inpTelefono.value = perfil.telefono;
        inpPassword.value = perfil.password;
        inpCiudad.value = perfil.ciudad;

        toggleLargeText.checked = Boolean(perfil.textoGrande);
        toggleVoiceRead.checked = Boolean(perfil.lecturaVoz);
        document.body.classList.toggle('qero-large-text', Boolean(perfil.textoGrande));
    }

    llenarFormulario();

    // 4. Modo edición de información general (guarda en cuentas y en data.js)
    const btnToggleEdit = document.getElementById('btn-toggle-edit');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const formActions = document.getElementById('cnt-form-actions');
    const feedbackEl = document.getElementById('cnt-feedback');
    const formEl = document.getElementById('cnt-form');

    function setModoEdicion(activo) {
        formInputs.forEach(inp => { inp.disabled = !activo; });
        formActions.classList.toggle('hidden', !activo);
        btnToggleEdit.classList.toggle('hidden', activo);
        if (activo) {
            feedbackEl.classList.add('hidden');
            inpNombre.focus();
        }
    }

    btnToggleEdit.addEventListener('click', () => setModoEdicion(true));

    btnCancelEdit.addEventListener('click', () => {
        llenarFormulario();
        setModoEdicion(false);
    });

    formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!inpNombre.value.trim() || !inpCorreo.checkValidity()) {
            inpCorreo.reportValidity();
            return;
        }

        perfil.nombre = inpNombre.value.trim();
        perfil.extraValor = inpExtra.value.trim();
        perfil.correo = inpCorreo.value.trim();
        perfil.telefono = inpTelefono.value.trim();
        perfil.password = inpPassword.value || '••••••••';
        perfil.ciudad = inpCiudad.value.trim();

        // Guardar preferencias/datos de cuenta
        mapaCuentas[accountKey] = perfil;
        localStorage.setItem(QERO_ACCOUNTS_KEY, JSON.stringify(mapaCuentas));
        localStorage.setItem('qero_user_email', perfil.correo);

        // Sincronizar cambios directamente en data.js
        if (typeof saveQeroData === 'function') {
            if (rol === 'Paciente' && pacienteActual) {
                pacienteActual.nombre = perfil.nombre;
                pacienteActual.iniciales = obtenerIniciales(perfil.nombre);
                const edadMatch = perfil.extraValor.match(/\d+/);
                if (edadMatch) pacienteActual.edad = parseInt(edadMatch[0], 10);
                saveQeroData(data);
            } else if (rol === 'Cuidador' && pacienteActual) {
                pacienteActual.cuidadora = perfil.nombre;
                saveQeroData(data);
            } else if (rol === 'Especialista') {
                if (!data.especialista) data.especialista = {};
                data.especialista.nombre = perfil.nombre;
                data.especialista.iniciales = obtenerIniciales(perfil.nombre);
                saveQeroData(data);
            }
        }

        actualizarTarjetaContexto();
        setModoEdicion(false);
        feedbackEl.classList.remove('hidden');
    });

    // Ver / ocultar contraseña
    const btnTogglePass = document.getElementById('btn-toggle-pass');
    btnTogglePass.addEventListener('click', () => {
        const esPass = inpPassword.type === 'password';
        inpPassword.type = esPass ? 'text' : 'password';
        btnTogglePass.innerHTML = esPass
            ? '<i class="fa-regular fa-eye-slash"></i>'
            : '<i class="fa-regular fa-eye"></i>';
    });

    // Switches de accesibilidad
    toggleLargeText.addEventListener('change', () => {
        perfil.textoGrande = toggleLargeText.checked;
        mapaCuentas[accountKey] = perfil;
        localStorage.setItem(QERO_ACCOUNTS_KEY, JSON.stringify(mapaCuentas));
        document.body.classList.toggle('qero-large-text', perfil.textoGrande);
    });

    toggleVoiceRead.addEventListener('change', () => {
        perfil.lecturaVoz = toggleVoiceRead.checked;
        mapaCuentas[accountKey] = perfil;
        localStorage.setItem(QERO_ACCOUNTS_KEY, JSON.stringify(mapaCuentas));
    });

    // 5. Modal: Cerrar sesión
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