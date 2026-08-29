// Valida el body al crear o actualizar un mantenimiento
export const validarMantenimiento = (req, res, next) => {

    const {
        id_camara,
        fecha_inicio,
        hora_inicio,
        fecha_fin,
        hora_fin,
        tipo,
        motivo,
        prioridad,
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
        tipo === undefined ||
        tipo === null ||
        isNaN(Number(tipo))
    ) {
        return res.status(400).json({
            error: 'El campo "tipo" es obligatorio y debe ser numérico'
        });
    }

    if (
        motivo !== undefined &&
        typeof motivo !== "string"
    ) {
        return res.status(400).json({
            error: 'El campo "motivo" debe ser texto'
        });
    }

    if (
        prioridad !== undefined &&
        prioridad !== null &&
        isNaN(Number(prioridad))
    ) {
        return res.status(400).json({
            error: 'El campo "prioridad" debe ser numérico'
        });
    }

    if (
        estado === undefined ||
        estado === null ||
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" es obligatorio y debe ser numérico (1=programado, 2=en_proceso, 3=finalizado, 4=cancelado)'
        });
    }

    next();
};


// Valida que el id_mantenimiento en los params sea un número
export const validarIdMantenimiento = (req, res, next) => {

    const { id_mantenimiento } = req.params;

    if (!id_mantenimiento || isNaN(Number(id_mantenimiento))) {

        return res.status(400).json({
            error: "El id de mantenimiento debe ser un número válido"
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
