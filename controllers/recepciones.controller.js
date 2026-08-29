import recepcionesModel from "../models/recepciones.model.js";

// =========================================================
// RECEPCIONES ESPERADAS (vista)
// =========================================================
const getRecepcionesEsperadas = async (req, res) => {
    try {
        const data = await recepcionesModel.getRecepcionesEsperadas();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener recepciones esperadas:", error);
        res.status(500).json({ error: "Error al obtener las recepciones esperadas" });
    }
};

const getRecepcionesEsperadasBySemana = async (req, res) => {
    try {
        const { semana } = req.params;
        if (!semana || isNaN(Number(semana))) {
            return res.status(400).json({ error: "La semana debe ser un número válido" });
        }
        const data = await recepcionesModel.getRecepcionesEsperadasBySemana(semana);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener recepciones esperadas por semana:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones esperadas de la semana"
        });
    }
};

const getPendientes = async (req, res) => {
    try {
        const data = await recepcionesModel.getPendientes();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener pendientes:", error);
        res.status(500).json({ error: "Error al obtener las recepciones pendientes" });
    }
};

// =========================================================
// DISPONIBILIDAD
// =========================================================
const getDisponibilidadCamaras = async (req, res) => {
    try {
        const data = await recepcionesModel.getDisponibilidadCamaras();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener disponibilidad:", error);
        res.status(500).json({ error: "Error al obtener la disponibilidad de cámaras" });
    }
};

const getTarimasDisponibles = async (req, res) => {
    try {
        const { id_camara } = req.params;
        if (!id_camara || isNaN(Number(id_camara))) {
            return res.status(400).json({ error: "El id de cámara debe ser un número válido" });
        }
        const disponibles = await recepcionesModel.getTarimasDisponibles(id_camara);
        res.status(200).json({ id_camara: Number(id_camara), disponibles });
    } catch (error) {
        console.error("Error al obtener tarimas disponibles:", error);
        res.status(500).json({ error: "Error al obtener las tarimas disponibles" });
    }
};

// =========================================================
// COLA DE ESPERA
// =========================================================
const getColaEspera = async (req, res) => {
    try {
        const data = await recepcionesModel.getColaEspera();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener la cola de espera:", error);
        res.status(500).json({ error: "Error al obtener la cola de espera" });
    }
};

const getColaEsperaByCamara = async (req, res) => {
    try {
        const { id_camara } = req.params;
        if (!id_camara || isNaN(Number(id_camara))) {
            return res.status(400).json({ error: "El id de cámara debe ser un número válido" });
        }
        const data = await recepcionesModel.getColaEsperaByCamara(id_camara);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener la cola de la cámara:", error);
        res.status(500).json({ error: "Error al obtener la cola de la cámara" });
    }
};

// POST /api/preenfrio/recepciones/promovercola
const promoverDeCola = async (req, res) => {
    try {
        const { id_ocupacion_espera, tarimas, fecha, hora } = req.body;
        if (!id_ocupacion_espera || isNaN(Number(id_ocupacion_espera))) {
            return res.status(400).json({
                error: 'El campo "id_ocupacion_espera" es obligatorio y numérico'
            });
        }
        if (!tarimas || isNaN(Number(tarimas)) || Number(tarimas) <= 0) {
            return res.status(400).json({
                error: 'El campo "tarimas" debe ser un número mayor a 0'
            });
        }
        const resultado = await recepcionesModel.promoverDeCola(
            Number(id_ocupacion_espera),
            Number(tarimas),
            fecha,
            hora
        );
        if (resultado && String(resultado).startsWith("OK")) {
            return res.status(200).json({ mensaje: resultado });
        }
        return res.status(409).json({ error: resultado || "No se pudo ingresar de la cola" });
    } catch (error) {
        console.error("Error al promover de la cola:", error);
        res.status(500).json({ error: "Error al ingresar el producto de la cola" });
    }
};

// PATCH /api/preenfrio/recepciones/prioridadcola/:id_ocupacion
// body: { prioridad, motivo }
//   prioridad = 0 -> orden normal (por fecha de empaque)
//   prioridad > 0 -> se adelanta en la fila de su cámara
const setPrioridadCola = async (req, res) => {
    try {
        const { id_ocupacion } = req.params;
        const { prioridad, motivo } = req.body;

        if (!id_ocupacion || isNaN(Number(id_ocupacion))) {
            return res.status(400).json({
                error: "El id de ocupación debe ser un número válido"
            });
        }
        if (
            prioridad === undefined ||
            prioridad === null ||
            isNaN(Number(prioridad)) ||
            Number(prioridad) < 0
        ) {
            return res.status(400).json({
                error: 'El campo "prioridad" debe ser numérico (0 = normal, 1+ = urgente)'
            });
        }

        const resultado = await recepcionesModel.setPrioridadCola(
            Number(id_ocupacion),
            Number(prioridad),
            motivo
        );
        if (resultado && String(resultado).startsWith("OK")) {
            return res.status(200).json({ mensaje: resultado });
        }
        return res.status(409).json({ error: resultado || "No se pudo cambiar la prioridad" });
    } catch (error) {
        console.error("Error al cambiar prioridad:", error);
        res.status(500).json({ error: "Error al cambiar la prioridad" });
    }
};

// =========================================================
// RECEPCIONES (registros reales)
// =========================================================
const getRecepciones = async (req, res) => {
    try {
        const recepciones = await recepcionesModel.getRecepciones();
        res.status(200).json(recepciones);
    } catch (error) {
        console.error("Error al obtener recepciones:", error);
        res.status(500).json({ error: "Error al obtener las recepciones" });
    }
};

const getRecepcionById = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcion = await recepcionesModel.getRecepcionById(id);
        if (!recepcion) {
            return res.status(404).json({ error: "Recepción no encontrada" });
        }
        res.status(200).json(recepcion);
    } catch (error) {
        console.error("Error al obtener recepcion:", error);
        res.status(500).json({ error: "Error al obtener la recepcion" });
    }
};

const getRecepcionesByProduccion = async (req, res) => {
    try {
        const { id_produccion } = req.params;
        if (!id_produccion || isNaN(Number(id_produccion))) {
            return res.status(400).json({
                error: "El id de producción debe ser un número válido"
            });
        }
        const data = await recepcionesModel.getRecepcionesByProduccion(id_produccion);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener recepciones de la produccion:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones de la produccion"
        });
    }
};

const createRecepcion = async (req, res) => {
    try {
        const id_usuario =
            req.id_usuario ?? req.usuario?.id_usuario ?? req.body.id_usuario ?? null;

        const nuevaRecepcion = await recepcionesModel.createRecepcion({
            ...req.body,
            id_usuario
        });
        res.status(201).json(nuevaRecepcion);
    } catch (error) {
        console.error("Error al crear recepcion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La producción, cámara o usuario indicados no existen"
            });
        }
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Conflicto de ocupación activa en la cámara"
            });
        }
        res.status(500).json({ error: "Error al crear la recepcion" });
    }
};

const updateRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcionActualizada = await recepcionesModel.updateRecepcion(id, req.body);
        if (!recepcionActualizada) {
            return res.status(404).json({ error: "Recepción no encontrada" });
        }
        res.status(200).json(recepcionActualizada);
    } catch (error) {
        console.error("Error al actualizar recepcion:", error);
        if (error.code === "23503") {
            return res.status(409).json({ error: "La cámara indicada no existe" });
        }
        res.status(500).json({ error: "Error al actualizar la recepcion" });
    }
};

const cancelarRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcionCancelada = await recepcionesModel.cancelarRecepcion(id);
        if (!recepcionCancelada) {
            return res.status(404).json({ error: "Recepción no encontrada" });
        }
        res.status(200).json({
            mensaje: "Recepción cancelada correctamente",
            recepcion: recepcionCancelada
        });
    } catch (error) {
        console.error("Error al cancelar recepcion:", error);
        res.status(500).json({ error: "Error al cancelar la recepcion" });
    }
};

const deleteRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcionEliminada = await recepcionesModel.deleteRecepcion(id);
        if (!recepcionEliminada) {
            return res.status(404).json({ error: "Recepción no encontrada" });
        }
        res.status(200).json({
            mensaje: "Recepción eliminada correctamente",
            recepcion: recepcionEliminada
        });
    } catch (error) {
        console.error("Error al eliminar recepcion:", error);
        res.status(500).json({ error: "Error al eliminar la recepcion" });
    }
};

export const recepcionesController = {
    getRecepcionesEsperadas,
    getRecepcionesEsperadasBySemana,
    getPendientes,
    getDisponibilidadCamaras,
    getTarimasDisponibles,
    getColaEspera,
    getColaEsperaByCamara,
    promoverDeCola,
    setPrioridadCola,
    getRecepciones,
    getRecepcionById,
    getRecepcionesByProduccion,
    createRecepcion,
    updateRecepcion,
    cancelarRecepcion,
    deleteRecepcion
};
