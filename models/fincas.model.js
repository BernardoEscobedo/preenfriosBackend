import { db } from "../database/connection.database.js";


// Obtener todas las fincas
const getFincas = async () => {

    const result = await db.query(
        `
        SELECT
            f.*,
            p.codigo_productor,
            p.nombre AS nombre_productor
        FROM fincas f
        JOIN productores p ON p.id_productor = f.id_productor
        ORDER BY f.id_finca ASC
        `
    );

    return result.rows;
};


// Obtener una finca por ID
const getFincaById = async (id_finca) => {

    const result = await db.query(
        `
        SELECT
            f.*,
            p.codigo_productor,
            p.nombre AS nombre_productor
        FROM fincas f
        JOIN productores p ON p.id_productor = f.id_productor
        WHERE f.id_finca = $1
        `,
        [id_finca]
    );

    return result.rows[0];
};


// Obtener fincas por productor
const getFincasByProductor = async (id_productor) => {

    const result = await db.query(
        `
        SELECT *
        FROM fincas
        WHERE id_productor = $1
        ORDER BY id_finca ASC
        `,
        [id_productor]
    );

    return result.rows;
};


// Crear finca
const createFinca = async ({
    codigo_finca,
    nombre,
    org_inv_nombre,
    zona,
    id_productor,
    estado
}) => {

    const result = await db.query(
        `
        INSERT INTO fincas (
            codigo_finca,
            nombre,
            org_inv_nombre,
            zona,
            id_productor,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            codigo_finca,
            nombre,
            org_inv_nombre,
            zona,
            id_productor,
            estado
        ]
    );

    return result.rows[0];
};


// Actualizar finca
const updateFinca = async (
    id_finca,
    {
        codigo_finca,
        nombre,
        org_inv_nombre,
        zona,
        id_productor,
        estado
    }
) => {

    const result = await db.query(
        `
        UPDATE fincas
        SET
            codigo_finca = $1,
            nombre = $2,
            org_inv_nombre = $3,
            zona = $4,
            id_productor = $5,
            estado = $6
        WHERE id_finca = $7
        RETURNING *
        `,
        [
            codigo_finca,
            nombre,
            org_inv_nombre,
            zona,
            id_productor,
            estado,
            id_finca
        ]
    );

    return result.rows[0];
};


// Eliminar finca
const deleteFinca = async (id_finca) => {

    const result = await db.query(
        `
        DELETE FROM fincas
        WHERE id_finca = $1
        RETURNING *
        `,
        [id_finca]
    );

    return result.rows[0];
};


const fincasModel = {
    getFincas,
    getFincaById,
    getFincasByProductor,
    createFinca,
    updateFinca,
    deleteFinca
};
export default fincasModel;
