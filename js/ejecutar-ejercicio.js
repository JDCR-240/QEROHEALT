const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';
const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';
const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/watch?v=XdXqE0HZkLc';

function obtenerPacienteActual(data) {
    const pacientes = data.pacientes || [];
    if (pacientes.length === 0) return null;

    const idGuardado = sessionStorage.getItem(QERO_SESSION_PATIENT_KEY);
    let paciente = pacientes.find(p => p.id === idGuardado);

    if (!paciente) {
        paciente = pacientes[0];
        sessionStorage.setItem(QERO_SESSION_PATIENT_KEY, paciente.id);
    }
    return paciente;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = getQeroData();
    const paciente = obtenerPacienteActual(data);

    if (!paciente) {
        window.location.href = '../../index.html';
        return;
    }

    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];
    if (rutina.length === 0) {
        window.location.href = 'mi-rutina.html';
        return;
    }

    // Leer el índice exacto del ejercicio seleccionado desde mi-rutina.html
    const params = new URLSearchParams(window.location.search);
    let idxActual = parseInt(params.get('index'), 10);
    if (isNaN(idxActual) || idxActual < 0 || idxActual >= rutina.length) {
        idxActual = 0;
    }

    const item = rutina[idxActual];
    const catalogo = JSON.parse(localStorage.getItem(QERO_CATALOG_KEY) || '[]');
    const ejCatalogo = catalogo.find(c =>
        String(c.id) === String(item.ejercicioId) ||
        (c.nombre && item.nombre && c.nombre.toLowerCase() === item.nombre.toLowerCase())
    ) || {};

    // Referencias DOM
    const routineTitleEl = document.getElementById('vp-routine-title');
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

    const btnTogglePause = document.getElementById('btn-toggle-pause');
    const iconPause = document.getElementById('icon-pause');
    const labelPause = document.getElementById('label-pause');
    const btnFinish = document.getElementById('btn-finish-ex');
    const labelFinish = document.getElementById('label-finish');
    const finishHint = document.getElementById('vp-finish-hint');

    const viewVideo = document.getElementById('vp-view-video');
    const viewSteps = document.getElementById('vp-view-steps');
    const stepCounter = document.getElementById('vp-step-counter');
    const stepImg = document.getElementById('vp-step-img');
    const stepDesc = document.getElementById('vp-step-desc');
    const btnStepPrev = document.getElementById('btn-step-prev');
    const btnStepNext = document.getElementById('btn-step-next');
    const btnModeVideo = document.getElementById('btn-mode-video');
    const btnModeSteps = document.getElementById('btn-mode-steps');

    if (labelFinish) labelFinish.textContent = 'Finalizar ejercicio';
    finishHint.innerHTML = 'El botón <strong>Finalizar ejercicio</strong> se activará cuando termine el temporizador.';

    let pasosActuales = [];
    let pasoActualIdx = 0;

    // Estado del reproductor y reloj
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
        const match = limpio.match(/(?:[?&]v=|youtu\.be\/|youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    function obtenerFuenteVideo(ejCat, ejItem) {
        const candidatos = [
            ejCat.youtubeId, ejCat.videoUrl, ejCat.videoId,
            ejCat.video, ejCat.embedUrl, ejCat.urlVideo,
            ejItem.youtubeId, ejItem.videoUrl, ejItem.video,
            DEFAULT_YOUTUBE_URL
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
                        ? 'YouTube bloqueó la reproducción externa de este video'
                        : `Video de YouTube no disponible (error ${e.data})`;
                    mostrarImagenRespaldo(imgActualFallback, tituloActualFallback, motivo);
                }
            }
        });
    }

    function parsearMinutos(ejItem) {
        const fuente = ejItem.tiempo || ejItem.frecuencia || '1 min';
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
            statusText.className = 'vp-status-pill status-done';
            statusText.innerHTML = '<i class="fa-solid fa-check"></i> Completado';
            iconPause.className = 'fa-solid fa-rotate-right';
            labelPause.textContent = 'Repetir';

            btnFinish.disabled = false;
            finishHint.classList.add('is-ready');
            finishHint.textContent = '¡Tiempo completado! Ya puedes presionar "Finalizar ejercicio".';
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

    function renderizarPasosGuia(ejItem, ejCat) {
        if (Array.isArray(ejCat.pasosImagenes) && ejCat.pasosImagenes.length > 0) {
            pasosActuales = ejCat.pasosImagenes.map((p, i) => ({
                titulo: p.titulo || `Paso ${i + 1}`,
                imagen: p.imagen || '../../img/paso.webp',
                texto: p.detalle || p.texto || 'Sigue la postura mostrada en la imagen de referencia.'
            }));
        } else {
            const bancoPasos = [
                { titulo: 'Paso 1', imagen: '../../img/paso.webp', texto: 'Posición inicial con espalda recta y hombros relajados.' },
                { titulo: 'Paso 2', imagen: '../../img/paso.webp', texto: 'Inhalar suavemente por la nariz antes de iniciar el movimiento.' },
                { titulo: 'Paso 3', imagen: '../../img/paso.webp', texto: 'Ejecutar el gesto de forma controlada frente al espejo.' },
                { titulo: 'Paso 4', imagen: '../../img/paso.webp', texto: 'Sostener la postura durante 3 a 5 segundos sin tensión.' },
                { titulo: 'Paso 5', imagen: '../../img/paso.webp', texto: 'Relajar lentamente y descansar antes de la siguiente repetición.' },
                { titulo: 'Paso 6', imagen: '../../img/paso.webp', texto: 'Verificar simetría facial y repetir el ciclo completo.' }
            ];

            const idStr = String(ejCat.id || ejItem.ejercicioId || '1');
            const numEj = parseInt(idStr.replace(/\D/g, ''), 10) || 1;
            const cantidades = [3, 5, 2, 6, 4, 3, 5, 2, 4, 6, 3, 5];
            const total = cantidades[(numEj - 1) % cantidades.length];

            pasosActuales = bancoPasos.slice(0, total);
        }

        pasoActualIdx = 0;
        mostrarPasoActual();
    }

    // Inicializar ejercicio seleccionado
    const minutos = parsearMinutos(item);
    totalSegundos = minutos * 60;
    segundosRestantes = totalSegundos;
    totalReps = parseInt(item.repeticiones, 10) > 0 ? parseInt(item.repeticiones, 10) : 6;
    segundosPorRep = totalSegundos / totalReps;

    document.title = `${item.nombre} — QeroHealth`;
    routineTitleEl.textContent = paciente.nombreRutina || `Rutina de ${paciente.nombre}`;
    stepBadge.textContent = `Ejercicio ${idxActual + 1} de ${rutina.length}`;
    catEl.textContent = item.categoria || ejCatalogo.categoria || 'Terapia';
    nameEl.textContent = item.nombre;
    indicationEl.textContent = item.indicacion || ejCatalogo.descripcion || 'Realiza el movimiento de forma pausada siguiendo el video guía.';
    intervalHint.textContent = `1 rep cada ${Math.round(segundosPorRep)}s`;

    renderizarPasosGuia(item, ejCatalogo);

    // Montar video de YouTube
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

            btnFinish.disabled = true;
            finishHint.classList.remove('is-ready');
            finishHint.innerHTML = 'El botón <strong>Finalizar ejercicio</strong> se activará cuando termine el temporizador.';

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

    // Al presionar "Finalizar ejercicio": marca como completado y siempre va a actividad-completada.html
    btnFinish.addEventListener('click', () => {
        if (btnFinish.disabled) return;

        rutina[idxActual].completado = true;

        const completadosReales = rutina.filter(ej => Boolean(ej.completado)).length;
        const nuevoAvance = Math.round((completadosReales / rutina.length) * 100);

        paciente.avance = nuevoAvance;
        paciente.etiqueta = `${nuevoAvance}%`;
        paciente.ultimaActividad = nuevoAvance === 100
            ? 'Sesión completada · Hoy'
            : 'Sesión hoy · En progreso';

        if (nuevoAvance >= 70) {
            paciente.estado = 'activo';
            paciente.nivel = 'green';
        } else {
            paciente.estado = 'seguimiento';
            paciente.nivel = 'amber';
        }

        saveQeroData(data);
        window.location.href = `actividad-completada.html?index=${idxActual}`;
    });

    // Controles de pestañas Video / Guía paso a paso
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
        sessionStorage.removeItem(QERO_SESSION_PATIENT_KEY);
        window.location.href = '../../index.html';
    });

    actualizarMetricasVisuales();
    iniciarReloj();
});