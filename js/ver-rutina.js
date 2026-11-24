document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idBuscado = params.get('id');

    const data = getQeroData();
    const index = data.pacientes.findIndex(p => p.id === idBuscado);
    const paciente = index !== -1 ? data.pacientes[index] : data.pacientes[0];

    if (!paciente) {
        window.location.href = 'paciente.html';
        return;
    }

    // 1. Botón volver directo a la ficha del paciente (sin bucles)
    document.getElementById('btn-back-patient').href = `paciente-detalle.html?id=${paciente.id}`;

    // Botón Editar rutina
    document.getElementById('btn-editar-rutina').href = `editar-rutina.html?id=${paciente.id}`;

    // 2. Pintar cabecera y contador
    const rutina = Array.isArray(paciente.rutinaAsignada) ? paciente.rutinaAsignada : [];

    document.title = `Rutina de ${paciente.nombre} — QeroHealth`;
    document.getElementById('vr-patient-subtitle').textContent = `${paciente.nombre} · ${paciente.id}`;
    document.getElementById('vr-count-pill').textContent =
        rutina.length === 1 ? '1 ejercicio' : `${rutina.length} ejercicios`;

    // 3. Pintar secuencia de ejercicios en orden
    const lista = document.getElementById('vr-exercises-list');
    lista.innerHTML = '';

    if (rutina.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                Este paciente aún no tiene ejercicios asignados en su rutina.
            </div>
        `;
    } else {
        rutina.forEach((item, idx) => {
            const indicacion = item.indicacion || 'Ejecutar de forma pausada frente al espejo, manteniendo descansos breves entre repeticiones.';
            const freqTexto = item.frecuencia || item.tiempo || 'Diaria';
            const row = document.createElement('article');
            row.className = 'vr-exercise-row';
            row.innerHTML = `
                <div class="vr-exercise-left">
                    <span class="vr-order-badge">${idx + 1}</span>
                    <div class="vr-exercise-info">
                        <h3>${item.nombre}</h3>
                        <div class="vr-exercise-meta">
                            <span class="vr-cat-tag">${item.categoria}</span>
                            <span><i class="fa-solid fa-repeat"></i> ${item.repeticiones} rep.</span>
                            <span><i class="fa-regular fa-calendar"></i> ${freqTexto}</span>
                        </div>
                        <p class="vr-indication">
                            <strong>Indicación:</strong> ${indicacion}
                        </p>
                    </div>
                </div>
                <a href="rutina.html?id=${item.ejercicioId}&pacienteId=${paciente.id}" class="vr-exercise-link">
                    Ver ejercicio <i class="fa-solid fa-chevron-right"></i>
                </a>
            `;
            lista.appendChild(row);
        });
    }

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
        if (e.key === 'Escape') logoutModal.classList.add('hidden');
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('qero_logged_in');
        window.location.href = '../../index.html';
    });
});