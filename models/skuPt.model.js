import { db } from "../database/connection.database.js";

// El turno es una propiedad fija del SKU (depende de la calidad) y se usa
// para armar el código de lote en el módulo de Producción.

// Obtener todos los SKU
const getSkuPt = async () => {
    const result = await db.query(
        `
        SELECT
            id_sku,
            codigo_sku,
            calidad,
            turno
        FROM sku_pt
        ORDER BY id_sku ASC
        `
    );
    return result.rows;
};

// Obtener un SKU por ID
const getSkuPtById = async (id_sku) => {
    const result = await db.query(
        `
        SELECT
            id_sku,
            codigo_sku,
            calidad,
            turno
        FROM sku_pt
        WHERE id_sku = $1
        `,
        [id_sku]
    );
    return result.rows[0];
};

// Crear SKU
const createSkuPt = async ({ codigo_sku, calidad, turno }) => {
    const result = await db.query(
        `
        INSERT INTO sku_pt (
            codigo_sku,
            calidad,
            turno
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [codigo_sku, calidad, turno ?? 1]
    );
    return result.rows[0];
};

// Actualizar SKU
const updateSkuPt = async (id_sku, { codigo_sku, calidad, turno }) => {
    const result = await db.query(
        `
        UPDATE sku_pt
        SET
            codigo_sku = $1,
            calidad = $2,
            turno = $3
        WHERE id_sku = $4
        RETURNING *
        `,
        [codigo_sku, calidad, turno ?? 1, id_sku]
    );
    return result.rows[0];
};

// Eliminar SKU
const deleteSkuPt = async (id_sku) => {
    const result = await db.query(
        `
        DELETE FROM sku_pt
        WHERE id_sku = $1
        RETURNING *
        `,
        [id_sku]
    );
    return result.rows[0];
};

const skuPtModel = {
    getSkuPt,
    getSkuPtById,
    createSkuPt,
    updateSkuPt,
    deleteSkuPt
};

export default skuPtModel;
