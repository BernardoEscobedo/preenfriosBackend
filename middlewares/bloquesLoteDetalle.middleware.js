// Valida el body al crear un detalle (agregar lote a un bloque)
export const validarDetalle = (req, res, next) => {

    const {
        id_bloque,
        id_lote,
        cantidad_tarimas,
        cantidad_cajas
    } = req.body;

    if (
        !id_bloque ||
        isNaN(Number(id_bloque))
    ) {
        return res.status(400).json({
            error: 'El campo "id_bloque" es obligatorio y debe ser un número válido'
        });
    }

    if (
        !id_lote ||
        isNaN(Number(id_lote))
    ) {
        return res.status(400).json({
            error: 'El campo "id_lote" es obligatorio y debe ser un número válido'
        });
    }

    if (
        cantidad_tarimas === undefined ||
        cantidad_tarimas === null ||
        isNaN(Number(cantidad_tarimas)) ||
        Number(cantidad_tarimas) < 0
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_tarimas" es obligatorio y debe ser un número mayor o igual a 0'
        });
    }

    if (
        cantidad_cajas === undefined ||
        cantidad_cajas === null ||
        isNaN(Number(cantidad_cajas)) ||
        Number(cantidad_cajas) < 0
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_cajas" es obligatorio y debe ser un número mayor o igual a 0'
        });
    }

    next();
};


// Valida el body al actualizar cantidades de un detalle existente
// (no se permite mover el detalle a otro bloque/lote; para eso se
// elimina y se crea uno nuevo, así el UNIQUE(id_bloque, id_lote) no se rompe)
export const validarActualizarDetalle = (req, res, next) => {

    const {
        cantidad_tarimas,
        cantidad_cajas
    } = req.body;

    if (
        cantidad_tarimas === undefined ||
        cantidad_tarimas === null ||
        isNaN(Number(cantidad_tarimas)) ||
        Number(cantidad_tarimas) < 0
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_tarimas" es obligatorio y debe ser un número mayor o igual a 0'
        });
    }

    if (
        cantidad_cajas === undefined ||
        cantidad_cajas === null ||
        isNaN(Number(cantidad_cajas)) ||
        Number(cantidad_cajas) < 0
    ) {
        return res.status(400).json({
            error: 'El campo "cantidad_cajas" es obligatorio y debe ser un número mayor o igual a 0'
        });
    }

    next();
};


// Valida que el id_detalle en los params sea un número
export const validarIdDetalle = (req, res, next) => {

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {

        return res.status(400).json({
            error: "El id de detalle debe ser un número válido"
        });

    }

    next();
};
