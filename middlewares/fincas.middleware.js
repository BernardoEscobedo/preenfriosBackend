// Valida el body al crear o actualizar una finca
export const validarFinca = (req, res, next) => {

    const {
        codigo_finca,
        nombre,
        org_inv_nombre,
        zona,
        id_productor,
        estado
    } = req.body;

    if (
        !codigo_finca ||
        typeof codigo_finca !== "string" ||
        codigo_finca.trim() === "" ||
        codigo_finca.length > 3
    ) {
        return res.status(400).json({
            error: 'El campo "codigo_finca" es obligatorio, debe ser texto y máximo 3 caracteres'
        });
    }

    if (
        !id_productor ||
        isNaN(Number(id_productor))
    ) {
        return res.status(400).json({
            error: 'El campo "id_productor" es obligatorio y debe ser un número válido'
        });
    }

    if (
        nombre !== undefined &&
        nombre !== null &&
        typeof nombre !== "string"
    ) {
        return res.status(400).json({
            error: 'El campo "nombre" debe ser texto'
        });
    }

    if (
        org_inv_nombre !== undefined &&
        org_inv_nombre !== null &&
        typeof org_inv_nombre !== "string"
    ) {
        return res.status(400).json({
            error: 'El campo "org_inv_nombre" debe ser texto'
        });
    }

    if (
        zona !== undefined &&
        zona !== null &&
        isNaN(Number(zona))
    ) {
        return res.status(400).json({
            error: 'El campo "zona" debe ser numérico'
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


// Valida que el id_finca en los params sea un número
export const validarIdFinca = (req, res, next) => {

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {

        return res.status(400).json({
            error: "El id de finca debe ser un número válido"
        });

    }

    next();
};
