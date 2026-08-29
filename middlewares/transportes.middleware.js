// Valida el body al crear o actualizar un transporte
// Alineado al esquema: todos los campos NOT NULL, incluido 'inocuidad' INT.
export const validarTransporte = (req, res, next) => {
    const {
        razon_social,
        nombre_operador,
        celular,
        placas_tracto,
        placas_caja,
        no_economico_caja,
        inocuidad
    } = req.body;

    if (
        !razon_social ||
        typeof razon_social !== "string" ||
        razon_social.trim() === "" ||
        razon_social.length > 100
    ) {
        return res.status(400).json({
            error: 'El campo "razon_social" es obligatorio, debe ser texto y máximo 100 caracteres'
        });
    }
    if (
        !nombre_operador ||
        typeof nombre_operador !== "string" ||
        nombre_operador.trim() === "" ||
        nombre_operador.length > 100
    ) {
        return res.status(400).json({
            error: 'El campo "nombre_operador" es obligatorio, debe ser texto y máximo 100 caracteres'
        });
    }
    if (
        !celular ||
        typeof celular !== "string" ||
        celular.trim() === "" ||
        celular.length > 10
    ) {
        return res.status(400).json({
            error: 'El campo "celular" es obligatorio, debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        !placas_tracto ||
        typeof placas_tracto !== "string" ||
        placas_tracto.trim() === "" ||
        placas_tracto.length > 10
    ) {
        return res.status(400).json({
            error: 'El campo "placas_tracto" es obligatorio, debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        !placas_caja ||
        typeof placas_caja !== "string" ||
        placas_caja.trim() === "" ||
        placas_caja.length > 10
    ) {
        return res.status(400).json({
            error: 'El campo "placas_caja" es obligatorio, debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        !no_economico_caja ||
        typeof no_economico_caja !== "string" ||
        no_economico_caja.trim() === "" ||
        no_economico_caja.length > 10
    ) {
        return res.status(400).json({
            error: 'El campo "no_economico_caja" es obligatorio, debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        inocuidad === undefined ||
        inocuidad === null ||
        isNaN(Number(inocuidad))
    ) {
        return res.status(400).json({
            error: 'El campo "inocuidad" es obligatorio y debe ser numérico'
        });
    }
    next();
};

// Valida que el id_transporte en los params sea un número
export const validarIdTransporte = (req, res, next) => {
    const { id_transporte } = req.params;
    if (!id_transporte || isNaN(Number(id_transporte))) {
        return res.status(400).json({
            error: "El id de transporte debe ser un número válido"
        });
    }
    next();
};
