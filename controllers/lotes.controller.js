import lotesModel from "../models/lotes.model.js";

// GET /api/preenfrio/lotes/lotes
const getLotes = async (req, res) => {
    try {
        const lotes = await lotesModel.getLotes();

        res.status(200).json(lotes);

    } catch (error) {

        console.error("Error al obtener lotes:", error);

        res.status(500).json({
            error: "Error al obtener los lotes"
        });
    }
};


// GET /api/preenfrio/lotes/lote/:id
const getLoteById = async (req, res) => {

    try {

        const { id } = req.params;

        const lote =
            await lotesModel.getLoteById(id);

        if (!lote) {

            return res.status(404).json({
                error: "Lote no encontrado"
            });
        }

        res.status(200).json(lote);

    } catch (error) {

        console.error("Error al obtener lote:", error);

        res.status(500).json({
            error: "Error al obtener el lote"
        });
    }
};


// GET /api/preenfrio/lotes/finca/:id_finca
const getLotesByFinca = async (req, res) => {

    try {

        const { id_finca } = req.params;

        if (!id_finca || isNaN(Number(id_finca))) {
            return res.status(400).json({
                error: "El id de finca debe ser un número válido"
            });
        }

        const lotes =
            await lotesModel.getLotesByFinca(id_finca);

        res.status(200).json(lotes);

    } catch (error) {

        console.error("Error al obtener lotes de la finca:", error);

        res.status(500).json({
            error: "Error al obtener los lotes de la finca"
        });
    }
};


// POST /api/preenfrio/lotes/registrarlote
const createLote = async (req, res) => {

    try {

        const nuevoLote =
            await lotesModel.createLote(req.body);

        res.status(201).json(nuevoLote);

    } catch (error) {

        console.error("Error al crear lote:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un lote con ese código"
            });
        }

        if (error.code === "23503") {
            return res.status(409).json({
                error: "La finca o el SKU indicado no existe"
            });
        }

        res.status(500).json({
            error: "Error al crear el lote"
        });
    }
};


// PUT /api/preenfrio/lotes/actualizarlote/:id
const updateLote = async (req, res) => {

    try {

        const { id } = req.params;

        const loteActualizado =
            await lotesModel.updateLote(
                id,
                req.body
            );

        if (!loteActualizado) {

            return res.status(404).json({
                error: "Lote no encontrado"
            });
        }

        res.status(200).json(loteActualizado);

    } catch (error) {

        console.error("Error al actualizar lote:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un lote con ese código"
            });
        }

        if (error.code === "23503") {
            return res.status(409).json({
                error: "La finca o el SKU indicado no existe"
            });
        }

        res.status(500).json({
            error: "Error al actualizar el lote"
        });
    }
};


// DELETE /api/preenfrio/lotes/eliminarlote/:id
const deleteLote = async (req, res) => {

    try {

        const { id } = req.params;

        const loteEliminado =
            await lotesModel.deleteLote(id);

        if (!loteEliminado) {

            return res.status(404).json({
                error: "Lote no encontrado"
            });
        }

        res.status(200).json({
            mensaje: "Lote eliminado correctamente",
            lote: loteEliminado
        });

    } catch (error) {

        console.error("Error al eliminar lote:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el lote está referenciado en otros registros (bloques, despachos, pulpeos, etc.)"
            });
        }

        res.status(500).json({
            error: "Error al eliminar el lote"
        });
    }
};


export const lotesController = {
    getLotes,
    getLoteById,
    getLotesByFinca,
    createLote,
    updateLote,
    deleteLote
};
