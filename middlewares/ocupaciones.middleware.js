// Valida el body al crear o actualizar una ocupación
export const validarOcupacion = (req, res, next) => {

    const {
        id_camara,
        fecha_inicio,
        hora_inicio,
        cantidad_tarimas,
        cantidad_cajas,
        cantidad_bloques,
        tipo_ocupacion,
        id_mantenimiento,
        estado
    } = req.body;

    if (
        id_camara === undefined ||
        id_camara === null ||
        isNaN(Number(id_camara))
    ) {
        return res.status(400).json({
            error: 'El campo "id_camara" es obligatorio y debe ser numérico'
        });
    }

    if (!fecha_inicio) {
        return res.status(400).json({
            error: 'El campo "fecha_inicio" es obligatorio'
        });
    }

    if (!hora_inicio) {
        return res.status(400).json({
            error: 'El campo "hora_inicio" es obligatorio'
        });
    }

    if (
        cantidad_tarimas !== undefined &&
        cantidad_tarimas !== null &&
        isNaN(Number(cantidad_tarimas))
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_tarimas" debe ser numérico'
        });
    }

    if (
        cantidad_cajas !== undefined &&
        cantidad_cajas !== null &&
        isNaN(Number(cantidad_cajas))
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_cajas" debe ser numérico'
        });
    }

    if (
        cantidad_bloques !== undefined &&
        cantidad_bloques !== null &&
        isNaN(Number(cantidad_bloques))
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_bloques" debe ser numérico'
        });
    }

    if (
        tipo_ocupacion !== undefined &&
        tipo_ocupacion !== null &&
        isNaN(Number(tipo_ocupacion))
    ) {
        return res.status(400).json({
            error: 'El campo "tipo_ocupacion" debe ser numérico (1=producto/inventario, 2=mantenimiento)'
        });
    }

    if (
        id_mantenimiento !== undefined &&
        id_mantenimiento !== null &&
        isNaN(Number(id_mantenimiento))
    ) {
        return res.status(400).json({
            error: 'El campo "id_mantenimiento" debe ser numérico'
        });
    }

    if (
        estado !== undefined &&
        estado !== null &&
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" debe ser numérico (1=activa, 0=cerrada)'
        });
    }

    next();
};


// Valida el body al cerrar una ocupación
export const validarCierreOcupacion = (req, res, next) => {

    const { fecha_fin, hora_fin } = req.body;

    if (!fecha_fin) {
        return res.status(400).json({
            error: 'El campo "fecha_fin" es obligatorio para cerrar la ocupación'
        });
    }

    if (!hora_fin) {
        return res.status(400).json({
            error: 'El campo "hora_fin" es obligatorio para cerrar la ocupación'
        });
    }

    next();
};


// Valida que el id_ocupacion en los params sea un número
export const validarIdOcupacion = (req, res, next) => {

    const { id_ocupacion } = req.params;

    if (!id_ocupacion || isNaN(Number(id_ocupacion))) {

        return res.status(400).json({
            error: "El id de ocupacion debe ser un número válido"
        });

    }

    next();
};


// Valida que el id_camara en los params sea un número
export const validarIdCamaraParam = (req, res, next) => {

    const { id_camara } = req.params;

    if (!id_camara || isNaN(Number(id_camara))) {

        return res.status(400).json({
            error: "El id de camara debe ser un número válido"
        });

    }

    next();
};
