// Valida el body al crear un movimiento de inventario
//
// CAMBIO DE MODELO:
//   Antes id_lote era obligatorio. Ahora el enlace principal es
//   id_produccion (+ id_ocupacion_origen). id_lote queda como legado
//   opcional, así que ya NO se exige.
export const validarMovimiento = (req, res, next) => {
    const {
        id_lote,
        id_produccion,
        id_ocupacion_origen,
        tipo_movimiento,
        id_camara_origen,
        id_camara_destino,
        fecha_movimiento,
        hora_movimiento,
        cantidad_tarimas,
        cantidad_cajas,
        temperatura
    } = req.body;

    // ----- Tipo de movimiento (obligatorio) -----
    if (
        tipo_movimiento === undefined ||
        tipo_movimiento === null ||
        isNaN(Number(tipo_movimiento)) ||
        ![1, 2, 3].includes(Number(tipo_movimiento))
    ) {
        return res.status(400).json({
            error: 'El campo "tipo_movimiento" es obligatorio (1=ingreso_preenfrio, 2=preenfrio_a_conserva, 3=salida_despacho)'
        });
    }

    // ----- Numéricos opcionales -----
    const numericos = {
        id_lote,
        id_produccion,
        id_ocupacion_origen,
        id_camara_origen,
        id_camara_destino
    };
    for (const [campo, valor] of Object.entries(numericos)) {
        if (
            valor !== undefined &&
            valor !== null &&
            valor !== "" &&
            isNaN(Number(valor))
        ) {
            return res.status(400).json({
                error: `El campo "${campo}" debe ser numérico`
            });
        }
    }

    // ----- Coherencia por tipo de movimiento -----
    if (Number(tipo_movimiento) === 1 && !id_camara_destino) {
        return res.status(400).json({
            error: "Un ingreso a preenfrío (tipo=1) requiere id_camara_destino"
        });
    }
    if (
        Number(tipo_movimiento) === 2 &&
        (!id_camara_origen || !id_camara_destino)
    ) {
        return res.status(400).json({
            error: "Un movimiento preenfrío→conservación (tipo=2) requiere id_camara_origen e id_camara_destino"
        });
    }
    if (
        Number(tipo_movimiento) === 2 &&
        Number(id_camara_origen) === Number(id_camara_destino)
    ) {
        return res.status(400).json({
            error: "La cámara de origen y destino no pueden ser la misma"
        });
    }
    if (Number(tipo_movimiento) === 3 && !id_camara_origen) {
        return res.status(400).json({
            error: "Una salida por despacho (tipo=3) requiere id_camara_origen"
        });
    }

    // ----- Fecha y hora -----
    if (!fecha_movimiento || isNaN(Date.parse(fecha_movimiento))) {
        return res.status(400).json({
            error: 'El campo "fecha_movimiento" es obligatorio y debe ser una fecha válida'
        });
    }
    if (!hora_movimiento || typeof hora_movimiento !== "string") {
        return res.status(400).json({
            error: 'El campo "hora_movimiento" es obligatorio (formato HH:MM o HH:MM:SS)'
        });
    }

    // ----- Cantidades -----
    if (
        cantidad_tarimas === undefined ||
        cantidad_tarimas === null ||
        isNaN(Number(cantidad_tarimas)) ||
        Number(cantidad_tarimas) < 0
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_tarimas" es obligatorio y debe ser numérico (>= 0)'
        });
    }
    if (
        cantidad_cajas === undefined ||
        cantidad_cajas === null ||
        isNaN(Number(cantidad_cajas)) ||
        Number(cantidad_cajas) < 0
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_cajas" es obligatorio y debe ser numérico (>= 0)'
        });
    }
    if (Number(cantidad_tarimas) <= 0 && Number(cantidad_cajas) <= 0) {
        return res.status(400).json({
            error: "Debes mover al menos una tarima o caja"
        });
    }

    if (
        temperatura !== undefined &&
        temperatura !== null &&
        temperatura !== "" &&
        isNaN(Number(temperatura))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura" debe ser numérico'
        });
    }

    next();
};

// Valida que el id (movimiento) en params sea numérico
export const validarIdMovimiento = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de movimiento debe ser un número válido"
        });
    }
    next();
};
