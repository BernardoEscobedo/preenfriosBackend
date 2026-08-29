import { Router } from "express";
import { recepcionesController } from "../controllers/recepciones.controller.js";
import { validarRecepcion, validarIdRecepcion } from "../middlewares/recepciones.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// ----- Vista: lo que el preenfrío espera recibir -----
router.get("/esperadas", verifyToken, verifySupervisor, recepcionesController.getRecepcionesEsperadas);
router.get("/esperadas/semana/:semana", verifyToken, verifySupervisor, recepcionesController.getRecepcionesEsperadasBySemana);
router.get("/pendientes", verifyToken, verifySupervisor, recepcionesController.getPendientes);

// ----- Disponibilidad (para sugerir la división al recepcionar) -----
router.get("/disponibilidad", verifyToken, verifySupervisor, recepcionesController.getDisponibilidadCamaras);
router.get("/disponibilidad/:id_camara", verifyToken, verifySupervisor, recepcionesController.getTarimasDisponibles);

// ----- Cola de espera -----
// Ordenada por: prioridad DESC -> fecha_empaque ASC -> llegada ASC
router.get("/cola", verifyToken, verifySupervisor, recepcionesController.getColaEspera);
router.get("/cola/:id_camara", verifyToken, verifySupervisor, recepcionesController.getColaEsperaByCamara);
// Ingresar producto de la cola a la cámara (el operador elige cuál y cuánto)
router.post("/promovercola", verifyToken, verifySupervisor, recepcionesController.promoverDeCola);
// Marcar / quitar prioridad de un proceso en la cola (coordinador+)
router.patch("/prioridadcola/:id_ocupacion", verifyToken, verifyCoordinador, recepcionesController.setPrioridadCola);

// ----- Recepciones (registros reales) -----
router.get("/recepciones", verifyToken, verifySupervisor, recepcionesController.getRecepciones);
router.get("/recepcion/:id", verifyToken, verifySupervisor, validarIdRecepcion, recepcionesController.getRecepcionById);
router.get("/produccion/:id_produccion", verifyToken, verifySupervisor, recepcionesController.getRecepcionesByProduccion);

// Registrar recepción (crear) -> ocupa lo que cabe y manda el resto a la cola
router.post("/registrarrecepcion", verifyToken, verifySupervisor, validarRecepcion, recepcionesController.createRecepcion);

// Actualizar recepción (editar)
router.put("/actualizarrecepcion/:id", verifyToken, verifyCoordinador, validarIdRecepcion, validarRecepcion, recepcionesController.updateRecepcion);

// Cancelar recepción (editar) -> estado = 0
router.patch("/cancelarrecepcion/:id", verifyToken, verifyCoordinador, validarIdRecepcion, recepcionesController.cancelarRecepcion);

// Eliminar recepción (eliminar)
router.delete("/eliminarrecepcion/:id", verifyToken, verifyAdmin, validarIdRecepcion, recepcionesController.deleteRecepcion);

export default router;
