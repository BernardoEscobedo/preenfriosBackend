// Valida el body al crear o actualizar una cámara
export const validarCamara = (req, res, next) => {

    const {
        nombre_camara,
        tipo_camara,
        ubicacion,
        capacidad_max_tarimas,
        capacidad_max_cajas,
        capacidad_max_bloques
    } = req.body;

    if (
        !nombre_camara ||
        typeof nombre_camara !== "string" ||
        nombre_camara.trim() === ""
    ) {
        return res.status(400).json({
            error: 'El campo "nombre_camara" es obligatorio y debe ser texto'
        });
    }

    if (
        tipo_camara === undefined ||
        tipo_camara === null ||
        isNaN(Number(tipo_camara))
    ) {
        return res.status(400).json({
            error: 'El campo "tipo_camara" es obligatorio y debe ser numérico (1=preenfrio, 2=conservacion)'
        });
    }

    if (
        ubicacion !== undefined &&
        typeof ubicacion !== "string"
    ) {
        return res.status(400).json({
            error: 'El campo "ubicacion" debe ser texto'
        });
    }

    if (
        capacidad_max_tarimas !== undefined &&
        capacidad_max_tarimas !== null &&
        isNaN(Number(capacidad_max_tarimas))
    ) {
        return res.status(400).json({
            error: 'El campo "capacidad_max_tarimas" debe ser numérico'
        });
    }

    if (
        capacidad_max_cajas !== undefined &&
        capacidad_max_cajas !== null &&
        isNaN(Number(capacidad_max_cajas))
    ) {
        return res.status(400).json({
            error: 'El campo "capacidad_max_cajas" debe ser numérico'
        });
    }

    if (
        capacidad_max_bloques !== undefined &&
        capacidad_max_bloques !== null &&
        isNaN(Number(capacidad_max_bloques))
    ) {
        return res.status(400).json({
            error: 'El campo "capacidad_max_bloques" debe ser numérico'
        });
    }

    next();
};


// Valida que el id_camara en los params sea un número
export const validarIdCamara = (req, res, next) => {

    const { id_camara } = req.params;

    if (!id_camara || isNaN(Number(id_camara))) {

        return res.status(400).json({
            error: "El id de camara debe ser un número válido"
        });

    }

    next();
};
