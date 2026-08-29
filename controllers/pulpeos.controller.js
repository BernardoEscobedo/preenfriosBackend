import pulpeosModel from "../models/pulpeos.model.js";

// GET /api/preenfrio/pulpeos/pulpeos
const getPulpeos = async (req, res) => {
    try {
        const pulpeos = await pulpeosModel.getPulpeos();
        res.status(200).json(pulpeos);
    } catch (error) {
        console.error("Error al obtener pulpeos:", error);
        res.status(500).json({
            error: "Error al obtener los pulpeos"
        });
    }
};

// GET /api/preenfrio/pulpeos/pulpeo/:id
const getPulpeoById = async (req, res) => {
    try {
        const { id } = req.params;
        const pulpeo = await pulpeosModel.getPulpeoById(id);
        if (!pulpeo) {
            return res.status(404).json({
                error: "Pulpeo no encontrado"
            });
        }
        res.status(200).json(pulpeo);
    } catch (error) {
        console.error("Error al obtener pulpeo:", error);
        res.status(500).json({
            error: "Error al obtener el pulpeo"
        });
    }
};

// GET /api/preenfrio/pulpeos/pulpeo/:id/detalle
const getPulpeoConDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const pulpeo = await pulpeosModel.getPulpeoConDetalle(id);
        if (!pulpeo) {
            return res.status(404).json({
                error: "Pulpeo no encontrado"
            });
        }
        res.status(200).json(pulpeo);
    } catch (error) {
        console.error("Error al obtener pulpeo con detalle:", error);
        res.status(500).json({
            error: "Error al obtener el pulpeo con su detalle"
        });
    }
};

// GET /api/preenfrio/pulpeos/bloque/:id_bloque
const getPulpeosByBloque = async (req, res) => {
    try {
        const { id_bloque } = req.params;
        if (!id_bloque || isNaN(Number(id_bloque))) {
            return res.status(400).json({
                error: "El id de bloque debe ser un número válido"
            });
        }
        const pulpeos = await pulpeosModel.getPulpeosByBloque(id_bloque);
        res.status(200).json(pulpeos);
    } catch (error) {
        console.error("Error al obtener pulpeos del bloque:", error);
        res.status(500).json({
            error: "Error al obtener los pulpeos del bloque"
        });
    }
};

// POST /api/preenfrio/pulpeos/registrarpulpeo
const createPulpeo = async (req, res) => {
    try {
        const nuevoPulpeo = await pulpeosModel.createPulpeo(req.body);
        res.status(201).json(nuevoPulpeo);
    } catch (error) {
        console.error("Error al crear pulpeo:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El bloque, lote o usuario indicado no existe"
            });
        }
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un detalle para ese lote en este pulpeo"
            });
        }
        res.status(500).json({
            error: "Error al crear el pulpeo"
        });
    }
};

// POST /api/preenfrio/pulpeos/pulpeo/:id/detalle
const addDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const linea = await pulpeosModel.addDetalle(id, req.body);
        res.status(201).json(linea);
    } catch (error) {
        console.error("Error al agregar detalle de pulpeo:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El pulpeo o lote indicado no existe"
            });
        }
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un detalle para ese lote en este pulpeo"
            });
        }
        res.status(500).json({
            error: "Error al agregar el detalle del pulpeo"
        });
    }
};

// POST /api/preenfrio/pulpeos/detalle/:id_pulpeo_detalle/evidencia
const addEvidencia = async (req, res) => {
    try {
        const { id_pulpeo_detalle } = req.params;
        const evidencia = await pulpeosModel.addEvidencia(
            id_pulpeo_detalle,
            req.body
        );
        res.status(201).json(evidencia);
    } catch (error) {
        console.error("Error al agregar evidencia:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La línea de detalle indicada no existe"
            });
        }
        res.status(500).json({
            error: "Error al agregar la evidencia"
        });
    }
};

// PUT /api/preenfrio/pulpeos/actualizarpulpeo/:id
const updatePulpeo = async (req, res) => {
    try {
        const { id } = req.params;
        const pulpeoActualizado = await pulpeosModel.updatePulpeo(id, req.body);
        if (!pulpeoActualizado) {
            return res.status(404).json({
                error: "Pulpeo no encontrado"
            });
        }
        res.status(200).json(pulpeoActualizado);
    } catch (error) {
        console.error("Error al actualizar pulpeo:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El bloque o usuario indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al actualizar el pulpeo"
        });
    }
};

// DELETE /api/preenfrio/pulpeos/eliminarpulpeo/:id
const deletePulpeo = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await pulpeosModel.deletePulpeo(id);
        if (!eliminado) {
            return res.status(404).json({
                error: "Pulpeo no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Pulpeo eliminado correctamente (incluye detalle y evidencia)",
            pulpeo: eliminado
        });
    } catch (error) {
        console.error("Error al eliminar pulpeo:", error);
        res.status(500).json({
            error: "Error al eliminar el pulpeo"
        });
    }
};

export const pulpeosController = {
    getPulpeos,
    getPulpeoById,
    getPulpeoConDetalle,
    getPulpeosByBloque,
    createPulpeo,
    addDetalle,
    addEvidencia,
    updatePulpeo,
    deletePulpeo
};
