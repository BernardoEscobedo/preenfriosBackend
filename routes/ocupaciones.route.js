import { Router } from "express";
import { ocupacionesController } from "../controllers/ocupaciones.controller.js";
import { validarOcupacion, validarCierreOcupacion, validarIdOcupacion, validarIdCamaraParam } from "../middlewares/ocupaciones.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor, verifyOperativo } from "../middlewares/jwt.middlewares.js";
import { cargarAlcance, validarCamaraEnAlcance } from "../middlewares/alcance.middleware.js";

const router = Router();

// MÓDULO OPERATIVO: ver/crear/editar = operativo+, eliminar = admin
//
// CAMBIO DE PERMISOS
//   Antes era supervisor+. Se bajó a verifyOperativo porque el tablero de
//   ocupación y las transferencias entre cámaras son tarea de piso: el
//   operativo necesita ver su cámara y mover producto a conserva.
//   El alcance por cámara garantiza que solo toque lo suyo.
//
// ALCANCE POR CÁMARA
//   cargarAlcance deja en req.camaras las cámaras del usuario.
//   validarCamaraEnAlcance protege las escrituras: sin él, alguien podría
//   crear una ocupación en una cámara ajena mandando el id a mano.

// Obtener ocupaciones (ver)
router.get("/ocupaciones", verifyToken, verifyOperativo, cargarAlcance, ocupacionesController.getOcupaciones);

// Obtener ocupaciones activas (ver)
router.get("/activas", verifyToken, verifyOperativo, cargarAlcance, ocupacionesController.getOcupacionesActivas);

// Obtener ocupación por ID (ver) — el controller valida el alcance
router.get("/ocupacion/:id_ocupacion", verifyToken, verifyOperativo, cargarAlcance, validarIdOcupacion, ocupacionesController.getOcupacionById);

// Obtener ocupaciones por cámara (ver)
router.get(
    "/camara/:id_camara",
    verifyToken,
    verifyOperativo,
    cargarAlcance,
    validarIdCamaraParam,
    validarCamaraEnAlcance("params", "id_camara"),
    ocupacionesController.getOcupacionesByCamara
);

// Registrar ocupación (crear)
router.post(
    "/registrarocupacion",
    verifyToken,
    verifyOperativo,
    cargarAlcance,
    validarCamaraEnAlcance("body", "id_camara"),
    validarOcupacion,
    ocupacionesController.createOcupacion
);

// Actualizar ocupación (editar)
// Se valida la cámara del BODY y, dentro del controller, la de la
// ocupación original: mover una ocupación ajena hacia una cámara propia
// también sería una fuga.
router.put(
    "/actualizarocupacion/:id_ocupacion",
    verifyToken,
    verifyOperativo,
    cargarAlcance,
    validarIdOcupacion,
    validarCamaraEnAlcance("body", "id_camara"),
    validarOcupacion,
    ocupacionesController.updateOcupacion
);

// Cerrar ocupación (editar)
router.patch(
    "/cerrarocupacion/:id_ocupacion",
    verifyToken,
    verifyOperativo,
    cargarAlcance,
    validarIdOcupacion,
    validarCierreOcupacion,
    ocupacionesController.cerrarOcupacion
);

// Eliminar ocupación (eliminar) — solo admin, alcance total
router.delete("/eliminarocupacion/:id_ocupacion", verifyToken, verifyAdmin, validarIdOcupacion, ocupacionesController.deleteOcupacion);

export default router;
