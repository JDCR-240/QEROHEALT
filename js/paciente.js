function obtenerPuntajeOrden(p) {
    if (p.estado === 'alerta' || p.nivel === 'red') {
        return -1; // Alerta siempre va antes que 0%
    }
    return Number(p.avance ?? 0); // 0 a 100
}

document.addEventListener('DOMContentLoaded', () => {
    let data = getQeroData();
    let ordenActual = 'desc'; // Por defecto: 100% a Alerta
    let textoBusqueda = '';

    const searchInput = document.getElementById('search-patient');
    const chips = document.querySelectorAll('.filter-chip');
    const listContainer = document.getElementById('patients-list');
    const countTitle = document.getElementById('patients-count');

    const moreWrap = document.getElementById('patients-more-wrap');
    const btnToggleMore = document.getElementById('btn-toggle-more-patients');
    const LIMITE_PACIENTES = 7;
    let mostrarTodos = false;

    // Leer filtro u orden inicial desde la URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('filtro') === 'alertas') {
        ordenActual = 'asc';
        chips.forEach(c => c.classList.toggle('active', c.dataset.sort === 'asc'));
    } else if (params.get('orden') === 'az') {
        ordenActual = 'az';
        chips.forEach(c => c.classList.toggle('active', c.dataset.sort === 'az'));
    }

    function renderizarLista() {
        const termino = textoBusqueda.trim().toLowerCase();

        // 1. Filtrar por nombre o ID
        let filtrados = data.pacientes.filter(p =>
            p.nombre.toLowerCase().includes(termino) ||
            p.id.toLowerCase().includes(termino)
        );

        // 2. Ordenar según el chip activo
        filtrados.sort((a, b) => {
            if (ordenActual === 'desc') return obtenerPuntajeOrden(b) - obtenerPuntajeOrden(a);
            if (ordenActual === 'asc') return obtenerPuntajeOrden(a) - obtenerPuntajeOrden(b);
            if (ordenActual === 'az') return a.nombre.localeCompare(b.nombre, 'es');
            if (ordenActual === 'za') return b.nombre.localeCompare(a.nombre, 'es');
            return 0;
        });

        // 3. Actualizar contador
        countTitle.textContent = filtrados.length === 1
            ? '1 paciente'
            : `${filtrados.length} pacientes`;

        // 4. Pintar tarjetas (7 iniciales o todas con scroll interno)
        listContainer.innerHTML = '';

        if (filtrados.length === 0) {
            listContainer.classList.remove('is-expanded');
            moreWrap.classList.add('hidden');
            listContainer.innerHTML = `
                <div class="empty-state">
                    No se encontraron pacientes con "${textoBusqueda}".
                </div>
            `;
            return;
        }

        const visibles = mostrarTodos ? filtrados : filtrados.slice(0, LIMITE_PACIENTES);
        listContainer.classList.toggle('is-expanded', mostrarTodos && filtrados.length > LIMITE_PACIENTES);

        visibles.forEach(paciente => {
            const link = document.createElement('a');
            link.href = `paciente-detalle.html?id=${paciente.id}`;
            link.className = 'patient-row';

            const badgeTexto = paciente.estado === 'alerta' ? 'Alerta' : paciente.etiqueta;

            link.innerHTML = `
                <div class="patient-row-left">
                    <div class="avatar-circle avatar-${paciente.nivel}">${paciente.iniciales}</div>
                    <div>
                        <p class="patient-name">${paciente.nombre} <span class="patient-id">${paciente.id}</span></p>
                        <p class="patient-meta">${paciente.condicion} · ${paciente.ultimaActividad}</p>
                    </div>
                </div>
                <span class="status-pill pill-${paciente.nivel}">${badgeTexto}</span>
            `;

            listContainer.appendChild(link);
        });

        // Mostrar u ocultar botón "Mostrar más pacientes"
        if (filtrados.length > LIMITE_PACIENTES) {
            moreWrap.classList.remove('hidden');
            const restantes = filtrados.length - LIMITE_PACIENTES;
            btnToggleMore.innerHTML = mostrarTodos
                ? '<i class="fa-solid fa-chevron-up"></i> <span>Mostrar menos pacientes</span>'
                : `<i class="fa-solid fa-chevron-down"></i> <span>Mostrar más pacientes (${restantes} más)</span>`;
        } else {
            moreWrap.classList.add('hidden');
        }
    }

    // Eventos de búsqueda y filtros
    searchInput.addEventListener('input', (e) => {
        textoBusqueda = e.target.value;
        mostrarTodos = false;
        renderizarLista();
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            ordenActual = chip.dataset.sort;
            mostrarTodos = false;
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderizarLista();
        });
    });

    btnToggleMore.addEventListener('click', () => {
        mostrarTodos = !mostrarTodos;
        renderizarLista();
        if (!mostrarTodos) {
            listContainer.scrollTop = 0;
        }
    });

    // Modal: Agregar paciente
    const addModal = document.getElementById('add-patient-modal');
    const btnOpenAdd = document.getElementById('btn-open-add');
    const btnCancelAdd = document.getElementById('btn-cancel-add');
    const addForm = document.getElementById('add-patient-form');

    const conditionSelect = document.getElementById('new-condition');
    const otherConditionField = document.getElementById('other-condition-field');
    const otherConditionInput = document.getElementById('new-condition-other');

    function resetOtherCondition() {
        otherConditionField.classList.add('hidden');
        otherConditionInput.required = false;
        otherConditionInput.value = '';
    }

    conditionSelect.addEventListener('change', () => {
        if (conditionSelect.value === 'Otro') {
            otherConditionField.classList.remove('hidden');
            otherConditionInput.required = true;
            otherConditionInput.focus();
        } else {
            resetOtherCondition();
        }
    });

    btnOpenAdd.addEventListener('click', () => {
        addModal.classList.remove('hidden');
        document.getElementById('new-name').focus();
    });

    btnCancelAdd.addEventListener('click', () => {
        addModal.classList.add('hidden');
        addForm.reset();
        resetOtherCondition();
    });

    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) {
            addModal.classList.add('hidden');
        }
    });

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('new-name').value.trim();
        const edad = parseInt(document.getElementById('new-age').value, 10);
        const condicion = conditionSelect.value === 'Otro'
            ? otherConditionInput.value.trim()
            : conditionSelect.value;
        const cuidadora = document.getElementById('new-caregiver').value.trim();

        const partes = nombre.split(' ').filter(Boolean);
        const iniciales = partes.length >= 2
            ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
            : nombre.slice(0, 2).toUpperCase();

        const nuevoPaciente = {
            id: `QH-${1001 + data.pacientes.length}`,
            iniciales,
            nombre,
            edad,
            condicion,
            area: condicion === 'Parálisis facial' ? 'Movilidad facial' : 'Lenguaje / rostro',
            ladoAfectado: 'Derecho',
            cuidadora,
            estado: 'seguimiento',
            ultimaActividad: 'Recién registrado',
            avance: 50,
            etiqueta: '50%',
            nivel: 'amber'
        };

        data.pacientes.unshift(nuevoPaciente);
        saveQeroData(data);
        addForm.reset();
        resetOtherCondition();
        addModal.classList.add('hidden');
        renderizarLista();
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

    btnCancelLogout.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) logoutModal.classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            logoutModal.classList.add('hidden');
            addModal.classList.add('hidden');
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        window.location.href = '../../index.html';
    });

    renderizarLista();
});