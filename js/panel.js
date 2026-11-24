document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const pacientes = data.pacientes || [];

    // 0. Fecha actual en el banner
    const dateEl = document.getElementById('panel-date');
    if (dateEl) {
        const hoy = new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        dateEl.textContent = hoy;
    }

    // 1. Calcular KPIs dinámicamente
    const totalActivos = pacientes.length;
    const sumaAvance = pacientes.reduce((acc, p) => acc + (p.avance || 0), 0);
    const continuidadPromedio = totalActivos > 0 ? Math.round(sumaAvance / totalActivos) : 0;

    const alDia = pacientes.filter(p => p.estado === 'activo').length;
    const enAlerta = pacientes.filter(p => p.estado === 'alerta').length;
    const enSeguimiento = Math.max(0, totalActivos - alDia - enAlerta);
    const pendientesRevision = totalActivos - alDia;

    document.getElementById('kpi-activos').textContent = totalActivos;
    document.getElementById('kpi-continuidad').textContent = `${continuidadPromedio}%`;
    document.getElementById('kpi-pendientes').textContent = pendientesRevision;

    const kpiBar = document.getElementById('kpi-continuidad-bar');
    if (kpiBar) kpiBar.style.width = `${continuidadPromedio}%`;

    // 1b. Barras de distribución clínica
    const pct = (n) => (totalActivos > 0 ? Math.round((n / totalActivos) * 100) : 0);
    document.getElementById('dist-total-badge').textContent = `${totalActivos} total`;
    document.getElementById('dist-activo-count').textContent = alDia;
    document.getElementById('dist-seg-count').textContent = enSeguimiento;
    document.getElementById('dist-alerta-count').textContent = enAlerta;

    document.getElementById('dist-activo-bar').style.width = `${pct(alDia)}%`;
    document.getElementById('dist-seg-bar').style.width = `${pct(enSeguimiento)}%`;
    document.getElementById('dist-alerta-bar').style.width = `${pct(enAlerta)}%`;

    // 2. Mensaje de Atención requerida
    const alertMessage = document.getElementById('alert-message');
    if (enAlerta > 0) {
        alertMessage.textContent = enAlerta === 1
            ? '1 paciente no registra sesión desde hace 5 días o más.'
            : `${enAlerta} pacientes no registran sesión desde hace 5 días o más.`;
    } else {
        alertMessage.textContent = 'Todos tus pacientes registran actividad reciente.';
    }

    // 3. Mostrar los 5 primeros pacientes y enlazar el resto a paciente.html (A - Z)
    const LIMITE_INICIAL = 4;
    const listContainer = document.getElementById('recent-activity-list');
    const moreLink = document.getElementById('btn-more-patients') || document.getElementById('btn-toggle-patients');

    listContainer.innerHTML = '';

    pacientes.slice(0, LIMITE_INICIAL).forEach(paciente => {
        const link = document.createElement('a');
        link.href = `paciente-detalle.html?id=${paciente.id}`;
        link.className = 'patient-row';

        link.innerHTML = `
            <div class="patient-row-left">
                <div class="avatar-circle avatar-${paciente.nivel}">${paciente.iniciales}</div>
                <div>
                    <p class="patient-name">${paciente.nombre} <span class="patient-id">${paciente.id}</span></p>
                    <p class="patient-meta">${paciente.ultimaActividad}</p>
                </div>
            </div>
            <div class="patient-row-right">
                <span class="status-pill pill-${paciente.nivel}">${paciente.etiqueta}</span>
                <i class="fa-solid fa-chevron-right patient-row-chevron"></i>
            </div>
        `;

        listContainer.appendChild(link);
    });

    if (moreLink && pacientes.length > LIMITE_INICIAL) {
        const restantes = pacientes.length - LIMITE_INICIAL;
        moreLink.textContent = `Ver más (${restantes} pacientes más)`;
        moreLink.classList.remove('hidden');
    }

    // 3b. Adelanto de Seguimiento por área
    const trackingEl = document.getElementById('panel-tracking-preview');
    if (trackingEl) {
        const gruposArea = {};
        pacientes.forEach(p => {
            const area = p.area || 'Rehabilitación general';
            if (!gruposArea[area]) {
                gruposArea[area] = { suma: 0, total: 0 };
            }
            gruposArea[area].suma += Number(p.avance || 0);
            gruposArea[area].total += 1;
        });

        const areasLista = Object.entries(gruposArea).slice(0, 3);
        trackingEl.innerHTML = areasLista.map(([area, info]) => {
            const promedio = info.total > 0 ? Math.round(info.suma / info.total) : 0;
            const colorBarra = promedio >= 70 ? 'fill-green' : promedio >= 40 ? 'fill-amber' : 'fill-red';
            const pacTexto = info.total === 1 ? '1 paciente' : `${info.total} pacientes`;

            return `
                <div class="pm-area-item">
                    <div class="pm-area-top">
                        <span class="pm-area-name">${area}</span>
                        <span class="pm-area-meta">${promedio}% · ${pacTexto}</span>
                    </div>
                    <div class="pm-area-track">
                        <div class="pm-area-fill ${colorBarra}" style="width: ${promedio}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3c. Adelanto de Catálogo de ejercicios (con miniatura real)
    const routinesEl = document.getElementById('panel-routines-preview');
    if (routinesEl) {
        const imgDefault = '../../img/catalogo.jpg';
        let destacados = [];

        try {
            const rawCat = localStorage.getItem('qerohealth_catalogo_v3');
            if (rawCat) {
                const catalogo = JSON.parse(rawCat);
                if (Array.isArray(catalogo) && catalogo.length > 0) {
                    const porCat = ['Lenguaje', 'Rostro', 'Respiración']
                        .map(cat => catalogo.find(e => e.categoria === cat))
                        .filter(Boolean);
                    destacados = porCat.length >= 3 ? porCat : catalogo.slice(0, 3);
                }
            }
        } catch (err) {
            destacados = [];
        }

        if (destacados.length === 0 && typeof BANCO_EJERCICIOS !== 'undefined') {
            destacados = [
                BANCO_EJERCICIOS.lenguaje[0],
                BANCO_EJERCICIOS.facial[0],
                BANCO_EJERCICIOS.lenguaje[2]
            ].filter(Boolean).map(ej => ({
                id: ej.ejercicioId,
                nombre: ej.nombre,
                categoria: ej.categoria,
                duracion: `${ej.tiempo} · ${ej.repeticiones} rep.`,
                imagen: imgDefault
            }));
        }

        routinesEl.innerHTML = destacados.map(ej => `
            <a href="rutina.html?id=${ej.id || 'EJ-01'}" class="pm-ex-item">
                <div class="pm-ex-left">
                    <div class="pm-ex-thumb">
                        <img src="${ej.imagen || imgDefault}" alt="${ej.nombre}" onerror="this.parentElement.classList.add('no-img')">
                        <span class="pm-ex-thumb-fallback" aria-hidden="true">
                            <i class="fa-solid fa-dumbbell"></i>
                        </span>
                    </div>
                    <div class="pm-ex-info">
                        <p class="pm-ex-name">${ej.nombre}</p>
                        <p class="pm-ex-meta">${ej.duracion || `${ej.tiempo || '3 min'} · ${ej.repeticiones || 10} rep.`}</p>
                    </div>
                </div>
                <span class="pm-ex-tag">${ej.categoria}</span>
            </a>
        `).join('');
    }

    // 4. Modal de cerrar sesión
    const logoutModal = document.getElementById('logout-modal');
    const btnOpenLogout = document.getElementById('btn-open-logout');
    const btnCancelLogout = document.getElementById('btn-cancel-logout');
    const btnConfirmLogout = document.getElementById('btn-confirm-logout');

    if (btnOpenLogout && logoutModal) {
        btnOpenLogout.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
            btnCancelLogout.focus();
        });

        btnCancelLogout.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });

        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) logoutModal.classList.add('hidden');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !logoutModal.classList.contains('hidden')) {
                logoutModal.classList.add('hidden');
            }
        });

        btnConfirmLogout.addEventListener('click', () => {
            localStorage.removeItem('qero_logged_in');
            window.location.href = '../../index.html';
        });
    }
});