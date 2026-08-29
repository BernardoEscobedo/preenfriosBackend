import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import { usuariosModel } from '../models/usuarios.model.js'

const createUsuario = async (req,res) =>{
    try {
        const {usuario,password_hash, id_empleado, id_role} = req.body
        const missingFields=[]
        if(!usuario) missingFields.push('usuario')
        if(!password_hash) missingFields.push('password_hash')
        if(!id_empleado) missingFields.push('id_empleado')
        if(!id_role) missingFields.push('id_role')
        if(missingFields.length > 0){
            return res.status(400).json({
                ok:false,
                msg:`Faltan los siguientes campos: ${missingFields.join(', ')}`
            })
        }
            const user = await usuariosModel.getUsuarioByUser(usuario)
            if(user){
                return res.status(409).json({ok: false, msg: "El usuario ya existe"})
            }
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password_hash, salt)
            const usuarioNuevo = await usuariosModel.createUsuario({usuario, password_hash:hashedPassword, id_empleado, id_role})
            const token = jwt.sign({id_usuario: usuarioNuevo.id_usuario, usuario: usuarioNuevo.usuario, id_role: usuarioNuevo.id_role},
            process.env.JWT_SECRET,
            {
                expiresIn:"1h"
            }
        )
        return res.status(201).json({
            ok:true,
            msg:{
                token, role_id: usuarioNuevo.id_role
            }
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            ok:false,
            msg: 'Error en el servidor'
        })
    }
}

// /api/preenfrio/login
const loginUsuario = async(req,res)=>{
    try{
        const {usuario, password_hash} = req.body
        const missingFields = []
        if(!usuario) missingFields.push('usuario')
        if(!password_hash) missingFields.push('password_hash')        
        if(missingFields.length>0){
            return res.status(400).json({
                ok:false,
                msg: `Faltan los siguientes campos: ${missingFields.join(', ')}`
            });
        }
        const usuario_ = await usuariosModel.getUsuarioByUser(usuario)
        if(!usuario_){
            return res.status(404).json({ok:false, msg:"Usuario no encontrado"})
        }
        const isMatch=await bcrypt.compare(password_hash, usuario_.password_hash)
        if(!isMatch){
            return res.status(401).json({ok: false, msg:"Contraseña incorrecta"})
        }
        const token = jwt.sign({id_usuario: usuario_.id_usuario, usuario: usuario_.usuario, id_role: usuario_.id_role},
            process.env.JWT_SECRET,
            {
                expiresIn:"2h"
            }
        )

        // Armamos el nombre completo del empleado a partir de las columnas
        // del JOIN (nombre + apellidos). filter(Boolean) evita espacios
        // sobrantes si algún campo viniera null.
        const nombreEmpleado = [
            usuario_.emp_nombre,
            usuario_.emp_apellidos
        ].filter(Boolean).join(" ").trim();

        return res.json({
            ok:true,
            token,
            usuario:{
                id_usuario: usuario_.id_usuario,
                correo: usuario_.usuario,
                usuario: usuario_.usuario,
                role: usuario_.id_role,
                // Nombre del empleado para el saludo del dashboard.
                // Si el usuario no tiene empleado ligado, cae al usuario.
                nombre_empleado: nombreEmpleado || usuario_.usuario
            }
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            ok:false,
            msg: 'Error en el servidor'
        })
    }
}

const profileUsuario = async(req,res)=>{
    try {
        const usuario_ = await usuariosModel.getUsuarioByUser(req.usuario)
        return res.json({
            ok:true,
            usuario_:{
                id_usuario: usuario_.id_usuario,
                usuario: usuario_.usuario,
                id_empleado: usuario_.id_empleado,
                id_role: usuario_.id_role
            }
        })
    } catch (error) {
        return res.status(500).json({
            ok:false,
            msg:'Error en el servidor'
        })
    }
}

const getUsuarios = async(req,res)=>{
    try {
        const usuarios = await usuariosModel.getUsuarios()
        return res.json({ok:true, msg: usuarios})
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            ok:false,
            msg:'Error en el servidor'
        })
    }
}

const getUsuarioById = async(req,res) => {
    try {
        const {id_usuario} = req.params
        const usuario_ = await usuariosModel.getUsuarioById(id_usuario)
        return res.json({ok:true, msg: usuario_})
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            ok:false,
            msg:'Error en el servidor'
        })
    }
}

const updateUsuario = async(req,res) => {
    try {
        const {id_usuario} = req.params
        const datoActualizado = req.body
        if(!datoActualizado || Object.keys(datoActualizado).length === 0){
            return res.status(400).json({
                ok:false,
                msg:'No se proporcionaron datos para actualizar'
            })
        }
        const usuario_ = await usuariosModel.getUsuarioById(id_usuario)
        if(!usuario_){
            return res.status(404).json({
                ok:false,
                msg:'Usuario no encontrado'
            })
        }
        if(datoActualizado.usuario && datoActualizado.usuario !== usuario_.usuario){
            const usuarioExistente = await usuariosModel.getUsuarioByUser(datoActualizado.usuario)
            if(usuarioExistente){
                return res.status(409).json({
                    ok: false,
                    msg: 'El usuario ya esta en uso por otro colaborador'
                })
            }
        }
        if(datoActualizado.password_hash){
            const salt = await bcrypt.genSalt(10)
            datoActualizado.password_hash = await bcrypt.hash(datoActualizado.password_hash, salt)
        }
        const actualizarDato = await usuariosModel.updateUsuario(id_usuario, datoActualizado)
        return res.json({
            ok: true,
            msg: 'Usuario actualizado correctamente',
            usuario: actualizarDato
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            ok:false,
            msg:'Error en el servidor'
        })
    }
}

export const usuariosController = {
    createUsuario,
    loginUsuario,
    profileUsuario,
    getUsuarios,
    getUsuarioById,
    updateUsuario
}
