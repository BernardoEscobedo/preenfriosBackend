import { Router } from "express";
import { produccionController } from "../controllers/produccion.controller.js";
import { validarProduccion, validarIdProduccion } from "../middlewares/produccion.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// Obtener producciones (ver)
router.get("/produccion", verifyToken, verifySupervisor, produccionController.getProducciones);

// Obtener producción por ID (ver)
router.get("/produccion/:id", verifyToken, verifySupervisor, validarIdProduccion, produccionController.getProduccionById);

// Obtener producciones por semana (ver)
router.get("/semana/:semana", verifyToken, verifySupervisor, produccionController.getProduccionesBySemana);

// Registrar producción (crear)
router.post("/registrarproduccion", verifyToken, verifySupervisor, validarProduccion, produccionController.createProduccion);

// Actualizar producción (editar)
router.put("/actualizarproduccion/:id", verifyToken, verifyCoordinador, validarIdProduccion, validarProduccion, produccionController.updateProduccion);

// Eliminar producción (eliminar)
router.delete("/eliminarproduccion/:id", verifyToken, verifyAdmin, validarIdProduccion, produccionController.deleteProduccion);

export default router;
