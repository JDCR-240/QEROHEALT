const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';
const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

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
    const avance = Math.max(0, Math.min(100, Number(paciente.avance ?? 0)));

    // Cargar catálogo para mostrar las miniaturas reales de cada ejercicio
    const rawCatalogo = localStorage.getItem(QERO_CATALOG_KEY);
    const catalogo = rawCatalogo ? JSON.parse(rawCatalogo) : [];
    const mapaCatalogo = new Map(catalogo.map(ej => [ej.id, ej]));

    // Equivalencia exacta: ej. 50% de 4 ejercicios = 2 completados (100%) y 2 pendientes (0%)
    const totalEjercicios = rutina.length;
    const completadosCount = rutina.filter(item => Boolean(item.completado)).length;
    const primerPendiente = rutina.findIndex(item => !item.completado);
    const siguienteIndex = primerPendiente !== -1 ? primerPendiente : 0;

    // 1. Cabecera
    const nombreRutina = paciente.nombreRutina || 'Rutina terapéutica actual';
    document.title = `${nombreRutina} — QeroHealth`;
    document.getElementById('pr-routine-title').textContent = nombreRutina;
    document.getElementById('pr-patient-sub').textContent =
        `${paciente.nombre} · ${paciente.condicion || 'Plan de rehabilitación'}`;

    // Botón principal (Iniciar / Continuar / Repetir)
    const btnMain = document.getElementById('btn-main-action');
    const btnMainText = document.getElementById('btn-main-action-text');
    btnMain.href = `ejecutar-ejercicio.html?index=${siguienteIndex}`;

    if (totalEjercicios === 0) {
        btnMain.classList.add('hidden');
    } else if (completadosCount === 0) {
        btnMainText.textContent = 'Iniciar rutina';
    } else if (completadosCount < totalEjercicios) {
        btnMainText.textContent = `Continuar rutina (${completadosCount + 1}/${totalEjercicios})`;
    } else {
        btnMainText.textContent = 'Repetir rutina';
    }

    // 2. Tarjeta resumen y color de estado
    const summaryCard = document.getElementById('pr-summary-card');
    summaryCard.classList.remove('is-warning', 'is-alert');
    if (paciente.estado === 'alerta' || paciente.nivel === 'red') {
        summaryCard.classList.add('is-alert');
    } else if (paciente.estado === 'seguimiento' || paciente.nivel === 'amber' || avance <= 60) {
        summaryCard.classList.add('is-warning');
    }

    document.getElementById('pr-completed-text').textContent =
        `${completadosCount} de ${totalEjercicios} ejercicios completados`;
    document.getElementById('pr-total-time').innerHTML =
        `<i class="fa-regular fa-clock"></i> ${calcularMinutosTotales(rutina)} min aprox.`;
    document.getElementById('pr-pct-badge').textContent = `${avance}%`;
    document.getElementById('pr-progress-fill').style.width = `${avance}%`;
    document.getElementById('pr-count-badge').textContent =
        totalEjercicios === 1 ? '1 ejercicio' : `${totalEjercicios} ejercicios`;

    // 3. Lista de ejercicios con equivalencia 100% / 0%
    const listEl = document.getElementById('pr-exercises-list');

    if (totalEjercicios === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                Aún no tienes ejercicios asignados en tu rutina actual.
            </div>
        `;
    } else {
        listEl.innerHTML = rutina.map((item, idx) => {
            const ejCat = mapaCatalogo.get(item.ejercicioId);
            const imgSrc = (ejCat && ejCat.imagen) || '../../img/catalogo.jpg';
            const tiempoTexto = item.tiempo || item.frecuencia || '3 min';
            const indicacion = item.indicacion || 'Realiza el movimiento de forma pausada y controlada.';

            const estaCompletado = Boolean(item.completado);
            const esSiguiente = !estaCompletado && idx === primerPendiente;

            const pctEjercicio = estaCompletado ? 100 : 0;
            const cardClass = estaCompletado ? 'is-done' : (esSiguiente ? 'is-next' : '');
            const iconoOrden = estaCompletado ? '<i class="fa-solid fa-check"></i>' : `${idx + 1}`;

            let badgeHtml = `<span class="pr-ex-status pending">Pendiente</span>`;
            if (estaCompletado) {
                badgeHtml = `<span class="pr-ex-status done"><i class="fa-solid fa-circle-check"></i> Completado</span>`;
            } else if (esSiguiente) {
                badgeHtml = `<span class="pr-ex-status next"><i class="fa-solid fa-play"></i> Siguiente</span>`;
            }

            let btnClass = 'btn btn-outline btn-interactive pr-ex-btn';
            let btnIcon = 'fa-solid fa-play';
            let btnLabel = 'Iniciar';

            if (estaCompletado) {
                btnIcon = 'fa-solid fa-rotate-right';
                btnLabel = 'Repetir';
            } else if (esSiguiente) {
                btnClass = 'btn btn-primary btn-interactive pr-ex-btn';
                btnLabel = completadosCount > 0 ? 'Continuar' : 'Iniciar';
            }

            return `
                <article class="pr-ex-card ${cardClass}">
                    <div class="pr-ex-left">
                        <div class="pr-ex-thumb-wrap">
                            <img src="${imgSrc}" alt="${item.nombre}">
                            <span class="pr-ex-order">${iconoOrden}</span>
                        </div>
                        <div class="pr-ex-info">
                            <div class="pr-ex-top-row">
                                <h3 class="pr-ex-name">${item.nombre}</h3>
                                ${badgeHtml}
                            </div>
                            <div class="pr-ex-meta">
                                <span><i class="fa-solid fa-tag"></i> ${item.categoria}</span>
                                <span><i class="fa-solid fa-repeat"></i> ${item.repeticiones} rep.</span>
                                <span><i class="fa-regular fa-clock"></i> ${tiempoTexto}</span>
                            </div>
                            <div class="pr-ex-mini-progress">
                                <div class="pr-ex-mini-track">
                                    <div class="pr-ex-mini-fill" style="width: ${pctEjercicio}%;"></div>
                                </div>
                                <span class="pr-ex-mini-pct">${pctEjercicio}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="pr-ex-actions">
                        <a href="ejecutar-ejercicio.html?index=${idx}" class="${btnClass}">
                            <i class="${btnIcon}"></i>
                            <span>${btnLabel}</span>
                        </a>
                    </div>
                </article>
            `;
        }).join('');
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