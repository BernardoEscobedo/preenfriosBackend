import { db } from "../database/connection.database.js";

// NOTA: 'activo' es INT en la BD (1=activo, 0=inactivo), con DEFAULT 1.
// Antes se enviaba boolean (true/false) a una columna INT y provocaba
// "invalid input syntax for type integer: true". Aquí se normaliza a 1/0.
const toInt01 = (v, def = 1) => {
    if (v === undefined || v === null) return def;
    if (v === true) return 1;
    if (v === false) return 0;
    const n = Number(v);
    return isNaN(n) ? def : n;
};

// Obtener todos los productores
const getProductores = async () => {
    const result = await db.query(
        `
        SELECT *
        FROM productores
        ORDER BY id_productor ASC
        `
    );
    return result.rows;
};

// Obtener un productor por ID
const getProductorById = async (id_productor) => {
    const result = await db.query(
        `
        SELECT *
        FROM productores
        WHERE id_productor = $1
        `,
        [id_productor]
    );
    return result.rows[0];
};

// Crear productor
const createProductor = async ({
    codigo_productor,
    nombre,
    activo
}) => {
    const result = await db.query(
        `
        INSERT INTO productores (
            codigo_productor,
            nombre,
            activo
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            codigo_productor,
            nombre,
            toInt01(activo, 1)
        ]
    );
    return result.rows[0];
};

// Actualizar productor
const updateProductor = async (
    id_productor,
    {
        codigo_productor,
        nombre,
        activo
    }
) => {
    const result = await db.query(
        `
        UPDATE productores
        SET
            codigo_productor = $1,
            nombre = $2,
            activo = $3
        WHERE id_productor = $4
        RETURNING *
        `,
        [
            codigo_productor,
            nombre,
            toInt01(activo, 1),
            id_productor
        ]
    );
    return result.rows[0];
};

// Eliminar productor
const deleteProductor = async (id_productor) => {
    const result = await db.query(
        `
        DELETE FROM productores
        WHERE id_productor = $1
        RETURNING *
        `,
        [id_productor]
    );
    return result.rows[0];
};

const productoresModel = {
    getProductores,
    getProductorById,
    createProductor,
    updateProductor,
    deleteProductor
};

export default productoresModel;
