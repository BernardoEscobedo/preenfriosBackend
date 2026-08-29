import { db } from "../database/connection.database.js";

// =========================================================
// RECEPCIONES ESPERADAS (vista)
// =========================================================
const getRecepcionesEsperadas = async () => {
    const result = await db.query(
        `SELECT * FROM vw_recepciones_esperadas ORDER BY id_produccion DESC`
    );
    return result.rows;
};

const getRecepcionesEsperadasBySemana = async (semana) => {
    const result = await db.query(
        `SELECT * FROM vw_recepciones_esperadas WHERE semana = $1
         ORDER BY id_produccion DESC`,
        [semana]
    );
    return result.rows;
};

const getPendientes = async () => {
    const result = await db.query(
        `
        SELECT * FROM vw_recepciones_esperadas
        WHERE cajas_pendientes > 0 AND se_preenfria = TRUE
        ORDER BY fecha_entrega ASC NULLS LAST, id_produccion DESC
        `
    );
    return result.rows;
};

// =========================================================
// DISPONIBILIDAD (para sugerir la división al recepcionar)
// =========================================================
const getDisponibilidadCamaras = async () => {
    const result = await db.query(
        `SELECT * FROM vw_disponibilidad_camaras ORDER BY id_camara ASC`
    );
    return result.rows;
};

const getTarimasDisponibles = async (id_camara) => {
    const result = await db.query(
        `SELECT fn_tarimas_disponibles($1) AS disponibles`,
        [id_camara]
    );
    return result.rows[0]?.disponibles ?? 0;
};

// =========================================================
// COLA DE ESPERA
// =========================================================
// La vista ya viene ordenada por:
//   prioridad DESC -> fecha_empaque ASC -> llegada ASC
// (la fruta más vieja entra primero, salvo que se marque urgente)
const getColaEspera = async () => {
    const result = await db.query(`SELECT * FROM vw_cola_espera`);
    return result.rows;
};

const getColaEsperaByCamara = async (id_camara) => {
    const result = await db.query(
        `SELECT * FROM vw_cola_espera WHERE id_camara = $1`,
        [id_camara]
    );
    return result.rows;
};

// Promueve tarimas de la cola hacia la cámara (el operador elige cuál)
const promoverDeCola = async (id_ocupacion_espera, tarimas, fecha, hora) => {
    const result = await db.query(
        `SELECT fn_promover_de_cola($1, $2, $3, $4) AS resultado`,
        [
            id_ocupacion_espera,
            tarimas,
            fecha || new Date().toISOString().substring(0, 10),
            hora || new Date().toTimeString().substring(0, 8)
        ]
    );
    return result.rows[0]?.resultado;
};

// Marcar / quitar prioridad de un proceso en la cola
//   prioridad = 0  -> vuelve al orden normal (por fecha de empaque)
//   prioridad > 0  -> se adelanta en la fila de su cámara
const setPrioridadCola = async (id_ocupacion, prioridad, motivo) => {
    const result = await db.query(
        `SELECT fn_set_prioridad_cola($1, $2, $3) AS resultado`,
        [id_ocupacion, prioridad, motivo ?? null]
    );
    return result.rows[0]?.resultado;
};

// =========================================================
// RECEPCIONES (registros reales)
// =========================================================
const getRecepciones = async () => {
    const result = await db.query(
        `
        SELECT
            r.*,
            p.codigo_lote,
            p.fecha_empaque,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            cc.cliente,
            cc.cedis,
            cam.nombre_camara,
            cam.tipo_camara,
            e.nombre            AS nombre_empleado
        FROM recepciones r
        JOIN produccion     p   ON p.id_produccion = r.id_produccion
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = r.id_camara
        LEFT JOIN usuarios  u   ON u.id_usuario    = r.id_usuario
        LEFT JOIN empleados e   ON e.id_empleado   = u.id_empleado
        ORDER BY r.id_recepcion DESC
        `
    );
    return result.rows;
};

const getRecepcionById = async (id_recepcion) => {
    const result = await db.query(
        `
        SELECT
            r.*,
            p.codigo_lote,
            p.fecha_empaque,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            cc.cliente,
            cc.cedis,
            cam.nombre_camara,
            cam.tipo_camara
        FROM recepciones r
        JOIN produccion     p   ON p.id_produccion = r.id_produccion
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = r.id_camara
        WHERE r.id_recepcion = $1
        `,
        [id_recepcion]
    );
    return result.rows[0];
};

const getRecepcionesByProduccion = async (id_produccion) => {
    const result = await db.query(
        `
        SELECT r.*, cam.nombre_camara, cam.tipo_camara
        FROM recepciones r
        LEFT JOIN camaras cam ON cam.id_camara = r.id_camara
        WHERE r.id_produccion = $1
        ORDER BY r.fecha_recepcion DESC, r.hora_recepcion DESC
        `,
        [id_produccion]
    );
    return result.rows;
};

const createRecepcion = async ({
    id_produccion,
    id_camara,
    fecha_recepcion,
    hora_recepcion,
    cajas_recibidas,
    tarimas_recibidas,
    tarimas_ingresadas,
    cajas_ingresadas,
    temperatura,
    id_usuario,
    estado,
    observaciones
}) => {
    const result = await db.query(
        `
        INSERT INTO recepciones (
            id_produccion, id_camara, fecha_recepcion, hora_recepcion,
            cajas_recibidas, tarimas_recibidas,
            tarimas_ingresadas, cajas_ingresadas,
            temperatura, id_usuario, estado, observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `,
        [
            id_produccion,
            id_camara ?? null,
            fecha_recepcion,
            hora_recepcion,
            cajas_recibidas ?? 0,
            tarimas_recibidas ?? 0,
            tarimas_ingresadas ?? null,
            cajas_ingresadas ?? null,
            temperatura ?? null,
            id_usuario ?? null,
            estado ?? 1,
            observaciones ?? null
        ]
    );
    return result.rows[0];
};

const updateRecepcion = async (
    id_recepcion,
    {
        id_camara,
        fecha_recepcion,
        hora_recepcion,
        cajas_recibidas,
        tarimas_recibidas,
        tarimas_ingresadas,
        cajas_ingresadas,
        temperatura,
        estado,
        observaciones
    }
) => {
    const result = await db.query(
        `
        UPDATE recepciones
        SET id_camara = $1, fecha_recepcion = $2, hora_recepcion = $3,
            cajas_recibidas = $4, tarimas_recibidas = $5,
            tarimas_ingresadas = $6, cajas_ingresadas = $7,
            temperatura = $8, estado = $9, observaciones = $10
        WHERE id_recepcion = $11
        RETURNING *
        `,
        [
            id_camara ?? null,
            fecha_recepcion,
            hora_recepcion,
            cajas_recibidas ?? 0,
            tarimas_recibidas ?? 0,
            tarimas_ingresadas ?? null,
            cajas_ingresadas ?? null,
            temperatura ?? null,
            estado ?? 1,
            observaciones ?? null,
            id_recepcion
        ]
    );
    return result.rows[0];
};

const cancelarRecepcion = async (id_recepcion) => {
    const result = await db.query(
        `UPDATE recepciones SET estado = 0 WHERE id_recepcion = $1 RETURNING *`,
        [id_recepcion]
    );
    return result.rows[0];
};

const deleteRecepcion = async (id_recepcion) => {
    const result = await db.query(
        `DELETE FROM recepciones WHERE id_recepcion = $1 RETURNING *`,
        [id_recepcion]
    );
    return result.rows[0];
};

const recepcionesModel = {
    getRecepcionesEsperadas,
    getRecepcionesEsperadasBySemana,
    getPendientes,
    getDisponibilidadCamaras,
    getTarimasDisponibles,
    getColaEspera,
    getColaEsperaByCamara,
    promoverDeCola,
    setPrioridadCola,
    getRecepciones,
    getRecepcionById,
    getRecepcionesByProduccion,
    createRecepcion,
    updateRecepcion,
    cancelarRecepcion,
    deleteRecepcion
};

export default recepcionesModel;
