import productoresModel from "../models/productores.model.js";

// GET /api/preenfrio/productores/productores
const getProductores = async (req, res) => {
    try {
        const productores = await productoresModel.getProductores();
        res.status(200).json(productores);
    } catch (error) {
        console.error("Error al obtener productores:", error);
        res.status(500).json({
            error: "Error al obtener los productores"
        });
    }
};

// GET /api/preenfrio/productores/productor/:id
const getProductorById = async (req, res) => {
    try {
        const { id } = req.params;
        const productor = await productoresModel.getProductorById(id);
        if (!productor) {
            return res.status(404).json({
                error: "Productor no encontrado"
            });
        }
        res.status(200).json(productor);
    } catch (error) {
        console.error("Error al obtener productor:", error);
        res.status(500).json({
            error: "Error al obtener el productor"
        });
    }
};

// POST /api/preenfrio/productores/registrarproductor
const createProductor = async (req, res) => {
    try {
        const nuevoProductor = await productoresModel.createProductor(req.body);
        res.status(201).json(nuevoProductor);
    } catch (error) {
        console.error("Error al crear productor:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un productor con ese código"
            });
        }
        res.status(500).json({
            error: "Error al crear el productor"
        });
    }
};

// PUT /api/preenfrio/productores/actualizarproductor/:id
const updateProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const productorActualizado = await productoresModel.updateProductor(
            id,
            req.body
        );
        if (!productorActualizado) {
            return res.status(404).json({
                error: "Productor no encontrado"
            });
        }
        res.status(200).json(productorActualizado);
    } catch (error) {
        console.error("Error al actualizar productor:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un productor con ese código"
            });
        }
        res.status(500).json({
            error: "Error al actualizar el productor"
        });
    }
};

// DELETE /api/preenfrio/productores/eliminarproductor/:id
const deleteProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const productorEliminado = await productoresModel.deleteProductor(id);
        if (!productorEliminado) {
            return res.status(404).json({
                error: "Productor no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Productor eliminado correctamente",
            productor: productorEliminado
        });
    } catch (error) {
        console.error("Error al eliminar productor:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el productor tiene fincas asociadas"
            });
        }
        res.status(500).json({
            error: "Error al eliminar el productor"
        });
    }
};

export const productoresController = {
    getProductores,
    getProductorById,
    createProductor,
    updateProductor,
    deleteProductor
};
