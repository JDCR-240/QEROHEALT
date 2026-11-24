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

function extraerMinutos(item) {
    const match = String(item.tiempo || item.frecuencia || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteActual(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    const historial = Array.isArray(paciente.historialRutinas) ? paciente.historialRutinas : [];

    const total = rutina.length;
    const completados = rutina.filter(ej => Boolean(ej.completado)).length;
    const pendientes = Math.max(0, total - completados);
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    const minHechos = rutina
        .filter(ej => Boolean(ej.completado))
        .reduce((acc, ej) => acc + extraerMinutos(ej), 0);
    const minRestantes = rutina
        .filter(ej => !ej.completado)
        .reduce((acc, ej) => acc + extraerMinutos(ej), 0);

    // 1. Cabecera
    document.getElementById('av-routine-name').textContent =
        paciente.nombreRutina || 'Rutina terapéutica · Semana actual';
    document.getElementById('av-subtitle').textContent =
        `Paciente: ${paciente.nombre} · Última actividad: ${paciente.ultimaActividad || 'Sin registro reciente'}`;

    const badge = document.getElementById('av-status-badge');
    const pctEl = document.getElementById('av-pct-value');
    const barFill = document.getElementById('av-bar-fill');

    if (porcentaje >= 70) {
        badge.className = 'av-status-badge is-green';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> <span>Buen ritmo</span>';
    } else if (porcentaje >= 40) {
        badge.className = 'av-status-badge is-amber';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> <span>En progreso</span>';
        pctEl.classList.add('is-amber');
        barFill.classList.add('is-amber');
    } else {
        badge.className = 'av-status-badge is-red';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> <span>Por iniciar</span>';
        pctEl.classList.add('is-red');
        barFill.classList.add('is-red');
    }

    // 2. Barra de progreso y tiempos
    pctEl.textContent = `${porcentaje}%`;
    document.getElementById('av-completed-text').textContent = `${completados} de ${total} ejercicios completados`;
    document.getElementById('av-min-done').textContent = `${minHechos} min hechos`;
    document.getElementById('av-min-left').textContent = `${minRestantes} min restantes`;

    const progressBar = document.getElementById('av-progress-bar');
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(porcentaje));
    requestAnimationFrame(() => {
        barFill.style.width = `${porcentaje}%`;
    });

    // 3. Contadores y filtros de ejercicios
    document.getElementById('av-count-all').textContent = String(total);
    document.getElementById('av-count-done').textContent = String(completados);
    document.getElementById('av-count-pending').textContent = String(pendientes);

    const listEl = document.getElementById('av-exercises-list');
    const filterBtns = document.querySelectorAll('.av-filter-btn');

    function renderizarEjercicios(filtro = 'todos') {
        const filtrados = rutina.filter(ej => {
            if (filtro === 'completados') return Boolean(ej.completado);
            if (filtro === 'pendientes') return !ej.completado;
            return true;
        });

        if (filtrados.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    No hay ejercicios en esta categoría.
                </div>
            `;
            return;
        }

        listEl.innerHTML = filtrados.map(ej => {
            const hecho = Boolean(ej.completado);
            const tiempo = ej.tiempo || ej.frecuencia || '3 min';
            const reps = ej.repeticiones || 10;

            return `
                <article class="av-ex-row">
                    <div class="av-ex-left">
                        <span class="av-ex-icon ${hecho ? 'is-done' : 'is-pending'}">
                            <i class="fa-solid ${hecho ? 'fa-check' : 'fa-clock'}"></i>
                        </span>
                        <div class="av-ex-body">
                            <h3 class="av-ex-title">${ej.nombre}</h3>
                            <p class="av-ex-meta">${ej.categoria || 'Rehabilitación'} · ${tiempo} · ${reps} rep.</p>
                            <p class="av-ex-desc">${ej.indicacion || 'Realiza el ejercicio con calma y sin forzar el movimiento.'}</p>
                        </div>
                    </div>
                    <span class="av-ex-tag ${hecho ? 'is-done' : 'is-pending'}">
                        ${hecho ? 'Completado' : 'Pendiente'}
                    </span>
                </article>
            `;
        }).join('');
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarEjercicios(btn.dataset.filter);
        });
    });

    renderizarEjercicios('todos');

    // 4. Avance por área
    const areaListEl = document.getElementById('av-area-list');
    if (areaListEl) {
        const grupos = {};
        rutina.forEach(ej => {
            const cat = ej.categoria || 'Rehabilitación';
            if (!grupos[cat]) grupos[cat] = { hechos: 0, total: 0 };
            grupos[cat].total += 1;
            if (ej.completado) grupos[cat].hechos += 1;
        });

        areaListEl.innerHTML = Object.entries(grupos).map(([cat, info]) => {
            const pctArea = info.total > 0 ? Math.round((info.hechos / info.total) * 100) : 0;
            const colorClass = pctArea >= 70 ? '' : pctArea >= 40 ? 'is-amber' : 'is-red';
            return `
                <div class="av-area-item">
                    <div class="av-area-row">
                        <span>${cat}</span>
                        <span>${info.hechos} de ${info.total}</span>
                    </div>
                    <div class="av-area-track">
                        <div class="av-area-fill ${colorClass}" style="width: ${pctArea}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 5. Tarjeta verde destacada dinámica
    const ctaTitle = document.getElementById('av-cta-title');
    const ctaDesc = document.getElementById('av-cta-desc');
    const ctaBtnText = document.getElementById('av-cta-btn-text');

    if (pendientes === 0 && total > 0) {
        ctaTitle.textContent = '¡Rutina completada!';
        ctaDesc.textContent = 'Excelente constancia esta semana. Puedes repasar tus ejercicios cuando gustes.';
        ctaBtnText.textContent = 'Repasar mi rutina';
    } else {
        ctaTitle.textContent = `Te ${pendientes === 1 ? 'falta 1 ejercicio' : `faltan ${pendientes} ejercicios`}`;
        ctaDesc.textContent = 'Retoma tu sesión con calma y completa tu meta de esta semana.';
        ctaBtnText.textContent = 'Continuar mi rutina';
    }

    // 6. Semanas anteriores (últimas 3)
    const histEl = document.getElementById('av-history-list');
    if (histEl) {
        const ultimas = historial.slice(0, 3);
        if (ultimas.length === 0) {
            histEl.innerHTML = `<p class="av-card-sub">Aún no hay sesiones anteriores registradas.</p>`;
        } else {
            histEl.innerHTML = ultimas.map(s => `
                <div class="av-hist-item">
                    <div class="av-hist-info">
                        <p class="av-hist-name">${s.nombre}</p>
                        <p class="av-hist-date">${s.fecha} · ${s.duracion}</p>
                    </div>
                    <span class="av-hist-pct ${s.avance >= 80 ? 'is-green' : 'is-amber'}">${s.avance}%</span>
                </div>
            `).join('');
        }
    }

    // 7. Modal: Cerrar sesión
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