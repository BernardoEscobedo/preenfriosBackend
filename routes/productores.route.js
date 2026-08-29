import { Router } from "express";
import { productoresController } from "../controllers/productores.controller.js";
import { validarProductor, validarIdProductor } from "../middlewares/productores.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// Obtener productores (ver)
router.get("/productores", verifyToken, verifySupervisor, productoresController.getProductores);
// Obtener productor por ID (ver)
router.get("/productor/:id", verifyToken, verifySupervisor, validarIdProductor, productoresController.getProductorById);
// Registrar productor (crear)
router.post("/registrarproductor", verifyToken, verifySupervisor, validarProductor, productoresController.createProductor);
// Actualizar productor (editar)
router.put("/actualizarproductor/:id", verifyToken, verifyCoordinador, validarIdProductor, validarProductor, productoresController.updateProductor);
// Eliminar productor (eliminar)
router.delete("/eliminarproductor/:id", verifyToken, verifyAdmin, validarIdProductor, productoresController.deleteProductor);

export default router;
