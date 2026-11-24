const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

function generarCatalogoInicial() {
    const imgDefault = '../../img/catalogo.jpg';
    const videoDefault = 'https://www.youtube.com/watch?v=XdXqE0HZkLc';

    return [
        // LENGUAJE (4)
        {
            id: 'EJ-01',
            nombre: 'Vocalización sostenida (A-E-I-O-U)',
            categoria: 'Lenguaje',
            duracion: '4 min · 10 rep.',
            descripcion: 'Pronunciar cada vocal de forma prolongada manteniendo la apertura bucal controlada.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-02',
            nombre: 'Articulación de sílabas pa-ta-ka',
            categoria: 'Lenguaje',
            duracion: '3 min · 12 rep.',
            descripcion: 'Repetir secuencias rítmicas de sílabas para fortalecer precisión y velocidad del habla.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-03',
            nombre: 'Lectura pausada en voz alta',
            categoria: 'Lenguaje',
            duracion: '5 min · 3 párrafos',
            descripcion: 'Leer frases cortas marcando pausas respiratorias y entonación clara.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-04',
            nombre: 'Movilidad lingual direccional',
            categoria: 'Lenguaje',
            duracion: '3 min · 10 rep.',
            descripcion: 'Desplazar la lengua hacia las comisuras y el paladar con movimientos lentos y firmes.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },

        // ROSTRO (4)
        {
            id: 'EJ-05',
            nombre: 'Redondeo y estiramiento de labios',
            categoria: 'Rostro',
            duracion: '3 min · 10 rep.',
            descripcion: 'Alternar posición de beso y sonrisa amplia sin forzar el lado afectado.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-06',
            nombre: 'Elevación simétrica de cejas',
            categoria: 'Rostro',
            duracion: '2 min · 12 rep.',
            descripcion: 'Elevar ambas cejas frente al espejo sosteniendo 3 segundos y relajar suavemente.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-07',
            nombre: 'Inflado alternado de mejillas',
            categoria: 'Rostro',
            duracion: '3 min · 10 rep.',
            descripcion: 'Retener aire en las mejillas y pasarlo lentamente de un lado al otro sin soltarlo.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-08',
            nombre: 'Cierre ocular suave y sostenido',
            categoria: 'Rostro',
            duracion: '2 min · 10 rep.',
            descripcion: 'Cerrar ambos párpados de forma controlada sin apretar en exceso la zona ocular.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },

        // RESPIRACIÓN (4)
        {
            id: 'EJ-09',
            nombre: 'Respiración diafragmática guiada',
            categoria: 'Respiración',
            duracion: '4 min · 8 ciclos',
            descripcion: 'Inhalar lento por la nariz expandiendo el abdomen y exhalar suavemente por la boca.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-10',
            nombre: 'Soplo controlado con labios fruncidos',
            categoria: 'Respiración',
            duracion: '3 min · 10 rep.',
            descripcion: 'Exhalar un hilo de aire constante durante 5 segundos para regular el flujo espiratorio.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-11',
            nombre: 'Coordinación fono-respiratoria',
            categoria: 'Respiración',
            duracion: '4 min · 8 rep.',
            descripcion: 'Tomar aire nasal y contar en voz alta del 1 al 10 en una sola exhalación estable.',
            imagen: imgDefault,
            videoUrl: videoDefault
        },
        {
            id: 'EJ-12',
            nombre: 'Exhalación prolongada con sonido /s/',
            categoria: 'Respiración',
            duracion: '3 min · 8 rep.',
            descripcion: 'Emitir un sonido suave y continuo de "sss" controlando la salida del aire.',
            imagen: imgDefault,
            videoUrl: videoDefault
        }
    ];
}

function getCatalogoData() {
    const iniciales = generarCatalogoInicial(); // Siempre lee tus cambios del código
    const raw = localStorage.getItem(QERO_CATALOG_KEY);
    if (!raw) {
        saveCatalogoData(iniciales);
        return iniciales;
    }

    const guardados = JSON.parse(raw);
    const idsBase = new Set(iniciales.map(e => e.id));
    const nuevos = guardados.filter(e => !idsBase.has(e.id));

    const combinados = [...nuevos, ...iniciales];
    saveCatalogoData(combinados);
    return combinados;
}

function saveCatalogoData(lista) {
    localStorage.setItem(QERO_CATALOG_KEY, JSON.stringify(lista));
}

document.addEventListener('DOMContentLoaded', () => {
    let ejercicios = getCatalogoData();
    let categoriaActual = 'Todos';
    let textoBusqueda = '';

    const searchInput = document.getElementById('search-exercise');
    const chips = document.querySelectorAll('.catalog-chip');
    const grid = document.getElementById('catalog-grid');
    const countTitle = document.getElementById('exercises-count');

    function renderizarCatalogo() {
        const termino = textoBusqueda.trim().toLowerCase();

        const filtrados = ejercicios.filter(ej => {
            const coincideCategoria = categoriaActual === 'Todos' || ej.categoria === categoriaActual;
            const coincideTexto =
                ej.nombre.toLowerCase().includes(termino) ||
                ej.descripcion.toLowerCase().includes(termino) ||
                ej.categoria.toLowerCase().includes(termino);
            return coincideCategoria && coincideTexto;
        });

        countTitle.textContent = filtrados.length === 1
            ? '1 ejercicio'
            : `${filtrados.length} ejercicios`;

        grid.innerHTML = '';

        if (filtrados.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    No se encontraron ejercicios con los filtros actuales.
                </div>
            `;
            return;
        }

        filtrados.forEach(ej => {
            const card = document.createElement('a');
            card.href = `rutina.html?id=${ej.id}`;
            card.className = 'exercise-card';

            card.innerHTML = `
                <div class="exercise-thumb">
                    <img src="${ej.imagen}" alt="${ej.nombre}" onerror="this.parentElement.classList.add('no-img')">
                    <div class="exercise-thumb-fallback">
                        <i class="fa-solid fa-dumbbell"></i>
                        <span>${ej.categoria}</span>
                    </div>
                    <span class="exercise-badge">${ej.categoria}</span>
                </div>
                <div class="exercise-body">
                    <h3 class="exercise-title">${ej.nombre}</h3>
                    <p class="exercise-desc">${ej.descripcion}</p>
                    <div class="exercise-footer" style="justify-content: flex-end;">
                        <span class="exercise-footer-link">Ver detalle <i class="fa-solid fa-chevron-right"></i></span>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    // Buscador y filtros
    searchInput.addEventListener('input', (e) => {
        textoBusqueda = e.target.value;
        renderizarCatalogo();
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoriaActual = chip.dataset.category;
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderizarCatalogo();
        });
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
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        window.location.href = '../../index.html';
    });

    renderizarCatalogo();
});