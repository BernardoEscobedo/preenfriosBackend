import { Router } from "express";
import { empleadosController } from "../controllers/empleados.controller.js";
import { validarEmpleado, validarIdEmpleado } from "../middlewares/empleados.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// ADMINISTRACIÓN: ver/crear/editar = coordinador+, eliminar = admin
// (supervisor y operativo SIN acceso a este panel)

// Obtener empleados (ver)
router.get("/empleados", verifyToken, verifyCoordinador, empleadosController.getEmpleados);
// Obtener empleado por ID (ver)
router.get("/empleado/:id_empleado", verifyToken, verifyCoordinador, validarIdEmpleado, empleadosController.getEmpleadoById);
// Registrar empleado (crear)
router.post("/registrarempleado", verifyToken, verifyCoordinador, validarEmpleado, empleadosController.createEmpleado);
// Actualizar empleado (editar)
router.put("/actualizarempleado/:id_empleado", verifyToken, verifyCoordinador, validarIdEmpleado, validarEmpleado, empleadosController.updateEmpleado);
// Eliminar empleado (eliminar)
router.delete("/eliminarempleado/:id_empleado", verifyToken, verifyAdmin, validarIdEmpleado, empleadosController.deleteEmpleado);

export default router;
