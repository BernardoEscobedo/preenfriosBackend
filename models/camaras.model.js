import { db } from "../database/connection.database.js";


// Obtener todas las cámaras
const getCamaras = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM camaras
        ORDER BY id_camara ASC
        `
    );

    return result.rows;
};


// Obtener una cámara por ID
const getCamaraById = async (id_camara) => {

    const result = await db.query(
        `
        SELECT *
        FROM camaras
        WHERE id_camara = $1
        `,
        [id_camara]
    );

    return result.rows[0];
};


// Crear cámara
const createCamara = async ({
    nombre_camara,
    tipo_camara,
    ubicacion,
    capacidad_max_tarimas,
    capacidad_max_cajas,
    capacidad_max_bloques
}) => {

    const result = await db.query(
        `
        INSERT INTO camaras (
            nombre_camara,
            tipo_camara,
            ubicacion,
            capacidad_max_tarimas,
            capacidad_max_cajas,
            capacidad_max_bloques
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            nombre_camara,
            tipo_camara,
            ubicacion,
            capacidad_max_tarimas,
            capacidad_max_cajas,
            capacidad_max_bloques
        ]
    );

    return result.rows[0];
};


// Actualizar cámara
const updateCamara = async (
    id_camara,
    {
        nombre_camara,
        tipo_camara,
        ubicacion,
        capacidad_max_tarimas,
        capacidad_max_cajas,
        capacidad_max_bloques
    }
) => {

    const result = await db.query(
        `
        UPDATE camaras
        SET
            nombre_camara = $1,
            tipo_camara = $2,
            ubicacion = $3,
            capacidad_max_tarimas = $4,
            capacidad_max_cajas = $5,
            capacidad_max_bloques = $6
        WHERE id_camara = $7
        RETURNING *
        `,
        [
            nombre_camara,
            tipo_camara,
            ubicacion,
            capacidad_max_tarimas,
            capacidad_max_cajas,
            capacidad_max_bloques,
            id_camara
        ]
    );

    return result.rows[0];
};


// Eliminar cámara
const deleteCamara = async (id_camara) => {

    const result = await db.query(
        `
        DELETE FROM camaras
        WHERE id_camara = $1
        RETURNING *
        `,
        [id_camara]
    );

    return result.rows[0];
};


const camarasModel = {
    getCamaras,
    getCamaraById,
    createCamara,
    updateCamara,
    deleteCamara
};
export default camarasModel;