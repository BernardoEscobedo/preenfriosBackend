import cedisClienteModel from "../models/cedisCliente.model.js";

// GET /api/preenfrio/cedisclientes/cedisclientes
const getCedisClientes = async (req, res) => {
    try {
        const registros = await cedisClienteModel.getCedisClientes();
        res.status(200).json(registros);
    } catch (error) {
        console.error("Error al obtener cedis-cliente:", error);
        res.status(500).json({
            error: "Error al obtener los cedis-cliente"
        });
    }
};

// GET /api/preenfrio/cedisclientes/cediscliente/:id_cc
const getCedisClienteById = async (req, res) => {
    try {
        const { id_cc } = req.params;
        const registro = await cedisClienteModel.getCedisClienteById(id_cc);
        if (!registro) {
            return res.status(404).json({
                error: "Cedis-cliente no encontrado"
            });
        }
        res.status(200).json(registro);
    } catch (error) {
        console.error("Error al obtener cedis-cliente:", error);
        res.status(500).json({
            error: "Error al obtener el cedis-cliente"
        });
    }
};

// POST /api/preenfrio/cedisclientes/registrarcediscliente
const createCedisCliente = async (req, res) => {
    try {
        const nuevo = await cedisClienteModel.createCedisCliente(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        console.error("Error al crear cedis-cliente:", error);
        res.status(500).json({
            error: "Error al crear el cedis-cliente"
        });
    }
};

// PUT /api/preenfrio/cedisclientes/actualizarcediscliente/:id_cc
const updateCedisCliente = async (req, res) => {
    try {
        const { id_cc } = req.params;
        const actualizado = await cedisClienteModel.updateCedisCliente(
            id_cc,
            req.body
        );
        if (!actualizado) {
            return res.status(404).json({
                error: "Cedis-cliente no encontrado"
            });
        }
        res.status(200).json(actualizado);
    } catch (error) {
        console.error("Error al actualizar cedis-cliente:", error);
        res.status(500).json({
            error: "Error al actualizar el cedis-cliente"
        });
    }
};

// DELETE /api/preenfrio/cedisclientes/eliminarcediscliente/:id_cc
const deleteCedisCliente = async (req, res) => {
    try {
        const { id_cc } = req.params;
        const eliminado = await cedisClienteModel.deleteCedisCliente(id_cc);
        if (!eliminado) {
            return res.status(404).json({
                error: "Cedis-cliente no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Cedis-cliente eliminado correctamente",
            cedis_cliente: eliminado
        });
    } catch (error) {
        console.error("Error al eliminar cedis-cliente:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el cedis-cliente está referenciado en despachos"
            });
        }
        res.status(500).json({
            error: "Error al eliminar el cedis-cliente"
        });
    }
};

export const cedisClienteController = {
    getCedisClientes,
    getCedisClienteById,
    createCedisCliente,
    updateCedisCliente,
    deleteCedisCliente
};
