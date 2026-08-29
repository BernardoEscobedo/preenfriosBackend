import { db } from "../database/connection.database.js";

// NOTA: cantidad_tarimas y cantidad_cajas se recalculan automáticamente
// mediante el trigger trg_recalcular_totales_bloque a partir de
// bloques_lote_detalle. Este modelo NUNCA debe escribir esos dos
// campos directamente: se insertan en 0 y se actualizan solos.


// Obtener todos los bloques
const getBloques = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM bloques_fruta
        ORDER BY id_bloque ASC
        `
    );

    return result.rows;
};


// Obtener un bloque por ID
const getBloqueById = async (id_bloque) => {

    const result = await db.query(
        `
        SELECT *
        FROM bloques_fruta
        WHERE id_bloque = $1
        `,
        [id_bloque]
    );

    return result.rows[0];
};


// Obtener un bloque con el detalle de lotes que lo componen
const getBloqueConDetalle = async (id_bloque) => {

    const bloqueResult = await db.query(
        `
        SELECT *
        FROM bloques_fruta
        WHERE id_bloque = $1
        `,
        [id_bloque]
    );

    const bloque = bloqueResult.rows[0];

    if (!bloque) {
        return null;
    }

    const detalleResult = await db.query(
        `
        SELECT
            bld.*,
            l.codigo_lote
        FROM bloques_lote_detalle bld
        JOIN lotes l ON l.id_lote = bld.id_lote
        WHERE bld.id_bloque = $1
        ORDER BY bld.id_detalle ASC
        `,
        [id_bloque]
    );

    return {
        ...bloque,
        detalle: detalleResult.rows
    };
};


// Crear bloque (cantidad_tarimas y cantidad_cajas inician en 0;
// se actualizan solos cuando se registre el detalle)
const createBloque = async ({
    codigo_bloque,
    fecha_hora_armado,
    temperatura_ingreso,
    estado
}) => {

    const result = await db.query(
        `
        INSERT INTO bloques_fruta (
            codigo_bloque,
            fecha_hora_armado,
            cantidad_tarimas,
            cantidad_cajas,
            temperatura_ingreso,
            estado
        )
        VALUES (
            $1,
            COALESCE($2, CURRENT_TIMESTAMP),
            0,
            0,
            $3,
            $4
        )
        RETURNING *
        `,
        [
            codigo_bloque,
            fecha_hora_armado,
            temperatura_ingreso,
            estado
        ]
    );

    return result.rows[0];
};


// Actualizar bloque (no toca cantidad_tarimas / cantidad_cajas,
// esos los controla el trigger)
const updateBloque = async (
    id_bloque,
    {
        codigo_bloque,
        fecha_hora_armado,
        temperatura_ingreso,
        estado
    }
) => {

    const result = await db.query(
        `
        UPDATE bloques_fruta
        SET
            codigo_bloque = $1,
            fecha_hora_armado = COALESCE($2, fecha_hora_armado),
            temperatura_ingreso = $3,
            estado = $4
        WHERE id_bloque = $5
        RETURNING *
        `,
        [
            codigo_bloque,
            fecha_hora_armado,
            temperatura_ingreso,
            estado,
            id_bloque
        ]
    );

    return result.rows[0];
};


// Eliminar bloque
const deleteBloque = async (id_bloque) => {

    const result = await db.query(
        `
        DELETE FROM bloques_fruta
        WHERE id_bloque = $1
        RETURNING *
        `,
        [id_bloque]
    );

    return result.rows[0];
};


const bloquesFrutaModel = {
    getBloques,
    getBloqueById,
    getBloqueConDetalle,
    createBloque,
    updateBloque,
    deleteBloque
};
export default bloquesFrutaModel;
