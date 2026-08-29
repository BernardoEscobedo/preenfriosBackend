import { Router } from "express";
import { mantenimientosController } from "../controllers/mantenimientos.controller.js";
import { validarMantenimiento, validarIdMantenimiento, validarIdCamaraParam } from "../middlewares/mantenimientos.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO: ver/crear = operativo+, editar = coordinador+, eliminar = admin

// Obtener mantenimientos (ver)
router.get("/mantenimientos", verifyToken, verifyOperativo, mantenimientosController.getMantenimientos);
// Obtener mantenimiento por ID (ver)
router.get("/mantenimiento/:id_mantenimiento", verifyToken, verifyOperativo, validarIdMantenimiento, mantenimientosController.getMantenimientoById);
// Obtener mantenimientos por cámara (ver)
router.get("/camara/:id_camara", verifyToken, verifyOperativo, validarIdCamaraParam, mantenimientosController.getMantenimientosByCamara);
// Registrar mantenimiento (crear)
router.post("/registrarmantenimiento", verifyToken, verifyOperativo, validarMantenimiento, mantenimientosController.createMantenimiento);
// Actualizar mantenimiento (editar) -> era "cualquiera autenticado"; ahora coordinador+
router.put("/actualizarmantenimiento/:id_mantenimiento", verifyToken, verifyCoordinador, validarIdMantenimiento, validarMantenimiento, mantenimientosController.updateMantenimiento);
// Eliminar mantenimiento (eliminar) -> FIX: verifyToken PRIMERO, un solo guard (admin)
router.delete("/eliminarmantenimiento/:id_mantenimiento", verifyToken, verifyAdmin, validarIdMantenimiento, mantenimientosController.deleteMantenimiento);

export default router;
