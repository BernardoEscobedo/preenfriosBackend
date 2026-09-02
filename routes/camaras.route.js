import { Router } from "express";
import { camarasController } from "../controllers/camaras.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";
import { validarCamara, validarIdCamara } from "../middlewares/camaras.middleware.js";
import { cargarAlcance, validarCamaraEnAlcance } from "../middlewares/alcance.middleware.js";

const router = Router();

// CATÁLOGO/OP: ver = supervisor+, crear/editar = coordinador+, eliminar = admin
// (operativo NO tiene acceso a este panel)
//
// ALCANCE POR CÁMARA
//   cargarAlcance va después de verifyToken y deja en req.camaras las
//   cámaras visibles del usuario. Filtrar este catálogo acota además todos
//   los DROPDOWNS del sistema: un supervisor de Doña Nelly no podrá elegir
//   Fortaleza al mover inventario, porque su lista no la trae.
//
// NOTA SOBRE "crear"
//   Se subió de verifySupervisor a verifyCoordinador: dar de alta una
//   cámara define capacidades que impactan a toda la operación, no es una
//   acción de piso.

// Obtener camaras (ver) — filtradas por alcance
router.get("/camaras", verifyToken, verifySupervisor, cargarAlcance, camarasController.getCamaras);

// Obtener camara por ID (ver) — el controller valida el alcance
router.get("/camara/:id_camara", verifyToken, verifySupervisor, cargarAlcance, validarIdCamara, camarasController.getCamaraById);

// Registrar camara (crear)
router.post("/registrarcamara", verifyToken, verifyCoordinador, validarCamara, camarasController.createCamara);

// Actualizar camara (editar)
router.put("/actualizarcamara/:id_camara", verifyToken, verifyCoordinador, validarIdCamara, validarCamara, camarasController.updateCamara);

// Eliminar camara (eliminar)
router.delete("/eliminarcamara/:id_camara", verifyToken, verifyAdmin, validarIdCamara, camarasController.deleteCamara);

export default router;
