const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

const CATALOGO_RESPALDO = [
    { id: 'EJ-01', nombre: 'Vocalización sostenida (A-E-I-O-U)', categoria: 'Lenguaje' },
    { id: 'EJ-02', nombre: 'Articulación de sílabas pa-ta-ka', categoria: 'Lenguaje' },
    { id: 'EJ-03', nombre: 'Lectura pausada en voz alta', categoria: 'Lenguaje' },
    { id: 'EJ-04', nombre: 'Movilidad lingual direccional', categoria: 'Lenguaje' },
    { id: 'EJ-05', nombre: 'Redondeo y estiramiento de labios', categoria: 'Rostro' },
    { id: 'EJ-06', nombre: 'Elevación simétrica de cejas', categoria: 'Rostro' },
    { id: 'EJ-07', nombre: 'Inflado alternado de mejillas', categoria: 'Rostro' },
    { id: 'EJ-08', nombre: 'Cierre ocular suave y sostenido', categoria: 'Rostro' },
    { id: 'EJ-09', nombre: 'Respiración diafragmática guiada', categoria: 'Respiración' },
    { id: 'EJ-10', nombre: 'Soplo controlado con labios fruncidos', categoria: 'Respiración' },
    { id: 'EJ-11', nombre: 'Coordinación fono-respiratoria', categoria: 'Respiración' },
    { id: 'EJ-12', nombre: 'Exhalación prolongada con sonido /s/', categoria: 'Respiración' }
];

function obtenerCatalogoDisponible() {
    const raw = localStorage.getItem(QERO_CATALOG_KEY);
    if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return CATALOGO_RESPALDO;
}

// Genera una rutina predeterminada distinta para cada paciente según su ID
function generarRutinaPredeterminada(paciente, catalogo) {
    const num = parseInt(paciente.id.replace(/\D/g, ''), 10) || 1;
    const frecuencias = ['Diaria', 'Lunes a viernes', '3 veces por semana'];
    const repsOpciones = [8, 10, 12, 15];
    const cantidad = 3 + (num % 2); // 3 o 4 ejercicios por paciente

    const seleccion = [];
    for (let i = 0; i < cantidad; i++) {
        const idx = (num * 2 + i * 3) % catalogo.length;
        const ej = catalogo[idx];
        if (!seleccion.some(s => s.ejercicioId === ej.id)) {
            seleccion.push({
                ejercicioId: ej.id,
                nombre: ej.nombre,
                categoria: ej.categoria,
                repeticiones: repsOpciones[(num + i) % repsOpciones.length],
                frecuencia: frecuencias[(num + i) % frecuencias.length]
            });
        }
    }
    return seleccion;
}

// Helper para sacar las iniciales (ej. "Marta González" -> "MG")
function obtenerIniciales(nombre) {
    const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'QH';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    const data = getQeroData();
    const index = data.pacientes.findIndex(p => p.id === idBuscado);
    const pacienteIndex = index !== -1 ? index : 0;

    if (!data.pacientes[pacienteIndex]) {
        window.location.href = 'paciente.html';
        return;
    }

    const catalogo = obtenerCatalogoDisponible();
    const paciente = data.pacientes[pacienteIndex];

    // Inicializar rutina única si el paciente aún no tiene una
    if (!Array.isArray(paciente.rutinaAsignada) || paciente.rutinaAsignada.length === 0) {
        paciente.rutinaAsignada = generarRutinaPredeterminada(paciente, catalogo);
        saveQeroData(data);
    }

    // 1. Leer datos REALES del paciente desde data.js
    const adherenciaReal = Number(paciente.avance ?? 0);
    const ultimaSesionReal = paciente.ultimaActividad || 'Sin registro';
    const estadoCrudo = String(paciente.estado || '').toLowerCase();

    // Determinar estado visual real según tu regla
    let claseEstado = 'status-active';
    let textoEstado = 'Seguimiento activo';
    let claseBarra = '';

    if (estadoCrudo === 'alerta' || paciente.nivel === 'red') {
        claseEstado = 'status-alert';
        textoEstado = 'En alerta';
        claseBarra = 'fill-alert';
    } else if (adherenciaReal <= 60) {
        claseEstado = 'status-warning';
        textoEstado = 'En seguimiento';
        claseBarra = 'fill-warning';
    } else {
        claseEstado = 'status-active';
        textoEstado = 'Seguimiento activo';
        claseBarra = '';
    }

    // Pintar cabecera e información clínica
    document.title = `${paciente.nombre} — QeroHealth`;
    document.getElementById('patient-name').textContent = paciente.nombre;

    const avatar = document.getElementById('patient-avatar');
    avatar.textContent = paciente.iniciales || obtenerIniciales(paciente.nombre);
    avatar.className = `patient-avatar ${claseEstado}`;

    const badge = document.getElementById('patient-status-badge');
    badge.className = `status-pill ${claseEstado}`;
    badge.innerHTML = `<i class="fa-solid fa-circle"></i> ${textoEstado}`;

    document.getElementById('info-id').textContent = paciente.id;
    document.getElementById('info-condition').textContent = paciente.condicion || '—';
    document.getElementById('info-last-session').textContent = ultimaSesionReal;
    document.getElementById('info-status-text').textContent = textoEstado;

    // 2. Botones preparados para conectar a sus páginas futuras
    document.getElementById('btn-historial').href = `historial.html?id=${paciente.id}`;
    document.getElementById('btn-nueva-rutina').href = `agregar-ejercicio-rutina.html?id=${paciente.id}&modo=nueva`;
    // document.getElementById('btn-editar-paciente').href = `editar-paciente.html?id=${paciente.id}`;
    document.getElementById('btn-ver-rutina').href = `ver-rutina.html?id=${paciente.id}`;

    // 3. Pintar tarjeta resumen de Rutina Actual (Pág. 16)
    const rutina = paciente.rutinaAsignada || [];
    const numPaciente = parseInt(paciente.id.replace(/\D/g, ''), 10) || 1;
    const semana = (numPaciente % 4) + 1; // Semana 1 a 4 según el paciente

    const areaTexto = String(paciente.area || '').toLowerCase();
    let tipoRutina = 'Rutina de lenguaje y rostro';
    if (areaTexto.includes('facial') && !areaTexto.includes('lenguaje')) {
        tipoRutina = 'Rutina facial';
    } else if (areaTexto.includes('habla')) {
        tipoRutina = 'Rutina de habla y articulación';
    }

    const totalTexto = rutina.length === 1 ? '1 ejercicio' : `${rutina.length} ejercicios`;

    document.getElementById('routine-title').textContent =
    paciente.nombreRutina || `${tipoRutina} · Semana ${semana}`;
    document.getElementById('routine-meta-sub').textContent = `${totalTexto} asignados · ${paciente.ultimaActividad || 'Plan vigente'}`;
    document.getElementById('routine-count-pill').textContent = totalTexto;

    document.getElementById('routine-progress-pct').textContent = `${adherenciaReal}%`;
    const routineBar = document.getElementById('routine-progress-bar');
    routineBar.style.width = `${adherenciaReal}%`;
    routineBar.className = `routine-progress-fill ${claseBarra}`.trim();

    document.getElementById('btn-ver-rutina').href = `ver-rutina.html?id=${paciente.id}`;


    // 3.5. Pintar las últimas 2 rutinas anteriores del historial
    const historial = Array.isArray(paciente.historialRutinas) ? paciente.historialRutinas : [];
    const ultimasDos = historial.slice(0, 2);

    const recentTotalEl = document.getElementById('recent-routines-total');
    const recentSubEl = document.getElementById('recent-routines-sub');
    const recentListEl = document.getElementById('recent-routines-list');

    if (recentTotalEl) {
        recentTotalEl.textContent = `${historial.length} en historial`;
    }

    if (recentListEl) {
        if (ultimasDos.length === 0) {
            if (recentSubEl) recentSubEl.textContent = 'Sin sesiones anteriores';
            recentListEl.innerHTML = `
                <p class="clinical-note-text">Este paciente aún no tiene rutinas anteriores registradas.</p>
            `;
        } else {
            if (recentSubEl) {
                recentSubEl.textContent = `Mostrando las últimas ${ultimasDos.length} de ${historial.length} sesiones`;
            }

            recentListEl.innerHTML = ultimasDos.map(item => {
                const esParcial = String(item.estado || '').toLowerCase() === 'parcial';
                const badgeClass = esParcial ? 'recent-status-partial' : 'recent-status-done';
                const ejTexto = item.ejerciciosCount === 1 ? '1 ejercicio' : `${item.ejerciciosCount} ejercicios`;

                return `
                    <div class="recent-routine-item">
                        <div class="recent-item-info">
                            <span class="recent-item-title">${item.nombre}</span>
                            <div class="recent-item-meta">
                                <span><i class="fa-regular fa-calendar"></i>${item.fecha}</span>
                                <span><i class="fa-regular fa-clock"></i>${item.duracion}</span>
                                <span><i class="fa-solid fa-dumbbell"></i>${ejTexto}</span>
                            </div>
                        </div>
                        <div class="recent-item-right">
                            <span class="recent-item-pct">${item.avance}%</span>
                            <span class="recent-status-badge ${badgeClass}">${item.estado}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }




    // 4. Botón volver atrás (recuerda si vino de panel.html o paciente.html, sin bucle con rutina.html)
    if (document.referrer.includes('panel.html')) {
        sessionStorage.setItem('qero_origen_paciente', 'panel.html');
    } else if (document.referrer.includes('paciente.html')) {
        sessionStorage.setItem('qero_origen_paciente', 'paciente.html');
    }

    document.getElementById('btn-back').addEventListener('click', () => {
        const origen = sessionStorage.getItem('qero_origen_paciente') || 'paciente.html';
        window.location.href = origen;
    });

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
        window.location.href = '../../index.html';
    });
});