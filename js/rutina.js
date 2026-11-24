const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

// Cambia aquí el enlace de YouTube (sirve para los 12 ejercicios) + Ctrl + S
const DEFAULT_YOUTUBE_ID = 'https://www.youtube.com/watch?v=XdXqE0HZkLc';

function extraerYoutubeId(input) {
    if (!input) return 'M7lc1UVf-VE';
    const texto = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(texto)) return texto;
    const match = texto.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : 'M7lc1UVf-VE';
}

function obtenerExtrasPorDefecto(ejercicio) {
    const bancoPasos = [
        { titulo: 'Paso 1', imagen: '../../img/paso.webp', detalle: 'Posición inicial con espalda recta y hombros relajados.' },
        { titulo: 'Paso 2', imagen: '../../img/paso.webp', detalle: 'Inhalar suavemente por la nariz antes de iniciar el movimiento.' },
        { titulo: 'Paso 3', imagen: '../../img/paso.webp', detalle: 'Ejecutar el gesto de forma controlada frente al espejo.' },
        { titulo: 'Paso 4', imagen: '../../img/paso.webp', detalle: 'Sostener la postura durante 3 a 5 segundos sin tensión.' },
        { titulo: 'Paso 5', imagen: '../../img/paso.webp', detalle: 'Relajar lentamente y descansar antes de la siguiente repetición.' },
        { titulo: 'Paso 6', imagen: '../../img/paso.webp', detalle: 'Verificar simetría facial y repetir el ciclo completo.' }
    ];

    // Cantidad variada según el número del ejercicio (entre 2 y 6 pasos)
    const numEj = parseInt(ejercicio.id.replace(/\D/g, ''), 10) || 1;
    const cantidades = [3, 5, 2, 6, 4, 3, 5, 2, 4, 6, 3, 5];
    const total = cantidades[(numEj - 1) % cantidades.length];
    const pasosBase = bancoPasos.slice(0, total);

    const guiasPorCategoria = {
        'Lenguaje': [
            'Ubicar al paciente sentado con la espalda recta y frente a un espejo o a la cámara.',
            'Realizar una inhalación nasal breve antes de emitir cada sonido o sílaba.',
            'Pronunciar lentamente manteniendo la articulación clara sin forzar la garganta.',
            'Hacer pausas de 15 segundos entre cada bloque de repeticiones.'
        ],
        'Rostro': [
            'Relajar la musculatura facial durante 10 segundos antes de iniciar.',
            'Ejecutar el movimiento de forma simétrica y controlada frente al espejo.',
            'Sostener la postura indicada entre 3 y 5 segundos evitando compensar con el cuello.',
            'Soltar suavemente y descansar si se percibe fatiga en el lado afectado.'
        ],
        'Respiración': [
            'Colocar una mano sobre el abdomen y otra sobre el pecho para sentir el ritmo.',
            'Inhalar suavemente por la nariz contando hasta 3 sin elevar los hombros.',
            'Exhalar de forma controlada por la boca siguiendo la indicación del ejercicio.',
            'Detener de inmediato si el paciente manifiesta mareo o falta de aire.'
        ]
    };

    const esCustom = Boolean(ejercicio.esCustom);

    return {
        youtubeId: esCustom && ejercicio.youtubeId ? ejercicio.youtubeId : DEFAULT_YOUTUBE_ID,
        pasosImagenes: esCustom && Array.isArray(ejercicio.pasosImagenes) && ejercicio.pasosImagenes.length > 0
            ? ejercicio.pasosImagenes
            : pasosBase,
        guia: esCustom && Array.isArray(ejercicio.guia) && ejercicio.guia.length > 0
            ? ejercicio.guia
            : (guiasPorCategoria[ejercicio.categoria] || guiasPorCategoria['Lenguaje']),
        accesibilidad: ejercicio.accesibilidad || {
            ritmoLento: false
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const rawCatalogo = localStorage.getItem(QERO_CATALOG_KEY);
    const catalogo = rawCatalogo ? JSON.parse(rawCatalogo) : [];

    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    // Si vino desde paciente-detalle.html, el botón atrás dentro de <main> vuelve a ese paciente
    const pacienteIdOrigen = params.get('pacienteId');
    const backBtn = document.querySelector('main a[href*="catalogo.html"], main .back-btn, main .back-link, #btn-back');
    if (pacienteIdOrigen && backBtn) {
        const destino = `ver-rutina.html?id=${pacienteIdOrigen}`;
        if (backBtn.tagName === 'A') {
            backBtn.href = destino;
        } else {
            backBtn.addEventListener('click', () => {
                window.location.href = destino;
            });
        }
    }

    let index = catalogo.findIndex(item => item.id === idBuscado);
    if (index === -1 && catalogo.length > 0) index = 0;

    if (index === -1) {
        window.location.href = 'catalogo.html';
        return;
    }

    const extras = obtenerExtrasPorDefecto(catalogo[index]);
    const ejercicio = { ...catalogo[index], ...extras };
    catalogo[index] = ejercicio;
    localStorage.setItem(QERO_CATALOG_KEY, JSON.stringify(catalogo));

    // 1. Pintar datos principales del video
    document.title = `${ejercicio.nombre} — QeroHealth`;
    document.getElementById('exercise-meta-line').textContent = ejercicio.categoria;
    document.getElementById('video-title').textContent = ejercicio.nombre;
    document.getElementById('video-category-badge').textContent = ejercicio.categoria;
    document.getElementById('video-desc').textContent = ejercicio.descripcion;


    // Switch de ritmo reducido
    const swSlow = document.getElementById('toggle-slow');
    swSlow.checked = Boolean(ejercicio.accesibilidad.ritmoLento);

    // Miniatura de YouTube + botón Play verde (Facade con YouTube IFrame API)
    const videoBox = document.getElementById('video-player-box');
    const thumbImg = document.getElementById('video-thumb');
    const ytId = extraerYoutubeId(ejercicio.youtubeId);

    let ytPlayer = null;
    thumbImg.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

    function crearReproductorYouTube() {
        videoBox.innerHTML = '<div id="yt-player-target"></div>';

        if (window.YT && window.YT.Player) {
            ytPlayer = new YT.Player('yt-player-target', {
                host: 'https://www.youtube-nocookie.com',
                videoId: ytId,
                playerVars: {
                    autoplay: 1,
                    rel: 0,
                    cc_load_policy: 0
                },
                events: {
                    onReady: (event) => {
                        event.target.setPlaybackRate(swSlow.checked ? 0.75 : 1);
                        event.target.playVideo();
                    }
                }
            });
        } else {
            videoBox.innerHTML = `
                <iframe
                    src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&cc_load_policy=0"
                    title="${ejercicio.nombre}"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                ></iframe>
            `;
        }
    }

    videoBox.addEventListener('click', crearReproductorYouTube, { once: true });
    videoBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            crearReproductorYouTube();
        }
    }, { once: true });

    // Guardar y aplicar ritmo reducido en tiempo real
    swSlow.addEventListener('change', () => {
        catalogo[index].accesibilidad = {
            ritmoLento: swSlow.checked
        };
        localStorage.setItem(QERO_CATALOG_KEY, JSON.stringify(catalogo));

        if (ytPlayer && typeof ytPlayer.setPlaybackRate === 'function') {
            ytPlayer.setPlaybackRate(swSlow.checked ? 0.75 : 1);
        }
    });

    // 2. Pintar pestaña Guías
    const guideList = document.getElementById('guide-steps-list');
    guideList.innerHTML = '';
    ejercicio.guia.forEach(textoPaso => {
        const li = document.createElement('li');
        li.textContent = textoPaso;
        guideList.appendChild(li);
    });



// Control de pestañas (Videos / Imágenes / Guías)
    const tabButtons = document.querySelectorAll('.detail-tab');
    const panelVideos = document.getElementById('tab-videos');
    const panelImagenes = document.getElementById('tab-imagenes');
    const panelGuias = document.getElementById('tab-guias');

    function cambiarTab(target) {
        tabButtons.forEach(b => {
            const isActive = b.dataset.tab === target;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', String(isActive));
        });
        panelVideos.classList.toggle('hidden', target !== 'videos');
        panelImagenes.classList.toggle('hidden', target !== 'imagenes');
        panelGuias.classList.toggle('hidden', target !== 'guias');
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });

    // 3. Carrusel de imágenes + secuencia lateral (máx 3 + botón "+")
    const pasos = ejercicio.pasosImagenes;
    const totalPasos = pasos.length;
    let pasoActual = 0;

    document.getElementById('steps-count-label').textContent =
        totalPasos === 1 ? 'Secuencia de 1 paso' : `Secuencia de ${totalPasos} pasos`;
    document.getElementById('steps-count-pill').textContent =
        totalPasos === 1 ? '1 foto' : `${totalPasos} fotos`;

    const stageMediaBox = document.getElementById('stage-media-box');
    const stageImg = document.getElementById('stage-step-img');
    const stageTitle = document.getElementById('stage-step-title');
    const stageDesc = document.getElementById('stage-step-desc');
    const stageCounter = document.getElementById('stage-step-counter');
    const btnPrevStep = document.getElementById('btn-prev-step');
    const btnNextStep = document.getElementById('btn-next-step');
    const stepsGrid = document.getElementById('steps-grid');

    function renderizarVisorImagen(indice) {
        pasoActual = (indice + totalPasos) % totalPasos;
        const paso = pasos[pasoActual];

        stageMediaBox.classList.remove('no-img');
        stageImg.onerror = () => stageMediaBox.classList.add('no-img');
        stageImg.src = paso.imagen;
        stageImg.alt = paso.titulo || `Paso ${pasoActual + 1}`;

        stageTitle.textContent = paso.titulo || `Paso ${pasoActual + 1}`;
        stageDesc.textContent = paso.detalle || 'Sigue la postura mostrada en la imagen de referencia.';
        stageCounter.textContent = `Paso ${pasoActual + 1} de ${totalPasos}`;

        // Resaltar miniatura activa en la columna lateral
        document.querySelectorAll('.step-thumb-card[data-step-index]').forEach(card => {
            const idx = Number(card.dataset.stepIndex);
            card.classList.toggle('active-step', idx === pasoActual);
        });
    }

    btnPrevStep.addEventListener('click', () => renderizarVisorImagen(pasoActual - 1));
    btnNextStep.addEventListener('click', () => renderizarVisorImagen(pasoActual + 1));

    // Pintar miniaturas laterales (siempre máximo 3 cajitas)
    stepsGrid.innerHTML = '';
    const tieneMas = totalPasos > 3;

    // Si hay más de 3 pasos, mostramos solo 2 + la 3ra cajita "+N más"
    const visibles = tieneMas ? pasos.slice(0, 2) : pasos;

    visibles.forEach((paso, i) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'step-thumb-card';
        card.dataset.stepIndex = i;
        card.innerHTML = `
            <div class="step-thumb-media">
                <img src="${paso.imagen}" alt="${paso.titulo}" onerror="this.parentElement.classList.add('no-img')">
                <i class="fa-regular fa-image step-thumb-fallback"></i>
            </div>
            <p class="step-thumb-label">${paso.titulo || `Paso ${i + 1}`}</p>
        `;
        card.addEventListener('click', () => {
            renderizarVisorImagen(i);
            cambiarTab('imagenes');
        });
        stepsGrid.appendChild(card);
    });

    if (tieneMas) {
        const restantes = totalPasos - 2; // Ej: si hay 5 pasos -> +3 más; si hay 11 -> +9 más
        const moreCard = document.createElement('button');
        moreCard.type = 'button';
        moreCard.className = 'step-thumb-card step-more-card';
        moreCard.setAttribute('aria-label', `Ver ${restantes} pasos más`);
        moreCard.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            <span>+${restantes} más</span>
        `;
        moreCard.addEventListener('click', () => {
            renderizarVisorImagen(2); // Abre directo en el Paso 3
            cambiarTab('imagenes');
        });
        stepsGrid.appendChild(moreCard);
    }

    renderizarVisorImagen(0);

    // 4. Modal: Asignar a paciente
    const assignModal = document.getElementById('assign-modal');
    const btnOpenAssign = document.getElementById('btn-open-assign');
    const btnCancelAssign = document.getElementById('btn-cancel-assign');
    const assignForm = document.getElementById('assign-form');
    const patientSelect = document.getElementById('assign-patient-select');
    const assignStatus = document.getElementById('assign-status-inline');

    const qeroData = getQeroData();
    patientSelect.innerHTML = '';
    qeroData.pacientes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.nombre} (${p.id}) · ${p.condicion}`;
        patientSelect.appendChild(opt);
    });

    btnOpenAssign.addEventListener('click', () => {
        assignModal.classList.remove('hidden');
        patientSelect.focus();
    });

    btnCancelAssign.addEventListener('click', () => {
        assignModal.classList.add('hidden');
    });

    assignModal.addEventListener('click', (e) => {
        if (e.target === assignModal) assignModal.classList.add('hidden');
    });

    assignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pacienteId = patientSelect.value;
        const repeticiones = parseInt(document.getElementById('assign-reps').value, 10);
        const frecuencia = document.getElementById('assign-freq').value;

        const dataActual = getQeroData();
        const paciente = dataActual.pacientes.find(p => p.id === pacienteId);

        if (paciente) {
            if (!Array.isArray(paciente.rutinaAsignada)) {
                paciente.rutinaAsignada = [];
            }
            paciente.rutinaAsignada.push({
                ejercicioId: ejercicio.id,
                nombre: ejercicio.nombre,
                categoria: ejercicio.categoria,
                repeticiones,
                frecuencia
            });
            saveQeroData(dataActual);

            assignStatus.textContent = `Asignado a ${paciente.nombre} (${repeticiones} rep. · ${frecuencia})`;
            assignStatus.classList.remove('hidden');
        }

        assignModal.classList.add('hidden');
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

    btnCancelLogout.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) logoutModal.classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            logoutModal.classList.add('hidden');
            assignModal.classList.add('hidden');
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        window.location.href = '../../index.html';
    });
});