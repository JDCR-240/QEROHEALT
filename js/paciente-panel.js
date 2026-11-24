const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';
const QERO_LAST_RANDOM_KEY = 'qero_ultimo_paciente_random';

function obtenerPacienteDeSesion(data) {
    const pacientes = data.pacientes || [];
    if (pacientes.length === 0) return null;

    // Si ya hay un paciente elegido en esta sesión, mantenerlo
    let idActual = sessionStorage.getItem(QERO_SESSION_PATIENT_KEY);
    let paciente = pacientes.find(p => p.id === idActual);

    // Si es un nuevo inicio de sesión, elegir uno al azar distinto al último
    if (!paciente) {
        const ultimoId = localStorage.getItem(QERO_LAST_RANDOM_KEY);
        const candidatos = pacientes.length > 1
            ? pacientes.filter(p => p.id !== ultimoId)
            : pacientes;

        paciente = candidatos[Math.floor(Math.random() * candidatos.length)];
        sessionStorage.setItem(QERO_SESSION_PATIENT_KEY, paciente.id);
        localStorage.setItem(QERO_LAST_RANDOM_KEY, paciente.id);
    }

    return paciente;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteDeSesion(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    const historial = Array.isArray(paciente.historialRutinas) ? paciente.historialRutinas : [];
    const avance = Number(paciente.avance ?? 0);
    const primerNombre = (paciente.nombre || 'Paciente').split(' ')[0];

    // 1. Bienvenida
    document.title = `Hola, ${primerNombre} — QeroHealth`;
    document.getElementById('pp-avatar').textContent = paciente.iniciales || primerNombre.slice(0, 2).toUpperCase();
    document.getElementById('pp-greeting').textContent = `¡Hola, ${primerNombre}!`;
    document.getElementById('pp-subtitle').textContent =
        `${paciente.nombre} · ${paciente.condicion || 'Plan de rehabilitación'}`;

    // 2. KPIs
    const ejTexto = rutina.length === 1 ? '1 ejercicio' : `${rutina.length} ejercicios`;
    document.getElementById('pp-stat-progress').textContent = `${avance}%`;
    document.getElementById('pp-stat-exercises').textContent = ejTexto;
    document.getElementById('pp-stat-sessions').textContent = `${historial.length} sesiones`;

    // 3. Tarjeta principal de Rutina de hoy
    // Aplicar color de estado solo a la tarjeta "Tu rutina actual"
    const heroRoutineCard = document.querySelector('.pp-hero-routine');
    if (heroRoutineCard) {
        heroRoutineCard.classList.remove('is-warning', 'is-alert');
        if (paciente.estado === 'alerta' || paciente.nivel === 'red') {
            heroRoutineCard.classList.add('is-alert');
        } else if (paciente.estado === 'seguimiento' || paciente.nivel === 'amber' || avance <= 60) {
            heroRoutineCard.classList.add('is-warning');
        }
    }
    document.getElementById('pp-routine-name').textContent =
        paciente.nombreRutina || 'Rutina terapéutica actual';
    document.getElementById('pp-routine-meta').textContent =
        `${ejTexto} asignados · ${paciente.ultimaActividad || 'Listo para comenzar'}`;
    document.getElementById('pp-routine-pill').textContent = ejTexto;

    document.getElementById('pp-progress-text').textContent = `${avance}%`;
    document.getElementById('pp-progress-fill').style.width = `${avance}%`;

    const previewEl = document.getElementById('pp-exercises-preview');
    if (rutina.length === 0) {
        previewEl.innerHTML = `<p class="pp-routine-meta">Aún no tienes ejercicios asignados.</p>`;
    } else {
        previewEl.innerHTML = rutina.map((item, idx) => {
            const hecho = Boolean(item.completado);
            return `
                <div class="pp-ex-item ${hecho ? 'is-done' : ''}">
                    <div class="pp-ex-left">
                        <span class="pp-ex-num ${hecho ? 'is-done' : ''}">
                            ${hecho ? '<i class="fa-solid fa-check"></i>' : idx + 1}
                        </span>
                        <div class="pp-ex-info">
                            <span class="pp-ex-name">${item.nombre}</span>
                            <span class="pp-ex-meta">${item.categoria} · ${item.repeticiones} rep. · ${item.tiempo || item.frecuencia || '3 min'}</span>
                        </div>
                    </div>
                    <span class="pp-ex-status ${hecho ? 'is-done' : 'is-pending'}">
                        ${hecho ? 'Completado' : 'Pendiente'}
                    </span>
                </div>
            `;
        }).join('');
    }

    // 4. Equipo de apoyo
    document.getElementById('pp-specialist-name').textContent =
        (data.especialista && data.especialista.nombre) || 'Lic. Elena Vargas';
    document.getElementById('pp-caregiver-name').textContent =
        paciente.cuidadora || 'Familiar / Cuidador';

    // 5. Últimas 2 sesiones del historial
    const recentEl = document.getElementById('pp-recent-history');
    const ultimas = historial.slice(0, 2);

    if (ultimas.length === 0) {
        recentEl.innerHTML = `<p class="pp-recent-date">Sin sesiones anteriores registradas.</p>`;
    } else {
        recentEl.innerHTML = ultimas.map(item => {
            const esParcial = String(item.estado || '').toLowerCase() === 'parcial';
            return `
                <div class="pp-recent-item">
                    <div>
                        <span class="pp-recent-name">${item.nombre}</span>
                        <span class="pp-recent-date">${item.fecha} · ${item.duracion}</span>
                    </div>
                    <span class="pp-recent-badge ${esParcial ? 'partial' : ''}">${item.avance}%</span>
                </div>
            `;
        }).join('');
    }



    // 5.5 Adelanto de Resumen de tu avance
    const avancePreviewEl = document.getElementById('pp-avance-preview');
    if (avancePreviewEl) {
        const completadosHoy = rutina.filter(ej => Boolean(ej.completado)).length;
        const pendientesHoy = Math.max(0, rutina.length - completadosHoy);
        const promedioHist = historial.length > 0
            ? Math.round(historial.reduce((acc, s) => acc + Number(s.avance || 0), 0) / historial.length)
            : avance;

        avancePreviewEl.innerHTML = `
            <div class="pp-av-item">
                <div class="pp-av-left">
                    <span class="pp-av-icon"><i class="fa-solid fa-circle-check"></i></span>
                    <div>
                        <span class="pp-av-label">Ejercicios completados</span>
                        <span class="pp-av-sub">De tu rutina actual</span>
                    </div>
                </div>
                <strong class="pp-av-val">${completadosHoy} / ${rutina.length}</strong>
            </div>

            <div class="pp-av-item">
                <div class="pp-av-left">
                    <span class="pp-av-icon"><i class="fa-solid fa-hourglass-half"></i></span>
                    <div>
                        <span class="pp-av-label">Pendientes esta semana</span>
                        <span class="pp-av-sub">Listos para continuar a tu ritmo</span>
                    </div>
                </div>
                <strong class="pp-av-val">${pendientesHoy}</strong>
            </div>

            <div class="pp-av-item">
                <div class="pp-av-left">
                    <span class="pp-av-icon"><i class="fa-solid fa-award"></i></span>
                    <div>
                        <span class="pp-av-label">Promedio de sesiones</span>
                        <span class="pp-av-sub">Basado en ${historial.length} sesiones anteriores</span>
                    </div>
                </div>
                <strong class="pp-av-val">${promedioHist}%</strong>
            </div>
        `;
    }


    // 6. Modal: Cerrar sesión (limpia el paciente de sesión para que el próximo ingreso sea otro aleatorio)
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