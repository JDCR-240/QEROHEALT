const QERO_SESSION_PATIENT_KEY = 'qero_paciente_actual_id';

const NAV_POR_ROL = {
    Paciente: {
        home: 'paciente/panel.html',
        ariaLabel: 'Navegación de paciente',
        links: [
            { href: 'paciente/panel.html', icon: 'fa-solid fa-house', label: 'Inicio' },
            { href: 'paciente/mi-rutina.html', icon: 'fa-solid fa-play', label: 'Mi rutina' },
            { href: 'paciente/avance.html', icon: 'fa-solid fa-chart-line', label: 'Avance' },
            { href: 'paciente/recursos.html', icon: 'fa-solid fa-book-open', label: 'Guias' },
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda', active: true }
        ]
    },
    Especialista: {
        home: 'especialista/panel.html',
        ariaLabel: 'Navegación de especialista',
        links: [
            { href: 'especialista/panel.html', icon: 'fa-solid fa-house', label: 'Panel' },
            { href: 'especialista/paciente.html', icon: 'fa-solid fa-users', label: 'Pacientes' },
            { href: 'especialista/catalogo.html', icon: 'fa-solid fa-clipboard-list', label: 'Rutinas' },
            { href: 'especialista/seguimiento.html', icon: 'fa-solid fa-chart-line', label: 'Seguimiento' },
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda', active: true }
        ]
    },
    Cuidador: {
        home: 'cuidador/panel.html',
        ariaLabel: 'Navegación de cuidador',
        links: [
            { href: 'cuidador/panel.html', icon: 'fa-solid fa-house', label: 'Inicio' },
            { href: 'cuidador/seguimiento.html', icon: 'fa-solid fa-chart-line', label: 'Seguimiento' },
            { href: 'cuidador/especialista.html', icon: 'fa-solid fa-user-doctor', label: 'Especialista' },
            { href: 'cuidador/guias.html', icon: 'fa-solid fa-book-open', label: 'Guías' },
            { href: 'ayuda.html', icon: 'fa-regular fa-circle-question', label: 'Ayuda', active: true }
        ]
    }
};

const FAQ_DATA = {
    General: [
        {
            question: '¿Qué es QeroHealth y cómo apoya en casa?',
            answer: 'QeroHealth es una plataforma web complementaria que guía las prácticas de rehabilitación del lenguaje y la movilidad facial en el hogar tras un ACV o parálisis facial, siguiendo las pautas establecidas por tu especialista.',
            defaultOpen: true
        },
        {
            question: '¿QeroHealth reemplaza las consultas con mi especialista?',
            answer: 'No. QeroHealth complementa el tratamiento entre consultas. El fonoaudiólogo o especialista define los ejercicios, tiempos y repeticiones, y la plataforma ayuda a mantener la constancia en casa.'
        },
        {
            question: '¿Cómo puede ayudar el cuidador o familiar durante la sesión?',
            answer: 'El cuidador cuenta con una vista de seguimiento y guías claras para acompañar la rutina, supervisar los pasos y pausar si el paciente necesita descanso, sin tener que tomar decisiones médicas ni improvisar.'
        },
        {
            question: '¿Puedo cambiar el tamaño del texto o hacer la pantalla más cómoda?',
            answer: 'Sí. Desde el apartado Mi cuenta puedes activar el modo de texto grande y la lectura en voz alta para reducir la fatiga visual tanto en computadora como en celular.'
        },
        {
            question: '¿Qué hago si siento dolor o molestias durante un ejercicio?',
            answer: 'Detén la actividad de inmediato, usa el botón de pausa o descanso y consulta con tu especialista en tu próximo control o canal indicado antes de continuar con ese movimiento.'
        }
    ],
    Rutinas: [
        {
            question: '¿Puedo pausar una actividad y retomarla después?',
            answer: 'Sí. Toca "Pausar" y continúa cuando estés listo. El temporizador y las repeticiones quedan guardados en el punto exacto para que retomes sin perder tu avance.',
            defaultOpen: true
        },
        {
            question: '¿Quién crea y configura mi rutina de ejercicios?',
            answer: 'Tu especialista o fonoaudiólogo configura la rutina personalizada según tu condición, estableciendo el orden de los ejercicios, la duración del temporizador y el número de repeticiones.'
        },
        {
            question: '¿Cómo funcionan el temporizador y el contador de repeticiones?',
            answer: 'Durante cada ejercicio verás el tiempo restante y las repeticiones indicadas en pantalla, junto con apoyos visuales para que no tengas que medir los segundos ni contar manualmente.'
        },
        {
            question: '¿Puedo volver a ver las instrucciones de un ejercicio en curso?',
            answer: 'Sí. Puedes consultar las indicaciones y videos guía en cualquier momento sin perder el progreso registrado en la actividad actual.'
        }
    ],
    Cuenta: [
        {
            question: '¿Cómo funciona la selección de perfiles (Paciente, Cuidador y Especialista)?',
            answer: 'Cada perfil muestra únicamente las funciones que corresponden a su rol: el paciente realiza su rutina guiada, el cuidador acompaña y hace seguimiento, y el especialista administra y configura las rutinas.',
            defaultOpen: true
        },
        {
            question: '¿Cómo se protege la información del perfil y de la rutina?',
            answer: 'El acceso está organizado por perfiles y roles para que cada usuario interactúe únicamente con la información y acciones correspondientes a su participación en el proceso.'
        },
        {
            question: '¿Puedo cambiar de perfil o revisar los datos del paciente asociado?',
            answer: 'Sí. Desde el apartado Mi cuenta puedes verificar el paciente asociado a la rutina activa, actualizar tus datos generales o cambiar entre los perfiles habilitados.'
        },
        {
            question: '¿Qué ocurre si todavía no tengo una rutina asignada?',
            answer: 'Si aún no hay una rutina activa configurada para el perfil, la plataforma te mostrará un aviso claro indicándolo para que puedas coordinarlo con tu especialista.'
        }
    ],
    Progreso: [
        {
            question: '¿Cómo veo mi progreso y las actividades completadas?',
            answer: 'En las secciones de "Avance" o "Seguimiento" puedes ver el porcentaje semanal, las actividades completadas, el tiempo estimado y las que quedan pendientes.',
            defaultOpen: true
        },
        {
            question: '¿Qué pasa si cierro la pantalla antes de terminar toda la rutina?',
            answer: 'Tu avance de las actividades completadas se conserva para que al volver puedas continuar desde la siguiente actividad pendiente sin repetir lo ya realizado.'
        },
        {
            question: '¿Qué veo al terminar el último ejercicio de la sesión?',
            answer: 'Al completar la rutina se muestra un resumen con las actividades realizadas, el tiempo y el avance alcanzado para reforzar la constancia diaria.'
        },
        {
            question: '¿El especialista puede revisar la continuidad de las sesiones en casa?',
            answer: 'Sí. Las sesiones registradas ayudan a que el especialista tenga una referencia organizada de las prácticas realizadas entre consultas y ajuste la rutina cuando sea necesario.'
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const rolGuardado = localStorage.getItem('qero_rol_activo') || 'Paciente';
    const rol = NAV_POR_ROL[rolGuardado] ? rolGuardado : 'Paciente';
    const navConfig = NAV_POR_ROL[rol];

    // 1. Inyectar navegación según el rol activo
    document.getElementById('faq-brand-link').setAttribute('href', navConfig.home);
    const navEl = document.getElementById('faq-dynamic-nav');
    navEl.setAttribute('aria-label', navConfig.ariaLabel);
    navEl.innerHTML = navConfig.links.map(item => `
        <a href="${item.href}" class="app-nav-link ${item.active ? 'active' : ''}">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </a>
    `).join('');

    // 2. Renderizar acordeón de preguntas frecuentes
    const colLeft = document.getElementById('faqColLeft');
    const colRight = document.getElementById('faqColRight');
    const counterEl = document.getElementById('faq-counter');
    const tabs = document.querySelectorAll('.faq-tab-btn');
    const supportModal = document.getElementById('support-modal');
    const btnCloseSupport = document.getElementById('btn-close-support');

    let activeCategory = 'General';

    function createFaqCard(item, index) {
        const card = document.createElement('article');
        card.className = 'faq-card';

        const buttonId = `faq-trigger-${activeCategory.toLowerCase()}-${index}`;
        const panelId = `faq-panel-${activeCategory.toLowerCase()}-${index}`;

        card.innerHTML = `
            <button
                type="button"
                class="faq-trigger"
                id="${buttonId}"
                aria-expanded="false"
                aria-controls="${panelId}"
            >
                <span>${item.question}</span>
                <span class="faq-chevron" aria-hidden="true">
                    <i class="fa-solid fa-chevron-down"></i>
                </span>
            </button>
            <div class="faq-panel" id="${panelId}" role="region" aria-labelledby="${buttonId}">
                <div class="faq-panel-inner">
                    <p class="faq-answer">${item.answer}</p>
                </div>
            </div>
        `;

        const trigger = card.querySelector('.faq-trigger');
        trigger.addEventListener('click', () => {
            const isOpen = card.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', String(isOpen));
        });

        return card;
    }

    function createSupportBanner() {
        const banner = document.createElement('button');
        banner.type = 'button';
        banner.className = 'faq-support-banner';
        banner.innerHTML = `
            <span class="faq-support-icon" aria-hidden="true">
                <i class="fa-regular fa-comment-dots"></i>
            </span>
            <span class="faq-support-text">
                <span class="faq-support-title">¿No encontraste tu respuesta?</span>
                <span class="faq-support-desc">Nuestro equipo de soporte puede orientarte.</span>
            </span>
            <i class="fa-solid fa-chevron-right faq-support-arrow" aria-hidden="true"></i>
        `;

        banner.addEventListener('click', () => {
            supportModal.classList.remove('hidden');
            btnCloseSupport.focus();
        });

        return banner;
    }

    function renderCategory(category) {
        activeCategory = category;
        const items = FAQ_DATA[category] || [];

        counterEl.textContent = `${items.length} ${items.length === 1 ? 'pregunta' : 'preguntas'}`;
        colLeft.innerHTML = '';
        colRight.innerHTML = '';

        // Columna izquierda: primeras preguntas + banner de soporte al final
        const mitad = Math.ceil(items.length / 2);
        items.slice(0, mitad).forEach((item, idx) => {
            colLeft.appendChild(createFaqCard(item, idx));
        });
        colLeft.appendChild(createSupportBanner());

        // Columna derecha: resto de preguntas
        items.slice(mitad).forEach((item, idx) => {
            colRight.appendChild(createFaqCard(item, idx + mitad));
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            renderCategory(tab.dataset.category);
        });
    });

    renderCategory(activeCategory);

    // 3. Modal: Soporte
    btnCloseSupport.addEventListener('click', () => supportModal.classList.add('hidden'));
    supportModal.addEventListener('click', (e) => {
        if (e.target === supportModal) supportModal.classList.add('hidden');
    });

    // 4. Modal: Cerrar sesión
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
            supportModal.classList.add('hidden');
        }
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        sessionStorage.removeItem(QERO_SESSION_PATIENT_KEY);
        window.location.href = '../index.html';
    });
});