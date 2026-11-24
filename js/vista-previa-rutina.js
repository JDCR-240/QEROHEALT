const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    const data = getQeroData();
    const paciente = data.pacientes.find(p => p.id === idBuscado) || data.pacientes[0];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    // Enlace de regreso a editar-rutina.html
    const volverUrl = `editar-rutina.html?id=${paciente.id}`;
    document.getElementById('btn-back-er').href = volverUrl;
    document.getElementById('vp-routine-title').textContent =
        paciente.nombreRutina || `Rutina de ${paciente.nombre}`;

    // Juntar rutina asignada + ejercicios pendientes recién agregados
    const rutina = Array.isArray(paciente.rutinaAsignada)
        ? paciente.rutinaAsignada.map(item => ({ ...item }))
        : [];

    const keyPendientes = `qero_ejercicios_pendientes_${paciente.id}`;
    const pendientes = JSON.parse(sessionStorage.getItem(keyPendientes) || '[]');
    pendientes.forEach(nuevo => {
        if (!rutina.some(e => e.ejercicioId === nuevo.ejercicioId)) {
            rutina.push(nuevo);
        }
    });

    if (rutina.length === 0) {
        window.location.href = volverUrl;
        return;
    }

    // Cargar catálogo para sacar el video / imagen de cada ejercicio
    const catalogo = JSON.parse(localStorage.getItem(QERO_CATALOG_KEY) || '[]');

    // Referencias DOM
    const stepBadge = document.getElementById('vp-step-badge');
    const mediaContainer = document.getElementById('vp-media-container');
    const pausedOverlay = document.getElementById('vp-paused-overlay');
    const catEl = document.getElementById('vp-ex-cat');
    const intervalHint = document.getElementById('vp-interval-hint');
    const nameEl = document.getElementById('vp-ex-name');
    const indicationEl = document.getElementById('vp-ex-indication');

    const timerDisplay = document.getElementById('vp-timer-display');
    const statusText = document.getElementById('vp-status-text');
    const repsCount = document.getElementById('vp-reps-count');
    const progressFill = document.getElementById('vp-progress-fill');
    const progressPct = document.getElementById('vp-progress-pct');
    const nextRepMsg = document.getElementById('vp-next-rep-msg');

    const btnTogglePause = document.getElementById('btn-toggle-pause');
    const iconPause = document.getElementById('icon-pause');
    const labelPause = document.getElementById('label-pause');
    const btnNext = document.getElementById('btn-next-ex');
    const labelNext = document.getElementById('label-next');
    const iconNext = document.getElementById('icon-next');
    const btnPrev = document.getElementById('btn-prev-ex');
    const viewVideo = document.getElementById('vp-view-video');
    const viewSteps = document.getElementById('vp-view-steps');
    const stepCounter = document.getElementById('vp-step-counter');
    const stepImg = document.getElementById('vp-step-img');
    const stepDesc = document.getElementById('vp-step-desc');
    const btnStepPrev = document.getElementById('btn-step-prev');
    const btnStepNext = document.getElementById('btn-step-next');

    let pasosActuales = [];
    let pasoActualIdx = 0;
    const btnModeVideo = document.getElementById('btn-mode-video');
    const btnModeSteps = document.getElementById('btn-mode-steps');

    // Estado del reproductor
    let idxActual = 0;
    let totalSegundos = 60;
    let segundosRestantes = 60;
    let totalReps = 6;
    let segundosPorRep = 10;
    let pausado = false;
    let timerInterval = null;

    let ytPlayer = null;
    let ytApiLista = false;
    let ytVideoPendiente = null;
    let imgActualFallback = '../../img/catalogo.jpg';
    let tituloActualFallback = 'Ejercicio';

    // Cargar YouTube IFrame API automáticamente
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    } else if (window.YT.Player) {
        ytApiLista = true;
    }

    window.onYouTubeIframeAPIReady = () => {
        ytApiLista = true;
        if (ytVideoPendiente) {
            montarReproductorYoutube(ytVideoPendiente.id, ytVideoPendiente.img, ytVideoPendiente.nombre);
            ytVideoPendiente = null;
        }
    };

    function extraerYoutubeId(valor) {
        if (!valor) return null;
        const limpio = String(valor).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(limpio)) return limpio;

        // Soporta watch?v=, youtu.be/, embed/, shorts/ y live/
        const match = limpio.match(/(?:[?&]v=|youtu\.be\/|youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    function obtenerFuenteVideo(ejCatalogo, item) {
        const candidatos = [
            ejCatalogo.videoUrl, ejCatalogo.youtubeId, ejCatalogo.videoId,
            ejCatalogo.video, ejCatalogo.embedUrl, ejCatalogo.urlVideo,
            item.videoUrl, item.youtubeId, item.video
        ];

        for (const c of candidatos) {
            if (extraerYoutubeId(c)) return c;
        }
        return null;
    }

    function mostrarImagenRespaldo(imgSrc, titulo, motivo) {
        if (ytPlayer && typeof ytPlayer.destroy === 'function') {
            ytPlayer.destroy();
            ytPlayer = null;
        }
        mediaContainer.innerHTML = `
            <img src="${imgSrc || '../../img/catalogo.jpg'}" alt="${titulo || 'Ejercicio'}">
            <span class="vp-video-notice">
                <i class="fa-solid fa-circle-info"></i> ${motivo}
            </span>
        `;
    }

    function aplicarEstadoPausa(debePausar, controlarVideo = true) {
        if (segundosRestantes <= 0 && debePausar) return;
        pausado = debePausar;

        if (pausado) {
            pausedOverlay.classList.remove('hidden');
            iconPause.className = 'fa-solid fa-play';
            labelPause.textContent = 'Reanudar';
            statusText.className = 'vp-status-pill status-paused';
            statusText.innerHTML = '<i class="fa-solid fa-pause"></i> En pausa';
            if (controlarVideo && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
                ytPlayer.pauseVideo();
            }
        } else {
            pausedOverlay.classList.add('hidden');
            iconPause.className = 'fa-solid fa-pause';
            labelPause.textContent = 'Pausar';
            statusText.className = 'vp-status-pill status-running';
            statusText.innerHTML = '<i class="fa-solid fa-circle"></i> En curso';
            if (controlarVideo && ytPlayer && typeof ytPlayer.playVideo === 'function') {
                ytPlayer.playVideo();
            }
        }
    }

    function montarReproductorYoutube(ytId, fallbackImg, titulo) {
        imgActualFallback = fallbackImg || '../../img/catalogo.jpg';
        tituloActualFallback = titulo || 'Ejercicio';

        if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
            ytPlayer.loadVideoById(ytId);
            return;
        }

        if (ytPlayer && typeof ytPlayer.destroy === 'function') {
            ytPlayer.destroy();
            ytPlayer = null;
        }

        mediaContainer.innerHTML = '<div id="vp-yt-player"></div>';

        const playerVars = {
            autoplay: 1,
            mute: 1,
            rel: 0,
            playsinline: 1
        };

        if (window.location.protocol.startsWith('http')) {
            playerVars.origin = window.location.origin;
        }

        ytPlayer = new YT.Player('vp-yt-player', {
            videoId: ytId,
            playerVars,
            events: {
                onReady: (event) => {
                    event.target.mute();
                    event.target.playVideo();
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.PAUSED) {
                        aplicarEstadoPausa(true, false);
                    } else if (event.data === YT.PlayerState.PLAYING) {
                        aplicarEstadoPausa(false, false);
                    }
                },
                onError: (e) => {
                    const motivo = (e.data === 101 || e.data === 150 || e.data === 153)
                        ? 'YouTube bloqueó la reproducción externa de este video (cambia el link en el catálogo)'
                        : `Video de YouTube no disponible (error ${e.data})`;
                    mostrarImagenRespaldo(imgActualFallback, tituloActualFallback, motivo);
                }
            }
        });
    }

    function parsearMinutos(item) {
        const fuente = item.tiempo || item.frecuencia || '1 min';
        const match = String(fuente).match(/(\d+)/);
        const mins = match ? parseInt(match[1], 10) : 1;
        return mins > 0 ? mins : 1;
    }

    function formatearTiempo(seg) {
        const m = Math.floor(seg / 60);
        const s = seg % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function actualizarMetricasVisuales() {
        const transcurridos = totalSegundos - segundosRestantes;
        const repsCompletadas = Math.min(totalReps, Math.floor(transcurridos / segundosPorRep));
        const porcentaje = Math.round((repsCompletadas / totalReps) * 100);

        timerDisplay.textContent = formatearTiempo(segundosRestantes);
        repsCount.textContent = `${repsCompletadas} / ${totalReps}`;
        progressFill.style.width = `${porcentaje}%`;
        progressPct.textContent = `${porcentaje}% completado`;

        if (segundosRestantes <= 0 || repsCompletadas >= totalReps) {
            if (nextRepMsg) nextRepMsg.textContent = '¡Ejercicio completado!';
            statusText.className = 'vp-status-pill status-done';
            statusText.innerHTML = '<i class="fa-solid fa-check"></i> Completado';
            iconPause.className = 'fa-solid fa-rotate-right';
            labelPause.textContent = 'Repetir';
        } else {
            const faltanParaSiguiente = Math.ceil(segundosPorRep - (transcurridos % segundosPorRep));
            if (nextRepMsg) nextRepMsg.textContent = `Siguiente rep en ${faltanParaSiguiente}s`;
        }
    }

    function iniciarReloj() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (pausado) return;

            if (segundosRestantes > 0) {
                segundosRestantes--;
                actualizarMetricasVisuales();

                if (segundosRestantes === 0) {
                    clearInterval(timerInterval);
                    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
                        ytPlayer.pauseVideo();
                    }
                }
            }
        }, 1000);
    }
    function cambiarModoVista(modo) {
        const esVideo = modo === 'video';
        viewVideo.classList.toggle('hidden', !esVideo);
        viewSteps.classList.toggle('hidden', esVideo);

        btnModeVideo.classList.toggle('active', esVideo);
        btnModeVideo.setAttribute('aria-selected', String(esVideo));

        btnModeSteps.classList.toggle('active', !esVideo);
        btnModeSteps.setAttribute('aria-selected', String(!esVideo));
    }

    function mostrarPasoActual() {
        if (pasosActuales.length === 0) return;
        const paso = pasosActuales[pasoActualIdx];

        stepCounter.textContent = `Paso ${pasoActualIdx + 1} de ${pasosActuales.length}`;
        stepImg.src = paso.imagen;
        stepImg.alt = `Paso ${pasoActualIdx + 1}`;
        stepDesc.textContent = paso.texto;

        btnStepPrev.disabled = pasoActualIdx === 0;
        btnStepNext.disabled = pasoActualIdx === pasosActuales.length - 1;
    }

    function renderizarPasosGuia(item, ejCatalogo) {
        // 1. Si el ejercicio ya tiene pasosImagenes (custom o abierto antes en rutina.html)
        if (Array.isArray(ejCatalogo.pasosImagenes) && ejCatalogo.pasosImagenes.length > 0) {
            pasosActuales = ejCatalogo.pasosImagenes.map((p, i) => ({
                titulo: p.titulo || `Paso ${i + 1}`,
                imagen: p.imagen || '../../img/paso.webp',
                texto: p.detalle || p.texto || 'Sigue la postura mostrada en la imagen de referencia.'
            }));
        } else {
            // 2. Misma lógica por defecto de rutina.js para los 12 ejercicios base
            const bancoPasos = [
                { titulo: 'Paso 1', imagen: '../../img/paso.webp', texto: 'Posición inicial con espalda recta y hombros relajados.' },
                { titulo: 'Paso 2', imagen: '../../img/paso.webp', texto: 'Inhalar suavemente por la nariz antes de iniciar el movimiento.' },
                { titulo: 'Paso 3', imagen: '../../img/paso.webp', texto: 'Ejecutar el gesto de forma controlada frente al espejo.' },
                { titulo: 'Paso 4', imagen: '../../img/paso.webp', texto: 'Sostener la postura durante 3 a 5 segundos sin tensión.' },
                { titulo: 'Paso 5', imagen: '../../img/paso.webp', texto: 'Relajar lentamente y descansar antes de la siguiente repetición.' },
                { titulo: 'Paso 6', imagen: '../../img/paso.webp', texto: 'Verificar simetría facial y repetir el ciclo completo.' }
            ];

            const idStr = String(ejCatalogo.id || item.ejercicioId || '1');
            const numEj = parseInt(idStr.replace(/\D/g, ''), 10) || 1;
            const cantidades = [3, 5, 2, 6, 4, 3, 5, 2, 4, 6, 3, 5];
            const total = cantidades[(numEj - 1) % cantidades.length];

            pasosActuales = bancoPasos.slice(0, total);
        }

        pasoActualIdx = 0;
        mostrarPasoActual();
    }
    function cargarEjercicio(index) {
        clearInterval(timerInterval);
        idxActual = index;
        pausado = false;
        pausedOverlay.classList.add('hidden');

        const item = rutina[idxActual];
        const ejCatalogo = catalogo.find(c =>
            String(c.id) === String(item.ejercicioId) ||
            (c.nombre && item.nombre && c.nombre.toLowerCase() === item.nombre.toLowerCase())
        ) || {};

        // Configurar tiempo y repeticiones
        const minutos = parsearMinutos(item);
        totalSegundos = minutos * 60;
        segundosRestantes = totalSegundos;
        totalReps = parseInt(item.repeticiones, 10) > 0 ? parseInt(item.repeticiones, 10) : 6;
        segundosPorRep = totalSegundos / totalReps;

        // Textos
        stepBadge.textContent = `Ejercicio ${idxActual + 1} de ${rutina.length}`;
        catEl.textContent = item.categoria || ejCatalogo.categoria || 'Terapia';
        nameEl.textContent = item.nombre;
        indicationEl.textContent = item.indicacion || ejCatalogo.descripcion || 'Realiza el movimiento de forma pausada siguiendo el video guía.';
        intervalHint.textContent = `1 rep cada ${Math.round(segundosPorRep)}s`;
    renderizarPasosGuia(item, ejCatalogo);
        // Video o imagen de respaldo con aviso
        const fuenteVideo = obtenerFuenteVideo(ejCatalogo, item);
        const ytId = extraerYoutubeId(fuenteVideo);
        const imgFallback = ejCatalogo.imagen || '../../img/catalogo.jpg';

        if (ytId) {
            if (ytApiLista && window.YT && window.YT.Player) {
                montarReproductorYoutube(ytId, imgFallback, item.nombre);
            } else {
                ytVideoPendiente = { id: ytId, img: imgFallback, nombre: item.nombre };
            }
        } else {
            mostrarImagenRespaldo(imgFallback, item.nombre, 'Este ejercicio no tiene un enlace de YouTube en el catálogo');
        }

        // Estado visual de botones
        iconPause.className = 'fa-solid fa-pause';
        labelPause.textContent = 'Pausar';
        statusText.className = 'vp-status-pill status-running';
        statusText.innerHTML = '<i class="fa-solid fa-circle"></i> En curso';

        if (idxActual === 0) {
            btnPrev.classList.add('hidden');
        } else {
            btnPrev.classList.remove('hidden');
        }

        const esUltimo = idxActual === rutina.length - 1;
        if (esUltimo) {
            labelNext.textContent = 'Finalizar vista previa';
            iconNext.className = 'fa-solid fa-check';
        } else {
            labelNext.textContent = 'Siguiente ejercicio';
            iconNext.className = 'fa-solid fa-forward-step';
        }

        actualizarMetricasVisuales();
        iniciarReloj();
    }

    // Pausar / Reanudar / Repetir
    btnTogglePause.addEventListener('click', () => {
        if (segundosRestantes <= 0) {
            segundosRestantes = totalSegundos;
            pausado = false;
            pausedOverlay.classList.add('hidden');
            iconPause.className = 'fa-solid fa-pause';
            labelPause.textContent = 'Pausar';
            statusText.className = 'vp-status-pill status-running';
            statusText.innerHTML = '<i class="fa-solid fa-circle"></i> En curso';

            if (ytPlayer) {
                if (typeof ytPlayer.seekTo === 'function') ytPlayer.seekTo(0, true);
                if (typeof ytPlayer.playVideo === 'function') ytPlayer.playVideo();
            }

            actualizarMetricasVisuales();
            iniciarReloj();
            return;
        }

        aplicarEstadoPausa(!pausado, true);
    });

    pausedOverlay.addEventListener('click', () => {
        if (pausado && segundosRestantes > 0) {
            aplicarEstadoPausa(false, true);
        }
    });

    // Siguiente ejercicio / Finalizar
    btnNext.addEventListener('click', () => {
        if (idxActual < rutina.length - 1) {
            cargarEjercicio(idxActual + 1);
        } else {
            clearInterval(timerInterval);
            window.location.href = volverUrl;
        }
    });

    // Ejercicio anterior
    btnPrev.addEventListener('click', () => {
        if (idxActual > 0) {
            cargarEjercicio(idxActual - 1);
        }
    });
    btnModeVideo.addEventListener('click', () => cambiarModoVista('video'));
    btnModeSteps.addEventListener('click', () => cambiarModoVista('steps'));
    btnStepPrev.addEventListener('click', () => {
        if (pasoActualIdx > 0) {
            pasoActualIdx--;
            mostrarPasoActual();
        }
    });

    btnStepNext.addEventListener('click', () => {
        if (pasoActualIdx < pasosActuales.length - 1) {
            pasoActualIdx++;
            mostrarPasoActual();
        }
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

    cargarEjercicio(0);
});