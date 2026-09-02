import ocupacionesModel from "../models/ocupaciones.model.js";

// ============================================================================
// OCUPACIONES DE CÁMARA
// ============================================================================
// ALCANCE POR CÁMARA
//   req.camaras lo pone el middleware cargarAlcance:
//       null  -> Admin / Coordinador (ven todas)
//       [...] -> Supervisor / Operativo (solo las suyas)
//
//   En los listados el filtro va en la query (modelo). En los endpoints que
//   operan sobre UNA ocupación se valida aquí, comparando el id_camara del
//   registro: así se distingue "no existe" (404) de "no es tuya" (403).
// ============================================================================

// Comprueba si el usuario puede tocar una cámara concreta.
// Se centraliza para no repetir la misma condición en cada handler.
const sinAcceso = (req, id_camara) =>
    Array.isArray(req.camaras) && !req.camaras.includes(Number(id_camara));

// GET /api/preenfrio/ocupaciones/ocupaciones
const getOcupaciones = async (req, res) => {
    try {
        const ocupaciones = await ocupacionesModel.getOcupaciones(req.camaras);
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
        const ocupacion = await ocupacionesModel.getOcupacionById(id_ocupacion);

        if (!ocupacion) {
            return res.status(404).json({
                error: "Ocupación no encontrada"
            });
        }
        if (sinAcceso(req, ocupacion.id_camara)) {
            return res.status(403).json({
                error: "No tienes acceso a esa cámara"
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
// El alcance ya lo valida validarCamaraEnAlcance en la ruta.
const getOcupacionesByCamara = async (req, res) => {
    try {
        const { id_camara } = req.params;
        const ocupaciones = await ocupacionesModel.getOcupacionesByCamara(id_camara);
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
        const ocupaciones = await ocupacionesModel.getOcupacionesActivas(req.camaras);
        res.status(200).json(ocupaciones);
    } catch (error) {
        console.error("Error al obtener ocupaciones activas:", error);
        res.status(500).json({
            error: "Error al obtener las ocupaciones activas"
        });
    }
};

// POST /api/preenfrio/ocupaciones/registrarocupacion
// El alcance de id_camara lo valida la ruta con validarCamaraEnAlcance.
const createOcupacion = async (req, res) => {
    try {
        const nuevaOcupacion = await ocupacionesModel.createOcupacion(req.body);
        res.status(201).json(nuevaOcupacion);
    } catch (error) {
        console.error("Error al crear ocupacion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La cámara o el mantenimiento indicados no existen"
            });
        }
        // El índice ux_ocupacion_inventario_camara_activa impide dos
        // ocupaciones de inventario activas en la misma cámara.
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Esa cámara ya tiene una ocupación de inventario activa"
            });
        }
        res.status(500).json({
            error:
                "Error al crear la ocupacion" +
                (error.message ? `: ${error.message}` : "")
        });
    }
};

// PUT /api/preenfrio/ocupaciones/actualizarocupacion/:id_ocupacion
const updateOcupacion = async (req, res) => {
    try {
        const { id_ocupacion } = req.params;

        // Se valida la ocupación ORIGEN antes de tocarla: no basta con
        // revisar la cámara que viene en el body.
        if (Array.isArray(req.camaras)) {
            const idCam = await ocupacionesModel.getCamaraDeOcupacion(id_ocupacion);
            if (idCam === null) {
                return res.status(404).json({ error: "Ocupación no encontrada" });
            }
            if (sinAcceso(req, idCam)) {
                return res.status(403).json({
                    error: "No tienes acceso a esa cámara"
                });
            }
        }

        const ocupacionActualizada = await ocupacionesModel.updateOcupacion(
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
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La cámara o el mantenimiento indicados no existen"
            });
        }
        res.status(500).json({
            error: "Error al actualizar la ocupacion"
        });
    }
};

// PATCH /api/preenfrio/ocupaciones/cerrarocupacion/:id_ocupacion
const cerrarOcupacion = async (req, res) => {
    try {
        const { id_ocupacion } = req.params;

        if (Array.isArray(req.camaras)) {
            const idCam = await ocupacionesModel.getCamaraDeOcupacion(id_ocupacion);
            if (idCam === null) {
                return res.status(404).json({ error: "Ocupación no encontrada" });
            }
            if (sinAcceso(req, idCam)) {
                return res.status(403).json({
                    error: "No tienes acceso a esa cámara"
                });
            }
        }

        const ocupacionCerrada = await ocupacionesModel.cerrarOcupacion(
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
        const ocupacionEliminada = await ocupacionesModel.deleteOcupacion(id_ocupacion);
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
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: la ocupación está referenciada en movimientos o despachos"
            });
        }
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
