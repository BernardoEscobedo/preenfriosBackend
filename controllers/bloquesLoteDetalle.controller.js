import bloquesLoteDetalleModel from "../models/bloquesLoteDetalle.model.js";

// GET /api/preenfrio/bloqueslotedetalle/detalles
const getDetalles = async (req, res) => {
    try {
        const detalles = await bloquesLoteDetalleModel.getDetalles();

        res.status(200).json(detalles);

    } catch (error) {

        console.error("Error al obtener el detalle de bloques:", error);

        res.status(500).json({
            error: "Error al obtener el detalle de bloques"
        });
    }
};


// GET /api/preenfrio/bloqueslotedetalle/detalle/:id
const getDetalleById = async (req, res) => {

    try {

        const { id } = req.params;

        const detalle =
            await bloquesLoteDetalleModel.getDetalleById(id);

        if (!detalle) {

            return res.status(404).json({
                error: "Detalle no encontrado"
            });
        }

        res.status(200).json(detalle);

    } catch (error) {

        console.error("Error al obtener detalle:", error);

        res.status(500).json({
            error: "Error al obtener el detalle"
        });
    }
};


// GET /api/preenfrio/bloqueslotedetalle/bloque/:id_bloque
const getDetallesByBloque = async (req, res) => {

    try {

        const { id_bloque } = req.params;

        if (!id_bloque || isNaN(Number(id_bloque))) {
            return res.status(400).json({
                error: "El id de bloque debe ser un número válido"
            });
        }

        const detalles =
            await bloquesLoteDetalleModel.getDetallesByBloque(id_bloque);

        res.status(200).json(detalles);

    } catch (error) {

        console.error("Error al obtener el detalle del bloque:", error);

        res.status(500).json({
            error: "Error al obtener el detalle del bloque"
        });
    }
};


// GET /api/preenfrio/bloqueslotedetalle/lote/:id_lote
const getDetallesByLote = async (req, res) => {

    try {

        const { id_lote } = req.params;

        if (!id_lote || isNaN(Number(id_lote))) {
            return res.status(400).json({
                error: "El id de lote debe ser un número válido"
            });
        }

        const detalles =
            await bloquesLoteDetalleModel.getDetallesByLote(id_lote);

        res.status(200).json(detalles);

    } catch (error) {

        console.error("Error al obtener los bloques del lote:", error);

        res.status(500).json({
            error: "Error al obtener los bloques del lote"
        });
    }
};


// POST /api/preenfrio/bloqueslotedetalle/registrardetalle
const createDetalle = async (req, res) => {

    try {

        const nuevoDetalle =
            await bloquesLoteDetalleModel.createDetalle(req.body);

        res.status(201).json(nuevoDetalle);

    } catch (error) {

        console.error("Error al crear detalle:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ese lote ya está registrado en este bloque; usa actualizar en vez de crear otro"
            });
        }

        if (error.code === "23503") {
            return res.status(409).json({
                error: "El bloque o el lote indicado no existe"
            });
        }

        res.status(500).json({
            error: "Error al crear el detalle"
        });
    }
};


// PUT /api/preenfrio/bloqueslotedetalle/actualizardetalle/:id
const updateDetalle = async (req, res) => {

    try {

        const { id } = req.params;

        const detalleActualizado =
            await bloquesLoteDetalleModel.updateDetalle(
                id,
                req.body
            );

        if (!detalleActualizado) {

            return res.status(404).json({
                error: "Detalle no encontrado"
            });
        }

        res.status(200).json(detalleActualizado);

    } catch (error) {

        console.error("Error al actualizar detalle:", error);

        res.status(500).json({
            error: "Error al actualizar el detalle"
        });
    }
};


// DELETE /api/preenfrio/bloqueslotedetalle/eliminardetalle/:id
const deleteDetalle = async (req, res) => {

    try {

        const { id } = req.params;

        const detalleEliminado =
            await bloquesLoteDetalleModel.deleteDetalle(id);

        if (!detalleEliminado) {

            return res.status(404).json({
                error: "Detalle no encontrado"
            });
        }

        res.status(200).json({
            mensaje: "Detalle eliminado correctamente (los totales del bloque se recalcularon automáticamente)",
            detalle: detalleEliminado
        });

    } catch (error) {

        console.error("Error al eliminar detalle:", error);

        res.status(500).json({
            error: "Error al eliminar el detalle"
        });
    }
};


export const bloquesLoteDetalleController = {

    getDetalles,
    getDetalleById,
    getDetallesByBloque,
    getDetallesByLote,
    createDetalle,
    updateDetalle,
    deleteDetalle

};
