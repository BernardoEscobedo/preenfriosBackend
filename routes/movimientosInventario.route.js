import { Router } from "express";
import { movimientosInventarioController } from "../controllers/movimientosInventario.controller.js";
import { validarMovimiento, validarIdMovimiento } from "../middlewares/movimientosInventario.middleware.js";
import { verifyToken, verifyAdmin, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO (inventarios): ver/crear = operativo+, eliminar = admin
// (no hay edición: los movimientos son bitácora inmutable)
//
// La ruta /lote/:id_lote se eliminó junto con la tabla 'lotes'.
// La trazabilidad ahora va por /produccion/:id_produccion.

// ----- Consultas -----
router.get("/movimientos", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientos);
router.get("/movimiento/:id", verifyToken, verifyOperativo, validarIdMovimiento, movimientosInventarioController.getMovimientoById);

// Trazabilidad del proceso (sustituye al antiguo /lote/:id_lote)
router.get("/produccion/:id_produccion", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientosByProduccion);

// Por tipo: 1=ingreso · 2=preenfrío→conserva · 3=salida por despacho
router.get("/tipo/:tipo", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientosByTipo);

// Por cámara (como origen o destino)
router.get("/camara/:id_camara", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientosByCamara);

// Por despacho (salidas tipo 3)
router.get("/despacho/:id_despacho", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientosByDespacho);

// ----- Registrar movimiento -----
// El trigger de la BD sincroniza ocupaciones_camaras.
router.post("/registrarmovimiento", verifyToken, verifyOperativo, validarMovimiento, movimientosInventarioController.createMovimiento);

// ----- Eliminar (solo admin; no revierte la ocupación) -----
router.delete("/eliminarmovimiento/:id", verifyToken, verifyAdmin, validarIdMovimiento, movimientosInventarioController.deleteMovimiento);

export default router;
