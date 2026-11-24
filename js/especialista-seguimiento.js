function obtenerClaseColor(pct, esAlerta = false) {
    if (esAlerta) return 'is-red';
    if (pct >= 70) return 'is-green';
    if (pct >= 40) return 'is-amber';
    return 'is-red';
}

function obtenerPuntajeOrden(p) {
    if (p.estado === 'alerta' || p.nivel === 'red') return -1;
    return Number(p.avance ?? 0);
}

function obtenerMinutosEjercicio(item) {
    const match = String(item.tiempo || item.frecuencia || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
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
    const priorityCard = document.getElementById('es-priority-card');
    const priorityListEl = document.getElementById('es-priority-list');
    const topCard = document.getElementById('es-top-card');
    const topListEl = document.getElementById('es-top-list');
    const mainCol = document.querySelector('.es-main-col');
    const sideCol = document.querySelector('.es-side-col');
    const areasCard = document.getElementById('es-areas-card');
    const alertBox = document.querySelector('.es-alert-box');
    const data = getQeroData();
    const pacientes = data.pacientes || [];
    const totalPacientes = pacientes.length;

    // Referencias principales del dashboard
    const kickerEl = document.querySelector('.es-kicker');
    const pageTitleEl = document.querySelector('.es-topbar .page-title');
    const subtitleEl = document.getElementById('es-subtitle');
    const globalPill = document.getElementById('es-global-pill');

    const modeBanner = document.getElementById('es-patient-mode-banner');
    const modeBannerText = document.getElementById('es-mode-banner-text');
    const btnBackGlobal = document.getElementById('btn-back-global');

    const progressLabelEl = document.querySelector('.es-progress-label');
    const avgPctEl = document.getElementById('es-avg-pct');
    const totalPatientsEl = document.getElementById('es-total-patients');
    const chipsRowEl = document.querySelector('.es-chips-row');
    const barTrack = document.getElementById('es-bar-track');
    const barFill = document.getElementById('es-bar-fill');

    const areasEl = document.getElementById('es-areas-list');

    const timelineCard = document.getElementById('es-timeline-card');
    const timelineListEl = document.getElementById('es-timeline-list');
    const filterBtns = document.querySelectorAll('.es-filter-btn');
    const cntAllEl = document.getElementById('es-cnt-all');
    const cntDoneEl = document.getElementById('es-cnt-done');
    const pendingFilterBtn = document.querySelector('.es-filter-btn[data-filter="pendientes"]');
    const moreWrap = document.getElementById('es-more-wrap');
    const btnToggleMore = document.getElementById('btn-toggle-more-ex');

    const alertTitleEl = document.getElementById('es-alert-title');
    const alertDescEl = document.getElementById('es-alert-desc');

    // Estado de timeline individual
    const LIMITE_EJERCICIOS = 3;
    let ejerciciosActivos = [];
    let filtroActual = 'todos';
    let mostrarTodosEj = false;
    let esHistorialActivo = false;

    // ==============================================================
    // 1. VISTA GLOBAL (Toda la cartera del especialista)
    // ==============================================================
    function renderizarVistaGlobal() {
        modeBanner.classList.add('hidden');
        timelineCard.classList.add('hidden');
        if (areasCard && mainCol) {
            mainCol.appendChild(areasCard);
        }

        let sumaAvance = 0;
        let cntGreen = 0;
        let cntAmber = 0;
        let cntRed = 0;

        pacientes.forEach(p => {
            const av = Number(p.avance ?? 0);
            const esAlerta = p.estado === 'alerta' || p.nivel === 'red';
            sumaAvance += av;

            if (esAlerta || av < 40) cntRed += 1;
            else if (av >= 70) cntGreen += 1;
            else cntAmber += 1;
        });

        const promedioGlobal = totalPacientes > 0 ? Math.round(sumaAvance / totalPacientes) : 0;
        const colorGlobal = obtenerClaseColor(promedioGlobal);

        kickerEl.textContent = 'Monitoreo clínico general';
        pageTitleEl.textContent = 'Seguimiento de pacientes';
        subtitleEl.textContent = 'Resumen global de adherencia y avance de toda tu cartera activa.';

        globalPill.className = `es-status-pill ${colorGlobal}`;
        globalPill.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${
            colorGlobal === 'is-green' ? 'Cartera estable' : colorGlobal === 'is-amber' ? 'Seguimiento activo' : 'Atención requerida'
        }</span>`;

        progressLabelEl.textContent = 'Adherencia promedio de la cartera';
        avgPctEl.textContent = `${promedioGlobal}%`;
        avgPctEl.className = colorGlobal;
        totalPatientsEl.textContent = `${totalPacientes} pacientes monitoreados`;

        chipsRowEl.innerHTML = `
            <span class="es-mini-chip is-green"><i class="fa-solid fa-check"></i> ${cntGreen} buen ritmo</span>
            <span class="es-mini-chip is-amber"><i class="fa-solid fa-clock"></i> ${cntAmber} seguimiento</span>
            <span class="es-mini-chip is-red"><i class="fa-solid fa-triangle-exclamation"></i> ${cntRed} en alerta</span>
        `;

        barFill.className = `es-bar-fill ${colorGlobal}`;
        barTrack.setAttribute('aria-valuenow', String(promedioGlobal));
        requestAnimationFrame(() => {
            barFill.style.width = `${promedioGlobal}%`;
        });

        // Desglose por área clínica global
        const mapaAreas = {};
        pacientes.forEach(p => {
            const area = p.area || 'Rehabilitación general';
            if (!mapaAreas[area]) mapaAreas[area] = { count: 0, suma: 0 };
            mapaAreas[area].count += 1;
            mapaAreas[area].suma += Number(p.avance ?? 0);
        });

        areasEl.innerHTML = Object.entries(mapaAreas).map(([area, stats]) => {
            const pct = Math.round(stats.suma / stats.count);
            const colorClass = obtenerClaseColor(pct);
            return `
                <div class="es-area-item">
                    <div class="es-area-top">
                        <span class="es-area-name">${area}</span>
                        <span class="es-area-meta">${pct}% promedio · ${stats.count} pacientes</span>
                    </div>
                    <div class="es-area-bar">
                        <div class="es-area-fill ${colorClass}" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        alertTitleEl.textContent = cntRed === 1 ? '1 paciente en alerta' : `${cntRed} pacientes en alerta`;
        alertDescEl.textContent = cntRed > 0
            ? 'Presentan baja adherencia o varios días sin actividad. Puedes seleccionarlos para revisar su rutina.'
            : 'Todos tus pacientes mantienen actividad reciente esta semana.';
        // Mostrar bloques exclusivos de vista general
        if (priorityCard) priorityCard.classList.remove('hidden');
        if (topCard) topCard.classList.remove('hidden');

        // Top 4 atención prioritaria (alertas y menor avance)
        const prioritarios = [...pacientes]
            .sort((a, b) => obtenerPuntajeOrden(a) - obtenerPuntajeOrden(b))
            .slice(0, 4);

        if (priorityListEl) {
            priorityListEl.innerHTML = prioritarios.map(p => {
                const av = Number(p.avance ?? 0);
                const esAlerta = p.estado === 'alerta' || p.nivel === 'red';
                const cClass = obtenerClaseColor(av, esAlerta);
                return `
                    <div class="es-mini-row">
                        <div class="es-mini-left">
                            <div class="avatar-circle avatar-${p.nivel}">${p.iniciales}</div>
                            <div class="es-mini-info">
                                <p class="es-mini-name">${p.nombre}</p>
                                <p class="es-mini-meta">${p.condicion} · ${p.ultimaActividad}</p>
                            </div>
                        </div>
                        <div class="es-mini-right">
                            <span class="pm-pct-badge ${cClass}">${esAlerta ? 'Alerta' : `${av}%`}</span>
                            <button type="button" class="btn btn-outline btn-interactive es-mini-btn" data-quick-patient="${p.id}">
                                Revisar
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Top 3 mejor adherencia
        const destacados = [...pacientes]
            .sort((a, b) => obtenerPuntajeOrden(b) - obtenerPuntajeOrden(a))
            .slice(0, 3);

        if (topListEl) {
            topListEl.innerHTML = destacados.map(p => {
                const av = Number(p.avance ?? 0);
                const cClass = obtenerClaseColor(av);
                return `
                    <div class="es-mini-row">
                        <div class="es-mini-left">
                            <div class="avatar-circle avatar-${p.nivel}">${p.iniciales}</div>
                            <div class="es-mini-info">
                                <p class="es-mini-name">${p.nombre}</p>
                                <p class="es-mini-meta">${p.area || 'Rehabilitación'}</p>
                            </div>
                        </div>
                        <div class="es-mini-right">
                            <span class="pm-pct-badge ${cClass}">${av}%</span>
                            <button type="button" class="btn btn-outline btn-interactive es-mini-btn" data-quick-patient="${p.id}">
                                Ver
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }


    }

    // ==============================================================
    // 2. VISTA INDIVIDUAL (Paciente + rutina actual o semana anterior)
    // ==============================================================
    function renderizarTimeline() {
        let lista = ejerciciosActivos;
        if (filtroActual === 'completados') lista = ejerciciosActivos.filter(ej => Boolean(ej.completado));
        if (filtroActual === 'pendientes') lista = ejerciciosActivos.filter(ej => !ej.completado);

        if (lista.length === 0) {
            timelineListEl.innerHTML = `<div class="empty-state">No hay ejercicios en esta categoría.</div>`;
            moreWrap.classList.add('hidden');
            return;
        }

        const visibles = mostrarTodosEj ? lista : lista.slice(0, LIMITE_EJERCICIOS);

        timelineListEl.innerHTML = visibles.map(ej => {
            const hecho = Boolean(ej.completado);
            const tiempo = ej.tiempo || ej.frecuencia || '3 min';
            const reps = ej.repeticiones ? ` · ${ej.repeticiones} rep.` : '';
            const nota = ej.indicacion || 'Realizar con calma, manteniendo postura cómoda.';

            const claseEstado = hecho ? 'is-done' : (esHistorialActivo ? 'is-missed' : 'is-pending');
            const iconoEstado = hecho ? 'fa-check' : (esHistorialActivo ? 'fa-xmark' : 'fa-hourglass-half');
            const textoEstado = hecho ? 'Completado' : (esHistorialActivo ? 'No realizado' : 'Pendiente');

            return `
                <article class="es-tl-item ${claseEstado}">
                    <span class="es-tl-dot" aria-hidden="true">
                        <i class="fa-solid ${iconoEstado}"></i>
                    </span>
                    <div class="es-tl-body">
                        <div class="es-tl-top">
                            <h3 class="es-tl-title">${ej.nombre}</h3>
                            <span class="es-tl-badge">${textoEstado}</span>
                        </div>
                        <div class="es-tl-meta">
                            <span>${ej.categoria || 'Rehabilitación'}</span>
                            <span>·</span>
                            <span>${tiempo}${reps}</span>
                        </div>
                        <p class="es-tl-note">${nota}</p>
                    </div>
                </article>
            `;
        }).join('');

        if (lista.length > LIMITE_EJERCICIOS) {
            moreWrap.classList.remove('hidden');
            const restantes = lista.length - LIMITE_EJERCICIOS;
            btnToggleMore.innerHTML = mostrarTodosEj
                ? '<i class="fa-solid fa-chevron-up"></i> <span>Mostrar menos ejercicios</span>'
                : `<i class="fa-solid fa-chevron-down"></i> <span>Mostrar más ejercicios (${restantes} más)</span>`;
        } else {
            moreWrap.classList.add('hidden');
        }
    }

    function renderizarVistaPaciente(paciente, config) {
        if (priorityCard) priorityCard.classList.add('hidden');
        if (topCard) topCard.classList.add('hidden');
        ejerciciosActivos = config.ejercicios;
        esHistorialActivo = Boolean(config.esHistorial);
        filtroActual = 'todos';
        mostrarTodosEj = false;
        if (areasCard && sideCol && alertBox) {
            sideCol.insertBefore(areasCard, alertBox);
        }

        filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'todos'));

        const totalEj = ejerciciosActivos.length;
        const completados = ejerciciosActivos.filter(ej => Boolean(ej.completado)).length;
        const pendientes = Math.max(0, totalEj - completados);
        const porcentaje = config.porcentajeForzado !== undefined
            ? config.porcentajeForzado
            : (totalEj > 0 ? Math.round((completados / totalEj) * 100) : 0);

        const colorClass = obtenerClaseColor(porcentaje);
        const minTotal = ejerciciosActivos.reduce((acc, ej) => acc + obtenerMinutosEjercicio(ej), 0);
        const minHechos = ejerciciosActivos
            .filter(ej => Boolean(ej.completado))
            .reduce((acc, ej) => acc + obtenerMinutosEjercicio(ej), 0);
        const minRestantes = Math.max(0, minTotal - minHechos);

        // Cabecera y banner de regreso
        kickerEl.textContent = `Seguimiento individual · ${paciente.id}`;
        pageTitleEl.textContent = config.titulo;
        subtitleEl.textContent = `Paciente: ${paciente.nombre} (${paciente.condicion}) · ${config.subtitulo}`;

        modeBannerText.textContent = `Viendo ${esHistorialActivo ? 'rutina anterior' : 'rutina actual'} de ${paciente.nombre} (${config.etiquetaPeriodo}).`;
        modeBanner.classList.remove('hidden');

        globalPill.className = `es-status-pill ${colorClass}`;
        globalPill.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${
            porcentaje >= 70
                ? (esHistorialActivo ? 'Completada' : 'Buen ritmo')
                : porcentaje >= 40
                    ? (esHistorialActivo ? 'Parcial' : 'En progreso')
                    : (esHistorialActivo ? 'Baja adherencia' : 'Sin iniciar')
        }</span>`;

        progressLabelEl.textContent = esHistorialActivo ? 'Avance de la rutina anterior' : 'Avance de la rutina vigente';
        avgPctEl.textContent = `${porcentaje}%`;
        avgPctEl.className = colorClass;
        totalPatientsEl.textContent = `${completados} de ${totalEj} ejercicios completados`;

        chipsRowEl.innerHTML = `
            <span class="es-mini-chip is-green"><i class="fa-solid fa-check"></i> ${minHechos} min hechos</span>
            <span class="es-mini-chip is-amber"><i class="fa-regular fa-clock"></i> ${minRestantes} min restantes</span>
        `;

        barFill.className = `es-bar-fill ${colorClass}`;
        barTrack.setAttribute('aria-valuenow', String(porcentaje));
        requestAnimationFrame(() => {
            barFill.style.width = `${porcentaje}%`;
        });

        // Distribución de ejercicios por área de la rutina elegida
        const mapaAreas = {};
        ejerciciosActivos.forEach(ej => {
            const cat = ej.categoria || 'General';
            if (!mapaAreas[cat]) mapaAreas[cat] = { total: 0, hechos: 0 };
            mapaAreas[cat].total += 1;
            if (ej.completado) mapaAreas[cat].hechos += 1;
        });

        areasEl.innerHTML = Object.entries(mapaAreas).map(([area, stats]) => {
            const pct = Math.round((stats.hechos / stats.total) * 100);
            const cClass = obtenerClaseColor(pct);
            return `
                <div class="es-area-item">
                    <div class="es-area-top">
                        <span class="es-area-name">${area}</span>
                        <span class="es-area-meta">${stats.hechos} de ${stats.total} ejercicios (${pct}%)</span>
                    </div>
                    <div class="es-area-bar">
                        <div class="es-area-fill ${cClass}" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Contadores y timeline
        cntAllEl.textContent = String(totalEj);
        cntDoneEl.textContent = String(completados);
        pendingFilterBtn.innerHTML = `${esHistorialActivo ? 'No realizados' : 'Pendientes'} <span id="es-cnt-pending">${pendientes}</span>`;

        timelineCard.classList.remove('hidden');
        renderizarTimeline();

        // Info lateral del cuidador
        alertTitleEl.textContent = `Cuidador: ${paciente.cuidadora || 'No asignado'}`;
        alertDescEl.textContent = `Área: ${paciente.area || 'Rehabilitación'} · Lado afectado: ${paciente.ladoAfectado || 'No especificado'}.`;
    }

    btnToggleMore.addEventListener('click', () => {
        mostrarTodosEj = !mostrarTodosEj;
        renderizarTimeline();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActual = btn.dataset.filter;
            mostrarTodosEj = false;
            renderizarTimeline();
        });
    });

    btnBackGlobal.addEventListener('click', () => {
        renderizarVistaGlobal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.addEventListener('click', (e) => {
        const btnQuick = e.target.closest('[data-quick-patient]');
        if (!btnQuick) return;

        const pac = pacientes.find(p => p.id === btnQuick.dataset.quickPatient);
        if (!pac) return;

        renderizarVistaPaciente(pac, {
            titulo: pac.nombreRutina || 'Rutina terapéutica actual',
            subtitulo: `Última actividad: ${pac.ultimaActividad || 'Sin registro reciente'}`,
            etiquetaPeriodo: 'Esta semana',
            ejercicios: Array.isArray(pac.rutinaAsignada) ? pac.rutinaAsignada : [],
            esHistorial: false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ==============================================================
    // 3. MODAL EN 2 PASOS: 1) Pacientes -> 2) Rutinas del paciente
    // ==============================================================
    const patientsModal = document.getElementById('patients-modal');
    const btnOpenModal = document.getElementById('btn-open-patients-modal');
    const btnCloseModal = document.getElementById('btn-close-patients-modal');
    const btnPmBack = document.getElementById('btn-pm-back');
    const pmKicker = document.getElementById('pm-kicker');
    const pmTitle = document.getElementById('pm-title');
    const pmSubtitle = document.getElementById('pm-subtitle');
    const pmControls = document.querySelector('.pm-controls');

    const searchInput = document.getElementById('pm-search');
    const btnToggleFilters = document.getElementById('btn-toggle-pm-filters');
    const filterPanel = document.getElementById('pm-filter-panel');
    const filterChips = document.querySelectorAll('.pm-chip');
    const pmList = document.getElementById('pm-list');

    let ordenModal = 'desc';
    let pacienteEnModal = null;

    function mostrarPasoPacientes(filtro = '') {
        pacienteEnModal = null;
        btnPmBack.classList.add('hidden');
        pmControls.classList.remove('hidden');

        pmKicker.textContent = 'Cartera de pacientes';
        pmTitle.textContent = 'Seleccionar paciente';
        pmSubtitle.textContent = 'Elige un paciente para revisar su seguimiento y rutinas.';

        const termino = filtro.trim().toLowerCase();
        const filtrados = pacientes.filter(p =>
            p.nombre.toLowerCase().includes(termino) ||
            p.id.toLowerCase().includes(termino) ||
            (p.condicion || '').toLowerCase().includes(termino)
        );

        filtrados.sort((a, b) => {
            if (ordenModal === 'desc') return obtenerPuntajeOrden(b) - obtenerPuntajeOrden(a);
            if (ordenModal === 'asc') return obtenerPuntajeOrden(a) - obtenerPuntajeOrden(b);
            if (ordenModal === 'az') return a.nombre.localeCompare(b.nombre, 'es');
            if (ordenModal === 'za') return b.nombre.localeCompare(a.nombre, 'es');
            return 0;
        });

        if (filtrados.length === 0) {
            pmList.innerHTML = `<div class="empty-state">No se encontraron pacientes con "${filtro}".</div>`;
            return;
        }

        pmList.innerHTML = filtrados.map(p => {
            const av = Number(p.avance ?? 0);
            const esAlerta = p.estado === 'alerta' || p.nivel === 'red';
            const colorClass = obtenerClaseColor(av, esAlerta);
            const badgeText = esAlerta ? 'Alerta' : `${av}%`;

            return `
                <article class="pm-item">
                    <div class="pm-item-left">
                        <div class="avatar-circle avatar-${p.nivel}">${p.iniciales}</div>
                        <div class="pm-item-info">
                            <h3 class="pm-item-name">${p.nombre} <span class="patient-id">${p.id}</span></h3>
                            <p class="pm-item-meta">${p.condicion} · ${p.ultimaActividad}</p>
                        </div>
                    </div>

                    <div class="pm-item-right">
                        <span class="pm-pct-badge ${colorClass}">${badgeText}</span>
                        <button type="button" class="btn btn-outline btn-interactive pm-btn-select" data-patient-id="${p.id}">
                            <span>Ver seguimiento</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function mostrarPasoRutinas(paciente) {
        pacienteEnModal = paciente;
        btnPmBack.classList.remove('hidden');
        pmControls.classList.add('hidden');

        pmKicker.textContent = `Rutinas de ${paciente.id}`;
        pmTitle.textContent = paciente.nombre;
        pmSubtitle.textContent = 'Selecciona la rutina actual o una semana anterior para cargar el panel.';

        const rutinaActual = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
        const totalActual = rutinaActual.length;
        const completadosActual = rutinaActual.filter(ej => Boolean(ej.completado)).length;
        const pctActual = totalActual > 0 ? Math.round((completadosActual / totalActual) * 100) : 0;
        const colorActual = obtenerClaseColor(pctActual);
        const minActual = rutinaActual.reduce((acc, ej) => acc + obtenerMinutosEjercicio(ej), 0);

        const historial = Array.isArray(paciente.historialRutinas) ? paciente.historialRutinas : [];

        // 1. Primera tarjeta: Rutina actual
        const htmlActual = `
            <article class="pm-item is-current-routine">
                <div class="pm-item-info">
                    <span class="pm-current-tag">Rutina actual · Esta semana</span>
                    <h3 class="pm-item-name">${paciente.nombreRutina || 'Rutina terapéutica actual'}</h3>
                    <p class="pm-item-meta">${totalActual} ejercicios · ${minActual} min · ${paciente.ultimaActividad || 'Activa'}</p>
                </div>

                <div class="pm-item-right">
                    <span class="pm-pct-badge ${colorActual}">${pctActual}%</span>
                    <button type="button" class="btn btn-primary btn-interactive pm-btn-select" data-routine-type="actual">
                        <span>Ver rutina actual</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </article>
        `;

        // 2. Resto: Semanas anteriores
        const htmlHistorial = historial.map(item => {
            const av = Number(item.avance ?? 0);
            const cClass = obtenerClaseColor(av);
            return `
                <article class="pm-item">
                    <div class="pm-item-info">
                        <span class="pm-kicker" style="margin-bottom: 2px;">${item.fecha || 'Semana anterior'}</span>
                        <h3 class="pm-item-name">${item.nombre || 'Rutina anterior'}</h3>
                        <p class="pm-item-meta">${item.ejerciciosCount || 3} ejercicios · ${item.duracion || '15 min'}</p>
                    </div>

                    <div class="pm-item-right">
                        <span class="pm-pct-badge ${cClass}">${av}%</span>
                        <button type="button" class="btn btn-outline btn-interactive pm-btn-select" data-routine-type="historial" data-history-id="${item.id}">
                            <span>Ver esta rutina</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        pmList.innerHTML = htmlActual + htmlHistorial;
        pmList.scrollTop = 0;
    }

    function cerrarModalPacientes() {
        patientsModal.classList.add('hidden');
    }

    btnToggleFilters.addEventListener('click', () => {
        const abierto = filterPanel.classList.toggle('hidden') === false;
        btnToggleFilters.classList.toggle('active', abierto);
        btnToggleFilters.setAttribute('aria-expanded', String(abierto));
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            ordenModal = chip.dataset.sort;
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            mostrarPasoPacientes(searchInput.value);
        });
    });

    btnOpenModal.addEventListener('click', () => {
        searchInput.value = '';
        mostrarPasoPacientes('');
        patientsModal.classList.remove('hidden');
        searchInput.focus();
    });

    btnPmBack.addEventListener('click', () => {
        mostrarPasoPacientes(searchInput.value);
    });

    btnCloseModal.addEventListener('click', cerrarModalPacientes);
    patientsModal.addEventListener('click', (e) => {
        if (e.target === patientsModal) cerrarModalPacientes();
    });

    searchInput.addEventListener('input', (e) => {
        mostrarPasoPacientes(e.target.value);
    });

    // Delegación de clics dentro del modal (Paso 1 y Paso 2)
    pmList.addEventListener('click', (e) => {
        const btnPaciente = e.target.closest('[data-patient-id]');
        if (btnPaciente) {
            const pac = pacientes.find(p => p.id === btnPaciente.dataset.patientId);
            if (pac) mostrarPasoRutinas(pac);
            return;
        }

        const btnRutina = e.target.closest('[data-routine-type]');
        if (btnRutina && pacienteEnModal) {
            const tipo = btnRutina.dataset.routineType;

            if (tipo === 'actual') {
                renderizarVistaPaciente(pacienteEnModal, {
                    titulo: pacienteEnModal.nombreRutina || 'Rutina terapéutica actual',
                    subtitulo: `Última actividad: ${pacienteEnModal.ultimaActividad || 'Sin registro reciente'}`,
                    etiquetaPeriodo: 'Esta semana',
                    ejercicios: Array.isArray(pacienteEnModal.rutinaAsignada) ? pacienteEnModal.rutinaAsignada : [],
                    esHistorial: false
                });
            } else {
                const histId = btnRutina.dataset.historyId;
                const historial = Array.isArray(pacienteEnModal.historialRutinas) ? pacienteEnModal.historialRutinas : [];
                const item = historial.find(h => h.id === histId);
                if (!item) return;

                renderizarVistaPaciente(pacienteEnModal, {
                    titulo: item.nombre || 'Rutina anterior',
                    subtitulo: `Registrada el ${item.fecha || 'sin fecha'}`,
                    etiquetaPeriodo: item.fecha || 'Semana anterior',
                    ejercicios: construirEjerciciosHistorial(item, pacienteEnModal),
                    porcentajeForzado: Number(item.avance ?? 0),
                    esHistorial: true
                });
            }

            cerrarModalPacientes();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Cargar vista global al iniciar
    renderizarVistaGlobal();

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
        if (e.key === 'Escape') {
            logoutModal.classList.add('hidden');
            cerrarModalPacientes();
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        window.location.href = '../../index.html';
    });
});