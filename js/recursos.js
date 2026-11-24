const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';
const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=i_BI7X55oAU';

const RECURSOS_PACIENTE = [
    {
        id: 'rec-1',
        categoria: 'Postura y entorno',
        titulo: 'Prepara tu espacio y postura antes de iniciar',
        descripcion: 'Usa una silla firme con respaldo recto, buena iluminación y un espejo a la altura de tu rostro.',
        miniatura: '../../img/logo-paciente.jpg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Siéntate con la espalda recta y los pies bien apoyados en el suelo.',
            'Coloca un espejo frente a ti en un lugar con buena luz natural o lámpara frontal.',
            'Apaga ruidos o distracciones para concentrarte en cada movimiento.'
        ]
    },
    {
        id: 'rec-2',
        categoria: 'Postura y entorno',
        titulo: 'Cómo usar el espejo para guiar tus movimientos',
        descripcion: 'Observa ambos lados del rostro con calma para mantener simetría sin forzar los músculos.',
        miniatura: '../../img/logo-paciente.jpg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Ubica el espejo a la altura de tus ojos para no inclinar el cuello.',
            'Realiza el gesto despacio comparando ambos lados del rostro.',
            'Evita apretar la mandíbula o tensionar los hombros mientras miras.'
        ]
    },
    {
        id: 'rec-3',
        categoria: 'Respiración y ritmo',
        titulo: 'Respira con calma entre cada repetición',
        descripcion: 'Inhala suave por la nariz y exhala despacio para evitar tensión en cuello y hombros.',
        miniatura: '../../img/logo-paciente.jpg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Inhala suavemente por la nariz durante 3 segundos antes de empezar.',
            'Suelta el aire despacio mientras relajas los músculos faciales.',
            'Haz una pausa breve si sientes que te falta el aire.'
        ]
    },
    {
        id: 'rec-4',
        categoria: 'Respiración y ritmo',
        titulo: 'Respeta tu ritmo y descansa cuando lo necesites',
        descripcion: 'La calidad del movimiento importa más que la velocidad. Haz pausas cortas entre ejercicios.',
        miniatura: '../../img/logo-paciente.jpg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Avanza a una velocidad cómoda; no intentes apresurar las repeticiones.',
            'Descansa 20 a 30 segundos entre cada actividad de tu rutina.',
            'Usa el botón de pausa siempre que necesites tomar agua o relajarte.'
        ]
    },
    {
        id: 'rec-5',
        categoria: 'Seguridad y constancia',
        titulo: 'Cuándo detenerte y avisar a tu especialista',
        descripcion: 'Si sientes mareo, dolor agudo o fatiga excesiva, detén la sesión y descansa de inmediato.',
        miniatura: '../../img/logo-paciente.jpg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Los ejercicios deben ser suaves y nunca provocar dolor intenso.',
            'Si aparece mareo o cansancio fuerte, pausa y recuéstate un momento.',
            'Comenta cualquier molestia a tu especialista o cuidador antes de retomar.'
        ]
    },
    {
        id: 'rec-6',
        categoria: 'Seguridad y constancia',
        titulo: 'Crea un horario fijo para mantener tu avance',
        descripcion: 'Elegir una hora tranquila del día te ayuda a convertir tu rutina terapéutica en un hábito.',
        miniatura: '../../img/logo-paciente.jpg',
        videoUrl: DEFAULT_VIDEO_URL,
        pasos: [
            'Escoge un momento del día en el que te sientas con mayor energía.',
            'Mantén tu espejo y silla listos en el mismo lugar de la casa.',
            'Celebra cada sesión completada revisando tu progreso semanal.'
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

    function abrirModalVideo(recursoId) {
        const item = RECURSOS_PACIENTE.find(r => r.id === recursoId);
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
        vmIframe.src = ''; // Detiene el video al cerrar
    }

    btnCloseVideo.addEventListener('click', cerrarModalVideo);
    btnDoneVideo.addEventListener('click', cerrarModalVideo);
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) cerrarModalVideo();
    });

    function renderizarRecursos(categoria = 'todos') {
        const lista = categoria === 'todos'
            ? RECURSOS_PACIENTE
            : RECURSOS_PACIENTE.filter(r => r.categoria === categoria);

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

    // Delegación de clic en los botones "Ver guía en video"
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
            renderizarRecursos(btn.dataset.filter);
        });
    });

    renderizarRecursos('todos');

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