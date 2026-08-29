import { Router } from "express";
import { pulpeosController } from "../controllers/pulpeos.controller.js";
import { validarPulpeo, validarDetallePulpeo, validarEvidencia, validarIdPulpeo, validarIdPulpeoDetalle } from "../middlewares/pulpeos.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO: ver/crear = operativo+, editar = coordinador+, eliminar = admin

// GET todos (ver)
router.get("/pulpeos", verifyToken, verifyOperativo, pulpeosController.getPulpeos);
// GET encabezado por id (ver)
router.get("/pulpeo/:id", verifyToken, verifyOperativo, validarIdPulpeo, pulpeosController.getPulpeoById);
// GET encabezado + detalle + evidencia (ver)
router.get("/pulpeo/:id/detalle", verifyToken, verifyOperativo, validarIdPulpeo, pulpeosController.getPulpeoConDetalle);
// GET pulpeos por bloque (ver)
router.get("/bloque/:id_bloque", verifyToken, verifyOperativo, pulpeosController.getPulpeosByBloque);
// POST crear pulpeo (crear)
router.post("/registrarpulpeo", verifyToken, verifyOperativo, validarPulpeo, pulpeosController.createPulpeo);
// POST agregar línea de detalle (crear)
router.post("/pulpeo/:id/detalle", verifyToken, verifyOperativo, validarIdPulpeo, validarDetallePulpeo, pulpeosController.addDetalle);
// POST agregar evidencia/foto (crear)
router.post("/detalle/:id_pulpeo_detalle/evidencia", verifyToken, verifyOperativo, validarIdPulpeoDetalle, validarEvidencia, pulpeosController.addEvidencia);
// PUT actualizar encabezado (editar) -> era "cualquiera autenticado"; ahora coordinador+
router.put("/actualizarpulpeo/:id", verifyToken, verifyCoordinador, validarIdPulpeo, validarPulpeo, pulpeosController.updatePulpeo);
// DELETE pulpeo completo (eliminar) -> FIX: verifyToken PRIMERO, un solo guard (admin)
router.delete("/eliminarpulpeo/:id", verifyToken, verifyAdmin, validarIdPulpeo, pulpeosController.deletePulpeo);

export default router;
