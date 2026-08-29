// Valida el body al crear o actualizar un SKU
export const validarSkuPt = (req, res, next) => {
    const { codigo_sku, calidad, turno } = req.body;

    if (
        !codigo_sku ||
        typeof codigo_sku !== "string" ||
        codigo_sku.trim() === "" ||
        codigo_sku.length > 10
    ) {
        return res.status(400).json({
            error: 'El campo "codigo_sku" es obligatorio, debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        calidad !== undefined &&
        calidad !== null &&
        typeof calidad !== "string"
    ) {
        return res.status(400).json({
            error: 'El campo "calidad" debe ser texto'
        });
    }
    // turno opcional; si viene, debe ser numérico
    if (
        turno !== undefined &&
        turno !== null &&
        turno !== "" &&
        isNaN(Number(turno))
    ) {
        return res.status(400).json({
            error: 'El campo "turno" debe ser numérico'
        });
    }

    next();
};

// Valida que el id_sku en los params sea un número
export const validarIdSkuPt = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de SKU debe ser un número válido"
        });
    }
    next();
};
