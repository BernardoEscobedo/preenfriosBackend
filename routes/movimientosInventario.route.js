import { Router } from "express";
import { movimientosInventarioController } from "../controllers/movimientosInventario.controller.js";
import { validarMovimiento, validarIdMovimiento } from "../middlewares/movimientosInventario.middleware.js";
import { cargarAlcance, validarCamaraEnAlcance } from "../middlewares/alcance.middleware.js";
import { verifyToken, verifyAdmin, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO (inventarios): ver/crear = operativo+, eliminar = admin
// (no hay edición: los movimientos son bitácora inmutable)
//
// ALCANCE POR CÁMARA
//   cargarAlcance deja en req.camaras las cámaras del usuario.
//   Para LEER basta con que una de las dos cámaras del movimiento esté en
//   su alcance. Para CREAR se exige que el ORIGEN sea suyo: nadie debe
//   sacar fruta de una cámara ajena.
//
// La ruta /lote/:id_lote se eliminó junto con la tabla 'lotes'.
// La trazabilidad ahora va por /produccion/:id_produccion.

// ----- Consultas -----
router.get("/movimientos", verifyToken, verifyOperativo, cargarAlcance, movimientosInventarioController.getMovimientos);
router.get("/movimiento/:id", verifyToken, verifyOperativo, cargarAlcance, validarIdMovimiento, movimientosInventarioController.getMovimientoById);

// Trazabilidad del proceso (sustituye al antiguo /lote/:id_lote)
router.get("/produccion/:id_produccion", verifyToken, verifyOperativo, cargarAlcance, movimientosInventarioController.getMovimientosByProduccion);

// Por tipo: 1=ingreso · 2=preenfrío→conserva · 3=salida por despacho
router.get("/tipo/:tipo", verifyToken, verifyOperativo, cargarAlcance, movimientosInventarioController.getMovimientosByTipo);

// Por cámara (como origen o destino)
router.get(
    "/camara/:id_camara",
    verifyToken,
    verifyOperativo,
    cargarAlcance,
    validarCamaraEnAlcance("params", "id_camara"),
    movimientosInventarioController.getMovimientosByCamara
);

// Por despacho (salidas tipo 3)
router.get("/despacho/:id_despacho", verifyToken, verifyOperativo, cargarAlcance, movimientosInventarioController.getMovimientosByDespacho);

// ----- Registrar movimiento -----
// El trigger de la BD sincroniza ocupaciones_camaras.
// El origen lo valida el controller (puede venir solo id_ocupacion_origen);
// el destino se valida aquí cuando viene explícito en el body.
router.post(
    "/registrarmovimiento",
    verifyToken,
    verifyOperativo,
    cargarAlcance,
    validarCamaraEnAlcance("body", "id_camara_destino"),
    validarMovimiento,
    movimientosInventarioController.createMovimiento
);

// ----- Eliminar (solo admin; no revierte la ocupación) -----
router.delete("/eliminarmovimiento/:id", verifyToken, verifyAdmin, validarIdMovimiento, movimientosInventarioController.deleteMovimiento);

export default router;
