import { db } from "../database/connection.database.js";

// ============================================================================
// DESPACHOS
// ============================================================================
// TOTALES
//   despachos.cantidad_tarimas / cantidad_cajas los recalcula el TRIGGER
//   trg_recalcular_totales_despacho desde despachos_detalle. No se tocan
//   a mano desde este modelo.
//
// DESCUENTO DE INVENTARIO
//   Al insertar una línea en despachos_detalle, el trigger
//   trg_despacho_detalle_movimiento genera un movimientos_inventario
//   tipo=3, y ES ESE movimiento el que descuenta la ocupación. Nunca se
//   toca ocupaciones_camaras desde aquí: una sola vía de descuento evita
//   descuadres por doble conteo.
//
// ESTADOS
//   1 = borrador (armando el picking) · 2 = cerrado (ya salió)
//   No existe "cancelado": marcarlo sin revertir inventario generaba
//   descuadres silenciosos.
//
// ALCANCE POR CÁMARA
//   El INVENTARIO se filtra siempre: un supervisor solo puede despachar
//   fruta de sus cámaras.
//   Los DESPACHOS (el documento) no se filtran por defecto: un despacho es
//   un documento comercial que puede llevar fruta de varias plantas, y
//   recortarlo daría totales incompletos. Lo que sí queda acotado es de
//   dónde puede tomar producto cada quien, que es lo que protege el
//   inventario.
// ============================================================================


// ---------------------------------------------------------
// INVENTARIO DISPONIBLE (para armar el picking)
// ---------------------------------------------------------
// Todo lo que hay físicamente en cámaras (preenfrío y conserva),
// ordenado por fruta más vieja primero (FEFO).
const getInventarioDisponible = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_inventario_disponible
        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))
        `,
        [camaras]
    );
    return result.rows;
};

// Mismo inventario, filtrado por el cliente al que estaba destinado.
const getInventarioByCliente = async (id_cc, camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_inventario_disponible
        WHERE id_cc = $1
          AND ($2::INT[] IS NULL OR id_camara = ANY($2))
        `,
        [id_cc, camaras]
    );
    return result.rows;
};

// Clientes que SÍ tienen fruta en cámara. Alimenta el dropdown del
// despacho en lugar del catálogo completo.
//
// El agregado se recalcula aquí (en vez de leer vw_clientes_con_inventario)
// porque esa vista agrupa TODO el inventario: si se leyera tal cual, un
// supervisor vería clientes cuya fruta está en cámaras ajenas y luego no
// encontraría nada al armar el picking.
const getClientesConInventario = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT
            id_cc,
            cliente,
            cedis,
            acronimo_cc,
            COUNT(*)                 AS procesos,
            SUM(tarimas_disponibles) AS tarimas_disponibles,
            SUM(cajas_disponibles)   AS cajas_disponibles,
            MIN(fecha_entrega)       AS fecha_entrega_proxima,
            MIN(fecha_empaque)       AS fecha_empaque_mas_antigua
        FROM vw_inventario_disponible
        WHERE id_cc IS NOT NULL
          AND ($1::INT[] IS NULL OR id_camara = ANY($1))
        GROUP BY id_cc, cliente, cedis, acronimo_cc
        ORDER BY cliente, cedis
        `,
        [camaras]
    );
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

// Siguiente folio (numeración de negocio desde 70000).
// OJO: consume la secuencia, llamar solo al abrir el modal de alta.
const getSiguienteFolio = async () => {
    const result = await db.query(`SELECT fn_generar_folio_despacho() AS folio`);
    return result.rows[0]?.folio;
};


// ---------------------------------------------------------
// CREAR DESPACHO (+ detalle opcional, en transacción)
// ---------------------------------------------------------
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

// Cámara de origen de una línea. Sirve para validar alcance antes de
// permitir que alguien quite fruta de una cámara ajena.
const getCamaraDeDetalle = async (id_detalle) => {
    const result = await db.query(
        `SELECT id_camara_origen FROM despachos_detalle WHERE id_detalle = $1`,
        [id_detalle]
    );
    return result.rows[0]?.id_camara_origen ?? null;
};

// Cámara de una ocupación. Se usa al agregar una línea cuando el body
// solo trae id_ocupacion_origen.
const getCamaraDeOcupacion = async (id_ocupacion) => {
    const result = await db.query(
        `SELECT id_camara FROM ocupaciones_camaras WHERE id_ocupacion = $1`,
        [id_ocupacion]
    );
    return result.rows[0]?.id_camara ?? null;
};


// ---------------------------------------------------------
// ACTUALIZAR / CERRAR
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

// Edición limitada para despachos CERRADOS.
// Solo datos administrativos: nunca el cliente ni el picking, porque eso
// cambiaría a quién se despachó o qué fruta salió.
const updateDespachoCerrado = async (
    id_despacho,
    {
        id_transporte,
        orden_venta,
        cita,
        fecha_cita,
        hora_salida,
        temperatura_salida,
        observaciones
    }
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

// Eliminar despacho.
// Antes de borrar, devuelve a las cámaras el producto de cada línea
// (con la misma función de reversa), para no dejar inventario perdido.
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


// ---------------------------------------------------------
// AUDITORÍA DE EDICIONES
// ---------------------------------------------------------
// Un despacho cerrado no se elimina, pero sí admite corregir datos
// administrativos (placas mal escritas, orden de venta que llegó tarde).
// Cada corrección exige motivo y queda registrada: si después hay un
// reclamo, aquí está el rastro de quién cambió qué y por qué.
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

const getAuditoria = async (id_despacho) => {
    const result = await db.query(
        `SELECT * FROM vw_despachos_auditoria WHERE id_despacho = $1`,
        [id_despacho]
    );
    return result.rows;
};


const despachosModel = {
    // inventario
    getInventarioDisponible,
    getInventarioByCliente,
    getClientesConInventario,
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
    // alcance
    getCamaraDeDetalle,
    getCamaraDeOcupacion,
    // bajas
    deleteDetalle,
    deleteDespacho,
    // cambios de estado
    updateDespacho,
    updateDespachoCerrado,
    cerrarDespacho,
    // auditoría
    registrarAuditoria,
    getAuditoria
};

export default despachosModel;
