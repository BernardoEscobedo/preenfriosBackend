import { db } from "../database/connection.database.js";


// Obtener todos los lotes
const getLotes = async () => {

    const result = await db.query(
        `
        SELECT
            l.*,
            f.codigo_finca,
            f.nombre AS nombre_finca,
            s.codigo_sku,
            s.calidad
        FROM lotes l
        JOIN fincas f ON f.id_finca = l.id_finca
        JOIN sku_pt s ON s.id_sku = l.id_sku
        ORDER BY l.id_lote ASC
        `
    );

    return result.rows;
};


// Obtener un lote por ID
const getLoteById = async (id_lote) => {

    const result = await db.query(
        `
        SELECT
            l.*,
            f.codigo_finca,
            f.nombre AS nombre_finca,
            s.codigo_sku,
            s.calidad
        FROM lotes l
        JOIN fincas f ON f.id_finca = l.id_finca
        JOIN sku_pt s ON s.id_sku = l.id_sku
        WHERE l.id_lote = $1
        `,
        [id_lote]
    );

    return result.rows[0];
};


// Obtener un lote por código
const getLoteByCodigo = async (codigo_lote) => {

    const result = await db.query(
        `
        SELECT *
        FROM lotes
        WHERE codigo_lote = $1
        `,
        [codigo_lote]
    );

    return result.rows[0];
};


// Obtener lotes por finca
const getLotesByFinca = async (id_finca) => {

    const result = await db.query(
        `
        SELECT *
        FROM lotes
        WHERE id_finca = $1
        ORDER BY id_lote ASC
        `,
        [id_finca]
    );

    return result.rows;
};


// Crear lote
const createLote = async ({
    codigo_lote,
    id_finca,
    id_sku,
    semana,
    fecha_empaque,
    turno,
    estado
}) => {

    const result = await db.query(
        `
        INSERT INTO lotes (
            codigo_lote,
            id_finca,
            id_sku,
            semana,
            fecha_empaque,
            turno,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            codigo_lote,
            id_finca,
            id_sku,
            semana,
            fecha_empaque,
            turno,
            estado
        ]
    );

    return result.rows[0];
};


// Actualizar lote
const updateLote = async (
    id_lote,
    {
        codigo_lote,
        id_finca,
        id_sku,
        semana,
        fecha_empaque,
        turno,
        estado
    }
) => {

    const result = await db.query(
        `
        UPDATE lotes
        SET
            codigo_lote = $1,
            id_finca = $2,
            id_sku = $3,
            semana = $4,
            fecha_empaque = $5,
            turno = $6,
            estado = $7
        WHERE id_lote = $8
        RETURNING *
        `,
        [
            codigo_lote,
            id_finca,
            id_sku,
            semana,
            fecha_empaque,
            turno,
            estado,
            id_lote
        ]
    );

    return result.rows[0];
};


// Eliminar lote
const deleteLote = async (id_lote) => {

    const result = await db.query(
        `
        DELETE FROM lotes
        WHERE id_lote = $1
        RETURNING *
        `,
        [id_lote]
    );

    return result.rows[0];
};


const lotesModel = {
    getLotes,
    getLoteById,
    getLoteByCodigo,
    getLotesByFinca,
    createLote,
    updateLote,
    deleteLote
};
export default lotesModel;
