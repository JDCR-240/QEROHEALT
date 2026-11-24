const TUTORIALES_QERO = [
    {
        id: 'tut-pac-rutina',
        rol: 'paciente',
        rolLabel: 'Paciente',
        icono: 'fa-play',
        titulo: 'Completar tu rutina diaria paso a paso',
        descripcion: 'Aprende a iniciar tus ejercicios, pausar cuando lo necesites y registrar tu avance.',
        pasos: [
            {
                icono: 'fa-house',
                titulo: '1. Entra a "Mi rutina" desde el menú',
                texto: 'Revisa el nombre de tu rutina asignada, la duración estimada y los ejercicios programados para hoy.',
                consejo: 'Asegúrate de tener una silla firme y un espejo a la altura de tu rostro antes de comenzar.'
            },
            {
                icono: 'fa-circle-pause',
                titulo: '2. Avanza a tu ritmo o pausa en cualquier momento',
                texto: 'Realiza los movimientos con calma sin forzar. Si sientes cansancio, puedes pausar y tu avance se mantiene.',
                consejo: 'La calidad del movimiento importa más que la velocidad.'
            },
            {
                icono: 'fa-chart-line',
                titulo: '3. Revisa tu progreso en "Avance"',
                texto: 'Al marcar tus ejercicios completados verás cómo sube tu porcentaje semanal y los minutos acumulados.',
                consejo: 'Mantener un horario fijo cada día facilita crear el hábito.'
            }
        ]
    },
    {
        id: 'tut-pac-guias',
        rol: 'paciente',
        rolLabel: 'Paciente',
        icono: 'fa-book-open',
        titulo: 'Consultar guías y consejos en video',
        descripcion: 'Filtra recomendaciones por categoría y revisa los puntos clave antes de practicar.',
        pasos: [
            {
                icono: 'fa-filter',
                titulo: '1. Filtra según lo que necesites',
                texto: 'Usa los botones de categoría para ver consejos de postura, respiración o seguridad y constancia.',
                consejo: 'Si es tu primera sesión del día, empieza por postura y entorno.'
            },
            {
                icono: 'fa-circle-play',
                titulo: '2. Abre la guía y sigue los pasos',
                texto: 'Al abrir una tarjeta verás el video demostrativo junto con la lista breve de preparación.',
                consejo: 'Cierra la ventana cuando termines para detener el video automáticamente.'
            }
        ]
    },
    {
        id: 'tut-cui-seguimiento',
        rol: 'cuidador',
        rolLabel: 'Cuidador',
        icono: 'fa-chart-line',
        titulo: 'Revisar la rutina actual y semanas anteriores',
        descripcion: 'Consulta el avance del paciente, filtra ejercicios y compara semanas pasadas.',
        pasos: [
            {
                icono: 'fa-list-check',
                titulo: '1. Revisa el avance y filtra ejercicios',
                texto: 'En "Seguimiento" verás el porcentaje vigente y podrás filtrar entre todos, completados o pendientes.',
                consejo: 'Usa el botón de expandir si la rutina tiene más ejercicios de los mostrados al inicio.'
            },
            {
                icono: 'fa-clock-rotate-left',
                titulo: '2. Explora el historial de semanas anteriores',
                texto: 'Abre "Explorar historial" y elige "Ver esta rutina" en cualquier semana previa para cargarla en el panel.',
                consejo: 'Usa "Volver a la rutina actual" en la franja superior para regresar a la semana vigente.'
            }
        ]
    },
    {
        id: 'tut-cui-especialista',
        rol: 'cuidador',
        rolLabel: 'Cuidador',
        icono: 'fa-user-doctor',
        titulo: 'Enviar consultas etiquetando ejercicios',
        descripcion: 'Comunica dudas o fatiga al especialista vinculando un ejercicio específico de la rutina actual.',
        pasos: [
            {
                icono: 'fa-tags',
                titulo: '1. Selecciona el motivo y etiqueta el ejercicio',
                texto: 'Elige un chip de motivo y selecciona en el desplegable el ejercicio de la rutina vigente sobre el que consultas.',
                consejo: 'Etiquetar el ejercicio ayuda a que la consulta sea mucho más clara.'
            },
            {
                icono: 'fa-paper-plane',
                titulo: '2. Envía y revisa tu bandeja',
                texto: 'Escribe tu observación y presiona enviar; el mensaje quedará registrado en "Consultas enviadas".',
                consejo: 'Puedes expandir las consultas anteriores cuando tengas varios mensajes guardados.'
            }
        ]
    },
    {
        id: 'tut-esp-pacientes',
        rol: 'especialista',
        rolLabel: 'Especialista',
        icono: 'fa-users',
        titulo: 'Buscar, ordenar y registrar pacientes',
        descripcion: 'Gestiona tu cartera filtrando por nombre o ID, ordenando por adherencia o agregando nuevos pacientes.',
        pasos: [
            {
                icono: 'fa-magnifying-glass',
                titulo: '1. Busca y ordena tu cartera',
                texto: 'Escribe un nombre o código en el buscador o usa los chips de orden (100% a Alerta, Alerta a 100%, A - Z, Z - A).',
                consejo: 'Expande la lista con "Mostrar más pacientes" para usar el scroll interno sin estirar la página.'
            },
            {
                icono: 'fa-user-plus',
                titulo: '2. Agrega un nuevo paciente cuando lo necesites',
                texto: 'Haz clic en "Agregar paciente", completa nombre, edad, condición y cuidador, y guarda.',
                consejo: 'Si eliges "Otro" en condición, se habilitará un campo para especificarla.'
            }
        ]
    },
    {
        id: 'tut-esp-seguimiento',
        rol: 'especialista',
        rolLabel: 'Especialista',
        icono: 'fa-users-viewfinder',
        titulo: 'Monitoreo global y detalle por paciente',
        descripcion: 'Observa el promedio de toda tu cartera o entra a un paciente para revisar su rutina actual y anteriores.',
        pasos: [
            {
                icono: 'fa-chart-pie',
                titulo: '1. Revisa el panorama general',
                texto: 'Al entrar a "Seguimiento" verás la adherencia promedio de tus pacientes y la distribución por área.',
                consejo: 'Los colores indican verde (70%+), ámbar/naranja (40%-69%) y rojo (<40% o alerta).'
            },
            {
                icono: 'fa-user-check',
                titulo: '2. Selecciona un paciente y su semana',
                texto: 'Pulsa "Seleccionar paciente", elige uno y selecciona su rutina actual o una semana anterior en el modal.',
                consejo: 'Al terminar, usa "Volver al resumen general" para regresar a la vista global.'
            }
        ]
    }
];

function detectarRolActivo() {
    const rolGuardado = (localStorage.getItem('qero_rol') || localStorage.getItem('qero_role') || '').toLowerCase();
    if (rolGuardado.includes('especialista')) return 'especialista';
    if (rolGuardado.includes('cuidador')) return 'cuidador';
    if (rolGuardado.includes('paciente')) return 'paciente';

    const ref = (document.referrer || '').toLowerCase();
    if (ref.includes('/especialista/')) return 'especialista';
    if (ref.includes('/cuidador/')) return 'cuidador';
    return 'paciente';
}

function configurarHeaderPorRol(rol) {
    const brandLink = document.getElementById('ay-brand-link');
    const navEl = document.getElementById('ay-dynamic-nav');
    const badgeEl = document.getElementById('ay-role-badge');

    const config = {
        paciente: {
            label: 'Paciente',
            panelHref: 'paciente/panel.html',
            links: [
                { href: 'paciente/panel.html', icon: 'fa-house', text: 'Inicio' },
                { href: 'paciente/mi-rutina.html', icon: 'fa-play', text: 'Mi rutina' },
                { href: 'paciente/avance.html', icon: 'fa-chart-line', text: 'Avance' },
                { href: 'paciente/recursos.html', icon: 'fa-book-open', text: 'Guías' }
            ]
        },
        cuidador: {
            label: 'Cuidador',
            panelHref: 'cuidador/panel.html',
            links: [
                { href: 'cuidador/panel.html', icon: 'fa-house', text: 'Inicio' },
                { href: 'cuidador/seguimiento.html', icon: 'fa-chart-line', text: 'Seguimiento' },
                { href: 'cuidador/especialista.html', icon: 'fa-user-doctor', text: 'Especialista' },
                { href: 'cuidador/guias.html', icon: 'fa-book-open', text: 'Guías' }
            ]
        },
        especialista: {
            label: 'Especialista',
            panelHref: 'especialista/panel.html',
            links: [
                { href: 'especialista/panel.html', icon: 'fa-house', text: 'Panel' },
                { href: 'especialista/paciente.html', icon: 'fa-users', text: 'Pacientes' },
                { href: 'especialista/catalogo.html', icon: 'fa-clipboard-list', text: 'Rutinas' },
                { href: 'especialista/seguimiento.html', icon: 'fa-chart-line', text: 'Seguimiento' }
            ]
        }
    }[rol];

    if (brandLink) brandLink.href = config.panelHref;
    if (badgeEl) {
        badgeEl.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${config.label}</span>`;
    }

    if (navEl && navEl.children.length === 0) {
        const itemsHtml = config.links.map(l => `
            <a href="${l.href}" class="app-nav-link">
                <i class="fa-solid ${l.icon}"></i>
                <span>${l.text}</span>
            </a>
        `).join('');

        navEl.innerHTML = `${itemsHtml}
            <a href="ayuda.html" class="app-nav-link active">
                <i class="fa-regular fa-circle-question"></i>
                <span>Ayuda</span>
            </a>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const rolActivo = detectarRolActivo();
    configurarHeaderPorRol(rolActivo);

    const gridEl = document.getElementById('tut-grid');
    const tabBtns = document.querySelectorAll('.tut-tab-btn');

    let filtroRol = 'todos';

    function renderizarTutoriales() {
        const lista = filtroRol === 'todos'
            ? TUTORIALES_QERO
            : TUTORIALES_QERO.filter(t => t.rol === filtroRol);

        gridEl.innerHTML = lista.map(tut => {
            const pasosPreview = tut.pasos.slice(0, 2).map((p, idx) => `
                <span><strong class="tut-step-num">${idx + 1}</strong> ${p.titulo.replace(/^\d+\.\s*/, '')}</span>
            `).join('');

            return `
                <article class="tut-card">
                    <div class="tut-card-top">
                        <div class="tut-icon-box">
                            <i class="fa-solid ${tut.icono}"></i>
                        </div>
                        <span class="tut-role-tag is-${tut.rol}">${tut.rolLabel}</span>
                    </div>

                    <h2 class="tut-card-title">${tut.titulo}</h2>
                    <p class="tut-card-desc">${tut.descripcion}</p>

                    <div class="tut-steps-preview">
                        ${pasosPreview}
                    </div>

                    <button type="button" class="btn btn-primary btn-interactive tut-btn-open" data-tutorial-id="${tut.id}">
                        <i class="fa-solid fa-shoe-prints"></i>
                        <span>Iniciar guía (${tut.pasos.length} pasos)</span>
                    </button>
                </article>
            `;
        }).join('');
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filtroRol = btn.dataset.role;
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));
            renderizarTutoriales();
        });
    });

    // Modal paso a paso
    const modal = document.getElementById('tutorial-modal');
    const btnCloseModal = document.getElementById('btn-close-tutorial');
    const tmRoleTag = document.getElementById('tm-role-tag');
    const tmTitle = document.getElementById('tm-title');
    const tmStepIndicator = document.getElementById('tm-step-indicator');
    const tmDots = document.getElementById('tm-dots');
    const tmStepIcon = document.getElementById('tm-step-icon');
    const tmStepHeading = document.getElementById('tm-step-heading');
    const tmStepText = document.getElementById('tm-step-text');
    const tmStepTipText = document.getElementById('tm-step-tip-text');
    const btnPrevStep = document.getElementById('btn-prev-step');
    const btnNextStep = document.getElementById('btn-next-step');

    let tutorialActual = null;
    let indicePaso = 0;

    function pintarPaso() {
        if (!tutorialActual) return;
        const pasos = tutorialActual.pasos;
        const paso = pasos[indicePaso];

        tmStepIndicator.textContent = `Paso ${indicePaso + 1} de ${pasos.length}`;
        tmDots.innerHTML = pasos.map((_, i) => `<span class="tm-dot ${i === indicePaso ? 'active' : ''}"></span>`).join('');

        tmStepIcon.className = `fa-solid ${paso.icono}`;
        tmStepHeading.textContent = paso.titulo;
        tmStepText.textContent = paso.texto;
        tmStepTipText.textContent = paso.consejo;

        btnPrevStep.disabled = indicePaso === 0;
        btnPrevStep.style.opacity = indicePaso === 0 ? '0.5' : '1';

        const esUltimo = indicePaso === pasos.length - 1;
        btnNextStep.innerHTML = esUltimo
            ? '<i class="fa-solid fa-check"></i> <span>Finalizar</span>'
            : '<span>Siguiente paso</span> <i class="fa-solid fa-arrow-right"></i>';
    }

    function abrirTutorial(id) {
        const found = TUTORIALES_QERO.find(t => t.id === id);
        if (!found) return;
        tutorialActual = found;
        indicePaso = 0;
        tmRoleTag.className = `tut-role-tag is-${found.rol}`;
        tmRoleTag.textContent = found.rolLabel;
        tmTitle.textContent = found.titulo;
        pintarPaso();
        modal.classList.remove('hidden');
        btnNextStep.focus();
    }

    function cerrarTutorial() {
        modal.classList.add('hidden');
        tutorialActual = null;
    }

    gridEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tutorial-id]');
        if (btn) abrirTutorial(btn.dataset.tutorialId);
    });

    btnPrevStep.addEventListener('click', () => {
        if (indicePaso > 0) {
            indicePaso -= 1;
            pintarPaso();
        }
    });

    btnNextStep.addEventListener('click', () => {
        if (!tutorialActual) return;
        if (indicePaso < tutorialActual.pasos.length - 1) {
            indicePaso += 1;
            pintarPaso();
        } else {
            cerrarTutorial();
        }
    });

    btnCloseModal.addEventListener('click', cerrarTutorial);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarTutorial();
    });

    renderizarTutoriales();

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
            cerrarTutorial();
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        sessionStorage.removeItem('qero_paciente_actual_id');
        window.location.href = '../index.html';
    });
});