import produccionModel from "../models/produccion.model.js";

// GET /api/preenfrio/produccion/produccion
const getProducciones = async (req, res) => {
    try {
        const producciones = await produccionModel.getProducciones();
        res.status(200).json(producciones);
    } catch (error) {
        console.error("Error al obtener producciones:", error);
        res.status(500).json({
            error: "Error al obtener las producciones"
        });
    }
};

// GET /api/preenfrio/produccion/produccion/:id
const getProduccionById = async (req, res) => {
    try {
        const { id } = req.params;
        const produccion = await produccionModel.getProduccionById(id);
        if (!produccion) {
            return res.status(404).json({
                error: "Producción no encontrada"
            });
        }
        res.status(200).json(produccion);
    } catch (error) {
        console.error("Error al obtener produccion:", error);
        res.status(500).json({
            error: "Error al obtener la produccion"
        });
    }
};

// GET /api/preenfrio/produccion/semana/:semana
const getProduccionesBySemana = async (req, res) => {
    try {
        const { semana } = req.params;
        if (!semana || isNaN(Number(semana))) {
            return res.status(400).json({
                error: "La semana debe ser un número válido"
            });
        }
        const producciones = await produccionModel.getProduccionesBySemana(
            semana
        );
        res.status(200).json(producciones);
    } catch (error) {
        console.error("Error al obtener producciones de la semana:", error);
        res.status(500).json({
            error: "Error al obtener las producciones de la semana"
        });
    }
};

// POST /api/preenfrio/produccion/registrarproduccion
const createProduccion = async (req, res) => {
    try {
        const nuevaProduccion = await produccionModel.createProduccion(
            req.body
        );
        res.status(201).json(nuevaProduccion);
    } catch (error) {
        console.error("Error al crear produccion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "Finca, productor, SKU, cliente o cámara indicados no existen"
            });
        }
        res.status(500).json({
            error: "Error al crear la produccion"
        });
    }
};

// PUT /api/preenfrio/produccion/actualizarproduccion/:id
const updateProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const produccionActualizada = await produccionModel.updateProduccion(
            id,
            req.body
        );
        if (!produccionActualizada) {
            return res.status(404).json({
                error: "Producción no encontrada"
            });
        }
        res.status(200).json(produccionActualizada);
    } catch (error) {
        console.error("Error al actualizar produccion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "Finca, productor, SKU, cliente o cámara indicados no existen"
            });
        }
        res.status(500).json({
            error: "Error al actualizar la produccion"
        });
    }
};

// DELETE /api/preenfrio/produccion/eliminarproduccion/:id
const deleteProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const produccionEliminada = await produccionModel.deleteProduccion(id);
        if (!produccionEliminada) {
            return res.status(404).json({
                error: "Producción no encontrada"
            });
        }
        res.status(200).json({
            mensaje: "Producción eliminada correctamente",
            produccion: produccionEliminada
        });
    } catch (error) {
        console.error("Error al eliminar produccion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: la producción tiene recepciones asociadas"
            });
        }
        res.status(500).json({
            error: "Error al eliminar la produccion"
        });
    }
};

export const produccionController = {
    getProducciones,
    getProduccionById,
    getProduccionesBySemana,
    createProduccion,
    updateProduccion,
    deleteProduccion
};
