// Valida el body al crear o actualizar un bloque
// NOTA: cantidad_tarimas y cantidad_cajas NO se validan aquí porque
// el cliente nunca los envía; los controla el trigger de Postgres.
export const validarBloque = (req, res, next) => {

    const {
        codigo_bloque,
        fecha_hora_armado,
        temperatura_ingreso,
        estado
    } = req.body;

    if (
        !codigo_bloque ||
        typeof codigo_bloque !== "string" ||
        codigo_bloque.trim() === "" ||
        codigo_bloque.length > 50
    ) {
        return res.status(400).json({
            error: 'El campo "codigo_bloque" es obligatorio, debe ser texto y máximo 50 caracteres'
        });
    }

    if (
        fecha_hora_armado !== undefined &&
        fecha_hora_armado !== null &&
        isNaN(Date.parse(fecha_hora_armado))
    ) {
        return res.status(400).json({
            error: 'El campo "fecha_hora_armado" debe ser una fecha/hora válida'
        });
    }

    if (
        temperatura_ingreso !== undefined &&
        temperatura_ingreso !== null &&
        isNaN(Number(temperatura_ingreso))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura_ingreso" debe ser numérico'
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


// Valida que el id_bloque en los params sea un número
export const validarIdBloque = (req, res, next) => {

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {

        return res.status(400).json({
            error: "El id de bloque debe ser un número válido"
        });

    }

    next();
};
