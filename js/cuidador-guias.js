const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';
const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=i6yU2UkVf_w';

const GUIAS_CUIDADOR = [
    {
        id: 'cg-1',
        categoria: 'Acompañamiento diario',
        titulo: 'Cómo preparar un entorno tranquilo antes de la sesión',
        descripcion: 'Organiza el espacio con buena luz, silla firme y sin ruidos para que el paciente se concentre sin estrés.',
        miniatura: '../../img/logo-cuidador.jpeg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Verifica que la silla tenga respaldo firme y que el espejo quede a la altura del rostro.',
            'Reduce ruidos de televisor o celular durante los minutos de práctica.',
            'Ten un vaso de agua cerca para pausas cortas entre ejercicios.'
        ]
    },
    {
        id: 'cg-2',
        categoria: 'Acompañamiento diario',
        titulo: 'Comunicación paciente y motivación sin presionar',
        descripcion: 'Acompaña con frases claras y positivas, celebrando los pequeños avances sin apurar las respuestas.',
        miniatura: '../../img/logo-cuidador.jpeg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Habla despacio, mirando de frente y dando una sola indicación a la vez.',
            'Evita corregir cada gesto de golpe; refuerza primero lo que sí salió bien.',
            'Respeta los silencios y dale tiempo suficiente para completar cada palabra o movimiento.'
        ]
    },
    {
        id: 'cg-3',
        categoria: 'Apoyo en los ejercicios',
        titulo: 'Cómo asistir sin forzar los movimientos faciales',
        descripcion: 'Tu rol es guiar y observar la postura, evitando empujar o sobreexigir el lado afectado del rostro.',
        miniatura: '../../img/logo-cuidador.jpeg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Colócate a su lado frente al espejo para que pueda imitar el ritmo con calma.',
            'Recuérdale relajar hombros y cuello antes de cada serie.',
            'Prioriza movimientos suaves y controlados en lugar de fuerza o velocidad.'
        ]
    },
    {
        id: 'cg-4',
        categoria: 'Apoyo en los ejercicios',
        titulo: 'Señales de fatiga: cuándo pausar la rutina',
        descripcion: 'Aprende a identificar cansancio muscular, frustración o molestia para detener la sesión a tiempo.',
        miniatura: '../../img/logo-cuidador.jpeg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Observa si aparecen temblores leves, tensión en el cuello o pérdida de concentración.',
            'Si notas cansancio, sugiere una pausa de 1 a 2 minutos o retomar en otro momento.',
            'Ante dolor agudo o mareo, suspende la actividad y comunícalo al especialista.'
        ]
    },
    {
        id: 'cg-5',
        categoria: 'Bienestar del cuidador',
        titulo: 'Qué observaciones anotar para el especialista',
        descripcion: 'Registrar detalles concretos de cada semana ayuda al especialista a ajustar la rutina con precisión.',
        miniatura: '../../img/logo-cuidador.jpeg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Anota en qué horario del día el paciente rinde mejor y se siente más cómodo.',
            'Señala qué ejercicio resultó más difícil o generó mayor cansancio.',
            'Usa la sección Especialista para enviar dudas etiquetando el ejercicio exacto.'
        ]
    },
    {
        id: 'cg-6',
        categoria: 'Bienestar del cuidador',
        titulo: 'Cuidarte para cuidar: pausas y manejo del desgaste',
        descripcion: 'Acompañar una rehabilitación requiere energía emocional; reservar espacios propios también es parte del cuidado.',
        miniatura: '../../img/logo-cuidador.jpeg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Define un horario fijo para la rutina y evita que ocupe todo el día.',
            'Pide apoyo a otros familiares para turnarse en las sesiones cuando sea posible.',
            'Tómate descansos breves y reconoce tu propio esfuerzo en el proceso.'
        ]
    }
];

function obtenerEmbedYoutube(url) {
    if (!url) return '';
    const match = String(url).match(/(?:[?&]v=|youtu\.be\/|youtube\.com\/(?:embed|shorts)\/)([a-zA-Z0-9_-]{11})/);
    const id = match ? match[1] : null;
    return id ? `https://www.youtube.com/embed/${id}?rel=0&autoplay=1` : '';
}

document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.getElementById('rec-grid');
    const counterEl = document.getElementById('rec-counter');
    const filterBtns = document.querySelectorAll('.rec-filter-btn');

    // Referencias del modal de video
    const videoModal = document.getElementById('video-modal');
    const vmCat = document.getElementById('vm-cat');
    const vmTitle = document.getElementById('vm-title');
    const vmIframe = document.getElementById('vm-iframe');
    const vmDesc = document.getElementById('vm-desc');
    const vmSteps = document.getElementById('vm-steps');
    const btnCloseVideo = document.getElementById('btn-close-video');
    const btnDoneVideo = document.getElementById('btn-done-video');

    function abrirModalVideo(guiaId) {
        const item = GUIAS_CUIDADOR.find(g => g.id === guiaId);
        if (!item) return;

        vmCat.textContent = item.categoria;
        vmTitle.textContent = item.titulo;
        vmDesc.textContent = item.descripcion;
        vmSteps.innerHTML = (item.pasos || []).map(p => `<li>${p}</li>`).join('');
        vmIframe.src = obtenerEmbedYoutube(item.videoUrl || DEFAULT_VIDEO_URL);

        videoModal.classList.remove('hidden');
        btnCloseVideo.focus();
    }

    function cerrarModalVideo() {
        videoModal.classList.add('hidden');
        vmIframe.src = '';
    }

    btnCloseVideo.addEventListener('click', cerrarModalVideo);
    btnDoneVideo.addEventListener('click', cerrarModalVideo);
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) cerrarModalVideo();
    });

    function renderizarGuias(categoria = 'todos') {
        const lista = categoria === 'todos'
            ? GUIAS_CUIDADOR
            : GUIAS_CUIDADOR.filter(g => g.categoria === categoria);

        counterEl.textContent = `${lista.length} ${lista.length === 1 ? 'guía disponible' : 'guías disponibles'}`;

        gridEl.innerHTML = lista.map(item => `
            <article class="rec-card" data-id="${item.id}">
                <div class="rec-thumb-wrap">
                    <img src="${item.miniatura}" alt="${item.titulo}" class="rec-thumb-img">
                    <span class="rec-play-badge" aria-hidden="true">
                        <i class="fa-solid fa-play"></i>
                    </span>
                </div>

                <div class="rec-body">
                    <span class="rec-cat-tag">${item.categoria}</span>
                    <h2 class="rec-title">${item.titulo}</h2>
                    <p class="rec-desc">${item.descripcion}</p>

                    <button type="button" class="btn btn-primary btn-interactive rec-btn-watch" data-id="${item.id}">
                        <i class="fa-solid fa-circle-play"></i>
                        <span>Ver guía en video</span>
                    </button>
                </div>
            </article>
        `).join('');
    }

    gridEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.rec-btn-watch');
        if (btn) {
            abrirModalVideo(btn.dataset.id);
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarGuias(btn.dataset.filter);
        });
    });

    renderizarGuias('todos');

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
        if (e.key === 'Escape') {
            logoutModal.classList.add('hidden');
            cerrarModalVideo();
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        sessionStorage.removeItem(QERO_SESSION_PATIENT_KEY);
        window.location.href = '../../index.html';
    });
});