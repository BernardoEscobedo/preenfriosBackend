import ocupacionesModel from "../models/ocupaciones.model.js";

// GET /api/preenfrio/ocupaciones/ocupaciones
const getOcupaciones = async (req, res) => {
    try {
        const ocupaciones = await ocupacionesModel.getOcupaciones();

        res.status(200).json(ocupaciones);

    } catch (error) {

        console.error("Error al obtener ocupaciones:", error);

        res.status(500).json({
            error: "Error al obtener las ocupaciones"
        });
    }
};


// GET /api/preenfrio/ocupaciones/ocupacion/:id_ocupacion
const getOcupacionById = async (req, res) => {

    try {

        const { id_ocupacion } = req.params;

        const ocupacion =
            await ocupacionesModel.getOcupacionById(id_ocupacion);

        if (!ocupacion) {

            return res.status(404).json({
                error: "Ocupación no encontrada"
            });
        }

        res.status(200).json(ocupacion);

    } catch (error) {

        console.error("Error al obtener ocupacion:", error);

        res.status(500).json({
            error: "Error al obtener la ocupacion"
        });
    }
};


// GET /api/preenfrio/ocupaciones/camara/:id_camara
const getOcupacionesByCamara = async (req, res) => {

    try {

        const { id_camara } = req.params;

        const ocupaciones =
            await ocupacionesModel.getOcupacionesByCamara(id_camara);

        res.status(200).json(ocupaciones);

    } catch (error) {

        console.error("Error al obtener ocupaciones de la camara:", error);

        res.status(500).json({
            error: "Error al obtener las ocupaciones de la camara"
        });
    }
};


// GET /api/preenfrio/ocupaciones/activas
const getOcupacionesActivas = async (req, res) => {

    try {

        const ocupaciones = await ocupacionesModel.getOcupacionesActivas();

        res.status(200).json(ocupaciones);

    } catch (error) {

        console.error("Error al obtener ocupaciones activas:", error);

        res.status(500).json({
            error: "Error al obtener las ocupaciones activas"
        });
    }
};


// POST /api/preenfrio/ocupaciones/registrarocupacion
const createOcupacion = async (req, res) => {

    try {

        const nuevaOcupacion =
            await ocupacionesModel.createOcupacion(req.body);

        res.status(201).json(nuevaOcupacion);

    } catch (error) {

        console.error("Error al crear ocupacion:", error);

        res.status(500).json({
            error: "Error al crear la ocupacion"
        });
    }
};


// PUT /api/preenfrio/ocupaciones/actualizarocupacion/:id_ocupacion
const updateOcupacion = async (req, res) => {

    try {

        const { id_ocupacion } = req.params;

        const ocupacionActualizada =
            await ocupacionesModel.updateOcupacion(
                id_ocupacion,
                req.body
            );

        if (!ocupacionActualizada) {

            return res.status(404).json({
                error: "Ocupación no encontrada"
            });
        }

        res.status(200).json(ocupacionActualizada);

    } catch (error) {

        console.error("Error al actualizar ocupacion:", error);

        res.status(500).json({
            error: "Error al actualizar la ocupacion"
        });
    }
};


// PATCH /api/preenfrio/ocupaciones/cerrarocupacion/:id_ocupacion
const cerrarOcupacion = async (req, res) => {

    try {

        const { id_ocupacion } = req.params;

        const ocupacionCerrada =
            await ocupacionesModel.cerrarOcupacion(
                id_ocupacion,
                req.body
            );

        if (!ocupacionCerrada) {

            return res.status(404).json({
                error: "Ocupación no encontrada"
            });
        }

        res.status(200).json(ocupacionCerrada);

    } catch (error) {

        console.error("Error al cerrar ocupacion:", error);

        res.status(500).json({
            error: "Error al cerrar la ocupacion"
        });
    }
};


// DELETE /api/preenfrio/ocupaciones/eliminarocupacion/:id_ocupacion
const deleteOcupacion = async (req, res) => {

    try {

        const { id_ocupacion } = req.params;

        const ocupacionEliminada =
            await ocupacionesModel.deleteOcupacion(id_ocupacion);

        if (!ocupacionEliminada) {

            return res.status(404).json({
                error: "Ocupación no encontrada"
            });
        }

        res.status(200).json({
            mensaje: "Ocupación eliminada correctamente",
            ocupacion: ocupacionEliminada
        });

    } catch (error) {

        console.error("Error al eliminar ocupacion:", error);

        res.status(500).json({
            error: "Error al eliminar la ocupacion"
        });
    }
};


export const ocupacionesController = {
    getOcupaciones,
    getOcupacionById,
    getOcupacionesByCamara,
    getOcupacionesActivas,
    createOcupacion,
    updateOcupacion,
    cerrarOcupacion,
    deleteOcupacion
};
