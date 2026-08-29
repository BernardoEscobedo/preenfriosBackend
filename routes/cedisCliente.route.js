import { Router } from "express";
import { cedisClienteController } from "../controllers/cedisCliente.controller.js";
import { validarCedisCliente, validarIdCedisCliente } from "../middlewares/cedisCliente.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// Ver
router.get("/cedisclientes", verifyToken, verifySupervisor, cedisClienteController.getCedisClientes);
router.get("/cediscliente/:id_cc", verifyToken, verifySupervisor, validarIdCedisCliente, cedisClienteController.getCedisClienteById);
// Crear
router.post("/registrarcediscliente", verifyToken, verifySupervisor, validarCedisCliente, cedisClienteController.createCedisCliente);
// Editar
router.put("/actualizarcediscliente/:id_cc", verifyToken, verifyCoordinador, validarIdCedisCliente, validarCedisCliente, cedisClienteController.updateCedisCliente);
// Eliminar
router.delete("/eliminarcediscliente/:id_cc", verifyToken, verifyAdmin, validarIdCedisCliente, cedisClienteController.deleteCedisCliente);

export default router;
