import { Router } from "express";
import { bloquesFrutaController } from "../controllers/bloquesFruta.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";
import { validarBloque, validarIdBloque } from "../middlewares/bloquesFruta.middleware.js";

const router = Router();

// Módulo OPERATIVO: ver/crear = operativo+, editar = coordinador+, eliminar = admin

// Obtener bloques (ver)
router.get("/bloques", verifyToken, verifyOperativo, bloquesFrutaController.getBloques);
// Obtener bloque por ID (ver)
router.get("/bloque/:id", verifyToken, verifyOperativo, validarIdBloque, bloquesFrutaController.getBloqueById);
// Obtener bloque con su detalle de lotes (ver)
router.get("/bloque/:id/detalle", verifyToken, verifyOperativo, validarIdBloque, bloquesFrutaController.getBloqueConDetalle);
// Registrar bloque (crear)
router.post("/registrarbloque", verifyToken, verifyOperativo, validarBloque, bloquesFrutaController.createBloque);
// Actualizar bloque (editar)
router.put("/actualizarbloque/:id", verifyToken, verifyCoordinador, validarIdBloque, validarBloque, bloquesFrutaController.updateBloque);
// Eliminar bloque (eliminar)
router.delete("/eliminarbloque/:id", verifyToken, verifyAdmin, validarIdBloque, bloquesFrutaController.deleteBloque);

export default router;
