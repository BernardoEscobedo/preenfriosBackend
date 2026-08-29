import { Router } from "express";
import { despachosController } from "../controllers/despachos.controller.js";
import {
    validarDespacho,
    validarDetalle,
    validarIdDespacho,
    validarIdDetalle
} from "../middlewares/despachos.middleware.js";
import {
    verifyToken,
    verifyAdmin,
    verifyCoordinador,
    verifySupervisor,
    verifyOperativo
} from "../middlewares/jwt.middlewares.js";
import { evidenciasController } from "../controllers/evidenciasDespacho.controller.js";
import { uploadMemoria, manejarErrorUpload } from "../middlewares/upload.middleware.js";

const router = Router();

// Módulo OPERATIVO (despachos)
//   ver/crear/armar picking = operativo+
//   cerrar/cancelar/editar  = coordinador+
//   eliminar                = admin
//
// Se conservan todas las rutas originales; las nuevas quedan marcadas.

// ============================================================
// INVENTARIO DISPONIBLE   ⭐ nuevo
// ============================================================
// Todo lo que hay en cámaras (preenfrío y conserva), ordenado FEFO
// (fruta más vieja primero). Es la fuente del picking.
router.get("/inventario", verifyToken, verifyOperativo, despachosController.getInventarioDisponible);
router.get("/inventario/cliente/:id_cc", verifyToken, verifyOperativo, despachosController.getInventarioByCliente);

// ============================================================
// CONSULTAS
// ============================================================
// GET todos (ver)
router.get("/despachos", verifyToken, verifyOperativo, despachosController.getDespachos);

// Folio automático (D-AAAA-NNNN)   ⭐ nuevo
// OJO: consume la secuencia; llamar solo al abrir el modal de alta.
router.get("/siguientefolio", verifyToken, verifyOperativo, despachosController.getSiguienteFolio);

// Por estado: 1=borrador · 2=cerrado · 0=cancelado   ⭐ nuevo
router.get("/estado/:estado", verifyToken, verifyOperativo, despachosController.getDespachosByEstado);

// Picking list para impresión (encabezado + líneas)   ⭐ nuevo
router.get("/pickinglist/:id", verifyToken, verifyOperativo, validarIdDespacho, despachosController.getPickingList);

// GET encabezado por id (ver)
router.get("/despacho/:id", verifyToken, verifyOperativo, validarIdDespacho, despachosController.getDespachoById);

// GET encabezado + detalle (ver)
router.get("/despacho/:id/detalle", verifyToken, verifyOperativo, validarIdDespacho, despachosController.getDespachoConDetalle);

// ============================================================
// ALTAS
// ============================================================
// POST crear despacho (crear)
// El folio se autogenera; el transporte es obligatorio.
router.post("/registrardespacho", verifyToken, verifyOperativo, validarDespacho, despachosController.createDespacho);

// POST agregar línea de detalle (armar picking)
// Genera un movimiento tipo 3 que descuenta la cámara de origen.
router.post("/despacho/:id/detalle", verifyToken, verifyOperativo, validarIdDespacho, validarDetalle, despachosController.addDetalle);

// ============================================================
// EDICIÓN Y CAMBIOS DE ESTADO
// ============================================================
// PUT actualizar encabezado (editar)
router.put("/actualizardespacho/:id", verifyToken, verifyOperativo, validarIdDespacho, validarDespacho, despachosController.updateDespacho);

// PATCH cerrar despacho (estado 2) — congela el picking   ⭐ nuevo
router.patch("/cerrardespacho/:id", verifyToken, verifyCoordinador, validarIdDespacho, despachosController.cerrarDespacho);

// PATCH cancelar despacho (estado 0)   ⭐ nuevo
router.patch("/cancelardespacho/:id", verifyToken, verifyCoordinador, validarIdDespacho, despachosController.cancelarDespacho);

// ============================================================
// BAJAS
// ============================================================
// DELETE una línea del picking.
// Devuelve el producto a la cámara y borra su movimiento.
// NOTA: antes era verifyAdmin. Se bajó a verifyOperativo porque quitar una
// línea de un borrador es una corrección normal de captura. Si prefieres
// restringirlo, cambia a verifyCoordinador o verifyAdmin.
router.delete("/detalle/:id_detalle", verifyToken, verifyCoordinador, validarIdDetalle, despachosController.deleteDetalle);

// DELETE despacho completo (eliminar)
// Devuelve a las cámaras el producto de todas sus líneas antes de borrar.
router.delete("/eliminardespacho/:id", verifyToken, verifyAdmin, validarIdDespacho, despachosController.deleteDespacho);

// Clientes que tienen fruta disponible (dropdown del despacho)
router.get("/clientes", verifyToken, verifyOperativo, despachosController.getClientesConInventario);

// ============================================================
// EVIDENCIAS FOTOGRÁFICAS (máx. 3 por despacho)
// Para respaldar reclamos: no se imprimen en el picking list.
// ============================================================
router.get("/evidencias/:id_despacho", verifyToken, verifyOperativo, evidenciasController.getEvidencias);

// multipart/form-data → campo "foto"
router.post(
    "/evidencias/:id_despacho",
    verifyToken,
    verifyOperativo,
    uploadMemoria.single("foto"),
    manejarErrorUpload,
    evidenciasController.subirEvidencia
);

router.delete("/evidencias/:id_evidencia", verifyToken, verifyCoordinador, evidenciasController.eliminarEvidencia);

router.get("/auditoria/:id_despacho", verifyToken, verifyOperativo, despachosController.getAuditoria);

export default router;
