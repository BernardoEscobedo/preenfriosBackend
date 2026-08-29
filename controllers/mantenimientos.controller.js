import mantenimientosModel from "../models/mantenimientos.model.js";

// GET /api/preenfrio/mantenimientos/mantenimientos
const getMantenimientos = async (req, res) => {
    try {
        const mantenimientos = await mantenimientosModel.getMantenimientos();

        res.status(200).json(mantenimientos);

    } catch (error) {

        console.error("Error al obtener mantenimientos:", error);

        res.status(500).json({
            error: "Error al obtener los mantenimientos"
        });
    }
};


// GET /api/preenfrio/mantenimientos/mantenimiento/:id_mantenimiento
const getMantenimientoById = async (req, res) => {

    try {

        const { id_mantenimiento } = req.params;

        const mantenimiento =
            await mantenimientosModel.getMantenimientoById(id_mantenimiento);

        if (!mantenimiento) {

            return res.status(404).json({
                error: "Mantenimiento no encontrado"
            });
        }

        res.status(200).json(mantenimiento);

    } catch (error) {

        console.error("Error al obtener mantenimiento:", error);

        res.status(500).json({
            error: "Error al obtener el mantenimiento"
        });
    }
};


// GET /api/preenfrio/mantenimientos/camara/:id_camara
const getMantenimientosByCamara = async (req, res) => {

    try {

        const { id_camara } = req.params;

        const mantenimientos =
            await mantenimientosModel.getMantenimientosByCamara(id_camara);

        res.status(200).json(mantenimientos);

    } catch (error) {

        console.error("Error al obtener mantenimientos de la camara:", error);

        res.status(500).json({
            error: "Error al obtener los mantenimientos de la camara"
        });
    }
};


// POST /api/preenfrio/mantenimientos/registrarmantenimiento
const createMantenimiento = async (req, res) => {

    try {

        const nuevoMantenimiento =
            await mantenimientosModel.createMantenimiento(req.body);

        res.status(201).json(nuevoMantenimiento);

    } catch (error) {

        console.error("Error al crear mantenimiento:", error);

        res.status(500).json({
            error: "Error al crear el mantenimiento"
        });
    }
};


// PUT /api/preenfrio/mantenimientos/actualizarmantenimiento/:id_mantenimiento
const updateMantenimiento = async (req, res) => {

    try {

        const { id_mantenimiento } = req.params;

        const mantenimientoActualizado =
            await mantenimientosModel.updateMantenimiento(
                id_mantenimiento,
                req.body
            );

        if (!mantenimientoActualizado) {

            return res.status(404).json({
                error: "Mantenimiento no encontrado"
            });
        }

        res.status(200).json(mantenimientoActualizado);

    } catch (error) {

        console.error("Error al actualizar mantenimiento:", error);

        res.status(500).json({
            error: "Error al actualizar el mantenimiento"
        });
    }
};


// DELETE /api/preenfrio/mantenimientos/eliminarmantenimiento/:id_mantenimiento
const deleteMantenimiento = async (req, res) => {

    try {

        const { id_mantenimiento } = req.params;

        const mantenimientoEliminado =
            await mantenimientosModel.deleteMantenimiento(id_mantenimiento);

        if (!mantenimientoEliminado) {

            return res.status(404).json({
                error: "Mantenimiento no encontrado"
            });
        }

        res.status(200).json({
            mensaje: "Mantenimiento eliminado correctamente",
            mantenimiento: mantenimientoEliminado
        });

    } catch (error) {

        console.error("Error al eliminar mantenimiento:", error);

        res.status(500).json({
            error: "Error al eliminar el mantenimiento"
        });
    }
};


export const mantenimientosController = {
    getMantenimientos,
    getMantenimientoById,
    getMantenimientosByCamara,
    createMantenimiento,
    updateMantenimiento,
    deleteMantenimiento
};
