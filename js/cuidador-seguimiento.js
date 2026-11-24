const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';

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

function obtenerMinutosEjercicio(item) {
    const match = String(item.tiempo || item.frecuencia || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
}

function obtenerClaseColor(pct) {
    if (pct >= 70) return 'is-green';
    if (pct >= 40) return 'is-amber';
    return 'is-red';
}

function construirEjerciciosHistorial(histItem, paciente) {
    const esFacial = (paciente.area || '').toLowerCase().includes('facial');
    const banco = esFacial
        ? [
            { nombre: 'Redondeo y estiramiento de labios', categoria: 'Rostro', repeticiones: 10, tiempo: '3 min', indicacion: 'Alternar posición de beso y sonrisa amplia sin forzar.' },
            { nombre: 'Elevación simétrica de cejas', categoria: 'Rostro', repeticiones: 12, tiempo: '3 min', indicacion: 'Elevar ambas cejas frente al espejo sosteniendo 3 segundos.' },
            { nombre: 'Inflado alternado de mejillas', categoria: 'Rostro', repeticiones: 10, tiempo: '3 min', indicacion: 'Retener aire en las mejillas y pasarlo de un lado al otro.' },
            { nombre: 'Cierre ocular suave controlado', categoria: 'Rostro', repeticiones: 10, tiempo: '2 min', indicacion: 'Cerrar ambos párpados despacio sin tensionar el cuello.' },
            { nombre: 'Respiración relajada frente al espejo', categoria: 'Respiración', repeticiones: 8, tiempo: '3 min', indicacion: 'Inhalar por la nariz y soltar el aire relajando el rostro.' }
        ]
        : [
            { nombre: 'Vocalización sostenida (A-E-I-O-U)', categoria: 'Lenguaje', repeticiones: 10, tiempo: '4 min', indicacion: 'Pronunciar cada vocal de forma prolongada y controlada.' },
            { nombre: 'Lectura pausada en voz alta', categoria: 'Lenguaje', repeticiones: 8, tiempo: '3 min', indicacion: 'Leer frases cortas marcando pausas respiratorias.' },
            { nombre: 'Respiración diafragmática guiada', categoria: 'Respiración', repeticiones: 8, tiempo: '4 min', indicacion: 'Inhalar expandiendo el abdomen y exhalar suavemente.' },
            { nombre: 'Movilidad lingual dirigida', categoria: 'Rostro', repeticiones: 10, tiempo: '3 min', indicacion: 'Desplazar la lengua de comisura a comisura con ritmo lento.' },
            { nombre: 'Articulación de sílabas rítmicas', categoria: 'Lenguaje', repeticiones: 12, tiempo: '3 min', indicacion: 'Repetir secuencias pausadas manteniendo claridad vocal.' }
        ];

    const cantidad = Math.max(1, Number(histItem.ejerciciosCount || 3));
    const avance = Number(histItem.avance ?? 100);
    const completadosEsperados = Math.min(cantidad, Math.round((avance / 100) * cantidad));

    const lista = [];
    for (let i = 0; i < cantidad; i++) {
        const base = banco[i % banco.length];
        lista.push({
            ...base,
            completado: i < completadosEsperados,
            indicacion: i === 0 && histItem.notas ? histItem.notas : base.indicacion
        });
    }
    return lista;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteAsociado(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const rutinaActual = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];

    // Referencias del DOM
    const routineNameEl = document.getElementById('cs-routine-name');
    const subtitleEl = document.getElementById('cs-subtitle');
    const statusPill = document.getElementById('cs-status-pill');
    const progressLabelEl = document.querySelector('.cs-progress-label');
    const pctTextEl = document.getElementById('cs-pct-text');
    const fractionTextEl = document.getElementById('cs-fraction-text');
    const minDoneEl = document.getElementById('cs-min-done');
    const minLeftEl = document.getElementById('cs-min-left');
    const barTrack = document.getElementById('cs-bar-track');
    const barFill = document.getElementById('cs-bar-fill');
    const cntAllEl = document.getElementById('cnt-all');
    const cntDoneEl = document.getElementById('cnt-done');
    const pendingFilterBtn = document.querySelector('.cs-filter-btn[data-filter="pendientes"]');
    const timelineEl = document.getElementById('cs-timeline-list');
    const areasEl = document.getElementById('cs-areas-list');
    const sideTagEl = document.querySelector('.cs-side-tag');
    const filterBtns = document.querySelectorAll('.cs-filter-btn');
    const moreWrap = document.getElementById('cs-more-wrap');
    const btnToggleMore = document.getElementById('btn-toggle-more');

    const historyBanner = document.getElementById('cs-history-mode-banner');
    const historyBannerText = document.getElementById('cs-hm-banner-text');
    const btnBackCurrent = document.getElementById('btn-back-current');

    // Estado de la vista activa (actual o histórica)
    const LIMITE_INICIAL = 3;
    let ejerciciosActivos = rutinaActual;
    let filtroActual = 'todos';
    let mostrarTodos = false;
    let esModoHistorial = false;

    function renderizarTimeline() {
        const total = ejerciciosActivos.length;
        let lista = ejerciciosActivos;
        if (filtroActual === 'completados') lista = ejerciciosActivos.filter(ej => Boolean(ej.completado));
        if (filtroActual === 'pendientes') lista = ejerciciosActivos.filter(ej => !ej.completado);

        if (lista.length === 0) {
            timelineEl.innerHTML = `
                <div class="cs-empty-state">
                    ${total === 0
                        ? `El especialista aún no asignó ejercicios para ${paciente.nombre}.`
                        : 'No hay ejercicios en esta categoría.'}
                </div>
            `;
            moreWrap.classList.add('hidden');
            return;
        }

        const visibles = mostrarTodos ? lista : lista.slice(0, LIMITE_INICIAL);

        timelineEl.innerHTML = visibles.map((ej) => {
            const hecho = Boolean(ej.completado);
            const tiempo = ej.tiempo || ej.frecuencia || '3 min';
            const reps = ej.repeticiones ? ` · ${ej.repeticiones} rep.` : '';
            const nota = ej.indicacion || 'Realizar con calma, manteniendo postura cómoda y pausas breves.';

            const claseEstado = hecho ? 'is-done' : (esModoHistorial ? 'is-missed' : 'is-pending');
            const iconoEstado = hecho ? 'fa-check' : (esModoHistorial ? 'fa-xmark' : 'fa-hourglass-half');
            const textoEstado = hecho ? 'Completado' : (esModoHistorial ? 'No realizado' : 'Pendiente');

            return `
                <article class="cs-tl-item ${claseEstado}">
                    <span class="cs-tl-dot" aria-hidden="true">
                        <i class="fa-solid ${iconoEstado}"></i>
                    </span>
                    <div class="cs-tl-body">
                        <div class="cs-tl-top">
                            <h3 class="cs-tl-title">${ej.nombre}</h3>
                            <span class="cs-tl-badge">${textoEstado}</span>
                        </div>
                        <div class="cs-tl-meta">
                            <span>${ej.categoria || 'Rehabilitación'}</span>
                            <span>·</span>
                            <span>${tiempo}${reps}</span>
                        </div>
                        <p class="cs-tl-note">${nota}</p>
                    </div>
                </article>
            `;
        }).join('');

        if (lista.length > LIMITE_INICIAL) {
            moreWrap.classList.remove('hidden');
            const restantes = lista.length - LIMITE_INICIAL;
            btnToggleMore.innerHTML = mostrarTodos
                ? '<i class="fa-solid fa-chevron-up"></i> <span>Mostrar menos ejercicios</span>'
                : `<i class="fa-solid fa-chevron-down"></i> <span>Mostrar más ejercicios (${restantes} más)</span>`;
        } else {
            moreWrap.classList.add('hidden');
        }
    }

    function renderizarAreas(ejercicios) {
        if (ejercicios.length === 0) {
            areasEl.innerHTML = '<p class="cs-side-desc">Sin áreas registradas todavía.</p>';
            return;
        }

        const mapaAreas = {};
        ejercicios.forEach(ej => {
            const cat = ej.categoria || 'General';
            if (!mapaAreas[cat]) mapaAreas[cat] = { total: 0, hechos: 0 };
            mapaAreas[cat].total += 1;
            if (ej.completado) mapaAreas[cat].hechos += 1;
        });

        areasEl.innerHTML = Object.entries(mapaAreas).map(([area, stats]) => {
            const pct = Math.round((stats.hechos / stats.total) * 100);
            const colorClass = obtenerClaseColor(pct);
            return `
                <div class="cs-area-row">
                    <div class="cs-area-head">
                        <span>${area}</span>
                        <span>${stats.hechos} de ${stats.total}</span>
                    </div>
                    <div class="cs-area-bar">
                        <div class="cs-area-fill ${colorClass}" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderizarVista(config) {
        ejerciciosActivos = config.ejercicios;
        esModoHistorial = Boolean(config.esHistorial);
        filtroActual = 'todos';
        mostrarTodos = false;

        if (progressLabelEl) {
            progressLabelEl.textContent = esModoHistorial
                ? 'Avance de la rutina anterior'
                : 'Avance de la rutina vigente';
        }

        filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'todos'));

        const total = ejerciciosActivos.length;
        const completados = ejerciciosActivos.filter(ej => Boolean(ej.completado)).length;
        const pendientes = Math.max(0, total - completados);
        const porcentaje = config.porcentajeForzado !== undefined
            ? config.porcentajeForzado
            : (total > 0 ? Math.round((completados / total) * 100) : 0);

        const minTotal = ejerciciosActivos.reduce((acc, ej) => acc + obtenerMinutosEjercicio(ej), 0);
        const minRealizados = ejerciciosActivos
            .filter(ej => Boolean(ej.completado))
            .reduce((acc, ej) => acc + obtenerMinutosEjercicio(ej), 0);
        const minRestantes = Math.max(0, minTotal - minRealizados);

        routineNameEl.textContent = config.titulo;
        subtitleEl.textContent = config.subtitulo;
        if (sideTagEl) sideTagEl.textContent = config.etiquetaPeriodo;

        if (porcentaje >= 70) {
            statusPill.className = 'cs-status-pill is-green';
            statusPill.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${esModoHistorial ? 'Completada' : 'Buen ritmo'}</span>`;
        } else if (porcentaje >= 40) {
            statusPill.className = 'cs-status-pill is-amber';
            statusPill.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${esModoHistorial ? 'Parcial' : 'En progreso'}</span>`;
        } else {
            statusPill.className = 'cs-status-pill is-red';
            statusPill.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${esModoHistorial ? 'Baja adherencia' : 'Sin iniciar'}</span>`;
        }

        pctTextEl.textContent = `${porcentaje}%`;
        fractionTextEl.textContent = `${completados} de ${total} ejercicios completados`;
        minDoneEl.textContent = `${minRealizados} min hechos`;
        minLeftEl.textContent = `${minRestantes} min restantes`;

        barFill.className = `cs-bar-fill ${obtenerClaseColor(porcentaje)}`;
        barTrack.setAttribute('aria-valuenow', String(porcentaje));
        requestAnimationFrame(() => {
            barFill.style.width = `${porcentaje}%`;
        });

        cntAllEl.textContent = String(total);
        cntDoneEl.textContent = String(completados);
        if (pendingFilterBtn) {
            pendingFilterBtn.innerHTML = `${esModoHistorial ? 'No realizados' : 'Pendientes'} <span id="cnt-pending">${pendientes}</span>`;
        }

        if (esModoHistorial) {
            historyBannerText.textContent = `Estás viendo una rutina anterior (${config.etiquetaPeriodo}).`;
            historyBanner.classList.remove('hidden');
        } else {
            historyBanner.classList.add('hidden');
        }

        renderizarTimeline();
        renderizarAreas(ejerciciosActivos);
    }

    function cargarRutinaActual() {
        renderizarVista({
            titulo: paciente.nombreRutina || 'Rutina terapéutica actual',
            subtitulo: `Paciente: ${paciente.nombre} · Última actividad: ${paciente.ultimaActividad || 'Sin registro reciente'}`,
            etiquetaPeriodo: 'Esta semana',
            ejercicios: rutinaActual,
            esHistorial: false
        });
    }

    btnToggleMore.addEventListener('click', () => {
        mostrarTodos = !mostrarTodos;
        renderizarTimeline();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActual = btn.dataset.filter;
            mostrarTodos = false;
            renderizarTimeline();
        });
    });

    btnBackCurrent.addEventListener('click', () => {
        cargarRutinaActual();
    });

    // Cargar rutina actual al iniciar
    cargarRutinaActual();

    // Modal: Historial de rutinas anteriores
    const historyModal = document.getElementById('history-modal');
    const btnOpenHistory = document.getElementById('btn-open-history');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const hmSubtitle = document.getElementById('hm-subtitle');
    const hmList = document.getElementById('hm-list');

    function obtenerHistorialPaciente(pac) {
        return Array.isArray(pac.historialRutinas) ? pac.historialRutinas : [];
    }

    function renderizarHistorial() {
        const historial = obtenerHistorialPaciente(paciente);
        const thumbFallback = (rutinaActual[0] && (rutinaActual[0].miniatura || rutinaActual[0].imagen)) || '../../img/catalogo.jpg';
        hmSubtitle.textContent = `Semanas previas registradas para ${paciente.nombre}.`;

        hmList.innerHTML = historial.map(item => {
            const titulo = item.nombre || item.titulo || 'Rutina anterior';
            const fecha = item.fecha || item.periodo || 'Sin fecha';
            const avance = Number(item.avance ?? item.porcentaje ?? 0);
            const cantEj = item.ejerciciosCount ?? item.ejercicios ?? 0;
            const duracion = item.duracion || '15 min';
            const miniatura = item.miniatura || thumbFallback;
            const badgeClass = obtenerClaseColor(avance);

            return `
                <article class="hm-item">
                    <div class="hm-thumb-wrap">
                        <img src="${miniatura}" alt="${titulo}" class="hm-thumb">
                    </div>

                    <div class="hm-info">
                        <span class="hm-date">${fecha}</span>
                        <h3 class="hm-item-title">${titulo}</h3>
                        <div class="hm-meta">
                            <span><i class="fa-solid fa-list-check"></i> ${cantEj} ejercicios</span>
                            <span>·</span>
                            <span><i class="fa-regular fa-clock"></i> ${duracion}</span>
                        </div>
                    </div>

                    <div class="hm-right">
                        <span class="hm-pct-badge ${badgeClass}">${avance}%</span>
                        <button type="button" class="btn btn-outline btn-interactive hm-btn-view" data-history-id="${item.id}">
                            <span>Ver esta rutina</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function cerrarModalHistorial() {
        if (historyModal) historyModal.classList.add('hidden');
    }

    if (btnOpenHistory && historyModal && btnCloseHistory) {
        btnOpenHistory.addEventListener('click', () => {
            renderizarHistorial();
            historyModal.classList.remove('hidden');
            btnCloseHistory.focus();
        });

        btnCloseHistory.addEventListener('click', cerrarModalHistorial);
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) cerrarModalHistorial();
        });

        // Al hacer clic en "Ver esta rutina"
        hmList.addEventListener('click', (e) => {
            const btn = e.target.closest('.hm-btn-view');
            if (!btn) return;

            const histId = btn.dataset.historyId;
            const historial = obtenerHistorialPaciente(paciente);
            const item = historial.find(h => h.id === histId);
            if (!item) return;

            const ejerciciosHist = construirEjerciciosHistorial(item, paciente);
            renderizarVista({
                titulo: item.nombre || 'Rutina anterior',
                subtitulo: `Paciente: ${paciente.nombre} · Registrada el ${item.fecha || 'sin fecha'}`,
                etiquetaPeriodo: item.fecha || 'Semana anterior',
                ejercicios: ejerciciosHist,
                porcentajeForzado: Number(item.avance ?? 0),
                esHistorial: true
            });

            cerrarModalHistorial();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

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
        if (e.key === 'Escape') {
            logoutModal.classList.add('hidden');
            cerrarModalHistorial();
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        sessionStorage.removeItem(QERO_SESSION_PATIENT_KEY);
        window.location.href = '../../index.html';
    });
});