// Valida una línea de detalle de pulpeo
const validarLineaDetalle = (linea) => {
    if (!linea || typeof linea !== "object") {
        return "Cada línea de detalle debe ser un objeto válido";
    }
    if (!linea.id_lote || isNaN(Number(linea.id_lote))) {
        return 'Cada detalle requiere un "id_lote" numérico válido';
    }
    if (
        linea.cantidad_tarimas === undefined ||
        linea.cantidad_tarimas === null ||
        isNaN(Number(linea.cantidad_tarimas)) ||
        Number(linea.cantidad_tarimas) < 0
    ) {
        return 'Cada detalle requiere "cantidad_tarimas" numérica (>= 0)';
    }
    if (
        linea.temperatura !== undefined &&
        linea.temperatura !== null &&
        isNaN(Number(linea.temperatura))
    ) {
        return 'La "temperatura" del detalle debe ser numérica';
    }
    if (linea.evidencia !== undefined && linea.evidencia !== null) {
        if (!Array.isArray(linea.evidencia)) {
            return 'El campo "evidencia" del detalle debe ser un arreglo';
        }
        for (const foto of linea.evidencia) {
            if (
                !foto ||
                typeof foto.foto_url !== "string" ||
                foto.foto_url.trim() === "" ||
                foto.foto_url.length > 500
            ) {
                return 'Cada evidencia requiere "foto_url" (texto, máx 500 caracteres)';
            }
        }
    }
    return null;
};

// Valida el body al crear un pulpeo (encabezado + detalle opcional)
// Alineado al esquema: temperatura_objetivo y temperatura_promedio
// son NOT NULL (obligatorios).
export const validarPulpeo = (req, res, next) => {
    const {
        id_bloque,
        temperatura_objetivo,
        temperatura_promedio,
        numero_pulpeo,
        detalle
    } = req.body;

    if (!id_bloque || isNaN(Number(id_bloque))) {
        return res.status(400).json({
            error: 'El campo "id_bloque" es obligatorio y debe ser un número válido'
        });
    }
    if (
        numero_pulpeo !== undefined &&
        numero_pulpeo !== null &&
        isNaN(Number(numero_pulpeo))
    ) {
        return res.status(400).json({
            error: 'El campo "numero_pulpeo" debe ser numérico'
        });
    }
    if (
        temperatura_objetivo === undefined ||
        temperatura_objetivo === null ||
        isNaN(Number(temperatura_objetivo))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura_objetivo" es obligatorio y debe ser numérico'
        });
    }
    if (
        temperatura_promedio === undefined ||
        temperatura_promedio === null ||
        isNaN(Number(temperatura_promedio))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura_promedio" es obligatorio y debe ser numérico'
        });
    }
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

// Valida una línea de detalle al agregarla individualmente
export const validarDetallePulpeo = (req, res, next) => {
    const err = validarLineaDetalle(req.body);
    if (err) {
        return res.status(400).json({ error: err });
    }
    next();
};

// Valida el body de una evidencia individual
export const validarEvidencia = (req, res, next) => {
    const { foto_url } = req.body;
    if (
        typeof foto_url !== "string" ||
        foto_url.trim() === "" ||
        foto_url.length > 500
    ) {
        return res.status(400).json({
            error: 'El campo "foto_url" es obligatorio (texto, máx 500 caracteres)'
        });
    }
    next();
};

// Valida que el id (pulpeo) en params sea numérico
export const validarIdPulpeo = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de pulpeo debe ser un número válido"
        });
    }
    next();
};

// Valida que el id_pulpeo_detalle en params sea numérico
export const validarIdPulpeoDetalle = (req, res, next) => {
    const { id_pulpeo_detalle } = req.params;
    if (!id_pulpeo_detalle || isNaN(Number(id_pulpeo_detalle))) {
        return res.status(400).json({
            error: "El id de detalle de pulpeo debe ser un número válido"
        });
    }
    next();
};
