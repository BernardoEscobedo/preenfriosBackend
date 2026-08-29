import evidenciasModel from "../models/evidenciasDespacho.model.js";
import despachosModel from "../models/despachos.model.js";
import {
    comprimirYGuardar,
    eliminarArchivo
} from "../middlewares/upload.middleware.js";

// ============================================================================
// EVIDENCIAS FOTOGRÁFICAS DE DESPACHO
// ============================================================================
// Flujo de subida:
//   1. Multer recibe el archivo en memoria (req.file.buffer).
//   2. Se valida el tope de 3 fotos por despacho.
//   3. Sharp comprime y guarda en backend/uploads/despachos/.
//   4. Se registra la ruta en la BD.
// ============================================================================

// GET /api/preenfrio/despachos/evidencias/:id_despacho
const getEvidencias = async (req, res) => {
    try {
        const { id_despacho } = req.params;
        if (!id_despacho || isNaN(Number(id_despacho))) {
            return res.status(400).json({
                error: "El id de despacho debe ser un número válido"
            });
        }
        const data = await evidenciasModel.getEvidenciasByDespacho(id_despacho);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener evidencias:", error);
        res.status(500).json({ error: "Error al obtener las evidencias" });
    }
};

// POST /api/preenfrio/despachos/evidencias/:id_despacho
// multipart/form-data → campo "foto" + campo opcional "descripcion"
const subirEvidencia = async (req, res) => {
    try {
        const { id_despacho } = req.params;
        const { descripcion } = req.body;

        if (!id_despacho || isNaN(Number(id_despacho))) {
            return res.status(400).json({
                error: "El id de despacho debe ser un número válido"
            });
        }
        if (!req.file) {
            return res.status(400).json({
                error: 'No se recibió ninguna imagen (campo "foto")'
            });
        }

        // El despacho debe existir: el nombre del archivo usa su folio
        const despacho = await despachosModel.getDespachoById(id_despacho);
        if (!despacho) {
            return res.status(404).json({ error: "Despacho no encontrado" });
        }

        // Tope de fotos por despacho
        const actuales = await evidenciasModel.contarEvidencias(id_despacho);
        if (actuales >= evidenciasModel.MAX_FOTOS) {
            return res.status(409).json({
                error: `Este despacho ya tiene el máximo de ${evidenciasModel.MAX_FOTOS} fotos. Elimina una para subir otra.`
            });
        }

        // Comprime (máx 1600px, ~300 KB) y guarda en disco
        const archivo = await comprimirYGuardar(
            req.file.buffer,
            despacho.folio_despacho,
            actuales + 1
        );

        const id_usuario =
            req.id_usuario ?? req.usuario?.id_usuario ?? null;

        const evidencia = await evidenciasModel.createEvidencia({
            id_despacho: Number(id_despacho),
            foto_url: archivo.foto_url,
            nombre_archivo: archivo.nombre_archivo,
            tamano_bytes: archivo.tamano_bytes,
            descripcion: descripcion?.trim() || null,
            id_usuario
        });

        res.status(201).json({
            mensaje: "Evidencia guardada correctamente",
            evidencia,
            // Útil para mostrar cuánto se ahorró al comprimir
            tamano_original: req.file.size,
            tamano_final: archivo.tamano_bytes
        });
    } catch (error) {
        console.error("Error al subir evidencia:", error);
        if (error.code === "23503") {
            return res.status(409).json({ error: "El despacho indicado no existe" });
        }
        res.status(500).json({ error: "Error al guardar la evidencia" });
    }
};

// DELETE /api/preenfrio/despachos/evidencias/:id_evidencia
// Borra el registro Y el archivo físico, para no dejar huérfanos en disco.
const eliminarEvidencia = async (req, res) => {
    try {
        const { id_evidencia } = req.params;
        if (!id_evidencia || isNaN(Number(id_evidencia))) {
            return res.status(400).json({
                error: "El id de evidencia debe ser un número válido"
            });
        }

        const evidencia = await evidenciasModel.getEvidenciaById(id_evidencia);
        if (!evidencia) {
            return res.status(404).json({ error: "Evidencia no encontrada" });
        }

        await evidenciasModel.deleteEvidencia(id_evidencia);
        eliminarArchivo(evidencia.nombre_archivo);

        res.status(200).json({
            mensaje: "Evidencia eliminada correctamente",
            evidencia
        });
    } catch (error) {
        console.error("Error al eliminar evidencia:", error);
        res.status(500).json({ error: "Error al eliminar la evidencia" });
    }
};

export const evidenciasController = {
    getEvidencias,
    subirEvidencia,
    eliminarEvidencia
};
