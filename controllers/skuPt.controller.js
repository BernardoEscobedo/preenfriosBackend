import skuPtModel from "../models/skuPt.model.js";

// GET /api/preenfrio/skupt/skupt
const getSkuPt = async (req, res) => {
    try {
        const skus = await skuPtModel.getSkuPt();

        res.status(200).json(skus);

    } catch (error) {

        console.error("Error al obtener SKU:", error);

        res.status(500).json({
            error: "Error al obtener los SKU"
        });
    }
};


// GET /api/preenfrio/skupt/sku/:id
const getSkuPtById = async (req, res) => {

    try {

        const { id } = req.params;

        const sku =
            await skuPtModel.getSkuPtById(id);

        if (!sku) {

            return res.status(404).json({
                error: "SKU no encontrado"
            });
        }

        res.status(200).json(sku);

    } catch (error) {

        console.error("Error al obtener SKU:", error);

        res.status(500).json({
            error: "Error al obtener el SKU"
        });
    }
};


// POST /api/preenfrio/skupt/registrarsku
const createSkuPt = async (req, res) => {

    try {

        const nuevoSku =
            await skuPtModel.createSkuPt(req.body);

        res.status(201).json(nuevoSku);

    } catch (error) {

        console.error("Error al crear SKU:", error);

        res.status(500).json({
            error: "Error al crear el SKU"
        });
    }
};


// PUT /api/preenfrio/skupt/actualizarsku/:id
const updateSkuPt = async (req, res) => {

    try {

        const { id } = req.params;

        const skuActualizado =
            await skuPtModel.updateSkuPt(
                id,
                req.body
            );

        if (!skuActualizado) {

            return res.status(404).json({
                error: "SKU no encontrado"
            });
        }

        res.status(200).json(skuActualizado);

    } catch (error) {

        console.error("Error al actualizar SKU:", error);

        res.status(500).json({
            error: "Error al actualizar el SKU"
        });
    }
};


// DELETE /api/preenfrio/skupt/eliminarsku/:id
const deleteSkuPt = async (req, res) => {

    try {

        const { id } = req.params;

        const skuEliminado =
            await skuPtModel.deleteSkuPt(id);

        if (!skuEliminado) {

            return res.status(404).json({
                error: "SKU no encontrado"
            });
        }

        res.status(200).json({
            mensaje: "SKU eliminado correctamente",
            sku: skuEliminado
        });

    } catch (error) {

        console.error("Error al eliminar SKU:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el SKU tiene lotes asociados"
            });
        }

        res.status(500).json({
            error: "Error al eliminar el SKU"
        });
    }
};


export const skuPtController = {

    getSkuPt,
    getSkuPtById,
    createSkuPt,
    updateSkuPt,
    deleteSkuPt

};
