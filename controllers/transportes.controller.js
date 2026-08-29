import transportesModel from "../models/transportes.model.js";

// GET /api/preenfrio/transportes/transportes
const getTransportes = async (req, res) => {
    try {
        const transportes = await transportesModel.getTransportes();
        res.status(200).json(transportes);
    } catch (error) {
        console.error("Error al obtener transportes:", error);
        res.status(500).json({
            error: "Error al obtener los transportes"
        });
    }
};

// GET /api/preenfrio/transportes/transporte/:id_transporte
const getTransporteById = async (req, res) => {
    try {
        const { id_transporte } = req.params;
        const transporte =
            await transportesModel.getTransporteById(id_transporte);
        if (!transporte) {
            return res.status(404).json({
                error: "Transporte no encontrado"
            });
        }
        res.status(200).json(transporte);
    } catch (error) {
        console.error("Error al obtener transporte:", error);
        res.status(500).json({
            error: "Error al obtener el transporte"
        });
    }
};

// POST /api/preenfrio/transportes/registrartransporte
const createTransporte = async (req, res) => {
    try {
        const nuevoTransporte =
            await transportesModel.createTransporte(req.body);
        res.status(201).json(nuevoTransporte);
    } catch (error) {
        console.error("Error al crear transporte:", error);
        res.status(500).json({
            error: "Error al crear el transporte"
        });
    }
};

// PUT /api/preenfrio/transportes/actualizartransporte/:id_transporte
const updateTransporte = async (req, res) => {
    try {
        const { id_transporte } = req.params;
        const transporteActualizado =
            await transportesModel.updateTransporte(
                id_transporte,
                req.body
            );
        if (!transporteActualizado) {
            return res.status(404).json({
                error: "Transporte no encontrado"
            });
        }
        res.status(200).json(transporteActualizado);
    } catch (error) {
        console.error("Error al actualizar transporte:", error);
        res.status(500).json({
            error: "Error al actualizar el transporte"
        });
    }
};

// DELETE /api/preenfrio/transportes/eliminartransporte/:id_transporte
const deleteTransporte = async (req, res) => {
    try {
        const { id_transporte } = req.params;
        const transporteEliminado =
            await transportesModel.deleteTransporte(id_transporte);
        if (!transporteEliminado) {
            return res.status(404).json({
                error: "Transporte no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Transporte eliminado correctamente",
            transporte: transporteEliminado
        });
    } catch (error) {
        console.error("Error al eliminar transporte:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el transporte está referenciado en despachos"
            });
        }
        res.status(500).json({
            error: "Error al eliminar el transporte"
        });
    }
};

export const transportesController = {
    getTransportes,
    getTransporteById,
    createTransporte,
    updateTransporte,
    deleteTransporte
};
