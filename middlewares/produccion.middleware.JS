// Valida el body al crear o actualizar una producción (plan logístico)
export const validarProduccion = (req, res, next) => {
    const {
        semana,
        id_finca,
        id_productor,
        fecha_empaque,
        id_cc,
        id_sku,
        cajas_procesadas,
        estiba_pallets,
        transito,
        id_camara,
        estado
    } = req.body;

    // ----- Campos obligatorios -----
    if (semana === undefined || semana === null || isNaN(Number(semana))) {
        return res.status(400).json({
            error: 'El campo "semana" es obligatorio y debe ser numérico'
        });
    }
    if (!id_finca || isNaN(Number(id_finca))) {
        return res.status(400).json({
            error: 'El campo "id_finca" es obligatorio y debe ser un número válido'
        });
    }
    if (!id_productor || isNaN(Number(id_productor))) {
        return res.status(400).json({
            error: 'El campo "id_productor" es obligatorio y debe ser un número válido'
        });
    }
    if (!fecha_empaque) {
        return res.status(400).json({
            error: 'El campo "fecha_empaque" es obligatorio'
        });
    }
    if (!id_cc || isNaN(Number(id_cc))) {
        return res.status(400).json({
            error: 'El campo "id_cc" (cliente/cedis) es obligatorio y debe ser un número válido'
        });
    }
    if (!id_sku || isNaN(Number(id_sku))) {
        return res.status(400).json({
            error: 'El campo "id_sku" es obligatorio y debe ser un número válido'
        });
    }

    // ----- Campos opcionales (validados solo si vienen) -----
    if (
        cajas_procesadas !== undefined &&
        cajas_procesadas !== null &&
        isNaN(Number(cajas_procesadas))
    ) {
        return res.status(400).json({
            error: 'El campo "cajas_procesadas" debe ser numérico'
        });
    }
    if (
        estiba_pallets !== undefined &&
        estiba_pallets !== null &&
        isNaN(Number(estiba_pallets))
    ) {
        return res.status(400).json({
            error: 'El campo "estiba_pallets" debe ser numérico'
        });
    }
    if (
        transito !== undefined &&
        transito !== null &&
        isNaN(Number(transito))
    ) {
        return res.status(400).json({
            error: 'El campo "transito" debe ser numérico'
        });
    }
    // id_camara puede ser NULL (procesos que no se preenfrían / CEDA directo).
    // Solo validamos que, si viene un valor, sea numérico.
    if (
        id_camara !== undefined &&
        id_camara !== null &&
        id_camara !== "" &&
        isNaN(Number(id_camara))
    ) {
        return res.status(400).json({
            error: 'El campo "id_camara" debe ser numérico o nulo'
        });
    }
    if (
        estado !== undefined &&
        estado !== null &&
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" debe ser numérico (1=planeada, 2=en recepción, 3=recibida, 0=cancelada)'
        });
    }

    next();
};

// Valida que el id en los params sea un número
export const validarIdProduccion = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de producción debe ser un número válido"
        });
    }
    next();
};
