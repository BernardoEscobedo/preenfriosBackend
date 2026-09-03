import { db } from "../database/connection.database.js";

// ============================================================================
// MOVIMIENTOS DE INVENTARIO
// ============================================================================
// NOTA DE DISEÑO
//   Al INSERTAR, el trigger trg_sync_ocupacion_movimiento actualiza
//   ocupaciones_camaras (descuenta origen / suma destino). Por eso los
//   movimientos son bitácora inmutable: GET, POST y DELETE, pero NO update
//   (un cambio posterior descuadraría las ocupaciones ya sincronizadas).
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
//   La tabla lotes se eliminó: el código de lote vive en
//   produccion.codigo_lote. Este modelo NO debe referenciar id_lote.
//
// ALCANCE POR CÁMARA
//   Un movimiento toca DOS cámaras (origen y destino). Basta con que UNA
//   esté en el alcance del usuario para que pueda verlo: si movió fruta de
//   su preenfrío a una conserva ajena, ese movimiento le concierne.
// ============================================================================


// ---------------------------------------------------------
// CONSULTAS
// ---------------------------------------------------------
const getMovimientos = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_movimientos
        WHERE ($1::INT[] IS NULL
               OR id_camara_origen = ANY($1)
               OR id_camara_destino = ANY($1))
        `,
        [camaras]
    );
    return result.rows;
};

// Un movimiento por ID.
// No filtra: el controller compara las cámaras del resultado para poder
// distinguir "no existe" (404) de "no tienes acceso" (403).
const getMovimientoById = async (id_movimiento) => {
    const result = await db.query(
        `SELECT * FROM vw_movimientos WHERE id_movimiento = $1`,
        [id_movimiento]
    );
    return result.rows[0];
};

// Trazabilidad del proceso: todos sus movimientos en orden cronológico
const getMovimientosByProduccion = async (id_produccion, camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_movimientos
        WHERE id_produccion = $1
          AND ($2::INT[] IS NULL
               OR id_camara_origen = ANY($2)
               OR id_camara_destino = ANY($2))
        ORDER BY fecha_movimiento ASC, hora_movimiento ASC
        `,
        [id_produccion, camaras]
    );
    return result.rows;
};

const getMovimientosByTipo = async (tipo_movimiento, camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_movimientos
        WHERE tipo_movimiento = $1
          AND ($2::INT[] IS NULL
               OR id_camara_origen = ANY($2)
               OR id_camara_destino = ANY($2))
        `,
        [tipo_movimiento, camaras]
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
const getMovimientosByDespacho = async (id_despacho, camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_movimientos
        WHERE id_despacho = $1
          AND ($2::INT[] IS NULL
               OR id_camara_origen = ANY($2)
               OR id_camara_destino = ANY($2))
        `,
        [id_despacho, camaras]
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

// Cámara origen de una ocupación. Sirve para validar el alcance cuando el
// body trae id_ocupacion_origen pero no la cámara.
const getCamaraDeOcupacion = async (id_ocupacion) => {
    const result = await db.query(
        `SELECT id_camara FROM ocupaciones_camaras WHERE id_ocupacion = $1`,
        [id_ocupacion]
    );
    return result.rows[0]?.id_camara ?? null;
};


const movimientosInventarioModel = {
    getMovimientos,
    getMovimientoById,
    getMovimientosByProduccion,
    getMovimientosByTipo,
    getMovimientosByCamara,
    getMovimientosByDespacho,
    getCamaraDeOcupacion,
    createMovimiento,
    deleteMovimiento
};

export default movimientosInventarioModel;
