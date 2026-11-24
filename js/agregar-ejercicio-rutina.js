const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');
    const esNuevaRutina = params.get('modo') === 'nueva';
    const data = getQeroData();
    const paciente = data.pacientes.find(p => p.id === idBuscado) || data.pacientes[0];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    // 1. Volver a editar-rutina.html del mismo paciente
    document.getElementById('btn-back-er').href = esNuevaRutina
        ? `paciente-detalle.html?id=${paciente.id}`
        : `editar-rutina.html?id=${paciente.id}`;
    document.getElementById('aer-subtitle').textContent = `Paciente: ${paciente.nombre} (${paciente.id})`;

    // 2. Cargar catálogo y detectar ejercicios que el paciente YA tiene asignados
    const rawCatalogo = localStorage.getItem(QERO_CATALOG_KEY);
    const catalogo = rawCatalogo ? JSON.parse(rawCatalogo) : [];

    const idsYaAsignados = esNuevaRutina
        ? new Set()
        : new Set((paciente.rutinaAsignada || []).map(item => item.ejercicioId));

    // Set de seleccionados (garantiza que NO se pueda repetir el mismo ejercicio)
    const seleccionados = new Set();

    let categoriaActiva = 'Todas';
    let textoBusqueda = '';

    const gridEl = document.getElementById('aer-grid');
    const searchInput = document.getElementById('aer-search-input');
    const catPills = document.querySelectorAll('.aer-cat-pill');

    const selectionBar = document.getElementById('aer-selection-bar');
    const selectionBadge = document.getElementById('aer-selection-badge');
    const selectionText = document.getElementById('aer-selection-text');
    const btnConfirmLabel = document.getElementById('btn-confirm-label');
    const btnClear = document.getElementById('btn-clear-selection');
    const btnConfirm = document.getElementById('btn-confirm-selection');

    function actualizarBarraSeleccion() {
        const total = seleccionados.size;
        if (total === 0) {
            selectionBar.classList.add('hidden');
            return;
        }

        selectionBar.classList.remove('hidden');
        selectionBadge.textContent = total;
        selectionText.textContent = total === 1
            ? '1 ejercicio seleccionado'
            : `${total} ejercicios seleccionados`;
        btnConfirmLabel.textContent = total === 1
            ? 'Agregar 1 rutina'
            : `Agregar ${total} rutinas`;
    }

    function renderizarGrid() {
        const filtrados = catalogo.filter(ej => {
            const coincideCat = categoriaActiva === 'Todas' || ej.categoria === categoriaActiva;
            const coincideTexto = ej.nombre.toLowerCase().includes(textoBusqueda.toLowerCase());
            return coincideCat && coincideTexto;
        });

        gridEl.innerHTML = '';

        if (filtrados.length === 0) {
            gridEl.innerHTML = `
                <div class="empty-state">
                    No se encontraron ejercicios con ese filtro.
                </div>
            `;
            return;
        }

        filtrados.forEach(ej => {
            const yaAsignado = idsYaAsignados.has(ej.id);
            const estaSeleccionado = seleccionados.has(ej.id);

            const card = document.createElement('article');
            card.className = 'aer-card';
            if (estaSeleccionado) card.classList.add('is-selected');
            if (yaAsignado) card.classList.add('is-assigned');

            let botonHTML = `
                <button type="button" class="aer-btn-toggle" data-id="${ej.id}">
                    <i class="fa-solid fa-plus"></i> Agregar rutina
                </button>
            `;

            if (yaAsignado) {
                botonHTML = `
                    <button type="button" class="aer-btn-toggle assigned" disabled>
                        <i class="fa-solid fa-check"></i> Ya asignado
                    </button>
                `;
            } else if (estaSeleccionado) {
                botonHTML = `
                    <button type="button" class="aer-btn-toggle selected" data-id="${ej.id}">
                        <i class="fa-solid fa-check"></i> Seleccionado
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="aer-card-thumb">
                    <img src="${ej.imagen || '../../img/catalogo.jpg'}" alt="${ej.nombre}">
                    <span class="aer-card-cat">${ej.categoria}</span>
                </div>
                <div class="aer-card-body">
                    <h3 class="aer-card-title">${ej.nombre}</h3>
                    <p class="aer-card-desc">${ej.descripcion || ''}</p>
                    <div class="aer-card-footer">
                        ${botonHTML}
                    </div>
                </div>
            `;

            gridEl.appendChild(card);
        });

        // Toggle de selección única por ejercicio
        gridEl.querySelectorAll('.aer-btn-toggle:not(.assigned)').forEach(btn => {
            btn.addEventListener('click', () => {
                const idEj = btn.dataset.id;
                if (seleccionados.has(idEj)) {
                    seleccionados.delete(idEj);
                } else {
                    seleccionados.add(idEj);
                }
                renderizarGrid();
                actualizarBarraSeleccion();
            });
        });
    }

    // Filtros
    searchInput.addEventListener('input', (e) => {
        textoBusqueda = e.target.value.trim();
        renderizarGrid();
    });

    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            categoriaActiva = pill.dataset.cat;
            renderizarGrid();
        });
    });

    btnClear.addEventListener('click', () => {
        seleccionados.clear();
        renderizarGrid();
        actualizarBarraSeleccion();
    });

    // Botón final: guarda la selección temporal y queda listo para el siguiente paso que indiques
    btnConfirm.addEventListener('click', () => {
        if (seleccionados.size === 0) return;

        const ejerciciosElegidos = catalogo.filter(ej => seleccionados.has(ej.id));
        sessionStorage.setItem('qero_ejercicios_por_agregar', JSON.stringify(ejerciciosElegidos));
        window.location.href = `configurar-ejercicios.html?id=${paciente.id}${esNuevaRutina ? '&modo=nueva' : ''}`;
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

    renderizarGrid();
    actualizarBarraSeleccion();
});