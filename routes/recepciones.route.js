import { Router } from "express";
import { recepcionesController } from "../controllers/recepciones.controller.js";
import { validarRecepcion, validarIdRecepcion } from "../middlewares/recepciones.middleware.js";
import { cargarAlcance, validarCamaraEnAlcance } from "../middlewares/alcance.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin
//
// ALCANCE POR CÁMARA
//   cargarAlcance va SIEMPRE después de verifyToken y antes del controller.
//   Deja en req.camaras las cámaras visibles del usuario:
//     null  -> Admin / Coordinador (sin restricción)
//     [...] -> Supervisor / Operativo (solo las suyas)
//
//   validarCamaraEnAlcance protege las ESCRITURAS: impide operar sobre una
//   cámara ajena mandando el id a mano. Leer filtrado no basta.

// ----- Vista: lo que el preenfrío espera recibir -----
router.get("/esperadas", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getRecepcionesEsperadas);
router.get("/esperadas/semana/:semana", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getRecepcionesEsperadasBySemana);
router.get("/pendientes", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getPendientes);

// ----- Disponibilidad (para sugerir la división al recepcionar) -----
router.get("/disponibilidad", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getDisponibilidadCamaras);
router.get(
    "/disponibilidad/:id_camara",
    verifyToken,
    verifySupervisor,
    cargarAlcance,
    validarCamaraEnAlcance("params", "id_camara"),
    recepcionesController.getTarimasDisponibles
);

// ----- Cola de espera -----
// Ordenada por: prioridad DESC -> fecha_empaque ASC -> llegada ASC
router.get("/cola", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getColaEspera);
router.get(
    "/cola/:id_camara",
    verifyToken,
    verifySupervisor,
    cargarAlcance,
    validarCamaraEnAlcance("params", "id_camara"),
    recepcionesController.getColaEsperaByCamara
);

// Ingresar producto de la cola a la cámara (el operador elige cuál y cuánto).
// El alcance se valida dentro del controller: el body trae id_ocupacion_espera,
// así que primero hay que resolver a qué cámara pertenece esa fila.
router.post("/promovercola", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.promoverDeCola);

// Marcar / quitar prioridad de un proceso en la cola (coordinador+)
router.patch("/prioridadcola/:id_ocupacion", verifyToken, verifyCoordinador, cargarAlcance, recepcionesController.setPrioridadCola);

// ----- Recepciones (registros reales) -----
router.get("/recepciones", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getRecepciones);
router.get("/recepcion/:id", verifyToken, verifySupervisor, cargarAlcance, validarIdRecepcion, recepcionesController.getRecepcionById);
router.get("/produccion/:id_produccion", verifyToken, verifySupervisor, cargarAlcance, recepcionesController.getRecepcionesByProduccion);

// Registrar recepción (crear) -> ocupa lo que cabe y manda el resto a la cola
router.post(
    "/registrarrecepcion",
    verifyToken,
    verifySupervisor,
    cargarAlcance,
    validarCamaraEnAlcance("body", "id_camara"),
    validarRecepcion,
    recepcionesController.createRecepcion
);

// Actualizar recepción (editar)
router.put(
    "/actualizarrecepcion/:id",
    verifyToken,
    verifyCoordinador,
    cargarAlcance,
    validarCamaraEnAlcance("body", "id_camara"),
    validarIdRecepcion,
    validarRecepcion,
    recepcionesController.updateRecepcion
);

// Cancelar recepción (editar) -> estado = 0
router.patch("/cancelarrecepcion/:id", verifyToken, verifyCoordinador, validarIdRecepcion, recepcionesController.cancelarRecepcion);

// Eliminar recepción (eliminar)
router.delete("/eliminarrecepcion/:id", verifyToken, verifyAdmin, validarIdRecepcion, recepcionesController.deleteRecepcion);

export default router;
