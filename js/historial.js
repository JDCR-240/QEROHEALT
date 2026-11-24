document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    const data = getQeroData();
    const paciente = data.pacientes.find(p => p.id === idBuscado) || data.pacientes[0];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    // Cabecera y enlace de regreso
    document.title = `Historial de ${paciente.nombre} — QeroHealth`;
    document.getElementById('btn-back-detail').href = `paciente-detalle.html?id=${paciente.id}`;
    document.getElementById('hist-patient-sub').textContent =
        `${paciente.nombre} (${paciente.id}) · ${paciente.condicion || 'Seguimiento'}`;

    // 1. Pintar historial: Rutina actual primero + todas las anteriores
    const rutinaActual = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    const historial = Array.isArray(paciente.historialRutinas) ? paciente.historialRutinas : [];

    const totalSesiones = historial.length + (rutinaActual.length > 0 ? 1 : 0);
    document.getElementById('hist-total-badge').textContent =
        totalSesiones === 1 ? '1 sesión' : `${totalSesiones} sesiones`;

    const listEl = document.getElementById('hist-list');
    let html = '';

    // Rutina actual
    if (rutinaActual.length > 0) {
        const ejActualTexto = rutinaActual.length === 1 ? '1 ejercicio' : `${rutinaActual.length} ejercicios`;
        const avanceActual = Number(paciente.avance ?? 0);

        html += `
            <article class="hist-item is-current">
                <div class="hist-item-info">
                    <div class="hist-item-top">
                        <span class="hist-current-tag">Actual</span>
                        <h3 class="hist-item-title">${paciente.nombreRutina || 'Rutina actual asignada'}</h3>
                    </div>
                    <div class="hist-item-meta">
                        <span><i class="fa-regular fa-clock"></i>${paciente.ultimaActividad || 'Plan vigente'}</span>
                        <span><i class="fa-solid fa-dumbbell"></i>${ejActualTexto}</span>
                    </div>
                </div>
                <div class="hist-item-right">
                    <span class="hist-item-pct">${avanceActual}%</span>
                    <span class="hist-status-pill hist-status-current">En curso</span>
                </div>
            </article>
        `;
    }

    // Rutinas anteriores (5 a 8)
    html += historial.map(item => {
        const esParcial = String(item.estado || '').toLowerCase() === 'parcial';
        const statusClass = esParcial ? 'hist-status-partial' : 'hist-status-done';
        const ejTexto = item.ejerciciosCount === 1 ? '1 ejercicio' : `${item.ejerciciosCount} ejercicios`;

        return `
            <article class="hist-item">
                <div class="hist-item-info">
                    <h3 class="hist-item-title">${item.nombre}</h3>
                    <div class="hist-item-meta">
                        <span><i class="fa-regular fa-calendar"></i>${item.fecha}</span>
                        <span><i class="fa-regular fa-clock"></i>${item.duracion}</span>
                        <span><i class="fa-solid fa-dumbbell"></i>${ejTexto}</span>
                    </div>
                    ${item.notas ? `<p class="hist-item-note">${item.notas}</p>` : ''}
                </div>
                <div class="hist-item-right">
                    <span class="hist-item-pct">${item.avance}%</span>
                    <span class="hist-status-pill ${statusClass}">${item.estado}</span>
                </div>
            </article>
        `;
    }).join('');

    listEl.innerHTML = html || '<p class="hist-item-note">No hay sesiones registradas para este paciente.</p>';

    // 2. Botón: Enviar recordatorio
    const btnReminder = document.getElementById('btn-send-reminder');
    const toast = document.getElementById('reminder-toast');
    const toastText = document.getElementById('reminder-toast-text');
    const btnCloseToast = document.getElementById('btn-close-toast');
    let toastTimer = null;

    btnReminder.addEventListener('click', () => {
        toastText.textContent = `Se envió el recordatorio exitosamente al paciente ${paciente.nombre}.`;
        toast.classList.remove('hidden');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, 4500);
    });

    btnCloseToast.addEventListener('click', () => {
        clearTimeout(toastTimer);
        toast.classList.add('hidden');
    });

    // 3. Modal: Cerrar sesión
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