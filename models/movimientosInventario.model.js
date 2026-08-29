import { db } from "../database/connection.database.js";

// =========================================================
// NOTA DE DISEÑO
// Al INSERTAR en movimientos_inventario, el trigger de la BD
// fn_sync_ocupacion_movimiento actualiza automáticamente
// ocupaciones_camaras (descuenta origen / suma destino).
// Por eso los movimientos son bitácora inmutable: GET, POST y
// DELETE, pero NO update (para no descuadrar las ocupaciones).
//
// tipo_movimiento: 1=ingreso_preenfrio, 2=preenfrio_a_conserva,
//                  3=salida_despacho
//
// ENLACES (modelo actualizado):
//   · id_produccion       -> QUÉ se mueve (lote, SKU, finca, cliente)
//   · id_ocupacion_origen -> DE DÓNDE sale exactamente
//   · id_lote             -> LEGADO (nullable). El módulo de lotes se dio
//                            de baja; se conserva por datos históricos.
// IMPORTANTE: los JOIN a 'lotes' son LEFT JOIN, porque id_lote puede
// ser NULL en los movimientos nuevos.
// =========================================================

// Bloque de SELECT reutilizable con toda la trazabilidad
const SELECT_MOVIMIENTO = `
    SELECT
        m.*,
        CASE m.tipo_movimiento
            WHEN 1 THEN 'Ingreso a preenfrío'
            WHEN 2 THEN 'Preenfrío a conserva'
            WHEN 3 THEN 'Salida por despacho'
            ELSE 'Otro'
        END AS tipo_texto,
        co.nombre_camara AS camara_origen,
        co.tipo_camara   AS tipo_camara_origen,
        cd.nombre_camara AS camara_destino,
        cd.tipo_camara   AS tipo_camara_destino,
        -- Trazabilidad vía producción (modelo actual)
        p.codigo_lote,
        p.semana,
        f.codigo_finca,
        f.nombre         AS nombre_finca,
        pr.nombre        AS nombre_productor,
        s.codigo_sku,
        s.calidad        AS calidad_sku,
        cc.cliente,
        cc.cedis,
        -- Legado: código de lote de la tabla lotes (si existiera)
        l.codigo_lote    AS codigo_lote_legado,
        u.usuario,
        e.nombre         AS nombre_empleado,
        e.apellidos      AS apellidos_empleado
    FROM movimientos_inventario m
    LEFT JOIN lotes         l  ON l.id_lote       = m.id_lote
    LEFT JOIN camaras       co ON co.id_camara    = m.id_camara_origen
    LEFT JOIN camaras       cd ON cd.id_camara    = m.id_camara_destino
    LEFT JOIN produccion    p  ON p.id_produccion = m.id_produccion
    LEFT JOIN fincas        f  ON f.id_finca      = p.id_finca
    LEFT JOIN productores   pr ON pr.id_productor = p.id_productor
    LEFT JOIN sku_pt        s  ON s.id_sku        = p.id_sku
    LEFT JOIN cedis_cliente cc ON cc.id_cc        = p.id_cc
    LEFT JOIN usuarios      u  ON u.id_usuario    = m.id_usuario
    LEFT JOIN empleados     e  ON e.id_empleado   = u.id_empleado
`;

// Obtener todos los movimientos
const getMovimientos = async () => {
    const result = await db.query(
        `${SELECT_MOVIMIENTO} ORDER BY m.id_movimiento DESC`
    );
    return result.rows;
};

// Obtener un movimiento por ID
const getMovimientoById = async (id_movimiento) => {
    const result = await db.query(
        `${SELECT_MOVIMIENTO} WHERE m.id_movimiento = $1`,
        [id_movimiento]
    );
    return result.rows[0];
};

// Obtener movimientos por producción (trazabilidad del lote actual)
const getMovimientosByProduccion = async (id_produccion) => {
    const result = await db.query(
        `${SELECT_MOVIMIENTO}
         WHERE m.id_produccion = $1
         ORDER BY m.fecha_movimiento ASC, m.hora_movimiento ASC`,
        [id_produccion]
    );
    return result.rows;
};

// Obtener movimientos por lote (LEGADO: datos históricos)
const getMovimientosByLote = async (id_lote) => {
    const result = await db.query(
        `${SELECT_MOVIMIENTO}
         WHERE m.id_lote = $1
         ORDER BY m.fecha_movimiento ASC, m.hora_movimiento ASC`,
        [id_lote]
    );
    return result.rows;
};

// Obtener movimientos por tipo
const getMovimientosByTipo = async (tipo_movimiento) => {
    const result = await db.query(
        `${SELECT_MOVIMIENTO}
         WHERE m.tipo_movimiento = $1
         ORDER BY m.id_movimiento DESC`,
        [tipo_movimiento]
    );
    return result.rows;
};

// Obtener movimientos de una cámara (como origen o destino)
const getMovimientosByCamara = async (id_camara) => {
    const result = await db.query(
        `${SELECT_MOVIMIENTO}
         WHERE m.id_camara_origen = $1 OR m.id_camara_destino = $1
         ORDER BY m.id_movimiento DESC`,
        [id_camara]
    );
    return result.rows;
};

// Crear movimiento (el trigger sincroniza ocupaciones_camaras)
const createMovimiento = async ({
    id_lote,
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
            id_lote,
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
        `,
        [
            id_lote ?? null,
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

// Eliminar movimiento
// OJO: el trigger NO revierte la ocupación al borrar. Usar sólo para
// corregir capturas erróneas y ajustar ocupaciones_camaras manualmente.
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
    getMovimientosByLote,
    getMovimientosByTipo,
    getMovimientosByCamara,
    createMovimiento,
    deleteMovimiento
};

export default movimientosInventarioModel;
