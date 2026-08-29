import { db } from "../database/connection.database.js";

// Obtener todos los transportes
const getTransportes = async () => {
    const result = await db.query(
        `
        SELECT *
        FROM transportes
        ORDER BY id_transporte ASC
        `
    );
    return result.rows;
};

// Obtener un transporte por ID
const getTransporteById = async (id_transporte) => {
    const result = await db.query(
        `
        SELECT *
        FROM transportes
        WHERE id_transporte = $1
        `,
        [id_transporte]
    );
    return result.rows[0];
};

// Crear transporte (incluye 'inocuidad' INT NOT NULL)
const createTransporte = async ({
    razon_social,
    nombre_operador,
    celular,
    placas_tracto,
    placas_caja,
    no_economico_caja,
    inocuidad
}) => {
    const result = await db.query(
        `
        INSERT INTO transportes (
            razon_social,
            nombre_operador,
            celular,
            placas_tracto,
            placas_caja,
            no_economico_caja,
            inocuidad
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            razon_social,
            nombre_operador,
            celular,
            placas_tracto,
            placas_caja,
            no_economico_caja,
            inocuidad
        ]
    );
    return result.rows[0];
};

// Actualizar transporte
const updateTransporte = async (
    id_transporte,
    {
        razon_social,
        nombre_operador,
        celular,
        placas_tracto,
        placas_caja,
        no_economico_caja,
        inocuidad
    }
) => {
    const result = await db.query(
        `
        UPDATE transportes
        SET
            razon_social = $1,
            nombre_operador = $2,
            celular = $3,
            placas_tracto = $4,
            placas_caja = $5,
            no_economico_caja = $6,
            inocuidad = $7
        WHERE id_transporte = $8
        RETURNING *
        `,
        [
            razon_social,
            nombre_operador,
            celular,
            placas_tracto,
            placas_caja,
            no_economico_caja,
            inocuidad,
            id_transporte
        ]
    );
    return result.rows[0];
};

// Eliminar transporte
const deleteTransporte = async (id_transporte) => {
    const result = await db.query(
        `
        DELETE FROM transportes
        WHERE id_transporte = $1
        RETURNING *
        `,
        [id_transporte]
    );
    return result.rows[0];
};

const transportesModel = {
    getTransportes,
    getTransporteById,
    createTransporte,
    updateTransporte,
    deleteTransporte
};

export default transportesModel;
