import { db } from "../database/connection.database.js";

// =========================================================
// MOVIMIENTOS DE INVENTARIO
// =========================================================
// NOTA DE DISEÑO
//   Al INSERTAR, el trigger trg_sync_ocupacion_movimiento actualiza
//   ocupaciones_camaras (descuenta origen / suma destino). Por eso los
//   movimientos son bitácora inmutable: GET, POST y DELETE, pero NO
//   update (un cambio posterior descuadraría las ocupaciones).
//
//   tipo_movimiento: 1=ingreso_preenfrio · 2=preenfrio_a_conserva
//                    3=salida_despacho
//
// ENLACES
//   id_produccion       -> QUÉ se mueve (lote, SKU, finca, cliente)
//   id_ocupacion_origen -> DE DÓNDE sale exactamente. Es lo que permite
//                          descontar del montón correcto cuando una cámara
//                          tiene varios procesos conviviendo.
//
// ⚠️ SIN 'lotes'
//   La tabla lotes se eliminó del esquema: el código de lote vive en
//   produccion.codigo_lote. Este modelo NO debe referenciar id_lote ni
//   hacer JOIN a lotes; hacerlo rompe el INSERT con error 42703.
//   Las lecturas usan la vista vw_movimientos, que ya resuelve nombres
//   de cámaras, folio de despacho, lote, finca, SKU, cliente y usuario.
// =========================================================


// ---------------------------------------------------------
// CONSULTAS
// ---------------------------------------------------------
const getMovimientos = async () => {
    const result = await db.query(`SELECT * FROM vw_movimientos`);
    return result.rows;
};

const getMovimientoById = async (id_movimiento) => {
    const result = await db.query(
        `SELECT * FROM vw_movimientos WHERE id_movimiento = $1`,
        [id_movimiento]
    );
    return result.rows[0];
};

// Trazabilidad del proceso: todos sus movimientos en orden cronológico
const getMovimientosByProduccion = async (id_produccion) => {
    const result = await db.query(
        `
        SELECT * FROM vw_movimientos
        WHERE id_produccion = $1
        ORDER BY fecha_movimiento ASC, hora_movimiento ASC
        `,
        [id_produccion]
    );
    return result.rows;
};

const getMovimientosByTipo = async (tipo_movimiento) => {
    const result = await db.query(
        `SELECT * FROM vw_movimientos WHERE tipo_movimiento = $1`,
        [tipo_movimiento]
    );
    return result.rows;
};

// Movimientos de una cámara, sea como origen o como destino
const getMovimientosByCamara = async (id_camara) => {
    const result = await db.query(
        `
        SELECT * FROM vw_movimientos
        WHERE id_camara_origen = $1 OR id_camara_destino = $1
        `,
        [id_camara]
    );
    return result.rows;
};

// Movimientos ligados a un despacho (salidas tipo 3)
const getMovimientosByDespacho = async (id_despacho) => {
    const result = await db.query(
        `SELECT * FROM vw_movimientos WHERE id_despacho = $1`,
        [id_despacho]
    );
    return result.rows;
};


// ---------------------------------------------------------
// ALTA
// ---------------------------------------------------------
// El trigger de la BD sincroniza ocupaciones_camaras al insertar.
const createMovimiento = async ({
    id_produccion,
    id_ocupacion_origen,
    tipo_movimiento,
    id_camara_origen,
    id_camara_destino,
    id_despacho,
    fecha_movimiento,
    hora_movimiento,
    cantidad_tarimas,
    cantidad_cajas,
    temperatura,
    id_usuario,
    observaciones
}) => {
    const result = await db.query(
        `
        INSERT INTO movimientos_inventario (
            id_produccion,
            id_ocupacion_origen,
            tipo_movimiento,
            id_camara_origen,
            id_camara_destino,
            id_despacho,
            fecha_movimiento,
            hora_movimiento,
            cantidad_tarimas,
            cantidad_cajas,
            temperatura,
            id_usuario,
            observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        `,
        [
            id_produccion ?? null,
            id_ocupacion_origen ?? null,
            tipo_movimiento,
            id_camara_origen ?? null,
            id_camara_destino ?? null,
            id_despacho ?? null,
            fecha_movimiento,
            hora_movimiento,
            cantidad_tarimas ?? 0,
            cantidad_cajas ?? 0,
            temperatura ?? null,
            id_usuario ?? null,
            observaciones ?? null
        ]
    );
    return result.rows[0];
};


// ---------------------------------------------------------
// BAJA
// ---------------------------------------------------------
// OJO: el trigger NO revierte la ocupación al borrar (solo actúa en
// INSERT). Se usa para corregir capturas erróneas, ajustando
// ocupaciones_camaras a mano si aplica.
const deleteMovimiento = async (id_movimiento) => {
    const result = await db.query(
        `
        DELETE FROM movimientos_inventario
        WHERE id_movimiento = $1
        RETURNING *
        `,
        [id_movimiento]
    );
    return result.rows[0];
};


const movimientosInventarioModel = {
    getMovimientos,
    getMovimientoById,
    getMovimientosByProduccion,
    getMovimientosByTipo,
    getMovimientosByCamara,
    getMovimientosByDespacho,
    createMovimiento,
    deleteMovimiento
};

export default movimientosInventarioModel;
