document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    const data = getQeroData();
    const pacienteIndex = data.pacientes.findIndex(p => p.id === idBuscado);
    const idxFinal = pacienteIndex !== -1 ? pacienteIndex : 0;
    const paciente = data.pacientes[idxFinal];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    // 1. Enlaces de navegación con el ID del paciente
    document.getElementById('btn-back-vr').href = `ver-rutina.html?id=${paciente.id}`;
    document.getElementById('btn-agregar-ejercicio').href = `agregar-ejercicio-rutina.html?id=${paciente.id}`;
    document.getElementById('btn-vista-previa').href = `vista-previa-rutina.html?id=${paciente.id}`;

    // 2. Precargar nombre de rutina editable y paciente bloqueado
    const numPaciente = parseInt(paciente.id.replace(/\D/g, ''), 10) || 1;
    const semana = (numPaciente % 4) + 1;
    const areaTexto = String(paciente.area || '').toLowerCase();
    let nombrePorDefecto = `Rutina de lenguaje y rostro · Semana ${semana}`;
    if (areaTexto.includes('facial') && !areaTexto.includes('lenguaje')) {
        nombrePorDefecto = `Rutina facial · Semana ${semana}`;
    } else if (areaTexto.includes('habla')) {
        nombrePorDefecto = `Rutina de habla y articulación · Semana ${semana}`;
    }

    const inputNombreRutina = document.getElementById('er-routine-name');
    const inputPaciente = document.getElementById('er-patient-locked');

    inputNombreRutina.value = paciente.nombreRutina || nombrePorDefecto;
    inputPaciente.value = `${paciente.nombre} (${paciente.id})`;
    document.title = `Editar rutina de ${paciente.nombre} — QeroHealth`;

    // 3. Cargar rutina actual + ejercicios recién configurados (Pendientes)
    let rutinaEditada = Array.isArray(paciente.rutinaAsignada)
        ? paciente.rutinaAsignada.map(item => ({ ...item }))
        : [];

    const keyPendientes = `qero_ejercicios_pendientes_${paciente.id}`;
    const pendientes = JSON.parse(sessionStorage.getItem(keyPendientes) || '[]');
    if (pendientes.length > 0) {
        pendientes.forEach(nuevo => {
            const yaExiste = rutinaEditada.some(e => e.ejercicioId === nuevo.ejercicioId);
            if (!yaExiste) rutinaEditada.push(nuevo);
        });
    }

    const listaEl = document.getElementById('er-exercises-list');
    const countSub = document.getElementById('er-count-sub');

    // Referencias para alternar entre Modo Editar y Modo Ordenar (Pág. 21)
    const pageTitle = document.getElementById('er-page-title');
    const pageSubtitle = document.getElementById('er-page-subtitle');
    const btnAgregar = document.getElementById('btn-agregar-ejercicio');
    const actionsBar = document.getElementById('er-actions-bar');
    const actionsSecondary = document.getElementById('er-actions-secondary');
    const btnRevisar = document.getElementById('btn-revisar');
    const btnGuardar = document.getElementById('btn-guardar-rutina');
    const btnConfirmarOrden = document.getElementById('btn-confirmar-orden');
    const orderHint = document.getElementById('er-order-hint');
    const orderSavedMsg = document.getElementById('er-order-saved-msg');

    let modoOrdenar = false;
    let dragOrigenIdx = null;
    let orderMsgTimer = null;

    // Referencias del modal de eliminar ejercicio (Pág. 22)
    const deleteModal = document.getElementById('delete-exercise-modal');
    const deleteDesc = document.getElementById('delete-exercise-desc');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    let indiceAEliminar = null;

    function moverEjercicio(desdeIdx, haciaIdx) {
        if (haciaIdx < 0 || haciaIdx >= rutinaEditada.length) return;
        const [movido] = rutinaEditada.splice(desdeIdx, 1);
        rutinaEditada.splice(haciaIdx, 0, movido);
        renderizarEjercicios();
    }

    function activarModoOrdenar(activo) {
        modoOrdenar = activo;

        if (activo) {
            pageTitle.textContent = 'Ordenar rutina';
            pageSubtitle.textContent = 'Arrastra los ejercicios o usa las flechas para definir el orden.';
            btnAgregar.classList.add('hidden');
            orderSavedMsg.classList.add('hidden');
            orderHint.classList.remove('hidden');
            actionsSecondary.classList.add('hidden');
            btnGuardar.classList.add('hidden');
            btnConfirmarOrden.classList.remove('hidden');
            actionsBar.classList.add('mode-order');
        } else {
            pageTitle.textContent = 'Editar rutina';
            pageSubtitle.textContent = 'Ajusta el nombre y los ejercicios asignados a este paciente.';
            btnAgregar.classList.remove('hidden');
            orderHint.classList.add('hidden');
            actionsSecondary.classList.remove('hidden');
            btnGuardar.classList.remove('hidden');
            btnConfirmarOrden.classList.add('hidden');
            actionsBar.classList.remove('mode-order');
        }

        renderizarEjercicios();
    }

    btnRevisar.addEventListener('click', () => activarModoOrdenar(true));

    btnConfirmarOrden.addEventListener('click', () => {
        activarModoOrdenar(false);
        orderSavedMsg.classList.remove('hidden');
        clearTimeout(orderMsgTimer);
        orderMsgTimer = setTimeout(() => {
            orderSavedMsg.classList.add('hidden');
        }, 3500);
    });

    function renderizarEjercicios() {
        countSub.textContent = rutinaEditada.length === 1
            ? '1 ejercicio en la rutina'
            : `${rutinaEditada.length} ejercicios en la rutina`;

        listaEl.innerHTML = '';

        if (rutinaEditada.length === 0) {
            listaEl.innerHTML = `
                <div class="empty-state">
                    No quedan ejercicios en esta rutina. Usa el botón <strong>Agregar</strong> para incluir ejercicios.
                </div>
            `;
            return;
        }

        rutinaEditada.forEach((item, idx) => {
            const card = document.createElement('article');
            card.className = modoOrdenar ? 'er-exercise-card is-draggable' : 'er-exercise-card';
            card.dataset.index = idx;

            if (modoOrdenar) {
                card.draggable = true;
                card.innerHTML = `
                    <div class="er-exercise-left">
                        <span class="er-drag-handle" title="Arrastrar para reordenar">
                            <i class="fa-solid fa-grip-vertical"></i>
                        </span>
                        <span class="er-order-num">${idx + 1}</span>
                        <div class="er-exercise-info">
                            <h3>${item.nombre}</h3>
                            <div class="er-exercise-meta">
                                <span class="er-cat-tag">${item.categoria}</span>
                                <span><i class="fa-solid fa-repeat"></i> ${item.repeticiones} rep.</span>
                                <span><i class="fa-regular fa-calendar"></i> ${item.frecuencia}</span>
                            </div>
                        </div>
                    </div>
                    <div class="er-move-controls">
                        <button type="button" class="er-move-btn btn-move-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="Subir ejercicio" title="Subir">
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button type="button" class="er-move-btn btn-move-down" data-index="${idx}" ${idx === rutinaEditada.length - 1 ? 'disabled' : ''} aria-label="Bajar ejercicio" title="Bajar">
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                    </div>
                `;

                // Eventos Drag & Drop
                card.addEventListener('dragstart', () => {
                    dragOrigenIdx = idx;
                    card.classList.add('dragging');
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    listaEl.querySelectorAll('.er-exercise-card').forEach(c => c.classList.remove('drag-over'));
                });
                card.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (dragOrigenIdx !== idx) card.classList.add('drag-over');
                });
                card.addEventListener('dragleave', () => {
                    card.classList.remove('drag-over');
                });
                card.addEventListener('drop', (e) => {
                    e.preventDefault();
                    card.classList.remove('drag-over');
                    if (dragOrigenIdx !== null && dragOrigenIdx !== idx) {
                        moverEjercicio(dragOrigenIdx, idx);
                    }
                    dragOrigenIdx = null;
                });
            } else {
                card.innerHTML = `
                    <div class="er-exercise-left">
                        <span class="er-order-num">${idx + 1}</span>
                        <div class="er-exercise-info">
                            <h3>${item.nombre}</h3>
                            <div class="er-exercise-meta">
                                <span class="er-cat-tag">${item.categoria}</span>
                                <span><i class="fa-solid fa-repeat"></i> ${item.repeticiones} rep.</span>
                                <span><i class="fa-regular fa-calendar"></i> ${item.frecuencia}</span>
                            </div>
                        </div>
                    </div>
                    <div class="er-exercise-right">
                        <button type="button" class="er-trash-btn" data-index="${idx}" aria-label="Eliminar ${item.nombre}" title="Eliminar ejercicio">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        ${item.pendiente
                            ? `<span class="er-pending-pill"><i class="fa-regular fa-clock"></i> Pendiente</span>`
                            : `<span class="er-assigned-pill"><i class="fa-solid fa-check"></i> Asignado</span>`
                        }
                    </div>
                `;
            }

            listaEl.appendChild(card);
        });

        if (modoOrdenar) {
            listaEl.querySelectorAll('.btn-move-up').forEach(btn => {
                btn.addEventListener('click', () => {
                    const i = Number(btn.dataset.index);
                    moverEjercicio(i, i - 1);
                });
            });
            listaEl.querySelectorAll('.btn-move-down').forEach(btn => {
                btn.addEventListener('click', () => {
                    const i = Number(btn.dataset.index);
                    moverEjercicio(i, i + 1);
                });
            });
        } else {
            // Conectar botones de tachito al modal de confirmación (Pág. 22)
            listaEl.querySelectorAll('.er-trash-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    indiceAEliminar = Number(btn.dataset.index);
                    const ej = rutinaEditada[indiceAEliminar];
                    deleteDesc.textContent = `¿Seguro que deseas quitar "${ej.nombre}" de la rutina de ${paciente.nombre}?`;
                    deleteModal.classList.remove('hidden');
                    btnCancelDelete.focus();
                });
            });
        }
    }

    btnCancelDelete.addEventListener('click', () => {
        indiceAEliminar = null;
        deleteModal.classList.add('hidden');
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            indiceAEliminar = null;
            deleteModal.classList.add('hidden');
        }
    });

    btnConfirmDelete.addEventListener('click', () => {
        if (indiceAEliminar !== null) {
            const eliminado = rutinaEditada.splice(indiceAEliminar, 1)[0];
            // Si era un pendiente, también lo sacamos de sessionStorage para que no reaparezca
            if (eliminado && eliminado.pendiente) {
                const actualesPend = JSON.parse(sessionStorage.getItem(keyPendientes) || '[]');
                const filtrados = actualesPend.filter(p => p.ejercicioId !== eliminado.ejercicioId);
                sessionStorage.setItem(keyPendientes, JSON.stringify(filtrados));
            }
            indiceAEliminar = null;
            renderizarEjercicios();
        }
        deleteModal.classList.add('hidden');
    });

    // 4. Guardar y asignar rutina (pasa todos los pendientes a Asignado)
    document.getElementById('btn-guardar-rutina').addEventListener('click', () => {
        const nuevoNombre = inputNombreRutina.value.trim();
        if (!nuevoNombre) {
            inputNombreRutina.focus();
            return;
        }

        paciente.nombreRutina = nuevoNombre;
        paciente.rutinaAsignada = rutinaEditada.map(({ pendiente, ...limpio }) => limpio);
        saveQeroData(data);
        sessionStorage.removeItem(keyPendientes);

        window.location.href = `ver-rutina.html?id=${paciente.id}`;
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
        if (e.key === 'Escape') {
            logoutModal.classList.add('hidden');
            deleteModal.classList.add('hidden');
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        window.location.href = '../../index.html';
    });

    renderizarEjercicios();
});