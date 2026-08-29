import { Router } from "express";
import { lotesController } from "../controllers/lotes.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";
import { validarLote, validarIdLote } from "../middlewares/lotes.middleware.js";

const router = Router();

// Módulo OPERATIVO: ver/crear = operativo+, editar = coordinador+, eliminar = admin

// Obtener lotes (ver)
router.get("/lotes", verifyToken, verifyOperativo, lotesController.getLotes);
// Obtener lote por ID (ver)
router.get("/lote/:id", verifyToken, verifyOperativo, validarIdLote, lotesController.getLoteById);
// Obtener lotes por finca (ver)
router.get("/finca/:id_finca", verifyToken, verifyOperativo, lotesController.getLotesByFinca);
// Registrar lote (crear)
router.post("/registrarlote", verifyToken, verifyOperativo, validarLote, lotesController.createLote);
// Actualizar lote (editar)
router.put("/actualizarlote/:id", verifyToken, verifyCoordinador, validarIdLote, validarLote, lotesController.updateLote);
// Eliminar lote (eliminar)
router.delete("/eliminarlote/:id", verifyToken, verifyAdmin, validarIdLote, lotesController.deleteLote);

export default router;
