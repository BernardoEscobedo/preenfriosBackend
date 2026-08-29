import { db } from "../database/connection.database.js";

// Bloque de JOINs reutilizable: desde la ocupación llegamos a la recepción
// que la originó y de ahí a la producción con todos sus catálogos.
// Así cada ocupación puede mostrar lote, finca, productor, SKU y cliente.
const SELECT_OCUPACION_DETALLE = `
    SELECT
        o.*,
        cam.nombre_camara,
        cam.tipo_camara,
        cam.ubicacion,
        cam.capacidad_max_tarimas,
        cam.capacidad_max_cajas,
        r.id_recepcion,
        r.fecha_recepcion,
        r.hora_recepcion,
        r.temperatura,
        r.cajas_recibidas,
        r.tarimas_recibidas,
        p.id_produccion,
        p.codigo_lote,
        p.semana,
        p.region,
        p.fecha_empaque,
        p.fecha_entrega,
        p.transito,
        p.cajas_procesadas,
        p.estiba_pallets,
        p.comentarios,
        f.codigo_finca,
        f.nombre            AS nombre_finca,
        f.org_inv_nombre,
        pr.codigo_productor,
        pr.nombre           AS nombre_productor,
        s.codigo_sku,
        s.calidad           AS calidad_sku,
        s.turno             AS turno_sku,
        cc.cliente,
        cc.cedis,
        cc.acronimo         AS acronimo_cc,
        e.nombre            AS nombre_empleado,
        e.apellidos         AS apellidos_empleado,
        m.motivo            AS motivo_mantenimiento,
        m.prioridad         AS prioridad_mantenimiento,
        m.fecha_inicio      AS mant_fecha_inicio,
        m.fecha_fin         AS mant_fecha_fin
    FROM ocupaciones_camaras o
    JOIN camaras            cam ON cam.id_camara      = o.id_camara
    LEFT JOIN recepciones   r   ON r.id_recepcion     = o.id_recepcion
    LEFT JOIN produccion    p   ON p.id_produccion    = r.id_produccion
    LEFT JOIN fincas        f   ON f.id_finca         = p.id_finca
    LEFT JOIN productores   pr  ON pr.id_productor    = p.id_productor
    LEFT JOIN sku_pt        s   ON s.id_sku           = p.id_sku
    LEFT JOIN cedis_cliente cc  ON cc.id_cc           = p.id_cc
    LEFT JOIN usuarios      u   ON u.id_usuario       = r.id_usuario
    LEFT JOIN empleados     e   ON e.id_empleado      = u.id_empleado
    LEFT JOIN mantenimientos m  ON m.id_mantenimiento = o.id_mantenimiento
`;

// Obtener todas las ocupaciones
const getOcupaciones = async () => {
    const result = await db.query(
        `${SELECT_OCUPACION_DETALLE}
         ORDER BY o.id_ocupacion ASC`
    );
    return result.rows;
};

// Obtener una ocupación por ID (con todo el detalle del proceso)
const getOcupacionById = async (id_ocupacion) => {
    const result = await db.query(
        `${SELECT_OCUPACION_DETALLE}
         WHERE o.id_ocupacion = $1`,
        [id_ocupacion]
    );
    return result.rows[0];
};

// Obtener ocupaciones por cámara
const getOcupacionesByCamara = async (id_camara) => {
    const result = await db.query(
        `${SELECT_OCUPACION_DETALLE}
         WHERE o.id_camara = $1
         ORDER BY o.fecha_inicio DESC, o.hora_inicio DESC`,
        [id_camara]
    );
    return result.rows;
};

// Obtener ocupaciones activas (estado = 1) con detalle del proceso
const getOcupacionesActivas = async () => {
    const result = await db.query(
        `${SELECT_OCUPACION_DETALLE}
         WHERE o.estado = 1
         ORDER BY o.fecha_inicio DESC, o.hora_inicio DESC`
    );
    return result.rows;
};

// Crear ocupación
const createOcupacion = async ({
    id_camara,
    fecha_inicio,
    hora_inicio,
    fecha_fin,
    hora_fin,
    cantidad_tarimas,
    cantidad_cajas,
    cantidad_bloques,
    tipo_ocupacion,
    id_mantenimiento,
    estado,
    observaciones
}) => {
    const result = await db.query(
        `
        INSERT INTO ocupaciones_camaras (
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            cantidad_tarimas,
            cantidad_cajas,
            cantidad_bloques,
            tipo_ocupacion,
            id_mantenimiento,
            estado,
            observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `,
        [
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            cantidad_tarimas ?? 0,
            cantidad_cajas ?? 0,
            cantidad_bloques ?? 0,
            tipo_ocupacion ?? 1,
            id_mantenimiento,
            estado,
            observaciones
        ]
    );
    return result.rows[0];
};

// Actualizar ocupación
const updateOcupacion = async (
    id_ocupacion,
    {
        id_camara,
        fecha_inicio,
        hora_inicio,
        fecha_fin,
        hora_fin,
        cantidad_tarimas,
        cantidad_cajas,
        cantidad_bloques,
        tipo_ocupacion,
        id_mantenimiento,
        estado,
        observaciones
    }
) => {
    const result = await db.query(
        `
        UPDATE ocupaciones_camaras
        SET
            id_camara = $1,
            fecha_inicio = $2,
            hora_inicio = $3,
            fecha_fin = $4,
            hora_fin = $5,
            cantidad_tarimas = $6,
            cantidad_cajas = $7,
            cantidad_bloques = $8,
            tipo_ocupacion = $9,
            id_mantenimiento = $10,
            estado = $11,
            observaciones = $12
        WHERE id_ocupacion = $13
        RETURNING *
        `,
        [
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            cantidad_tarimas ?? 0,
            cantidad_cajas ?? 0,
            cantidad_bloques ?? 0,
            tipo_ocupacion ?? 1,
            id_mantenimiento,
            estado,
            observaciones,
            id_ocupacion
        ]
    );
    return result.rows[0];
};

// Cerrar ocupación (fecha_fin, hora_fin y estado = 0)
const cerrarOcupacion = async (id_ocupacion, { fecha_fin, hora_fin }) => {
    const result = await db.query(
        `
        UPDATE ocupaciones_camaras
        SET
            fecha_fin = $1,
            hora_fin = $2,
            estado = 0
        WHERE id_ocupacion = $3
        RETURNING *
        `,
        [fecha_fin, hora_fin, id_ocupacion]
    );
    return result.rows[0];
};

// Eliminar ocupación
const deleteOcupacion = async (id_ocupacion) => {
    const result = await db.query(
        `
        DELETE FROM ocupaciones_camaras
        WHERE id_ocupacion = $1
        RETURNING *
        `,
        [id_ocupacion]
    );
    return result.rows[0];
};

const ocupacionesModel = {
    getOcupaciones,
    getOcupacionById,
    getOcupacionesByCamara,
    getOcupacionesActivas,
    createOcupacion,
    updateOcupacion,
    cerrarOcupacion,
    deleteOcupacion
};

export default ocupacionesModel;
