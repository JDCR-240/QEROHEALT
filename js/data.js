const QERO_STORAGE_KEY = 'qerohealth_data_v5';

const BANCO_EJERCICIOS = {
    facial: [
        {
            ejercicioId: 'EJ-05',
            nombre: 'Redondeo y estiramiento de labios',
            categoria: 'Rostro',
            repeticiones: 10,
            tiempo: '3 min',
            indicacion: 'Alternar posición de beso y sonrisa amplia frente al espejo sin forzar el lado afectado.'
        },
        {
            ejercicioId: 'EJ-06',
            nombre: 'Elevación simétrica de cejas',
            categoria: 'Rostro',
            repeticiones: 12,
            tiempo: '2 min',
            indicacion: 'Elevar ambas cejas sosteniendo 3 segundos y relajar suavemente.'
        },
        {
            ejercicioId: 'EJ-07',
            nombre: 'Inflado alternado de mejillas',
            categoria: 'Rostro',
            repeticiones: 10,
            tiempo: '3 min',
            indicacion: 'Retener aire en las mejillas y pasarlo lentamente de un lado al otro.'
        },
        {
            ejercicioId: 'EJ-08',
            nombre: 'Cierre ocular suave controlado',
            categoria: 'Rostro',
            repeticiones: 10,
            tiempo: '2 min',
            indicacion: 'Cerrar ambos párpados despacio sin tensionar el cuello ni la mandíbula.'
        },
        {
            ejercicioId: 'EJ-10',
            nombre: 'Respiración relajada frente al espejo',
            categoria: 'Respiración',
            repeticiones: 8,
            tiempo: '3 min',
            indicacion: 'Inhalar por la nariz y soltar el aire relajando toda la musculatura facial.'
        }
    ],
    lenguaje: [
        {
            ejercicioId: 'EJ-01',
            nombre: 'Vocalización sostenida (A-E-I-O-U)',
            categoria: 'Lenguaje',
            repeticiones: 10,
            tiempo: '4 min',
            indicacion: 'Pronunciar cada vocal de forma prolongada manteniendo la apertura bucal controlada.'
        },
        {
            ejercicioId: 'EJ-03',
            nombre: 'Lectura pausada en voz alta',
            categoria: 'Lenguaje',
            repeticiones: 8,
            tiempo: '3 min',
            indicacion: 'Leer frases cortas marcando pausas respiratorias y entonación clara.'
        },
        {
            ejercicioId: 'EJ-09',
            nombre: 'Respiración diafragmática guiada',
            categoria: 'Respiración',
            repeticiones: 8,
            tiempo: '4 min',
            indicacion: 'Inhalar lento por la nariz expandiendo el abdomen y exhalar suavemente por la boca.'
        },
        {
            ejercicioId: 'EJ-02',
            nombre: 'Movilidad lingual dirigida',
            categoria: 'Rostro',
            repeticiones: 10,
            tiempo: '3 min',
            indicacion: 'Desplazar la lengua de comisura a comisura con ritmo pausado y sin apuro.'
        },
        {
            ejercicioId: 'EJ-04',
            nombre: 'Articulación de sílabas rítmicas',
            categoria: 'Lenguaje',
            repeticiones: 12,
            tiempo: '3 min',
            indicacion: 'Repetir secuencias pausadas (pa-ta-ka) manteniendo claridad vocal.'
        }
    ]
};

function obtenerMinutos(tiempoStr) {
    const match = String(tiempoStr || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
}

function generarRutinaActualPorDefecto(paciente, cantidadEjercicios = 4) {
    const esFacial = (paciente.area || '').toLowerCase().includes('facial');
    const banco = esFacial ? BANCO_EJERCICIOS.facial : BANCO_EJERCICIOS.lenguaje;
    const total = Math.max(3, Math.min(banco.length, cantidadEjercicios));

    const avObjetivo = Math.max(0, Math.min(100, Number(paciente.avance ?? 0)));
    const completadosInit = Math.min(total, Math.round((avObjetivo / 100) * total));

    const rutinaAsignada = banco.slice(0, total).map((ej, idx) => ({
        ...ej,
        completado: idx < completadosInit
    }));

    return {
        nombreRutina: esFacial
            ? 'Rutina de movilidad facial · Semana actual'
            : 'Rutina de lenguaje y rostro · Semana actual',
        rutinaAsignada
    };
}

function generarHistorialPorDefecto(paciente) {
    const esFacial = (paciente.area || '').toLowerCase().includes('facial');
    const bancoEj = esFacial ? BANCO_EJERCICIOS.facial : BANCO_EJERCICIOS.lenguaje;

    const bancoPlantillas = esFacial
        ? [
            'Rutina de movilidad facial',
            'Rutina de simetría y labios',
            'Rutina de control ocular y cejas',
            'Rutina de activación facial suave',
            'Rutina de relajación y mejillas',
            'Evaluación inicial de movilidad facial'
        ]
        : [
            'Rutina de lenguaje y rostro',
            'Rutina de articulación y soplo',
            'Rutina de vocalización guiada',
            'Rutina de respiración y habla',
            'Rutina de lectura pausada',
            'Evaluación inicial fono-respiratoria'
        ];

    const notasBanco = [
        'Buena tolerancia al ritmo indicado, sin signos de fatiga.',
        'Sesión registrada dentro del plan progresivo.',
        'Mejor control respiratorio durante las pausas.',
        'Se recomienda mantener el mismo ritmo en la siguiente semana.',
        'Ejecutó los ejercicios con apoyo visual sin dificultad.'
    ];

    const cantidad = 6;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const historial = [];

    for (let i = 0; i < cantidad; i++) {
        const fechaObj = new Date(2026, 10, 17); // 17 Nov 2026 hacia atrás
        fechaObj.setDate(fechaObj.getDate() - (i * 7));
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = meses[fechaObj.getMonth()];
        const fechaStr = `${dia} ${mes} ${fechaObj.getFullYear()}`;

        const ejCount = 3 + (i % 3); // 3, 4 o 5 ejercicios
        const esParcial = i % 3 === 1;
        const completados = esParcial ? Math.max(1, ejCount - 1) : ejCount;

        const ejercicios = [];
        let minutosTotal = 0;
        for (let j = 0; j < ejCount; j++) {
            const base = bancoEj[(i + j) % bancoEj.length];
            minutosTotal += obtenerMinutos(base.tiempo);
            ejercicios.push({
                ...base,
                completado: j < completados
            });
        }

        const avanceExacto = Math.round((completados / ejCount) * 100);
        const tituloBase = bancoPlantillas[i % bancoPlantillas.length];
        const semana = cantidad - i;
        const nombre = tituloBase.startsWith('Evaluación')
            ? tituloBase
            : `${tituloBase} · Semana ${semana}`;

        historial.push({
            id: `HIST-${paciente.id}-${i + 1}`,
            nombre,
            fecha: fechaStr,
            estado: avanceExacto === 100 ? 'Completada' : 'Parcial',
            avance: avanceExacto,
            duracion: `${minutosTotal} min`,
            ejerciciosCount: ejCount,
            ejercicios,
            notas: notasBanco[i % notasBanco.length]
        });
    }

    return historial;
}

function generarDatosIniciales() {
    const pacientesBase = [
        {
            id: 'QH-1001',
            iniciales: 'MG',
            nombre: 'Marta González',
            edad: 64,
            condicion: 'ACV isquémico',
            area: 'Lenguaje / rostro',
            ladoAfectado: 'Izquierdo',
            cuidadora: 'Sofía González',
            estado: 'activo',
            ultimaActividad: 'Sesión hoy · 18 min',
            avance: 100,
            etiqueta: '100%',
            nivel: 'green'
        },
        {
            id: 'QH-1002',
            iniciales: 'CR',
            nombre: 'Carlos Ruiz',
            edad: 58,
            condicion: 'Parálisis facial',
            area: 'Movilidad facial',
            ladoAfectado: 'Derecho',
            cuidadora: 'Elena Ruiz',
            estado: 'seguimiento',
            ultimaActividad: 'Última sesión: ayer',
            avance: 50,
            etiqueta: '50%',
            nivel: 'amber'
        },
        {
            id: 'QH-1003',
            iniciales: 'AL',
            nombre: 'Ana López',
            edad: 71,
            condicion: 'Disartria leve',
            area: 'Lenguaje / habla',
            ladoAfectado: 'Derecho',
            cuidadora: 'Pedro López',
            estado: 'alerta',
            ultimaActividad: 'Sin actividad · 5 días',
            avance: 0,
            etiqueta: 'Pend.',
            nivel: 'red'
        }
    ];

    const nombresExtra = [
        'José Sánchez', 'María Salazar', 'Luis Fernández', 'Carmen Torres',
        'Jorge Ramírez', 'Rosa Morales', 'Miguel Castro', 'Lucía Vargas',
        'Pedro Mendoza', 'Elena Paredes', 'Raúl Quispe', 'Teresa Flores',
        'Víctor Rojas', 'Patricia Díaz', 'Manuel Herrera', 'Gloria Núñez',
        'Héctor Medina', 'Silvia Chávez', 'Óscar Ríos', 'Beatriz Vega',
        'Ricardo Silva', 'Nadia Campos', 'Julio Navarro', 'Mónica León'
    ];

    const condiciones = [
        'ACV isquémico',
        'Parálisis facial',
        'Disartria leve',
        'Afasia motora'
    ];

    const cuidadores = [
        'Andrea Sánchez', 'Diego Salazar', 'Valeria Fernández', 'Marco Torres',
        'Paula Ramírez', 'Daniel Morales', 'Camila Castro', 'Mateo Vargas',
        'Claudia Mendoza', 'Renato Paredes', 'Fiorella Quispe', 'Gabriel Flores',
        'Natalia Rojas', 'Bruno Díaz', 'Karla Herrera', 'Sebastián Núñez',
        'Adriana Medina', 'Rodrigo Chávez', 'Alejandra Ríos', 'Lucas Vega',
        'Daniela Silva', 'Esteban Campos', 'Lorena Navarro', 'Felipe León'
    ];

    const perfilesActividad = [
        { estado: 'seguimiento', ultimaActividad: 'Hace 2 días · 10 min', avance: 60, etiqueta: '60%', nivel: 'amber', ejCount: 5 },
        { estado: 'alerta', ultimaActividad: 'Sin actividad · 7 días', avance: 0, etiqueta: 'Pend.', nivel: 'red', ejCount: 4 },
        { estado: 'activo', ultimaActividad: 'Sesión hoy · 15 min', avance: 100, etiqueta: '100%', nivel: 'green', ejCount: 4 },
        { estado: 'activo', ultimaActividad: 'Sesión hoy · 20 min', avance: 80, etiqueta: '80%', nivel: 'green', ejCount: 5 },
        { estado: 'seguimiento', ultimaActividad: 'Última sesión: ayer', avance: 50, etiqueta: '50%', nivel: 'amber', ejCount: 4 },
        { estado: 'alerta', ultimaActividad: 'Sin actividad · 6 días', avance: 20, etiqueta: '20%', nivel: 'red', ejCount: 5 }
    ];

    const pacientesGenerados = nombresExtra.map((nombre, i) => {
        const partes = nombre.split(' ');
        const iniciales = `${partes[0][0]}${partes[1][0]}`.toUpperCase();
        const condicion = condiciones[i % condiciones.length];
        const perfil = perfilesActividad[i % perfilesActividad.length];

        return {
            id: `QH-${1004 + i}`,
            iniciales,
            nombre,
            edad: 50 + ((i * 3) % 28),
            condicion,
            area: condicion === 'Parálisis facial' ? 'Movilidad facial' : 'Lenguaje / rostro',
            ladoAfectado: i % 2 === 0 ? 'Derecho' : 'Izquierdo',
            cuidadora: cuidadores[i],
            estado: perfil.estado,
            ultimaActividad: perfil.ultimaActividad,
            avance: perfil.avance,
            etiqueta: perfil.etiqueta,
            nivel: perfil.nivel,
            _ejCountInit: perfil.ejCount
        };
    });

    const todos = [...pacientesBase, ...pacientesGenerados].map((p, idx) => {
        const ejCount = p._ejCountInit || (idx === 0 ? 5 : 4);
        const { _ejCountInit, ...pacienteLimpio } = p;
        const rutinaActual = generarRutinaActualPorDefecto(pacienteLimpio, ejCount);

        return {
            ...pacienteLimpio,
            nombreRutina: rutinaActual.nombreRutina,
            rutinaAsignada: rutinaActual.rutinaAsignada,
            historialRutinas: generarHistorialPorDefecto(pacienteLimpio)
        };
    });

    return {
        especialista: {
            nombre: 'Lic. Elena Vargas',
            iniciales: 'EV'
        },
        pacientes: todos
    };
}

function getQeroData() {
    const raw = localStorage.getItem(QERO_STORAGE_KEY);
    let data = raw ? JSON.parse(raw) : generarDatosIniciales();
    let huboCambios = !raw;

    data.pacientes.forEach(p => {
        if (!Array.isArray(p.rutinaAsignada) || p.rutinaAsignada.length === 0) {
            const rutinaActual = generarRutinaActualPorDefecto(p, 4);
            p.nombreRutina = p.nombreRutina || rutinaActual.nombreRutina;
            p.rutinaAsignada = rutinaActual.rutinaAsignada;
            huboCambios = true;
        }
        if (!Array.isArray(p.historialRutinas) || p.historialRutinas.length < 5) {
            p.historialRutinas = generarHistorialPorDefecto(p);
            huboCambios = true;
        }

        // 1. Asegurar campos completos en cada ejercicio y sincronizar porcentaje exacto
        const totalEj = p.rutinaAsignada.length;
        if (totalEj > 0) {
            const tieneEstados = p.rutinaAsignada.some(ej => typeof ej.completado === 'boolean');
            if (!tieneEstados) {
                const avActual = Math.max(0, Math.min(100, Number(p.avance ?? 0)));
                const completadosInit = Math.min(totalEj, Math.round((avActual / 100) * totalEj));
                p.rutinaAsignada.forEach((ej, idx) => {
                    ej.completado = idx < completadosInit;
                });
                huboCambios = true;
            } else {
                p.rutinaAsignada.forEach(ej => {
                    if (typeof ej.completado !== 'boolean') {
                        ej.completado = false;
                        huboCambios = true;
                    }
                    if (!ej.categoria) { ej.categoria = 'Rehabilitación'; huboCambios = true; }
                    if (!ej.tiempo) { ej.tiempo = '3 min'; huboCambios = true; }
                    if (!ej.indicacion) { ej.indicacion = 'Realizar con calma, manteniendo postura cómoda.'; huboCambios = true; }
                });
            }

            const completadosReales = p.rutinaAsignada.filter(ej => ej.completado).length;
            const avanceExacto = Math.round((completadosReales / totalEj) * 100);

            if (p.avance !== avanceExacto) {
                p.avance = avanceExacto;
                huboCambios = true;
            }

            // 2. Regla de semáforo unificada (Verde >= 70%, Ámbar 40-69%, Rojo < 40% o alerta)
            const esNuevaHoy = String(p.ultimaActividad || '').includes('Nueva rutina asignada');

            if (esNuevaHoy && avanceExacto === 0) {
                if (p.estado !== 'seguimiento' || p.nivel !== 'amber' || p.etiqueta !== '0%') {
                    p.estado = 'seguimiento';
                    p.nivel = 'amber';
                    p.etiqueta = '0%';
                    huboCambios = true;
                }
            } else if (avanceExacto >= 70) {
                if (p.estado !== 'activo' || p.nivel !== 'green' || p.etiqueta !== `${avanceExacto}%`) {
                    p.estado = 'activo';
                    p.nivel = 'green';
                    p.etiqueta = `${avanceExacto}%`;
                    huboCambios = true;
                }
            } else if (avanceExacto >= 40) {
                if (p.estado !== 'seguimiento' || p.nivel !== 'amber' || p.etiqueta !== `${avanceExacto}%`) {
                    p.estado = 'seguimiento';
                    p.nivel = 'amber';
                    p.etiqueta = `${avanceExacto}%`;
                    huboCambios = true;
                }
            } else {
                const etiquetaRoja = avanceExacto === 0 ? 'Pend.' : `${avanceExacto}%`;
                if (p.estado !== 'alerta' || p.nivel !== 'red' || p.etiqueta !== etiquetaRoja) {
                    p.estado = 'alerta';
                    p.nivel = 'red';
                    p.etiqueta = etiquetaRoja;
                    huboCambios = true;
                }
            }
        }
    });

    if (huboCambios) {
        saveQeroData(data);
    }
    return data;
}

function saveQeroData(data) {
    localStorage.setItem(QERO_STORAGE_KEY, JSON.stringify(data));
}