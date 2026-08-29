import empleadosModel from "../models/empleados.model.js";

// GET /api/empleados
const getEmpleados = async (req, res) => {
    try {
        const empleados = await empleadosModel.getEmpleados();

        res.status(200).json(empleados);

    } catch (error) {

        console.error("Error al obtener empleados:", error);

        res.status(500).json({
            error: "Error al obtener los empleados"
        });
    }
};


// GET /api/empleados/:id
const getEmpleadoById = async (req, res) => {

    try {

        const { id } = req.params;

        const empleado =
            await empleadosModel.getEmpleadoById(id);

        if (!empleado) {

            return res.status(404).json({
                error: "Empleado no encontrado"
            });
        }

        res.status(200).json(empleado);

    } catch (error) {

        console.error("Error al obtener empleado:", error);

        res.status(500).json({
            error: "Error al obtener el empleado"
        });
    }
};


// POST /api/empleados
const createEmpleado = async (req, res) => {

    try {

        const nuevoEmpleado =
            await empleadosModel.createEmpleado(req.body);

        res.status(201).json(nuevoEmpleado);

    } catch (error) {

        console.error("Error al crear empleado:", error);

        res.status(500).json({
            error: "Error al crear el empleado"
        });
    }
};


// PUT /api/empleados/:id
const updateEmpleado = async (req, res) => {

    try {

        const { id } = req.params;

        const empleadoActualizado =
            await empleadosModel.updateEmpleado(
                id,
                req.body
            );

        if (!empleadoActualizado) {

            return res.status(404).json({
                error: "Empleado no encontrado"
            });
        }

        res.status(200).json(empleadoActualizado);

    } catch (error) {

        console.error("Error al actualizar empleado:", error);

        res.status(500).json({
            error: "Error al actualizar el empleado"
        });
    }
};


// DELETE /api/empleados/:id
const deleteEmpleado = async (req, res) => {

    try {

        const { id } = req.params;

        const empleadoEliminado =
            await empleadosModel.deleteEmpleado(id);

        if (!empleadoEliminado) {

            return res.status(404).json({
                error: "Empleado no encontrado"
            });
        }

        res.status(200).json({
            mensaje: "Empleado eliminado correctamente",
            empleado: empleadoEliminado
        });

    } catch (error) {

        console.error("Error al eliminar empleado:", error);

        res.status(500).json({
            error: "Error al eliminar el empleado"
        });
    }
};


export const empleadosController = {

    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado

};