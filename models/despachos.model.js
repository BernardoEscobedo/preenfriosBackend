import { db } from "../database/connection.database.js";

// =========================================================
// NOTA DE DISEÑO  (actualizada tras la migración de despachos)
// =========================================================
// TOTALES
//   despachos.cantidad_tarimas / cantidad_cajas los recalcula el TRIGGER
//   trg_recalcular_totales_despacho a partir de despachos_detalle.
//   Ya NO se recalculan a mano desde este modelo (se eliminó
//   recalcularTotales para no duplicar trabajo).
//
// DESCUENTO DE INVENTARIO
//   Al insertar una línea en despachos_detalle, el trigger
//   trg_despacho_detalle_movimiento genera un movimientos_inventario
//   tipo=3 (salida_despacho), y ES ESE movimiento el que descuenta la
//   ocupación de la cámara. Nunca se toca ocupaciones_camaras desde aquí:
//   una sola vía de descuento evita descuadres por doble conteo.
//
// TRAZABILIDAD
//   El detalle se liga a id_produccion + id_ocupacion_origen.
//   id_lote quedó como LEGADO (el módulo de lotes se dio de baja), por eso
//   los JOIN a 'lotes' son LEFT JOIN: un INNER ocultaría todas las líneas
//   nuevas.
//
// ESTADOS DEL DESPACHO
//   1 = borrador (se está armando el picking)
//   2 = cerrado  (ya salió; no se edita)
//   0 = cancelado
//
// FOLIO
//   Se autogenera en la BD con fn_generar_folio_despacho() → D-AAAA-NNNN.
// =========================================================


// ---------------------------------------------------------
// INVENTARIO DISPONIBLE (para armar el picking)
// ---------------------------------------------------------
// Todo lo que hay físicamente en cámaras (preenfrío y conserva),
// ordenado por fruta más vieja primero (FEFO).
const getInventarioDisponible = async () => {
    const result = await db.query(`SELECT * FROM vw_inventario_disponible`);
    return result.rows;
};

// Mismo inventario, filtrado por el cliente al que estaba destinado.
// El frontend muestra TODO, pero este endpoint queda disponible.
const getInventarioByCliente = async (id_cc) => {
    const result = await db.query(
        `SELECT * FROM vw_inventario_disponible WHERE id_cc = $1`,
        [id_cc]
    );
    return result.rows;
};

// Alimenta el dropdown del despacho: evita ofrecer clientes sin inventario.
const getClientesConInventario = async () => {
    const result = await db.query(`SELECT * FROM vw_clientes_con_inventario`);
    return result.rows;
};

// ---------------------------------------------------------
// CONSULTAS DE DESPACHOS
// ---------------------------------------------------------
const getDespachos = async () => {
    const result = await db.query(`SELECT * FROM vw_despachos`);
    return result.rows;
};

const getDespachoById = async (id_despacho) => {
    const result = await db.query(
        `SELECT * FROM vw_despachos WHERE id_despacho = $1`,
        [id_despacho]
    );
    return result.rows[0];
};

const getDespachosByEstado = async (estado) => {
    const result = await db.query(
        `SELECT * FROM vw_despachos WHERE estado = $1`,
        [estado]
    );
    return result.rows;
};

// Encabezado + detalle. La vista vw_despachos_detalle ya resuelve
// lote, finca, SKU y cámara de origen.
const getDespachoConDetalle = async (id_despacho) => {
    const despacho = await getDespachoById(id_despacho);
    if (!despacho) {
        return null;
    }
    const detalleResult = await db.query(
        `SELECT * FROM vw_despachos_detalle WHERE id_despacho = $1`,
        [id_despacho]
    );
    return {
        ...despacho,
        detalle: detalleResult.rows
    };
};

// Alias semántico para impresión del picking list
const getPickingList = async (id_despacho) => {
    return await getDespachoConDetalle(id_despacho);
};

// Siguiente folio (D-AAAA-NNNN).
// OJO: consume la secuencia, llamar solo al abrir el modal de alta.
const getSiguienteFolio = async () => {
    const result = await db.query(`SELECT fn_generar_folio_despacho() AS folio`);
    return result.rows[0]?.folio;
};


// ---------------------------------------------------------
// CREAR DESPACHO (+ detalle opcional, en transacción)
// ---------------------------------------------------------
// body = { ...encabezado, detalle: [ { id_ocupacion_origen, cantidad_tarimas, ... } ] }
// El folio se autogenera si no se envía.
// Los totales y los movimientos los generan los triggers.
const createDespacho = async ({
    folio_despacho,
    id_transporte,
    fecha_despacho,
    hora_salida,
    id_cc,
    orden_venta,
    cita,
    fecha_cita,
    temperatura_salida,
    estado,
    observaciones,
    detalle = []
}) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const despachoResult = await client.query(
            `
            INSERT INTO despachos (
                folio_despacho,
                id_transporte,
                fecha_despacho,
                hora_salida,
                id_cc,
                orden_venta,
                cita,
                fecha_cita,
                cantidad_tarimas,
                cantidad_cajas,
                temperatura_salida,
                estado,
                observaciones
            )
            VALUES (
                COALESCE($1, fn_generar_folio_despacho()),
                $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10, $11
            )
            RETURNING *
            `,
            [
                folio_despacho ?? null,
                id_transporte,
                fecha_despacho,
                hora_salida ?? null,
                id_cc,
                orden_venta ?? null,
                cita ?? null,
                fecha_cita ?? null,
                temperatura_salida ?? null,
                estado ?? 1,               // nace como borrador
                observaciones ?? null
            ]
        );

        const despacho = despachoResult.rows[0];

        // Cada línea dispara su propio movimiento tipo 3 vía trigger
        for (const linea of detalle) {
            await client.query(
                `
                INSERT INTO despachos_detalle (
                    id_despacho,
                    id_ocupacion_origen,
                    id_produccion,
                    id_camara_origen,
                    id_bloque,
                    cantidad_tarimas,
                    cantidad_cajas,
                    temperatura,
                    observaciones
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `,
                [
                    despacho.id_despacho,
                    linea.id_ocupacion_origen ?? null,
                    linea.id_produccion ?? null,
                    linea.id_camara_origen ?? null,
                    linea.id_bloque ?? null,
                    linea.cantidad_tarimas ?? 0,
                    linea.cantidad_cajas ?? 0,
                    linea.temperatura ?? null,
                    linea.observaciones ?? null
                ]
            );
        }

        await client.query("COMMIT");
        // Se relee para devolver los totales ya calculados por el trigger
        return await getDespachoConDetalle(despacho.id_despacho);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


// ---------------------------------------------------------
// DETALLE (picking)
// ---------------------------------------------------------
// Agregar una línea a un despacho existente.
// El trigger crea el movimiento tipo 3 y descuenta la cámara;
// otro trigger recalcula los totales del encabezado.
const addDetalle = async (
    id_despacho,
    {
        id_ocupacion_origen,
        id_produccion,
        id_camara_origen,
        id_bloque,
        cantidad_tarimas,
        cantidad_cajas,
        temperatura,
        observaciones
    }
) => {
    const result = await db.query(
        `
        INSERT INTO despachos_detalle (
            id_despacho,
            id_ocupacion_origen,
            id_produccion,
            id_camara_origen,
            id_bloque,
            cantidad_tarimas,
            cantidad_cajas,
            temperatura,
            observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            id_despacho,
            id_ocupacion_origen ?? null,
            id_produccion ?? null,
            id_camara_origen ?? null,
            id_bloque ?? null,
            cantidad_tarimas ?? 0,
            cantidad_cajas ?? 0,
            temperatura ?? null,
            observaciones ?? null
        ]
    );
    return result.rows[0];
};

// Quitar una línea del picking.
// Usa fn_quitar_linea_despacho: devuelve el producto a la cámara, reabre
// la ocupación si se había cerrado y borra el movimiento asociado.
// Devuelve texto: 'OK: ...' o el motivo del rechazo.
const deleteDetalle = async (id_detalle) => {
    const result = await db.query(
        `SELECT fn_quitar_linea_despacho($1) AS resultado`,
        [id_detalle]
    );
    return result.rows[0]?.resultado;
};


// ---------------------------------------------------------
// ACTUALIZAR / CERRAR / CANCELAR
// ---------------------------------------------------------
// Actualiza el encabezado. No toca cantidades (las lleva el trigger).
// El folio tampoco se modifica: es inmutable una vez asignado.
const updateDespacho = async (
    id_despacho,
    {
        id_transporte,
        fecha_despacho,
        hora_salida,
        id_cc,
        orden_venta,
        cita,
        fecha_cita,
        temperatura_salida,
        estado,
        observaciones
    }
) => {
    const result = await db.query(
        `
        UPDATE despachos
        SET
            id_transporte = $1,
            fecha_despacho = $2,
            hora_salida = $3,
            id_cc = $4,
            orden_venta = $5,
            cita = $6,
            fecha_cita = $7,
            temperatura_salida = $8,
            estado = $9,
            observaciones = $10
        WHERE id_despacho = $11
        RETURNING *
        `,
        [
            id_transporte,
            fecha_despacho,
            hora_salida ?? null,
            id_cc,
            orden_venta ?? null,
            cita ?? null,
            fecha_cita ?? null,
            temperatura_salida ?? null,
            estado ?? 1,
            observaciones ?? null,
            id_despacho
        ]
    );
    return result.rows[0];
};

// Cerrar el despacho (estado = 2). Solo procede si está en borrador.
// A partir de aquí el picking queda congelado.
const cerrarDespacho = async (
    id_despacho,
    { hora_salida, temperatura_salida, observaciones }
) => {
    const result = await db.query(
        `
        UPDATE despachos
        SET estado = 2,
            hora_salida = COALESCE($1, hora_salida, CURRENT_TIME),
            temperatura_salida = COALESCE($2, temperatura_salida),
            observaciones = COALESCE($3, observaciones)
        WHERE id_despacho = $4
          AND estado = 1
        RETURNING *
        `,
        [
            hora_salida ?? null,
            temperatura_salida ?? null,
            observaciones ?? null,
            id_despacho
        ]
    );
    return result.rows[0];
};

const cancelarDespacho = async (id_despacho) => {
    const result = await db.query(
        `UPDATE despachos SET estado = 0 WHERE id_despacho = $1 RETURNING *`,
        [id_despacho]
    );
    return result.rows[0];
};

// Eliminar despacho.
// Antes de borrar, devuelve a las cámaras el producto de cada línea
// (usando la misma función de reversa), para no dejar inventario perdido.
const deleteDespacho = async (id_despacho) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const lineas = await client.query(
            `SELECT id_detalle FROM despachos_detalle WHERE id_despacho = $1`,
            [id_despacho]
        );
        for (const l of lineas.rows) {
            await client.query(
                `SELECT fn_quitar_linea_despacho($1)`,
                [l.id_detalle]
            );
        }

        const result = await client.query(
            `DELETE FROM despachos WHERE id_despacho = $1 RETURNING *`,
            [id_despacho]
        );

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const registrarAuditoria = async ({
    id_despacho,
    estado_al_editar,
    motivo,
    cambios,
    id_usuario
}) => {
    const result = await db.query(
        `
        INSERT INTO despachos_auditoria (
            id_despacho, estado_al_editar, motivo, cambios, id_usuario
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
            id_despacho,
            estado_al_editar ?? null,
            motivo,
            cambios ?? null,
            id_usuario ?? null
        ]
    );
    return result.rows[0];
};

// Historial de ediciones de un despacho
const getAuditoria = async (id_despacho) => {
    const result = await db.query(
        `SELECT * FROM vw_despachos_auditoria WHERE id_despacho = $1`,
        [id_despacho]
    );
    return result.rows;
};

// Edición limitada para despachos CERRADOS.
// Solo datos administrativos: nunca el cliente ni el picking, porque
// eso cambiaría a quién se despachó o qué fruta salió.
const updateDespachoCerrado = async (
    id_despacho,
    { id_transporte, orden_venta, cita, fecha_cita, hora_salida,
      temperatura_salida, observaciones }
) => {
    const result = await db.query(
        `
        UPDATE despachos
        SET id_transporte      = COALESCE($1, id_transporte),
            orden_venta        = COALESCE($2, orden_venta),
            cita               = COALESCE($3, cita),
            fecha_cita         = COALESCE($4, fecha_cita),
            hora_salida        = COALESCE($5, hora_salida),
            temperatura_salida = COALESCE($6, temperatura_salida),
            observaciones      = COALESCE($7, observaciones)
        WHERE id_despacho = $8
        RETURNING *
        `,
        [
            id_transporte ?? null,
            orden_venta ?? null,
            cita ?? null,
            fecha_cita ?? null,
            hora_salida ?? null,
            temperatura_salida ?? null,
            observaciones ?? null,
            id_despacho
        ]
    );
    return result.rows[0];
};


const despachosModel = {
    // inventario
    getInventarioDisponible,
    getInventarioByCliente,
    // consultas
    getDespachos,
    getDespachoById,
    getDespachosByEstado,
    getDespachoConDetalle,
    getPickingList,
    getSiguienteFolio,
    // altas
    createDespacho,
    addDetalle,
    // bajas
    deleteDetalle,
    deleteDespacho,
    // cambios de estado
    updateDespacho,
    cerrarDespacho,
    cancelarDespacho,
    getClientesConInventario,
    registrarAuditoria,
    getAuditoria,
    updateDespachoCerrado
};

export default despachosModel;
