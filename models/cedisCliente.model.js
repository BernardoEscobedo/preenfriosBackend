import { db } from "../database/connection.database.js";

// Obtener todos los cedis-cliente
const getCedisClientes = async () => {
    const result = await db.query(
        `
        SELECT *
        FROM cedis_cliente
        ORDER BY id_cc ASC
        `
    );
    return result.rows;
};

// Obtener un cedis-cliente por ID
const getCedisClienteById = async (id_cc) => {
    const result = await db.query(
        `
        SELECT *
        FROM cedis_cliente
        WHERE id_cc = $1
        `,
        [id_cc]
    );
    return result.rows[0];
};

// Crear cedis-cliente
const createCedisCliente = async ({ cliente, cedis, acronimo }) => {
    const result = await db.query(
        `
        INSERT INTO cedis_cliente (cliente, cedis, acronimo)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [cliente, cedis, acronimo]
    );
    return result.rows[0];
};

// Actualizar cedis-cliente
const updateCedisCliente = async (id_cc, { cliente, cedis, acronimo }) => {
    const result = await db.query(
        `
        UPDATE cedis_cliente
        SET
            cliente = $1,
            cedis = $2,
            acronimo = $3
        WHERE id_cc = $4
        RETURNING *
        `,
        [cliente, cedis, acronimo, id_cc]
    );
    return result.rows[0];
};

// Eliminar cedis-cliente
const deleteCedisCliente = async (id_cc) => {
    const result = await db.query(
        `
        DELETE FROM cedis_cliente
        WHERE id_cc = $1
        RETURNING *
        `,
        [id_cc]
    );
    return result.rows[0];
};

const cedisClienteModel = {
    getCedisClientes,
    getCedisClienteById,
    createCedisCliente,
    updateCedisCliente,
    deleteCedisCliente
};

export default cedisClienteModel;
