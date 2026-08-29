import bloquesFrutaModel from "../models/bloquesFruta.model.js";

// GET /api/preenfrio/bloques/bloques
const getBloques = async (req, res) => {
    try {
        const bloques = await bloquesFrutaModel.getBloques();

        res.status(200).json(bloques);

    } catch (error) {

        console.error("Error al obtener bloques:", error);

        res.status(500).json({
            error: "Error al obtener los bloques"
        });
    }
};


// GET /api/preenfrio/bloques/bloque/:id
const getBloqueById = async (req, res) => {

    try {

        const { id } = req.params;

        const bloque =
            await bloquesFrutaModel.getBloqueById(id);

        if (!bloque) {

            return res.status(404).json({
                error: "Bloque no encontrado"
            });
        }

        res.status(200).json(bloque);

    } catch (error) {

        console.error("Error al obtener bloque:", error);

        res.status(500).json({
            error: "Error al obtener el bloque"
        });
    }
};


// GET /api/preenfrio/bloques/bloque/:id/detalle
const getBloqueConDetalle = async (req, res) => {

    try {

        const { id } = req.params;

        const bloque =
            await bloquesFrutaModel.getBloqueConDetalle(id);

        if (!bloque) {

            return res.status(404).json({
                error: "Bloque no encontrado"
            });
        }

        res.status(200).json(bloque);

    } catch (error) {

        console.error("Error al obtener el bloque con detalle:", error);

        res.status(500).json({
            error: "Error al obtener el bloque con su detalle"
        });
    }
};


// POST /api/preenfrio/bloques/registrarbloque
const createBloque = async (req, res) => {

    try {

        const nuevoBloque =
            await bloquesFrutaModel.createBloque(req.body);

        res.status(201).json(nuevoBloque);

    } catch (error) {

        console.error("Error al crear bloque:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un bloque con ese código"
            });
        }

        res.status(500).json({
            error: "Error al crear el bloque"
        });
    }
};


// PUT /api/preenfrio/bloques/actualizarbloque/:id
const updateBloque = async (req, res) => {

    try {

        const { id } = req.params;

        const bloqueActualizado =
            await bloquesFrutaModel.updateBloque(
                id,
                req.body
            );

        if (!bloqueActualizado) {

            return res.status(404).json({
                error: "Bloque no encontrado"
            });
        }

        res.status(200).json(bloqueActualizado);

    } catch (error) {

        console.error("Error al actualizar bloque:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un bloque con ese código"
            });
        }

        res.status(500).json({
            error: "Error al actualizar el bloque"
        });
    }
};


// DELETE /api/preenfrio/bloques/eliminarbloque/:id
const deleteBloque = async (req, res) => {

    try {

        const { id } = req.params;

        const bloqueEliminado =
            await bloquesFrutaModel.deleteBloque(id);

        if (!bloqueEliminado) {

            return res.status(404).json({
                error: "Bloque no encontrado"
            });
        }

        res.status(200).json({
            mensaje: "Bloque eliminado correctamente",
            bloque: bloqueEliminado
        });

    } catch (error) {

        console.error("Error al eliminar bloque:", error);

        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el bloque tiene detalle de lotes u otros registros asociados"
            });
        }

        res.status(500).json({
            error: "Error al eliminar el bloque"
        });
    }
};


export const bloquesFrutaController = {

    getBloques,
    getBloqueById,
    getBloqueConDetalle,
    createBloque,
    updateBloque,
    deleteBloque

};
