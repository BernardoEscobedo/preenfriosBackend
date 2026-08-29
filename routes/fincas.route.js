import { Router } from "express";
import { fincasController } from "../controllers/fincas.controller.js";
import { validarFinca, validarIdFinca } from "../middlewares/fincas.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// Obtener fincas (ver)
router.get("/fincas", verifyToken, verifySupervisor, fincasController.getFincas);
// Obtener finca por ID (ver)
router.get("/finca/:id", verifyToken, verifySupervisor, validarIdFinca, fincasController.getFincaById);
// Obtener fincas por productor (ver)
router.get("/productor/:id_productor", verifyToken, verifySupervisor, fincasController.getFincasByProductor);
// Registrar finca (crear) -> era "cualquiera autenticado"; ahora supervisor+ (operativo NO)
router.post("/registrarfinca", verifyToken, verifySupervisor, validarFinca, fincasController.createFinca);
// Actualizar finca (editar)
router.put("/actualizarfinca/:id", verifyToken, verifyCoordinador, validarIdFinca, validarFinca, fincasController.updateFinca);
// Eliminar finca (eliminar)
router.delete("/eliminarfinca/:id", verifyToken, verifyAdmin, validarIdFinca, fincasController.deleteFinca);

export default router;
