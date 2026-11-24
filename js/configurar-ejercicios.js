document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');
    const esNuevaRutina = params.get('modo') === 'nueva';
    const sufijoModo = esNuevaRutina ? '&modo=nueva' : '';

    const data = getQeroData();
    const paciente = data.pacientes.find(p => p.id === idBuscado) || data.pacientes[0];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    const rawSeleccion = sessionStorage.getItem('qero_ejercicios_por_agregar');
    const ejerciciosElegidos = rawSeleccion ? JSON.parse(rawSeleccion) : [];

    // Si entra sin ejercicios seleccionados, vuelve a la pantalla anterior conservando el modo
    if (ejerciciosElegidos.length === 0) {
        window.location.href = `agregar-ejercicio-rutina.html?id=${paciente.id}${sufijoModo}`;
        return;
    }

    document.getElementById('btn-back-aer').href = `agregar-ejercicio-rutina.html?id=${paciente.id}${sufijoModo}`;
    document.getElementById('ce-subtitle').textContent = `Paciente: ${paciente.nombre} (${paciente.id})`;

    // Estado de configuración por cada ejercicio (arrancan vacíos y obligatorios)
    const configs = ejerciciosElegidos.map(ej => ({
        ejercicioId: ej.id,
        nombre: ej.nombre,
        categoria: ej.categoria,
        descripcion: ej.descripcion || '',
        imagen: ej.imagen || '../../img/catalogo.jpg',
        tiempo: '',
        repeticiones: '',
        indicacion: '',
        completado: false
    }));

    let pasoActual = 0;

    const stepperEl = document.getElementById('ce-stepper');
    const counterEl = document.getElementById('ce-step-counter');
    const imgEl = document.getElementById('ce-ex-img');
    const catEl = document.getElementById('ce-ex-cat');
    const nameEl = document.getElementById('ce-ex-name');
    const descEl = document.getElementById('ce-ex-desc');

    const formEl = document.getElementById('ce-form');
    const inputTime = document.getElementById('ce-time');
    const inputReps = document.getElementById('ce-reps');
    const inputNotes = document.getElementById('ce-notes');

    const btnPrev = document.getElementById('btn-prev-step');
    const btnNextLabel = document.getElementById('btn-next-label');
    const btnNextIcon = document.getElementById('btn-next-icon');
    const errorMsgEl = document.getElementById('ce-error-msg');

    [inputTime, inputReps, inputNotes].forEach(el => {
        el.addEventListener('input', () => errorMsgEl.classList.add('hidden'));
    });

    function esEjercicioCompleto(cfg) {
        return Number(cfg.tiempo) >= 1 && Number(cfg.repeticiones) >= 1 && String(cfg.indicacion).trim().length > 0;
    }

    function guardarBorradorActual() {
        const t = parseInt(inputTime.value, 10);
        const r = parseInt(inputReps.value, 10);
        configs[pasoActual].tiempo = isNaN(t) ? '' : t;
        configs[pasoActual].repeticiones = isNaN(r) ? '' : r;
        configs[pasoActual].indicacion = inputNotes.value.trim();
        configs[pasoActual].completado = esEjercicioCompleto(configs[pasoActual]);
    }

    function renderizarStepper() {
        stepperEl.innerHTML = '';
        configs.forEach((cfg, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ce-step-pill';
            if (idx === pasoActual) btn.classList.add('active');
            else if (cfg.completado) btn.classList.add('completed');

            const iconoNum = cfg.completado && idx !== pasoActual
                ? '<i class="fa-solid fa-check"></i>'
                : `${idx + 1}`;

            btn.innerHTML = `
                <span class="ce-step-num">${iconoNum}</span>
                <span>Ejercicio ${idx + 1}</span>
            `;

            btn.addEventListener('click', () => {
                guardarBorradorActual();
                errorMsgEl.classList.add('hidden');
                pasoActual = idx;
                renderizarPaso();
            });

            stepperEl.appendChild(btn);
        });
    }

    function renderizarPaso() {
        const cfg = configs[pasoActual];
        const esUltimo = pasoActual === configs.length - 1;

        counterEl.textContent = `Ejercicio ${pasoActual + 1} de ${configs.length}`;
        imgEl.src = cfg.imagen;
        imgEl.alt = cfg.nombre;
        catEl.textContent = cfg.categoria;
        nameEl.textContent = cfg.nombre;
        descEl.textContent = cfg.descripcion || 'Ejercicio terapéutico del catálogo clínico.';

        inputTime.value = cfg.tiempo;
        inputReps.value = cfg.repeticiones;
        inputNotes.value = cfg.indicacion;

        if (pasoActual === 0) {
            btnPrev.classList.add('hidden');
        } else {
            btnPrev.classList.remove('hidden');
        }

        if (esUltimo) {
            btnNextLabel.textContent = esNuevaRutina ? 'Continuar y nombrar' : 'Guardar ejercicios';
            btnNextIcon.className = esNuevaRutina ? 'fa-solid fa-arrow-right' : 'fa-solid fa-check';
        } else {
            btnNextLabel.textContent = 'Siguiente';
            btnNextIcon.className = 'fa-solid fa-arrow-right';
        }

        renderizarStepper();
    }

    btnPrev.addEventListener('click', () => {
        guardarBorradorActual();
        errorMsgEl.classList.add('hidden');
        if (pasoActual > 0) {
            pasoActual--;
            renderizarPaso();
        }
    });

    formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarBorradorActual();

        const esUltimo = pasoActual === configs.length - 1;

        if (!esUltimo) {
            if (!esEjercicioCompleto(configs[pasoActual])) {
                errorMsgEl.classList.remove('hidden');
                return;
            }
            configs[pasoActual].completado = true;
            errorMsgEl.classList.add('hidden');
            pasoActual++;
            renderizarPaso();
            return;
        }

        // Verifica que TODOS los ejercicios estén completos
        const incompletoIdx = configs.findIndex(cfg => !esEjercicioCompleto(cfg));
        if (incompletoIdx !== -1) {
            errorMsgEl.classList.remove('hidden');
            return;
        }

        errorMsgEl.classList.add('hidden');

        // Si viene de "Nueva rutina", pasa a nombrar-rutina.html
        if (esNuevaRutina) {
            const ejerciciosNuevaRutina = configs.map(cfg => ({
                ejercicioId: cfg.ejercicioId,
                nombre: cfg.nombre,
                categoria: cfg.categoria,
                repeticiones: cfg.repeticiones,
                frecuencia: `${cfg.tiempo} min · Diario`,
                tiempo: `${cfg.tiempo} min`,
                indicacion: cfg.indicacion
            }));

            sessionStorage.setItem(`qero_nueva_rutina_config_${paciente.id}`, JSON.stringify(ejerciciosNuevaRutina));
            window.location.href = `nombrar-rutina.html?id=${paciente.id}`;
            return;
        }

        // Flujo normal: guardar como PENDIENTES para editar-rutina.html
        const nuevosPendientes = configs.map(cfg => ({
            ejercicioId: cfg.ejercicioId,
            nombre: cfg.nombre,
            categoria: cfg.categoria,
            repeticiones: cfg.repeticiones,
            frecuencia: `${cfg.tiempo} min · Diario`,
            tiempo: `${cfg.tiempo} min`,
            indicacion: cfg.indicacion,
            pendiente: true
        }));

        const keyPendientes = `qero_ejercicios_pendientes_${paciente.id}`;
        const existentes = JSON.parse(sessionStorage.getItem(keyPendientes) || '[]');
        sessionStorage.setItem(keyPendientes, JSON.stringify([...existentes, ...nuevosPendientes]));
        sessionStorage.removeItem('qero_ejercicios_por_agregar');

        window.location.href = `editar-rutina.html?id=${paciente.id}`;
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

    renderizarPaso();
});