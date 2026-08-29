// Valida el body al crear o actualizar un cedis-cliente
export const validarCedisCliente = (req, res, next) => {
    const { cliente, cedis, acronimo } = req.body;

    if (
        !cliente ||
        typeof cliente !== "string" ||
        cliente.trim() === "" ||
        cliente.length > 80
    ) {
        return res.status(400).json({
            error: 'El campo "cliente" es obligatorio, debe ser texto y máximo 80 caracteres'
        });
    }
    if (
        !cedis ||
        typeof cedis !== "string" ||
        cedis.trim() === "" ||
        cedis.length > 80
    ) {
        return res.status(400).json({
            error: 'El campo "cedis" es obligatorio, debe ser texto y máximo 80 caracteres'
        });
    }
    if (
        acronimo !== undefined &&
        acronimo !== null &&
        (typeof acronimo !== "string" || acronimo.length > 50)
    ) {
        return res.status(400).json({
            error: 'El campo "acronimo" debe ser texto y máximo 50 caracteres'
        });
    }
    next();
};

// Valida que el id_cc en los params sea un número
export const validarIdCedisCliente = (req, res, next) => {
    const { id_cc } = req.params;
    if (!id_cc || isNaN(Number(id_cc))) {
        return res.status(400).json({
            error: "El id de cedis-cliente debe ser un número válido"
        });
    }
    next();
};
