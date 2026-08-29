// =========================================================
// VALIDACIONES DE DESPACHOS  (actualizadas tras la migración)
// =========================================================
// CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR
//   · folio_despacho YA NO se exige: lo genera la BD
//     (fn_generar_folio_despacho → D-AAAA-NNNN).
//   · orden_venta, cita, fecha_cita, temperatura_salida, hora_salida y
//     observaciones pasaron a OPCIONALES: el despacho nace como borrador
//     y esos datos se completan al cerrarlo.
//   · id_transporte sigue OBLIGATORIO: el picking list se imprime con los
//     datos del operador y las placas.
//   · En el detalle, id_lote se sustituyó por id_ocupacion_origen (el
//     módulo de lotes se dio de baja). Ese campo es el que permite al
//     trigger descontar del montón correcto.
// =========================================================


// ---------------------------------------------------------
// Valida una línea de detalle (picking)
// ---------------------------------------------------------
const validarLineaDetalle = (linea) => {
    if (!linea || typeof linea !== "object") {
        return "Cada línea de detalle debe ser un objeto válido";
    }

    // Origen del producto: sin esto el trigger no sabe de dónde descontar
    if (!linea.id_ocupacion_origen || isNaN(Number(linea.id_ocupacion_origen))) {
        return 'Cada detalle requiere "id_ocupacion_origen": indica de qué cámara y proceso sale la fruta';
    }

    // Numéricos opcionales
    const opcionales = {
        id_produccion: linea.id_produccion,
        id_camara_origen: linea.id_camara_origen,
        id_bloque: linea.id_bloque
    };
    for (const [campo, valor] of Object.entries(opcionales)) {
        if (
            valor !== undefined &&
            valor !== null &&
            valor !== "" &&
            isNaN(Number(valor))
        ) {
            return `El "${campo}" del detalle debe ser numérico`;
        }
    }

    // Cantidades
    if (
        linea.cantidad_tarimas !== undefined &&
        linea.cantidad_tarimas !== null &&
        (isNaN(Number(linea.cantidad_tarimas)) || Number(linea.cantidad_tarimas) < 0)
    ) {
        return 'La "cantidad_tarimas" del detalle debe ser numérica (>= 0)';
    }
    if (
        linea.cantidad_cajas !== undefined &&
        linea.cantidad_cajas !== null &&
        (isNaN(Number(linea.cantidad_cajas)) || Number(linea.cantidad_cajas) < 0)
    ) {
        return 'La "cantidad_cajas" del detalle debe ser numérica (>= 0)';
    }

    const tarimas = Number(linea.cantidad_tarimas) || 0;
    const cajas = Number(linea.cantidad_cajas) || 0;
    if (tarimas <= 0 && cajas <= 0) {
        return "Cada línea debe despachar al menos una tarima o caja";
    }

    if (
        linea.temperatura !== undefined &&
        linea.temperatura !== null &&
        linea.temperatura !== "" &&
        isNaN(Number(linea.temperatura))
    ) {
        return 'La "temperatura" del detalle debe ser numérica';
    }

    return null;
};


// ---------------------------------------------------------
// Valida el encabezado del despacho (+ detalle opcional)
// ---------------------------------------------------------
export const validarDespacho = (req, res, next) => {
    const {
        id_transporte,
        fecha_despacho,
        hora_salida,
        id_cc,
        orden_venta,
        cita,
        fecha_cita,
        temperatura_salida,
        estado,
        observaciones,
        detalle
    } = req.body;

    // ----- OBLIGATORIOS -----
    if (!id_transporte || isNaN(Number(id_transporte))) {
        return res.status(400).json({
            error: 'El campo "id_transporte" es obligatorio: el picking list requiere los datos del transportista'
        });
    }
    if (!id_cc || isNaN(Number(id_cc))) {
        return res.status(400).json({
            error: 'El campo "id_cc" (cedis-cliente) es obligatorio y debe ser numérico'
        });
    }
    if (!fecha_despacho || isNaN(Date.parse(fecha_despacho))) {
        return res.status(400).json({
            error: 'El campo "fecha_despacho" es obligatorio y debe ser una fecha válida'
        });
    }

    // ----- OPCIONALES (se completan al cerrar) -----
    if (
        hora_salida !== undefined && hora_salida !== null && hora_salida !== "" &&
        typeof hora_salida !== "string"
    ) {
        return res.status(400).json({
            error: 'El campo "hora_salida" debe ser texto (HH:MM o HH:MM:SS)'
        });
    }
    if (
        orden_venta !== undefined && orden_venta !== null && orden_venta !== "" &&
        (typeof orden_venta !== "string" || orden_venta.length > 50)
    ) {
        return res.status(400).json({
            error: 'El campo "orden_venta" debe ser texto y máximo 50 caracteres'
        });
    }
    if (
        cita !== undefined && cita !== null && cita !== "" &&
        (typeof cita !== "string" || cita.length > 50)
    ) {
        return res.status(400).json({
            error: 'El campo "cita" debe ser texto y máximo 50 caracteres'
        });
    }
    if (
        fecha_cita !== undefined && fecha_cita !== null && fecha_cita !== "" &&
        isNaN(Date.parse(fecha_cita))
    ) {
        return res.status(400).json({
            error: 'El campo "fecha_cita" debe ser una fecha válida'
        });
    }
    if (
        temperatura_salida !== undefined && temperatura_salida !== null &&
        temperatura_salida !== "" && isNaN(Number(temperatura_salida))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura_salida" debe ser numérico'
        });
    }
    if (
        observaciones !== undefined && observaciones !== null &&
        observaciones !== "" &&
        (typeof observaciones !== "string" || observaciones.length > 250)
    ) {
        return res.status(400).json({
            error: 'El campo "observaciones" debe ser texto y máximo 250 caracteres'
        });
    }

    // ----- ESTADO: 1=borrador · 2=cerrado · 0=cancelado -----
    if (estado !== undefined && estado !== null && estado !== "") {
        if (isNaN(Number(estado))) {
            return res.status(400).json({
                error: 'El campo "estado" debe ser numérico (1=borrador, 2=cerrado, 0=cancelado)'
            });
        }
        if (![0, 1, 2].includes(Number(estado))) {
            return res.status(400).json({
                error: 'El campo "estado" debe ser 0, 1 o 2'
            });
        }
    }

    // ----- DETALLE OPCIONAL AL CREAR -----
    if (detalle !== undefined && detalle !== null) {
        if (!Array.isArray(detalle)) {
            return res.status(400).json({
                error: 'El campo "detalle" debe ser un arreglo de líneas'
            });
        }
        for (const linea of detalle) {
            const err = validarLineaDetalle(linea);
            if (err) {
                return res.status(400).json({ error: err });
            }
        }
    }

    next();
};


// ---------------------------------------------------------
// Valida una línea agregada individualmente
// ---------------------------------------------------------
export const validarDetalle = (req, res, next) => {
    const err = validarLineaDetalle(req.body);
    if (err) {
        return res.status(400).json({ error: err });
    }
    next();
};


// ---------------------------------------------------------
// Validaciones de params
// ---------------------------------------------------------
export const validarIdDespacho = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de despacho debe ser un número válido"
        });
    }
    next();
};

export const validarIdDetalle = (req, res, next) => {
    const { id_detalle } = req.params;
    if (!id_detalle || isNaN(Number(id_detalle))) {
        return res.status(400).json({
            error: "El id de detalle debe ser un número válido"
        });
    }
    next();
};
