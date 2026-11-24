document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    const data = getQeroData();
    const paciente = data.pacientes.find(p => p.id === idBuscado) || data.pacientes[0];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    const keyNueva = `qero_nueva_rutina_config_${paciente.id}`;
    const nuevosEjercicios = JSON.parse(sessionStorage.getItem(keyNueva) || '[]');

    // Si alguien entra directo sin haber configurado ejercicios, vuelve al detalle
    if (nuevosEjercicios.length === 0) {
        window.location.href = `paciente-detalle.html?id=${paciente.id}`;
        return;
    }

    const detalleUrl = `paciente-detalle.html?id=${paciente.id}`;
    document.getElementById('btn-back-nr').href = `configurar-ejercicios.html?id=${paciente.id}&modo=nueva`;
    document.getElementById('btn-cancel-nr').href = detalleUrl;
    document.getElementById('nr-patient-sub').textContent =
        `Paciente: ${paciente.nombre} (${paciente.id})`;

    const ejTexto = nuevosEjercicios.length === 1 ? '1 ejercicio' : `${nuevosEjercicios.length} ejercicios`;
    document.getElementById('nr-summary-text').textContent =
        `Listo para activar (${ejTexto}). La rutina actual pasará automáticamente al historial.`;

    // Guardar nueva rutina y bajar la actual al historial
    const form = document.getElementById('nr-form');
    const nameInput = document.getElementById('nr-name-input');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoNombre = nameInput.value.trim();
        if (!nuevoNombre) return;

        // 1. Bajar la rutina actual al inicio del historial
        if (!Array.isArray(paciente.historialRutinas)) {
            paciente.historialRutinas = [];
        }

        if (Array.isArray(paciente.rutinaAsignada) && paciente.rutinaAsignada.length > 0) {
            const hoy = new Date();
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const fechaHoy = `${String(hoy.getDate()).padStart(2, '0')} ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
            const avanceAnterior = Number(paciente.avance ?? 0);

            paciente.historialRutinas.unshift({
                id: `HIST-${paciente.id}-${Date.now().toString().slice(-4)}`,
                nombre: paciente.nombreRutina || 'Rutina anterior',
                fecha: fechaHoy,
                estado: avanceAnterior >= 90 ? 'Completada' : 'Parcial',
                avance: avanceAnterior,
                duracion: `${Math.max(10, paciente.rutinaAsignada.length * 4)} min`,
                ejerciciosCount: paciente.rutinaAsignada.length,
                notas: 'Rutina reemplazada por un nuevo plan asignado.'
            });
        }

        // 2. Activar la nueva rutina como actual (0% en amarillo / seguimiento)
        paciente.nombreRutina = nuevoNombre;
        paciente.rutinaAsignada = nuevosEjercicios;
        paciente.avance = 0;
        paciente.etiqueta = '0%';
        paciente.estado = 'seguimiento';
        paciente.nivel = 'amber';
        paciente.ultimaActividad = 'Nueva rutina asignada · Hoy';

        saveQeroData(data);

        // Limpiar temporales y volver al detalle del paciente
        sessionStorage.removeItem(keyNueva);
        sessionStorage.removeItem('qero_ejercicios_por_agregar');
        window.location.href = detalleUrl;
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
        window.location.href = '../../index.html';
    });
});