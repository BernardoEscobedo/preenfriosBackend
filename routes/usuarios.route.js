import { Router } from "express";
import { usuariosController } from "../controllers/usuarios.controller.js";
import { verifyAdmin, verifyCoordinador, verifyToken } from "../middlewares/jwt.middlewares.js";

const router = Router();
// Login (público)
router.post("/login", usuariosController.loginUsuario);

// Perfil del usuario autenticado (cualquier rol con sesión)
router.get("/profile", verifyToken, usuariosController.profileUsuario);

// Listar usuarios (ver) -> coordinador+ (antes solo admin)
router.get("/usuarios", verifyToken, verifyCoordinador, usuariosController.getUsuarios);
// Usuario por ID (ver) -> coordinador+
router.get("/usuario/:id_usuario", verifyToken, verifyCoordinador, usuariosController.getUsuarioById);
// Registrar usuario (crear) -> coordinador+
router.post("/registrarusuario", verifyToken, verifyCoordinador, usuariosController.createUsuario);
// Actualizar usuario (editar) -> coordinador+
router.put("/actualizarusuario/:id_usuario", verifyToken, verifyCoordinador, usuariosController.updateUsuario);

export default router;
