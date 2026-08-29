import { Router } from "express";
import { transportesController } from "../controllers/transportes.controller.js";
import { validarTransporte, validarIdTransporte } from "../middlewares/transportes.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO: ver/crear = operativo+, editar = coordinador+, eliminar = admin

// GET todos (ver)
router.get("/transportes", verifyToken, verifyOperativo, transportesController.getTransportes);
// GET por id (ver)
router.get("/transporte/:id_transporte", verifyToken, verifyOperativo, validarIdTransporte, transportesController.getTransporteById);
// POST crear (crear)
router.post("/registrartransporte", verifyToken, verifyOperativo, validarTransporte, transportesController.createTransporte);
// PUT actualizar (editar)
router.put("/actualizartransporte/:id_transporte", verifyToken, verifyCoordinador, validarIdTransporte, validarTransporte, transportesController.updateTransporte);
// DELETE eliminar (eliminar)
router.delete("/eliminartransporte/:id_transporte", verifyToken, verifyAdmin, validarIdTransporte, transportesController.deleteTransporte);

export default router;
