// Valida el body al crear o actualizar un productor
// 'activo' es INT en la BD (1=activo, 0=inactivo). Se aceptan también
// booleanos por compatibilidad, pero se validan/normalizan a 0/1.
export const validarProductor = (req, res, next) => {
    const {
        codigo_productor,
        nombre,
        activo
    } = req.body;

    if (
        !codigo_productor ||
        typeof codigo_productor !== "string" ||
        codigo_productor.trim() === "" ||
        codigo_productor.length > 4
    ) {
        return res.status(400).json({
            error: 'El campo "codigo_productor" es obligatorio, debe ser texto y máximo 4 caracteres'
        });
    }
    if (
        !nombre ||
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        return res.status(400).json({
            error: 'El campo "nombre" es obligatorio y debe ser texto'
        });
    }
    if (activo !== undefined && activo !== null) {
        const esBoolean = typeof activo === "boolean";
        const esCero1 =
            !isNaN(Number(activo)) &&
            (Number(activo) === 0 || Number(activo) === 1);
        if (!esBoolean && !esCero1) {
            return res.status(400).json({
                error: 'El campo "activo" debe ser 1 (activo) o 0 (inactivo)'
            });
        }
    }
    next();
};

// Valida que el id_productor en los params sea un número
export const validarIdProductor = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de productor debe ser un número válido"
        });
    }
    next();
};
