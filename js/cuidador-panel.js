const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';

function obtenerPacienteAsociado(data) {
    const pacientes = data.pacientes || [];
    if (pacientes.length === 0) return null;

    const idGuardado = sessionStorage.getItem(QERO_SESSION_PATIENT_KEY);
    let paciente = pacientes.find(p => p.id === idGuardado);

    if (!paciente) {
        const indiceAleatorio = Math.floor(Math.random() * pacientes.length);
        paciente = pacientes[indiceAleatorio];
        sessionStorage.setItem(QERO_SESSION_PATIENT_KEY, paciente.id);
    }
    return paciente;
}

function obtenerIniciales(nombre) {
    return String(nombre || 'QH')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join('');
}

function calcularMinutosRutina(rutina) {
    return rutina.reduce((acc, item) => {
        const match = String(item.tiempo || item.frecuencia || '').match(/\d+/);
        return acc + (match ? parseInt(match[0], 10) : 3);
    }, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteAsociado(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const nombreCuidador = paciente.cuidadora || paciente.cuidador || 'Lucía González';
    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    const total = rutina.length;
    const completados = rutina.filter(ej => Boolean(ej.completado)).length;
    const pendientes = Math.max(0, total - completados);
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
    const minutosTotales = calcularMinutosRutina(rutina);

    // 1. Bienvenida y datos del paciente asociado
    document.getElementById('cp-welcome-title').textContent = `Hola, ${nombreCuidador.split(' ')[0]}`;
    document.getElementById('cp-welcome-sub').textContent =
        `Resumen semanal y apoyo en casa para ${paciente.nombre}.`;

    document.getElementById('cp-patient-avatar').textContent = obtenerIniciales(paciente.nombre);
    document.getElementById('cp-patient-name').textContent = paciente.nombre;
    document.getElementById('cp-patient-meta').textContent =
        `${paciente.condicion || 'Rehabilitación'} · Última actividad: ${paciente.ultimaActividad || 'Sin registro reciente'}`;
    document.getElementById('cp-routine-name').textContent =
        paciente.nombreRutina || 'Rutina terapéutica actual';

    const badge = document.getElementById('cp-status-badge');
    if (porcentaje >= 70) {
        badge.className = 'cp-status-badge is-green';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> <span>Buen ritmo</span>';
    } else if (paciente.nivel === 'red' && porcentaje === 0) {
        badge.className = 'cp-status-badge is-red';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> <span>Sin iniciar</span>';
    } else {
        badge.className = 'cp-status-badge is-amber';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> <span>En progreso</span>';
    }

    // 2. Anillo de progreso
    const ring = document.getElementById('cp-progress-ring');
    if (ring) {
        ring.style.setProperty('--pct', '0');
        ring.setAttribute('aria-valuenow', String(porcentaje));
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                ring.style.setProperty('--pct', String(porcentaje));
                document.getElementById('cp-pct-value').textContent = `${porcentaje}%`;
            });
        });
    }

    // 3. Métricas
    document.getElementById('cp-completed-count').textContent = String(completados);
    document.getElementById('cp-pending-count').textContent = String(pendientes);
    document.getElementById('cp-total-time').textContent = `${minutosTotales} min`;

    // 4. Siguiente ejercicio pendiente del paciente
    const nextBox = document.getElementById('cp-next-box');
    const nextBadge = document.getElementById('cp-next-badge');
    const pendiente = rutina.find(ej => !ej.completado);

    if (total === 0) {
        nextBadge.textContent = 'Sin rutina';
        nextBox.innerHTML = `
            <h3 class="cp-next-title">Sin actividades asignadas</h3>
            <p class="cp-next-indication">El especialista aún no ha asignado una rutina activa para este paciente.</p>
        `;
    } else if (!pendiente) {
        nextBadge.textContent = 'Completada';
        nextBadge.classList.add('is-done');
        nextBox.innerHTML = `
            <h3 class="cp-next-title">¡Rutina semanal completada!</h3>
            <span class="cp-next-meta">${total} de ${total} ejercicios finalizados</span>
            <p class="cp-next-indication">${paciente.nombre} completó todas las actividades de esta semana. Puedes revisar el historial en Seguimiento.</p>
        `;
    } else {
        const idx = rutina.indexOf(pendiente);
        const tiempo = pendiente.tiempo || pendiente.frecuencia || '3 min';
        const reps = pendiente.repeticiones || 10;

        nextBadge.textContent = `Actividad ${idx + 1} de ${total}`;
        nextBox.innerHTML = `
            <h3 class="cp-next-title">${pendiente.nombre}</h3>
            <span class="cp-next-meta">${pendiente.categoria || 'Rehabilitación'} · ${tiempo} · ${reps} repeticiones</span>
            <p class="cp-next-indication">${pendiente.indicacion || 'Acompaña con calma y permite descansos breves si nota fatiga.'}</p>
        `;
    }


    // 4.5 Actividad reciente de la rutina actual
    const recentList = document.getElementById('cp-recent-list');
    const recentCount = document.getElementById('cp-recent-count');

    if (recentCount) {
        recentCount.textContent = `${completados} de ${total} realizados`;
    }

    if (recentList) {
        if (total === 0) {
            recentList.innerHTML = `
                <div class="cp-recent-empty">
                    Aún no hay ejercicios registrados en la rutina actual.
                </div>
            `;
        } else {
            // Priorizamos mostrar los completados arriba, máximo 4 filas
            const ordenados = [...rutina]
                .sort((a, b) => Number(Boolean(b.completado)) - Number(Boolean(a.completado)))
                .slice(0, 4);

            recentList.innerHTML = ordenados.map(ej => {
                const hecho = Boolean(ej.completado);
                const tiempo = ej.tiempo || ej.frecuencia || '3 min';
                return `
                    <div class="cp-recent-item">
                        <div class="cp-recent-left">
                            <span class="cp-recent-icon ${hecho ? 'is-done' : 'is-pending'}">
                                <i class="fa-solid ${hecho ? 'fa-check' : 'fa-clock'}"></i>
                            </span>
                            <div class="cp-recent-info">
                                <h3 class="cp-recent-title">${ej.nombre}</h3>
                                <p class="cp-recent-meta">${ej.categoria || 'Rehabilitación'} · ${tiempo}</p>
                            </div>
                        </div>
                        <span class="cp-recent-tag ${hecho ? 'is-done' : 'is-pending'}">
                            ${hecho ? 'Hecho' : 'Pendiente'}
                        </span>
                    </div>
                `;
            }).join('');
        }
    }

    // 4.8 Datos del especialista a cargo
    const specNameEl = document.getElementById('cp-specialist-name');
    const specAvatarEl = document.getElementById('cp-specialist-avatar');
    const especialista = data.especialista || {};

    if (specNameEl) {
        specNameEl.textContent = especialista.nombre || 'Lic. Elena Vargas';
    }
    if (specAvatarEl) {
        specAvatarEl.textContent = especialista.iniciales || obtenerIniciales(especialista.nombre || 'EV');
    }

    // 4.9 Adelanto de Videos guía de apoyo en casa (con miniaturas reales)
    const guidesPreviewEl = document.getElementById('cp-guides-preview');
    if (guidesPreviewEl) {
        const videosDestacados = [
            {
                categoria: 'Acompañamiento diario',
                titulo: 'Cómo preparar un entorno tranquilo antes de la sesión',
                miniatura: '../../img/logo-cuidador.jpeg'
            },
            {
                categoria: 'Apoyo en los ejercicios',
                titulo: 'Cómo asistir sin forzar los movimientos faciales',
                miniatura: '../../img/logo-cuidador.jpeg'
            },
            {
                categoria: 'Bienestar del cuidador',
                titulo: 'Qué observaciones anotar para el especialista',
                miniatura: '../../img/logo-cuidador.jpeg'
            }
        ];

        guidesPreviewEl.innerHTML = videosDestacados.map(video => `
            <a href="guias.html" class="cp-video-item">
                <div class="cp-video-thumb">
                    <img src="${video.miniatura}" alt="${video.titulo}">
                    <span class="cp-video-play" aria-hidden="true">
                        <i class="fa-solid fa-play"></i>
                    </span>
                </div>
                <div class="cp-video-info">
                    <span class="cp-video-cat">${video.categoria}</span>
                    <p class="cp-video-title">${video.titulo}</p>
                </div>
            </a>
        `).join('');
    }
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
        window.location.href = '../../index.html';
    });
});