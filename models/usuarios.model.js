import {db} from '../database/connection.database.js'

const createUsuario = async ({usuario, password_hash, id_empleado, id_role}) => {
    const query={
        text:`
            INSERT INTO usuarios (usuario, password_hash, id_empleado, id_role)
            VALUES ($1,$2,$3,$4)
            RETURNING usuario, password_hash, id_empleado, id_role
        `,
        values: [usuario, password_hash, id_empleado, id_role]
    }
    const {rows} = await db.query(query)
    return rows[0]
}

const getUsuarios = async () => {
    const query = {
        text:`
        SELECT 
        u.id_usuario,
        u.usuario,
        u.password_hash,
        u.id_empleado,
        u.id_role
        FROM usuarios u
        ORDER BY (u.id_usuario)
        `
    }
    const {rows} = await db.query(query)
    return rows
}

const getUsuarioByUser = async(usuario)=>{
    const query ={
        text: `
        SELECT 
        u.id_usuario,
        u.usuario,
        u.password_hash,
        u.id_empleado,
        u.id_role,
        e.nombre AS emp_nombre,
        e.apellidos AS emp_apellidos
        FROM usuarios u
        JOIN roles r ON u.id_role = r.id_role
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
        WHERE u.usuario = $1
        `,
        values: [usuario]
    }
    const {rows} = await db.query(query);
    return rows[0]
}

const getUsuarioById = async (id_usuario) => {
    const query = {
        text: `
        SELECT 
        u.id_usuario,
        u.usuario,
        u.password_hash,
        u.id_empleado,
        u.id_role
        FROM usuarios u
        JOIN roles r ON u.id_role = r.id_role
        WHERE u.id_usuario = $1
        `,
        values: [id_usuario]
    }
    const {rows} = await db.query(query)
    return rows[0]
}

const updateUsuario = async(id_usuario, updateData)=>{
    const validFields = ['usuario', 'password_hash', 'id_empleado', 'id_role'] // campos actualizables
    const fieldsToUpdate ={}
    Object.keys(updateData).forEach(key=>{
        if(validFields.includes(key) && updateData[key] !== undefined){
            fieldsToUpdate[key] = updateData[key]
        }
    });
    if(Object.keys(fieldsToUpdate).length === 0){
        throw new Error('No se proporcionaron campos para actualizar');
    }
     const setClause = Object.keys(fieldsToUpdate)
     .map((key,index) => `${key} = $${index +1}`)
     .join(', ');
     const values = Object.values(fieldsToUpdate)
     values.push(id_usuario)
     const query ={
        text:`
        UPDATE usuarios
        SET ${setClause}
        WHERE id_usuario = $${values.length}
        RETURNING *
        `,
        values: values
     }
     const {rows} = await db.query(query)
     return rows[0]
}

export const usuariosModel = {
    createUsuario,
    getUsuarios,
    getUsuarioByUser,
    getUsuarioById,
    updateUsuario
}
