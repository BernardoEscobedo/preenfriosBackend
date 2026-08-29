import { Router } from "express";
import { camarasController } from "../controllers/camaras.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";
import { validarCamara, validarIdCamara } from "../middlewares/camaras.middleware.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin
// (operativo NO tiene acceso a este panel)

// Obtener camaras (ver)
router.get("/camaras", verifyToken, verifySupervisor, camarasController.getCamaras);
// Obtener camara por ID (ver)
router.get("/camara/:id_camara", verifyToken, verifySupervisor, validarIdCamara, camarasController.getCamaraById);
// Registrar camara (crear)
router.post("/registrarcamara", verifyToken, verifySupervisor, validarCamara, camarasController.createCamara);
// Actualizar camara (editar)
router.put("/actualizarcamara/:id_camara", verifyToken, verifyCoordinador, validarIdCamara, validarCamara, camarasController.updateCamara);
// Eliminar camara (eliminar)
router.delete("/eliminarcamara/:id_camara", verifyToken, verifyAdmin, validarIdCamara, camarasController.deleteCamara);

export default router;
