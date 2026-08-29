// Valida el body al crear o actualizar una recepción
export const validarRecepcion = (req, res, next) => {
    const {
        id_produccion,
        id_camara,
        fecha_recepcion,
        hora_recepcion,
        cajas_recibidas,
        tarimas_recibidas,
        tarimas_ingresadas,
        cajas_ingresadas,
        temperatura,
        estado
    } = req.body;

    // ----- Obligatorios -----
    if (!id_produccion || isNaN(Number(id_produccion))) {
        return res.status(400).json({
            error: 'El campo "id_produccion" es obligatorio y debe ser un número válido'
        });
    }
    if (!fecha_recepcion) {
        return res.status(400).json({ error: 'El campo "fecha_recepcion" es obligatorio' });
    }
    if (!hora_recepcion) {
        return res.status(400).json({ error: 'El campo "hora_recepcion" es obligatorio' });
    }

    // ----- Opcionales -----
    if (
        id_camara !== undefined && id_camara !== null && id_camara !== "" &&
        isNaN(Number(id_camara))
    ) {
        return res.status(400).json({ error: 'El campo "id_camara" debe ser numérico o nulo' });
    }
    if (
        cajas_recibidas !== undefined && cajas_recibidas !== null &&
        isNaN(Number(cajas_recibidas))
    ) {
        return res.status(400).json({ error: 'El campo "cajas_recibidas" debe ser numérico' });
    }
    if (
        tarimas_recibidas !== undefined && tarimas_recibidas !== null &&
        isNaN(Number(tarimas_recibidas))
    ) {
        return res.status(400).json({ error: 'El campo "tarimas_recibidas" debe ser numérico' });
    }
    if (
        temperatura !== undefined && temperatura !== null && temperatura !== "" &&
        isNaN(Number(temperatura))
    ) {
        return res.status(400).json({ error: 'El campo "temperatura" debe ser numérico' });
    }
    if (estado !== undefined && estado !== null && isNaN(Number(estado))) {
        return res.status(400).json({
            error: 'El campo "estado" debe ser numérico (1=activa, 0=cancelada)'
        });
    }

    // ----- División dentro / en espera -----
    // tarimas_ingresadas es lo que entra físicamente a la cámara.
    // Si viene NULL, el trigger de la BD calcula automáticamente lo que cabe.
    const tarRecibidas = Number(tarimas_recibidas) || 0;
    const cajRecibidas = Number(cajas_recibidas) || 0;

    if (tarimas_ingresadas !== undefined && tarimas_ingresadas !== null && tarimas_ingresadas !== "") {
        if (isNaN(Number(tarimas_ingresadas))) {
            return res.status(400).json({
                error: 'El campo "tarimas_ingresadas" debe ser numérico'
            });
        }
        if (Number(tarimas_ingresadas) < 0) {
            return res.status(400).json({
                error: 'El campo "tarimas_ingresadas" no puede ser negativo'
            });
        }
        if (Number(tarimas_ingresadas) > tarRecibidas) {
            return res.status(400).json({
                error: "Las tarimas que ingresan no pueden superar a las recibidas"
            });
        }
    }
    if (cajas_ingresadas !== undefined && cajas_ingresadas !== null && cajas_ingresadas !== "") {
        if (isNaN(Number(cajas_ingresadas))) {
            return res.status(400).json({
                error: 'El campo "cajas_ingresadas" debe ser numérico'
            });
        }
        if (Number(cajas_ingresadas) > cajRecibidas) {
            return res.status(400).json({
                error: "Las cajas que ingresan no pueden superar a las recibidas"
            });
        }
    }

    // Al menos algo debe recibirse
    if (cajRecibidas <= 0 && tarRecibidas <= 0) {
        return res.status(400).json({
            error: "Debes registrar al menos cajas o tarimas recibidas"
        });
    }

    next();
};

// Valida que el id en los params sea un número
export const validarIdRecepcion = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "El id de recepción debe ser un número válido" });
    }
    next();
};
