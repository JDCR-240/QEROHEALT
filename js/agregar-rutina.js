const QERO_CATALOG_KEY = 'qerohealth_catalogo_v3';

function extraerYoutubeId(input) {
    if (!input) return '';
    const texto = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(texto)) return texto;
    const match = texto.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
}

function comprimirImagen(file, maxAncho = 600, calidad = 0.72) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const escala = Math.min(1, maxAncho / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', calidad));
            };
            img.onerror = () => resolve(null);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-routine-form');
    const stepsList = document.getElementById('routine-steps-list');
    const btnAddStep = document.getElementById('btn-add-step');

    function renumerarPasos() {
        stepsList.querySelectorAll('.step-input-row').forEach((row, idx) => {
            row.querySelector('.step-input-badge').textContent = `Paso ${idx + 1}`;
        });
    }

    function crearFilaPaso() {
        const row = document.createElement('div');
        row.className = 'step-input-row';
        row.innerHTML = `
            <div class="step-input-top">
                <span class="step-input-badge">Paso</span>
                <button type="button" class="step-remove-btn" title="Quitar paso">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <input type="text" class="form-input-page step-desc-input" placeholder="Indicación de este paso (ej. Inhalar lento 3 seg.)" required>
            <input type="file" class="form-input-page file-input-page step-file-input" accept="image/*">
        `;

        row.querySelector('.step-remove-btn').addEventListener('click', () => {
            if (stepsList.children.length > 1) {
                row.remove();
                renumerarPasos();
            }
        });

        stepsList.appendChild(row);
        renumerarPasos();
    }

    // Arranca con Paso 1 listo
    crearFilaPaso();
    btnAddStep.addEventListener('click', crearFilaPaso);

    // Guardar rutina y volver al catálogo
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-routine');
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const nombre = document.getElementById('routine-name').value.trim();
        const categoria = document.getElementById('routine-category').value;
        const descripcion = document.getElementById('routine-desc').value.trim();
        const youtubeInput = document.getElementById('routine-youtube').value.trim();
        const thumbFile = document.getElementById('routine-thumb').files[0];

        // 1. Miniatura: foto subida -> si no, miniatura de YouTube -> si no, imagen por defecto
        const ytId = extraerYoutubeId(youtubeInput);
        let imagenPortada = ytId
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
            : '../../img/catalogo.jpg';

        if (thumbFile) {
            const comprimida = await comprimirImagen(thumbFile);
            if (comprimida) imagenPortada = comprimida;
        }

        // 2. Pasos dinámicos (alimentan Imágenes + Guías en rutina.html)
        const filas = Array.from(stepsList.querySelectorAll('.step-input-row'));
        const pasosImagenes = [];
        const guia = [];

        for (let i = 0; i < filas.length; i++) {
            const textoPaso = filas[i].querySelector('.step-desc-input').value.trim();
            const archivoPaso = filas[i].querySelector('.step-file-input').files[0];

            let fotoPaso = '../../img/paso.webp';
            if (archivoPaso) {
                const fotoComp = await comprimirImagen(archivoPaso);
                if (fotoComp) fotoPaso = fotoComp;
            }

            pasosImagenes.push({
                titulo: `Paso ${i + 1}`,
                imagen: fotoPaso,
                detalle: textoPaso
            });
            guia.push(textoPaso);
        }

        const raw = localStorage.getItem(QERO_CATALOG_KEY);
        const ejercicios = raw ? JSON.parse(raw) : [];

        const nuevoEjercicio = {
            id: `EJ-${Date.now().toString().slice(-4)}`,
            nombre,
            categoria,
            descripcion,
            imagen: imagenPortada,
            youtubeId: youtubeInput,
            pasosImagenes,
            guia,
            esCustom: true
        };

        ejercicios.unshift(nuevoEjercicio);
        try {
            localStorage.setItem(QERO_CATALOG_KEY, JSON.stringify(ejercicios));
            window.location.href = 'catalogo.html';
        } catch (err) {
            alert('Se alcanzó el límite de almacenamiento del navegador. Intenta subir menos fotos.');
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar rutina';
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
});