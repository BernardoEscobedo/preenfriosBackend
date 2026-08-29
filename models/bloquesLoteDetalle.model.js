import { db } from "../database/connection.database.js";

// NOTA: cada INSERT/UPDATE/DELETE aquí dispara automáticamente
// (vía trigger de Postgres) el recalculo de cantidad_tarimas y
// cantidad_cajas en bloques_fruta. No hay que tocar esa tabla manualmente.


// Obtener todo el detalle
const getDetalles = async () => {

    const result = await db.query(
        `
        SELECT
            bld.*,
            b.codigo_bloque,
            l.codigo_lote
        FROM bloques_lote_detalle bld
        JOIN bloques_fruta b ON b.id_bloque = bld.id_bloque
        JOIN lotes l ON l.id_lote = bld.id_lote
        ORDER BY bld.id_detalle ASC
        `
    );

    return result.rows;
};


// Obtener un detalle por ID
const getDetalleById = async (id_detalle) => {

    const result = await db.query(
        `
        SELECT
            bld.*,
            b.codigo_bloque,
            l.codigo_lote
        FROM bloques_lote_detalle bld
        JOIN bloques_fruta b ON b.id_bloque = bld.id_bloque
        JOIN lotes l ON l.id_lote = bld.id_lote
        WHERE bld.id_detalle = $1
        `,
        [id_detalle]
    );

    return result.rows[0];
};


// Obtener el detalle (composición) de un bloque
const getDetallesByBloque = async (id_bloque) => {

    const result = await db.query(
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

    return result.rows;
};


// Obtener en qué bloques aparece un lote
const getDetallesByLote = async (id_lote) => {

    const result = await db.query(
        `
        SELECT
            bld.*,
            b.codigo_bloque
        FROM bloques_lote_detalle bld
        JOIN bloques_fruta b ON b.id_bloque = bld.id_bloque
        WHERE bld.id_lote = $1
        ORDER BY bld.id_detalle ASC
        `,
        [id_lote]
    );

    return result.rows;
};


// Crear detalle (agregar un lote a un bloque)
const createDetalle = async ({
    id_bloque,
    id_lote,
    cantidad_tarimas,
    cantidad_cajas
}) => {

    const result = await db.query(
        `
        INSERT INTO bloques_lote_detalle (
            id_bloque,
            id_lote,
            cantidad_tarimas,
            cantidad_cajas
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
            id_bloque,
            id_lote,
            cantidad_tarimas,
            cantidad_cajas
        ]
    );

    return result.rows[0];
};


// Actualizar detalle (ej. corregir cantidades de tarimas/cajas de ese lote)
const updateDetalle = async (
    id_detalle,
    {
        cantidad_tarimas,
        cantidad_cajas
    }
) => {

    const result = await db.query(
        `
        UPDATE bloques_lote_detalle
        SET
            cantidad_tarimas = $1,
            cantidad_cajas = $2
        WHERE id_detalle = $3
        RETURNING *
        `,
        [
            cantidad_tarimas,
            cantidad_cajas,
            id_detalle
        ]
    );

    return result.rows[0];
};


// Eliminar detalle (quitar un lote del bloque)
const deleteDetalle = async (id_detalle) => {

    const result = await db.query(
        `
        DELETE FROM bloques_lote_detalle
        WHERE id_detalle = $1
        RETURNING *
        `,
        [id_detalle]
    );

    return result.rows[0];
};


const bloquesLoteDetalleModel = {
    getDetalles,
    getDetalleById,
    getDetallesByBloque,
    getDetallesByLote,
    createDetalle,
    updateDetalle,
    deleteDetalle
};
export default bloquesLoteDetalleModel;
