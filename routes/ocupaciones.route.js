import { Router } from "express";
import { ocupacionesController } from "../controllers/ocupaciones.controller.js";
import { validarOcupacion, validarCierreOcupacion, validarIdOcupacion, validarIdCamaraParam } from "../middlewares/ocupaciones.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar/cerrar = coordinador+, eliminar = admin
// FIX DE SEGURIDAD: antes NINGUNA ruta tenía verifyToken (estaba 100% abierto).

// Obtener ocupaciones (ver)
router.get("/ocupaciones", verifyToken, verifySupervisor, ocupacionesController.getOcupaciones);
// Obtener ocupaciones activas (ver)
router.get("/activas", verifyToken, verifySupervisor, ocupacionesController.getOcupacionesActivas);
// Obtener ocupación por ID (ver)
router.get("/ocupacion/:id_ocupacion", verifyToken, verifySupervisor, validarIdOcupacion, ocupacionesController.getOcupacionById);
// Obtener ocupaciones por cámara (ver)
router.get("/camara/:id_camara", verifyToken, verifySupervisor, validarIdCamaraParam, ocupacionesController.getOcupacionesByCamara);
// Registrar ocupación (crear)
router.post("/registrarocupacion", verifyToken, verifySupervisor, validarOcupacion, ocupacionesController.createOcupacion);
// Actualizar ocupación (editar)
router.put("/actualizarocupacion/:id_ocupacion", verifyToken, verifyCoordinador, validarIdOcupacion, validarOcupacion, ocupacionesController.updateOcupacion);
// Cerrar ocupación (editar)
router.patch("/cerrarocupacion/:id_ocupacion", verifyToken, verifyCoordinador, validarIdOcupacion, validarCierreOcupacion, ocupacionesController.cerrarOcupacion);
// Eliminar ocupación (eliminar)
router.delete("/eliminarocupacion/:id_ocupacion", verifyToken, verifyAdmin, validarIdOcupacion, ocupacionesController.deleteOcupacion);

export default router;
