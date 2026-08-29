import { db } from "../database/connection.database.js";


// Obtener todos los empleados
const getEmpleados = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM empleados
        ORDER BY id_empleado ASC
        `
    );

    return result.rows;
};


// Obtener un empleado por ID
const getEmpleadoById = async (id_empleado) => {

    const result = await db.query(
        `
        SELECT *
        FROM empleados
        WHERE id_empleado = $1
        `,
        [id_empleado]
    );

    return result.rows[0];
};


// Crear empleado
const createEmpleado = async ({
    nombre,
    apellidos,
    turno,
    zona
}) => {

    const result = await db.query(
        `
        INSERT INTO empleados (
            nombre,
            apellidos,
            turno,
            zona
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
            nombre,
            apellidos,
            turno,
            zona
        ]
    );

    return result.rows[0];
};


// Actualizar empleado
const updateEmpleado = async (
    id_empleado,
    {
        nombre,
        apellidos,
        turno,
        zona
    }
) => {

    const result = await db.query(
        `
        UPDATE empleados
        SET
            nombre = $1,
            apellidos = $2,
            turno = $3,
            zona = $4
        WHERE id_empleado = $5
        RETURNING *
        `,
        [
            nombre,
            apellidos,
            turno,
            zona,
            id_empleado
        ]
    );

    return result.rows[0];
};


// Eliminar empleado
const deleteEmpleado = async (id_empleado) => {

    const result = await db.query(
        `
        DELETE FROM empleados
        WHERE id_empleado = $1
        RETURNING *
        `,
        [id_empleado]
    );

    return result.rows[0];
};


const empleadosModel = {

    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado

};


export default empleadosModel;