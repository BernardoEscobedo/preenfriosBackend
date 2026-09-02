import camarasModel from "../models/camaras.model.js";

// ============================================================================
// CÁMARAS
// ============================================================================
// ALCANCE POR CÁMARA
//   req.camaras lo pone el middleware cargarAlcance:
//       null  -> Admin / Coordinador (ven todas)
//       [...] -> Supervisor / Operativo (solo las suyas)
// ============================================================================

// GET /api/preenfrio/camaras/camaras
const getCamaras = async (req, res) => {
    try {
        const camaras = await camarasModel.getCamaras(req.camaras);
        res.status(200).json(camaras);
    } catch (error) {
        console.error("Error al obtener camaras:", error);
        res.status(500).json({
            error: "Error al obtener las camaras"
        });
    }
};

// GET /api/preenfrio/camaras/camara/:id_camara
const getCamaraById = async (req, res) => {
    try {
        const { id_camara } = req.params;
        const camara = await camarasModel.getCamaraById(id_camara);

        if (!camara) {
            return res.status(404).json({
                error: "Cámara no encontrada"
            });
        }

        // Alcance: se valida DESPUÉS de traerla para poder distinguir entre
        // "no existe" (404) y "existe pero no es tuya" (403).
        if (
            Array.isArray(req.camaras) &&
            !req.camaras.includes(Number(camara.id_camara))
        ) {
            return res.status(403).json({
                error: "No tienes acceso a esa cámara"
            });
        }

        res.status(200).json(camara);
    } catch (error) {
        console.error("Error al obtener camara:", error);
        res.status(500).json({
            error: "Error al obtener la camara"
        });
    }
};

// POST /api/preenfrio/camaras/registrarcamara
// Dar de alta cámaras es decisión de coordinación (ver la ruta), así que
// aquí no hay validación de alcance: quien llega tiene alcance total.
const createCamara = async (req, res) => {
    try {
        const nuevaCamara = await camarasModel.createCamara(req.body);
        res.status(201).json(nuevaCamara);
    } catch (error) {
        console.error("Error al crear camara:", error);
        res.status(500).json({
            error:
                "Error al crear la camara" +
                (error.message ? `: ${error.message}` : "")
        });
    }
};

// PUT /api/preenfrio/camaras/actualizarcamara/:id_camara
const updateCamara = async (req, res) => {
    try {
        const { id_camara } = req.params;
        const camaraActualizada = await camarasModel.updateCamara(
            id_camara,
            req.body
        );
        if (!camaraActualizada) {
            return res.status(404).json({
                error: "Cámara no encontrada"
            });
        }
        res.status(200).json(camaraActualizada);
    } catch (error) {
        console.error("Error al actualizar camara:", error);
        res.status(500).json({
            error: "Error al actualizar la camara"
        });
    }
};

// DELETE /api/preenfrio/camaras/eliminarcamara/:id_camara
const deleteCamara = async (req, res) => {
    try {
        const { id_camara } = req.params;
        const camaraEliminada = await camarasModel.deleteCamara(id_camara);
        if (!camaraEliminada) {
            return res.status(404).json({
                error: "Cámara no encontrada"
            });
        }
        res.status(200).json({
            mensaje: "Cámara eliminada correctamente",
            camara: camaraEliminada
        });
    } catch (error) {
        console.error("Error al eliminar camara:", error);
        // La cámara puede estar referenciada por ocupaciones, producción,
        // recepciones o movimientos: conviene decirlo en vez de un 500 mudo.
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: la cámara tiene ocupaciones, producción o movimientos asociados"
            });
        }
        res.status(500).json({
            error: "Error al eliminar la camara"
        });
    }
};

export const camarasController = {
    getCamaras,
    getCamaraById,
    createCamara,
    updateCamara,
    deleteCamara
};
