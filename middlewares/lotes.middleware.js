// Valida el body al crear o actualizar un lote
export const validarLote = (req, res, next) => {

    const {
        codigo_lote,
        id_finca,
        id_sku,
        semana,
        fecha_empaque,
        turno,
        estado
    } = req.body;

    if (
        !codigo_lote ||
        typeof codigo_lote !== "string" ||
        codigo_lote.trim() === "" ||
        codigo_lote.length > 50
    ) {
        return res.status(400).json({
            error: 'El campo "codigo_lote" es obligatorio, debe ser texto y máximo 50 caracteres'
        });
    }

    if (
        !id_finca ||
        isNaN(Number(id_finca))
    ) {
        return res.status(400).json({
            error: 'El campo "id_finca" es obligatorio y debe ser un número válido'
        });
    }

    if (
        !id_sku ||
        isNaN(Number(id_sku))
    ) {
        return res.status(400).json({
            error: 'El campo "id_sku" es obligatorio y debe ser un número válido'
        });
    }

    if (
        semana === undefined ||
        semana === null ||
        isNaN(Number(semana))
    ) {
        return res.status(400).json({
            error: 'El campo "semana" es obligatorio y debe ser numérico'
        });
    }

    if (
        !fecha_empaque ||
        isNaN(Date.parse(fecha_empaque))
    ) {
        return res.status(400).json({
            error: 'El campo "fecha_empaque" es obligatorio y debe ser una fecha válida'
        });
    }

    if (
        turno === undefined ||
        turno === null ||
        isNaN(Number(turno))
    ) {
        return res.status(400).json({
            error: 'El campo "turno" es obligatorio y debe ser numérico'
        });
    }

    if (
        estado !== undefined &&
        estado !== null &&
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" debe ser numérico'
        });
    }

    next();
};


// Valida que el id_lote en los params sea un número
export const validarIdLote = (req, res, next) => {

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {

        return res.status(400).json({
            error: "El id de lote debe ser un número válido"
        });

    }

    next();
};
