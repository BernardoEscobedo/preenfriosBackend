import movimientosInventarioModel from "../models/movimientosInventario.model.js";

// GET /api/preenfrio/movimientos/movimientos
const getMovimientos = async (req, res) => {
    try {
        const movimientos = await movimientosInventarioModel.getMovimientos();
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos de inventario"
        });
    }
};

// GET /api/preenfrio/movimientos/movimiento/:id
const getMovimientoById = async (req, res) => {
    try {
        const { id } = req.params;
        const movimiento =
            await movimientosInventarioModel.getMovimientoById(id);
        if (!movimiento) {
            return res.status(404).json({
                error: "Movimiento no encontrado"
            });
        }
        res.status(200).json(movimiento);
    } catch (error) {
        console.error("Error al obtener movimiento:", error);
        res.status(500).json({
            error: "Error al obtener el movimiento"
        });
    }
};

// GET /api/preenfrio/movimientos/produccion/:id_produccion
// Trazabilidad del proceso (modelo actual)
const getMovimientosByProduccion = async (req, res) => {
    try {
        const { id_produccion } = req.params;
        if (!id_produccion || isNaN(Number(id_produccion))) {
            return res.status(400).json({
                error: "El id de producción debe ser un número válido"
            });
        }
        const movimientos =
            await movimientosInventarioModel.getMovimientosByProduccion(
                id_produccion
            );
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos de la produccion:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos de la producción"
        });
    }
};

// GET /api/preenfrio/movimientos/lote/:id_lote  (LEGADO)
const getMovimientosByLote = async (req, res) => {
    try {
        const { id_lote } = req.params;
        if (!id_lote || isNaN(Number(id_lote))) {
            return res.status(400).json({
                error: "El id de lote debe ser un número válido"
            });
        }
        const movimientos =
            await movimientosInventarioModel.getMovimientosByLote(id_lote);
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos del lote:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos del lote"
        });
    }
};

// GET /api/preenfrio/movimientos/tipo/:tipo
const getMovimientosByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        if (!tipo || isNaN(Number(tipo))) {
            return res.status(400).json({
                error: "El tipo debe ser un número válido"
            });
        }
        const movimientos =
            await movimientosInventarioModel.getMovimientosByTipo(tipo);
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos por tipo:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos"
        });
    }
};

// GET /api/preenfrio/movimientos/camara/:id_camara
const getMovimientosByCamara = async (req, res) => {
    try {
        const { id_camara } = req.params;
        if (!id_camara || isNaN(Number(id_camara))) {
            return res.status(400).json({
                error: "El id de cámara debe ser un número válido"
            });
        }
        const movimientos =
            await movimientosInventarioModel.getMovimientosByCamara(id_camara);
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos de la camara:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos de la cámara"
        });
    }
};

// POST /api/preenfrio/movimientos/registrarmovimiento
// El trigger de la BD descuenta del origen y suma al destino.
const createMovimiento = async (req, res) => {
    try {
        // El usuario se toma del token; si no, del body como respaldo.
        const id_usuario =
            req.id_usuario ??
            req.usuario?.id_usuario ??
            req.body.id_usuario ??
            null;

        const nuevoMovimiento =
            await movimientosInventarioModel.createMovimiento({
                ...req.body,
                id_usuario
            });
        res.status(201).json(nuevoMovimiento);
    } catch (error) {
        console.error("Error al crear movimiento:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La producción, ocupación, cámara, despacho o usuario indicado no existe"
            });
        }
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Conflicto de ocupación activa en la cámara destino"
            });
        }
        res.status(500).json({
            error: "Error al crear el movimiento de inventario"
        });
    }
};

// DELETE /api/preenfrio/movimientos/eliminarmovimiento/:id
const deleteMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado =
            await movimientosInventarioModel.deleteMovimiento(id);
        if (!eliminado) {
            return res.status(404).json({
                error: "Movimiento no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Movimiento eliminado correctamente",
            aviso: "El trigger NO revierte la ocupación de cámara; ajusta ocupaciones_camaras manualmente si aplica.",
            movimiento: eliminado
        });
    } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        res.status(500).json({
            error: "Error al eliminar el movimiento"
        });
    }
};

export const movimientosInventarioController = {
    getMovimientos,
    getMovimientoById,
    getMovimientosByProduccion,
    getMovimientosByLote,
    getMovimientosByTipo,
    getMovimientosByCamara,
    createMovimiento,
    deleteMovimiento
};
