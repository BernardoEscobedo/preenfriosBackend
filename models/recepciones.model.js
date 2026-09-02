import { db } from "../database/connection.database.js";

// ============================================================================
// RECEPCIONES
// ============================================================================
// ALCANCE POR CÁMARA
//   Todas las consultas reciben `camaras`, que llega desde el middleware
//   cargarAlcance:
//       null   -> sin restricción (Admin / Coordinador)
//       [1,2]  -> solo esas cámaras (Supervisor / Operativo)
//       []     -> no ve nada (usuario sin asignación)
//
//   El patrón `($1::INT[] IS NULL OR id_camara = ANY($1))` permite usar la
//   MISMA query para los dos casos, sin armar SQL dinámico ni duplicar
//   métodos. Si el parámetro es NULL la condición se cumple siempre.
//
//   El filtro va aquí y no en el frontend: ocultar cámaras en la vista no
//   protege nada, porque con el token se puede llamar la API directo.
// ============================================================================


// ---------------------------------------------------------
// RECEPCIONES ESPERADAS (vista)
// ---------------------------------------------------------
// Las producciones con id_camara NULL van directo a CEDA: no pasan por
// ninguna cámara, así que NO se muestran a quien tiene alcance limitado.
// No son asunto del preenfrío.
const getRecepcionesEsperadas = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_recepciones_esperadas
        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))
        ORDER BY id_produccion DESC
        `,
        [camaras]
    );
    return result.rows;
};

const getRecepcionesEsperadasBySemana = async (semana, camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_recepciones_esperadas
        WHERE semana = $1
          AND ($2::INT[] IS NULL OR id_camara = ANY($2))
        ORDER BY id_produccion DESC
        `,
        [semana, camaras]
    );
    return result.rows;
};

const getPendientes = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_recepciones_esperadas
        WHERE cajas_pendientes > 0
          AND se_preenfria = TRUE
          AND ($1::INT[] IS NULL OR id_camara = ANY($1))
        ORDER BY fecha_entrega ASC NULLS LAST, id_produccion DESC
        `,
        [camaras]
    );
    return result.rows;
};


// ---------------------------------------------------------
// DISPONIBILIDAD (para sugerir la división al recepcionar)
// ---------------------------------------------------------
const getDisponibilidadCamaras = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_disponibilidad_camaras
        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))
        ORDER BY id_camara ASC
        `,
        [camaras]
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


// ---------------------------------------------------------
// COLA DE ESPERA
// ---------------------------------------------------------
// La vista ya viene ordenada por:
//   prioridad DESC -> fecha_empaque ASC -> llegada ASC
// (la fruta más vieja entra primero, salvo que se marque urgente)
const getColaEspera = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT * FROM vw_cola_espera
        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))
        `,
        [camaras]
    );
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

// Devuelve la cámara de una fila de la cola.
// Se usa para validar que el usuario tenga acceso antes de promoverla:
// sin esto, alguien podría ingresar producto de una cámara ajena
// mandando el id_ocupacion a mano.
const getCamaraDeOcupacion = async (id_ocupacion) => {
    const result = await db.query(
        `SELECT id_camara FROM ocupaciones_camaras WHERE id_ocupacion = $1`,
        [id_ocupacion]
    );
    return result.rows[0]?.id_camara ?? null;
};


// ---------------------------------------------------------
// RECEPCIONES (registros reales)
// ---------------------------------------------------------
const getRecepciones = async (camaras = null) => {
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
        WHERE ($1::INT[] IS NULL OR r.id_camara = ANY($1))
        ORDER BY r.id_recepcion DESC
        `,
        [camaras]
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

// Crear recepción.
// El trigger fn_sync_ocupacion_recepcion usa tarimas_ingresadas para saber
// cuánto entra a la cámara; el resto se va a la cola (tipo_ocupacion = 3).
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
            // NULL => el trigger calcula automáticamente lo que cabe
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
    getCamaraDeOcupacion,
    getRecepciones,
    getRecepcionById,
    getRecepcionesByProduccion,
    createRecepcion,
    updateRecepcion,
    cancelarRecepcion,
    deleteRecepcion
};

export default recepcionesModel;
