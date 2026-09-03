import { Router } from "express";
import { despachosController } from "../controllers/despachos.controller.js";
import {
    validarDespacho,
    validarDetalle,
    validarIdDespacho,
    validarIdDetalle
} from "../middlewares/despachos.middleware.js";
import { cargarAlcance } from "../middlewares/alcance.middleware.js";
import {
    verifyToken,
    verifyAdmin,
    verifyCoordinador,
    verifySupervisor,
    verifyOperativo
} from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO (despachos)
//   ver/crear/armar picking = operativo+
//   cerrar/editar           = coordinador+
//   eliminar                = admin
//
// ALCANCE POR CÁMARA
//   cargarAlcance deja en req.camaras las cámaras del usuario.
//   Se aplica al INVENTARIO (de dónde se toma la fruta) y a las escrituras
//   sobre el picking. La lista de despachos NO se filtra: un despacho es un
//   documento comercial que puede llevar carga de varias plantas.
//
//   Las validaciones de alcance del picking van dentro del controller,
//   porque el body suele traer id_ocupacion_origen y hay que resolver
//   primero a qué cámara pertenece.

// ============================================================
// INVENTARIO DISPONIBLE
// ============================================================
// Todo lo que hay en SUS cámaras, ordenado FEFO (fruta más vieja primero).
router.get("/inventario", verifyToken, verifyOperativo, cargarAlcance, despachosController.getInventarioDisponible);
router.get("/inventario/cliente/:id_cc", verifyToken, verifyOperativo, cargarAlcance, despachosController.getInventarioByCliente);

// Clientes que tienen fruta disponible EN SUS CÁMARAS (dropdown del alta)
router.get("/clientes", verifyToken, verifyOperativo, cargarAlcance, despachosController.getClientesConInventario);

// ============================================================
// CONSULTAS
// ============================================================
router.get("/despachos", verifyToken, verifyOperativo, despachosController.getDespachos);

// Folio automático (numeración desde 70000)
// OJO: consume la secuencia; llamar solo al abrir el modal de alta.
router.get("/siguientefolio", verifyToken, verifyOperativo, despachosController.getSiguienteFolio);

// Por estado: 1=borrador · 2=cerrado
router.get("/estado/:estado", verifyToken, verifyOperativo, despachosController.getDespachosByEstado);

// Picking list para impresión (encabezado + líneas)
router.get("/pickinglist/:id", verifyToken, verifyOperativo, validarIdDespacho, despachosController.getPickingList);

// Historial de correcciones sobre el despacho
router.get("/auditoria/:id_despacho", verifyToken, verifyOperativo, despachosController.getAuditoria);

// Encabezado por id
router.get("/despacho/:id", verifyToken, verifyOperativo, validarIdDespacho, despachosController.getDespachoById);

// Encabezado + detalle
router.get("/despacho/:id/detalle", verifyToken, verifyOperativo, validarIdDespacho, despachosController.getDespachoConDetalle);

// ============================================================
// ALTAS
// ============================================================
// Crear despacho. El folio se autogenera; el transporte es obligatorio.
// Si viene con detalle, el controller valida que todas las líneas salgan
// de cámaras propias.
router.post("/registrardespacho", verifyToken, verifyOperativo, cargarAlcance, validarDespacho, despachosController.createDespacho);

// Agregar línea al picking.
// Genera un movimiento tipo 3 que descuenta la cámara de origen.
router.post("/despacho/:id/detalle", verifyToken, verifyOperativo, cargarAlcance, validarIdDespacho, validarDetalle, despachosController.addDetalle);

// ============================================================
// EDICIÓN Y CAMBIOS DE ESTADO
// ============================================================
// Actualizar encabezado.
// Si el despacho está CERRADO, el controller exige motivo_edicion y solo
// permite corregir datos administrativos (queda en la bitácora).
router.put("/actualizardespacho/:id", verifyToken, verifyOperativo, validarIdDespacho, validarDespacho, despachosController.updateDespacho);

// Cerrar despacho (estado 2) — congela el picking
router.patch("/cerrardespacho/:id", verifyToken, verifyCoordinador, validarIdDespacho, despachosController.cerrarDespacho);

// ============================================================
// BAJAS
// ============================================================
// Quitar una línea del picking: devuelve el producto a la cámara y borra
// su movimiento. Es una corrección normal de captura sobre un borrador,
// por eso queda en verifyOperativo.
router.delete("/detalle/:id_detalle", verifyToken, verifyOperativo, cargarAlcance, validarIdDetalle, despachosController.deleteDetalle);

// Eliminar despacho completo. Solo borradores: devuelve a las cámaras el
// producto de todas sus líneas antes de borrar.
router.delete("/eliminardespacho/:id", verifyToken, verifyAdmin, validarIdDespacho, despachosController.deleteDespacho);

export default router;
