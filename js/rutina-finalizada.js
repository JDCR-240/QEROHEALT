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

function calcularMinutosTotales(rutina) {
    return rutina.reduce((acc, item) => {
        const match = String(item.tiempo || item.frecuencia || '').match(/\d+/);
        return acc + (match ? parseInt(match[0], 10) : 3);
    }, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteActual(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    const totalEjercicios = rutina.length;
    const totalMinutos = calcularMinutosTotales(rutina);
    const primerNombre = (paciente.nombre || 'Paciente').split(' ')[0];

    // Pintar resumen de la rutina finalizada
    document.getElementById('rf-subtitle').textContent =
        `¡Muy bien hecho, ${primerNombre}! Completaste todos los ejercicios de tu plan.`;
    document.getElementById('rf-stat-activities').textContent =
        `${totalEjercicios} de ${totalEjercicios}`;
    document.getElementById('rf-stat-time').textContent = `${totalMinutos} min`;
    document.getElementById('rf-stat-pct').textContent = '100%';
    document.getElementById('rf-routine-name').textContent =
        paciente.nombreRutina || 'Rutina terapéutica actual';

    // Botón "Ver mi seguimiento" listo para conectar cuando indiques
    const btnSeguimiento = document.getElementById('btn-ver-seguimiento');
    btnSeguimiento.addEventListener('click', () => {
        // Sin redirección aún, según lo indicado
    });

    // Modal: Cerrar sesión
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