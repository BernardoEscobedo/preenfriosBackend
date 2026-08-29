import { Router } from "express";
import { bloquesLoteDetalleController } from "../controllers/bloquesLoteDetalle.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";
import { validarDetalle, validarActualizarDetalle, validarIdDetalle } from "../middlewares/bloquesLoteDetalle.middleware.js";

const router = Router();

// Composición de bloques: sigue el mismo criterio que bloques (OPERATIVO)

// Obtener todo el detalle (ver)
router.get("/detalles", verifyToken, verifyOperativo, bloquesLoteDetalleController.getDetalles);
// Obtener detalle por ID (ver)
router.get("/detalle/:id", verifyToken, verifyOperativo, validarIdDetalle, bloquesLoteDetalleController.getDetalleById);
// Obtener composición (detalle) de un bloque (ver)
router.get("/bloque/:id_bloque", verifyToken, verifyOperativo, bloquesLoteDetalleController.getDetallesByBloque);
// Obtener en qué bloques aparece un lote (ver)
router.get("/lote/:id_lote", verifyToken, verifyOperativo, bloquesLoteDetalleController.getDetallesByLote);
// Registrar detalle (crear)
router.post("/registrardetalle", verifyToken, verifyOperativo, validarDetalle, bloquesLoteDetalleController.createDetalle);
// Actualizar detalle (editar)
router.put("/actualizardetalle/:id", verifyToken, verifyCoordinador, validarIdDetalle, validarActualizarDetalle, bloquesLoteDetalleController.updateDetalle);
// Eliminar detalle (eliminar)
router.delete("/eliminardetalle/:id", verifyToken, verifyAdmin, validarIdDetalle, bloquesLoteDetalleController.deleteDetalle);

export default router;
