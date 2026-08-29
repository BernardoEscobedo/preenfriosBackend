import { Router } from "express";
import { skuPtController } from "../controllers/skuPt.controller.js";
import { validarSkuPt, validarIdSkuPt } from "../middlewares/skuPt.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// Obtener SKU (ver)
router.get("/skupt", verifyToken, verifySupervisor, skuPtController.getSkuPt);
// Obtener SKU por ID (ver)
router.get("/sku/:id", verifyToken, verifySupervisor, validarIdSkuPt, skuPtController.getSkuPtById);
// Registrar SKU (crear)
router.post("/registrarsku", verifyToken, verifySupervisor, validarSkuPt, skuPtController.createSkuPt);
// Actualizar SKU (editar)
router.put("/actualizarsku/:id", verifyToken, verifyCoordinador, validarIdSkuPt, validarSkuPt, skuPtController.updateSkuPt);
// Eliminar SKU (eliminar)
router.delete("/eliminarsku/:id", verifyToken, verifyAdmin, validarIdSkuPt, skuPtController.deleteSkuPt);

export default router;
