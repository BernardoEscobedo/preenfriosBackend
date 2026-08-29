import { db } from "../database/connection.database.js";


// Obtener todos los mantenimientos
const getMantenimientos = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM mantenimientos
        ORDER BY id_mantenimiento ASC
        `
    );

    return result.rows;
};


// Obtener un mantenimiento por ID
const getMantenimientoById = async (id_mantenimiento) => {

    const result = await db.query(
        `
        SELECT *
        FROM mantenimientos
        WHERE id_mantenimiento = $1
        `,
        [id_mantenimiento]
    );

    return result.rows[0];
};


// Obtener mantenimientos por cámara
const getMantenimientosByCamara = async (id_camara) => {

    const result = await db.query(
        `
        SELECT *
        FROM mantenimientos
        WHERE id_camara = $1
        ORDER BY fecha_inicio DESC, hora_inicio DESC
        `,
        [id_camara]
    );

    return result.rows;
};


// Crear mantenimiento
const createMantenimiento = async ({
    id_camara,
    fecha_inicio,
    hora_inicio,
    fecha_fin,
    hora_fin,
    tipo,
    motivo,
    prioridad,
    estado
}) => {

    const result = await db.query(
        `
        INSERT INTO mantenimientos (
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            tipo,
            motivo,
            prioridad,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            tipo,
            motivo,
            prioridad,
            estado
        ]
    );

    return result.rows[0];
};


// Actualizar mantenimiento
const updateMantenimiento = async (
    id_mantenimiento,
    {
        id_camara,
        fecha_inicio,
        hora_inicio,
        fecha_fin,
        hora_fin,
        tipo,
        motivo,
        prioridad,
        estado
    }
) => {

    const result = await db.query(
        `
        UPDATE mantenimientos
        SET
            id_camara = $1,
            fecha_inicio = $2,
            hora_inicio = $3,
            fecha_fin = $4,
            hora_fin = $5,
            tipo = $6,
            motivo = $7,
            prioridad = $8,
            estado = $9
        WHERE id_mantenimiento = $10
        RETURNING *
        `,
        [
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            tipo,
            motivo,
            prioridad,
            estado,
            id_mantenimiento
        ]
    );

    return result.rows[0];
};


// Eliminar mantenimiento
const deleteMantenimiento = async (id_mantenimiento) => {

    const result = await db.query(
        `
        DELETE FROM mantenimientos
        WHERE id_mantenimiento = $1
        RETURNING *
        `,
        [id_mantenimiento]
    );

    return result.rows[0];
};


const mantenimientosModel = {
    getMantenimientos,
    getMantenimientoById,
    getMantenimientosByCamara,
    createMantenimiento,
    updateMantenimiento,
    deleteMantenimiento
};
export default mantenimientosModel;
