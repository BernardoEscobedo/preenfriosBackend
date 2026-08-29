import fincasModel from "../models/fincas.model.js";

// GET /api/preenfrio/fincas/fincas
const getFincas = async (req, res) => {
    try {
        const fincas = await fincasModel.getFincas();

        res.status(200).json(fincas);

    } catch (error) {

        console.error("Error al obtener fincas:", error);

        res.status(500).json({
            error: "Error al obtener las fincas"
        });
    }
};


// GET /api/preenfrio/fincas/finca/:id
const getFincaById = async (req, res) => {

    try {

        const { id } = req.params;

        const finca =
            await fincasModel.getFincaById(id);

        if (!finca) {

            return res.status(404).json({
                error: "Finca no encontrada"
            });
        }

        res.status(200).json(finca);

    } catch (error) {

        console.error("Error al obtener finca:", error);

        res.status(500).json({
            error: "Error al obtener la finca"
        });
    }
};


// GET /api/preenfrio/fincas/productor/:id_productor
const getFincasByProductor = async (req, res) => {

    try {

        const { id_productor } = req.params;

        if (!id_productor || isNaN(Number(id_productor))) {
            return res.status(400).json({
                error: "El id de productor debe ser un número válido"
            });
        }

        const fincas =
            await fincasModel.getFincasByProductor(id_productor);

        res.status(200).json(fincas);

    } catch (error) {

        console.error("Error al obtener fincas del productor:", error);

        res.status(500).json({
            error: "Error al obtener las fincas del productor"
        });
    }
};


// POST /api/preenfrio/fincas/registrarfinca
const createFinca = async (req, res) => {

    try {

        const nuevaFinca =
            await fincasModel.createFinca(req.body);

        res.status(201).json(nuevaFinca);

    } catch (error) {

        console.error("Error al crear finca:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe una finca con ese código"
            });
        }

        if (error.code === "23503") {
            return res.status(409).json({
                error: "El productor indicado no existe"
            });
        }

        res.status(500).json({
            error: "Error al crear la finca"
        });
    }
};


// PUT /api/preenfrio/fincas/actualizarfinca/:id
const updateFinca = async (req, res) => {

    try {

        const { id } = req.params;

        const fincaActualizada =
            await fincasModel.updateFinca(
                id,
                req.body
            );

        if (!fincaActualizada) {

            return res.status(404).json({
                error: "Finca no encontrada"
            });
        }

        res.status(200).json(fincaActualizada);

    } catch (error) {

        console.error("Error al actualizar finca:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe una finca con ese código"
            });
        }

        if (error.code === "23503") {
            return res.status(409).json({
                error: "El productor indicado no existe"
            });
        }

        res.status(500).json({
            error: "Error al actualizar la finca"
        });
    }
};


// DELETE /api/preenfrio/fincas/eliminarfinca/:id
const deleteFinca = async (req, res) => {

    try {

        const { id } = req.params;

        const fincaEliminada =
            await fincasModel.deleteFinca(id);

        if (!fincaEliminada) {

            return res.status(404).json({
                error: "Finca no encontrada"
            });
        }

        res.status(200).json({
            mensaje: "Finca eliminada correctamente",
            finca: fincaEliminada
        });

    } catch (error) {

        console.error("Error al eliminar finca:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: la finca tiene lotes asociados"
            });
        }

        res.status(500).json({
            error: "Error al eliminar la finca"
        });
    }
};


export const fincasController = {
    getFincas,
    getFincaById,
    getFincasByProductor,
    createFinca,
    updateFinca,
    deleteFinca
};
