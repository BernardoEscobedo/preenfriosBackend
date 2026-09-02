import { db } from "../database/connection.database.js";

// ============================================================================
// CÁMARAS
// ============================================================================
// ALCANCE POR CÁMARA
//   getCamaras recibe `camaras` desde el middleware cargarAlcance:
//       null   -> sin restricción (Admin / Coordinador)
//       [1,2]  -> solo esas cámaras (Supervisor / Operativo)
//
//   El patrón `($1::INT[] IS NULL OR id_camara = ANY($1))` sirve para los
//   dos casos con la misma query: si el parámetro es NULL la condición se
//   cumple siempre.
//
//   Filtrar aquí tiene un efecto colateral valioso: los DROPDOWNS de todo
//   el sistema se acotan solos. Un supervisor de Doña Nelly ya no podrá
//   siquiera elegir Fortaleza al mover inventario, porque su lista no la
//   trae. Previene errores de captura, no solo fugas de información.
// ============================================================================

// Obtener todas las cámaras (filtradas por alcance)
const getCamaras = async (camaras = null) => {
    const result = await db.query(
        `
        SELECT *
        FROM camaras
        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))
        ORDER BY id_camara ASC
        `,
        [camaras]
    );
    return result.rows;
};

// Obtener una cámara por ID.
// No filtra por alcance: el controller compara el resultado para poder
// distinguir entre "no existe" (404) y "no tienes acceso" (403).
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
