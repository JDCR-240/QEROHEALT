const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';

function obtenerPacienteActual(data) {
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
function obtenerSiguientePendiente(rutina, idxActual) {
    const total = rutina.length;
    for (let offset = 1; offset < total; offset++) {
        const i = (idxActual + offset) % total;
        if (!rutina[i].completado) {
            return i;
        }
    }
    return -1;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteActual(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    const total = rutina.length;

    if (total === 0) {
        window.location.href = 'mi-rutina.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    let idxCompletado = parseInt(params.get('index'), 10);
    if (isNaN(idxCompletado) || idxCompletado < 0 || idxCompletado >= total) {
        idxCompletado = 0;
    }

    const ejCompletado = rutina[idxCompletado];
    const avance = Math.max(0, Math.min(100, Number(paciente.avance ?? 0)));
    const completadosCount = rutina.filter(ej => Boolean(ej.completado)).length;

    // 1. Pintar datos del ejercicio recién terminado
    document.getElementById('ac-step-pill').textContent =
        `Ejercicio ${idxCompletado + 1} de ${total} completado`;
    document.getElementById('ac-completed-name').textContent =
        `Completaste "${ejCompletado.nombre}". ¡Muy buen trabajo!`;

    // 2. Pintar progreso semanal actualizado
    document.getElementById('ac-routine-name').textContent =
        paciente.nombreRutina || 'Rutina actual';
    document.getElementById('ac-progress-pct').textContent = `${avance}%`;
    document.getElementById('ac-progress-fill').style.width = `${avance}%`;
    document.getElementById('ac-progress-detail').textContent =
        `${completadosCount} de ${total} ejercicios completados esta semana`;

    // 3. Pintar siguiente actividad (si falta alguno va al pendiente; si ya está al 100% sigue en bucle)
    const btnNextActivity = document.getElementById('btn-next-activity');
    const btnFinishRoutine = document.getElementById('btn-finish-routine');

    const pendienteIdx = obtenerSiguientePendiente(rutina, idxCompletado);
    const siguienteIdx = pendienteIdx !== -1 ? pendienteIdx : (idxCompletado + 1) % total;

    const sigEj = rutina[siguienteIdx];
    const tiempoTexto = sigEj.tiempo || sigEj.frecuencia || '3 min';
    document.getElementById('ac-next-meta').textContent =
        `${tiempoTexto} · ${sigEj.repeticiones || 10} rep.`;
    document.getElementById('ac-next-title').textContent =
        `${siguienteIdx + 1}. ${sigEj.nombre}`;
    document.getElementById('ac-next-indication').textContent =
        sigEj.indicacion || 'Realiza el movimiento de forma pausada y controlada.';

    btnNextActivity.addEventListener('click', () => {
        window.location.href = `ejecutar-ejercicio.html?index=${siguienteIdx}`;
    });

    // Mostrar "Finalizar rutina" solo cuando el paciente ya llegó al 100%
    if (avance === 100 && btnFinishRoutine) {
        btnFinishRoutine.classList.remove('hidden');
    }

    // 4. Modal: Cerrar sesión
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