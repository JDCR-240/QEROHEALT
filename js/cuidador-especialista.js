const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';
const QERO_CONSULTAS_KEY = 'qero_consultas_cuidador_v1';

function obtenerPacienteAsociado(data) {
    const pacientes = data.pacientes || [];
    if (pacientes.length === 0) return null;

    const idGuardado = sessionStorage.getItem(QERO_SESSION_PATIENT_KEY);
    let paciente = pacientes.find(p => p.id === idGuardado);

    if (!paciente) {
        paciente = pacientes[0];
        sessionStorage.setItem(QERO_SESSION_PATIENT_KEY, paciente.id);
    }
    return paciente;
}

function obtenerConsultasPorPaciente(paciente, especialistaNombre) {
    const raw = localStorage.getItem(QERO_CONSULTAS_KEY);
    const todas = raw ? JSON.parse(raw) : {};

    if (!Array.isArray(todas[paciente.id])) {
        const primerEjercicio =
            Array.isArray(paciente.rutinaAsignada) && paciente.rutinaAsignada[0]
                ? paciente.rutinaAsignada[0].nombre
                : 'Rutina semanal';

        todas[paciente.id] = [
            {
                id: 'CONS-INIT-1',
                fecha: 'Ayer · 17:40',
                motivo: 'Ritmo y pausas',
                ejercicio: primerEjercicio,
                mensaje: '¿Podemos hacer una pausa de 1 minuto entre series si notamos un poco de cansancio?',
                estado: 'Respondido',
                respuesta: {
                    autor: especialistaNombre,
                    texto: 'Sí, perfecto. Prioricen la calidad del movimiento sobre la velocidad; pausar 1 minuto ayuda mucho a evitar fatiga.'
                }
            }
        ];
        localStorage.setItem(QERO_CONSULTAS_KEY, JSON.stringify(todas));
    }

    return todas;
}

function formatearHoraActual() {
    const ahora = new Date();
    const h = String(ahora.getHours()).padStart(2, '0');
    const m = String(ahora.getMinutes()).padStart(2, '0');
    return `Hoy · ${h}:${m}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteAsociado(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const especialista = data.especialista || { nombre: 'Lic. Elena Vargas', iniciales: 'EV' };
    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];

    // 1. Pintar datos del especialista y paciente
    document.getElementById('ce-doc-avatar').textContent = especialista.iniciales || 'EV';
    document.getElementById('ce-doc-name').textContent = especialista.nombre || 'Lic. Elena Vargas';
    document.getElementById('ce-patient-name').textContent = paciente.nombre;

    // 2. Poblar selector con los ejercicios de la rutina actual
    const exerciseSelect = document.getElementById('ce-exercise-select');
    rutina.forEach((ej, idx) => {
        const opt = document.createElement('option');
        opt.value = ej.nombre;
        opt.textContent = `${idx + 1}. ${ej.nombre} (${ej.categoria || 'Rehabilitación'})`;
        exerciseSelect.appendChild(opt);
    });

    // 3. Manejo de chips de motivo
    const topicChips = document.querySelectorAll('.ce-chip');
    let motivoSeleccionado = 'Duda de ejercicio';

    topicChips.forEach(chip => {
        chip.addEventListener('click', () => {
            topicChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            motivoSeleccionado = chip.dataset.topic;
        });
    });

    // 4. Renderizar bandeja de consultas enviadas (máximo 3 por defecto)
    const messagesListEl = document.getElementById('ce-messages-list');
    const inboxCountEl = document.getElementById('ce-inbox-count');
    const moreWrap = document.getElementById('ce-more-wrap');
    const btnToggleMore = document.getElementById('btn-toggle-more-msgs');

    const LIMITE_MENSAJES = 3;
    let mostrarTodosMensajes = false;

    function renderizarConsultas() {
        const todas = obtenerConsultasPorPaciente(paciente, especialista.nombre);
        const lista = todas[paciente.id] || [];

        inboxCountEl.textContent = `${lista.length} ${lista.length === 1 ? 'mensaje' : 'mensajes'}`;

        const visibles = mostrarTodosMensajes ? lista : lista.slice(0, LIMITE_MENSAJES);
        messagesListEl.classList.toggle('is-expanded', mostrarTodosMensajes && lista.length > LIMITE_MENSAJES);

        messagesListEl.innerHTML = visibles.map(item => {
            const respondido = item.estado === 'Respondido';
            return `
                <article class="ce-msg-card">
                    <div class="ce-msg-top">
                        <span class="ce-msg-date">${item.fecha}</span>
                        <span class="ce-msg-status ${respondido ? 'is-replied' : 'is-sent'}">
                            ${respondido ? 'Respondido' : 'Enviado · Esperando respuesta'}
                        </span>
                    </div>

                    <div class="ce-msg-tags">
                        <span class="ce-tag is-topic">
                            <i class="fa-solid fa-tag"></i> ${item.motivo}
                        </span>
                        ${item.ejercicio ? `
                            <span class="ce-tag is-exercise">
                                <i class="fa-solid fa-dumbbell"></i> ${item.ejercicio}
                            </span>
                        ` : ''}
                    </div>

                    <p class="ce-msg-body">${item.mensaje}</p>

                    ${item.respuesta ? `
                        <div class="ce-reply-box">
                            <span class="ce-reply-author">${item.respuesta.autor}</span>
                            <p class="ce-reply-text">${item.respuesta.texto}</p>
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('');

        if (lista.length > LIMITE_MENSAJES) {
            moreWrap.classList.remove('hidden');
            const restantes = lista.length - LIMITE_MENSAJES;
            btnToggleMore.innerHTML = mostrarTodosMensajes
                ? '<i class="fa-solid fa-chevron-up"></i> <span>Mostrar menos consultas</span>'
                : `<i class="fa-solid fa-chevron-down"></i> <span>Mostrar consultas anteriores (${restantes} más)</span>`;
        } else {
            moreWrap.classList.add('hidden');
        }
    }

    btnToggleMore.addEventListener('click', () => {
        mostrarTodosMensajes = !mostrarTodosMensajes;
        renderizarConsultas();
    });

    renderizarConsultas();

    // 5. Envío del formulario
    const form = document.getElementById('ce-form');
    const msgInput = document.getElementById('ce-message');
    const msgError = document.getElementById('ce-msg-error');
    const toast = document.getElementById('ce-toast');

    msgInput.addEventListener('input', () => {
        const vacio = msgInput.value.trim() === '';
        msgInput.setAttribute('aria-invalid', String(vacio));
        msgError.classList.toggle('hidden', !vacio);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        toast.classList.add('hidden');

        const texto = msgInput.value.trim();
        if (!texto) {
            msgInput.setAttribute('aria-invalid', 'true');
            msgError.classList.remove('hidden');
            msgInput.focus();
            return;
        }

        const todas = obtenerConsultasPorPaciente(paciente, especialista.nombre);
        const nuevaConsulta = {
            id: `CONS-${Date.now()}`,
            fecha: formatearHoraActual(),
            motivo: motivoSeleccionado,
            ejercicio: exerciseSelect.value || '',
            mensaje: texto,
            estado: 'Enviado',
            respuesta: null
        };

        todas[paciente.id].unshift(nuevaConsulta);
        localStorage.setItem(QERO_CONSULTAS_KEY, JSON.stringify(todas));

        // Limpiar y refrescar
        msgInput.value = '';
        msgInput.removeAttribute('aria-invalid');
        exerciseSelect.value = '';
        toast.classList.remove('hidden');
        renderizarConsultas();
    });

    // 6. Modal: Cerrar sesión
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
        window.location.href = '../../index.html';
    });
});