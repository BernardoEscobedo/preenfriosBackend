import despachosModel from "../models/despachos.model.js";

// =========================================================
// INVENTARIO DISPONIBLE (para armar el picking)
// =========================================================

// GET /api/preenfrio/despachos/inventario
// Muestra TODO lo que hay en cámaras (preenfrío y conserva), FEFO.
const getInventarioDisponible = async (req, res) => {
    try {
        const data = await despachosModel.getInventarioDisponible();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener inventario disponible:", error);
        res.status(500).json({
            error: "Error al obtener el inventario disponible"
        });
    }
};

// GET /api/preenfrio/despachos/inventario/cliente/:id_cc
const getInventarioByCliente = async (req, res) => {
    try {
        const { id_cc } = req.params;
        if (!id_cc || isNaN(Number(id_cc))) {
            return res.status(400).json({
                error: "El id de cliente debe ser un número válido"
            });
        }
        const data = await despachosModel.getInventarioByCliente(id_cc);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener inventario del cliente:", error);
        res.status(500).json({
            error: "Error al obtener el inventario del cliente"
        });
    }
};

// Solo clientes con producto disponible en cámaras.
const getClientesConInventario = async (req, res) => {
    try {
        const data = await despachosModel.getClientesConInventario();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener clientes con inventario:", error);
        res.status(500).json({
            error: "Error al obtener los clientes con inventario"
        });
    }
};

// =========================================================
// CONSULTAS DE DESPACHOS
// =========================================================

// GET /api/preenfrio/despachos/despachos
const getDespachos = async (req, res) => {
    try {
        const despachos = await despachosModel.getDespachos();
        res.status(200).json(despachos);
    } catch (error) {
        console.error("Error al obtener despachos:", error);
        res.status(500).json({
            error: "Error al obtener los despachos"
        });
    }
};

// GET /api/preenfrio/despachos/despacho/:id
const getDespachoById = async (req, res) => {
    try {
        const { id } = req.params;
        const despacho = await despachosModel.getDespachoById(id);
        if (!despacho) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json(despacho);
    } catch (error) {
        console.error("Error al obtener despacho:", error);
        res.status(500).json({
            error: "Error al obtener el despacho"
        });
    }
};

// GET /api/preenfrio/despachos/despacho/:id/detalle
const getDespachoConDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const despacho = await despachosModel.getDespachoConDetalle(id);
        if (!despacho) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json(despacho);
    } catch (error) {
        console.error("Error al obtener el despacho con detalle:", error);
        res.status(500).json({
            error: "Error al obtener el despacho con su detalle"
        });
    }
};

// GET /api/preenfrio/despachos/estado/:estado
const getDespachosByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        if (estado === undefined || isNaN(Number(estado))) {
            return res.status(400).json({
                error: "El estado debe ser un número válido"
            });
        }
        const data = await despachosModel.getDespachosByEstado(estado);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener despachos por estado:", error);
        res.status(500).json({
            error: "Error al obtener los despachos"
        });
    }
};

// GET /api/preenfrio/despachos/pickinglist/:id
// Encabezado (con transporte) + líneas, listo para imprimir.
const getPickingList = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await despachosModel.getPickingList(id);
        if (!data) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener el picking list:", error);
        res.status(500).json({
            error: "Error al obtener el picking list"
        });
    }
};

// GET /api/preenfrio/despachos/siguientefolio
// OJO: consume la secuencia; llamar solo al abrir el modal de alta.
const getSiguienteFolio = async (req, res) => {
    try {
        const folio = await despachosModel.getSiguienteFolio();
        res.status(200).json({ folio });
    } catch (error) {
        console.error("Error al generar folio:", error);
        res.status(500).json({ error: "Error al generar el folio" });
    }
};


// =========================================================
// ALTAS
// =========================================================

// POST /api/preenfrio/despachos/registrardespacho
// El folio se autogenera si no se envía. El transporte es obligatorio
// (lo valida el middleware) porque el picking list lo imprime.
const createDespacho = async (req, res) => {
    try {
        const nuevoDespacho = await despachosModel.createDespacho(req.body);
        res.status(201).json(nuevoDespacho);
    } catch (error) {
        console.error("Error al crear despacho:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un despacho con ese folio"
            });
        }
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El transporte, cliente, ocupación o bloque indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al crear el despacho"
        });
    }
};

// POST /api/preenfrio/despachos/despacho/:id/detalle
// Agrega una línea al picking. El trigger genera el movimiento tipo 3
// y descuenta la cámara de origen.
const addDetalle = async (req, res) => {
    try {
        const { id } = req.params;

        // Solo se arma el picking de un despacho en borrador
        const despacho = await despachosModel.getDespachoById(id);
        if (!despacho) {
            return res.status(404).json({ error: "Despacho no encontrado" });
        }
        if (Number(despacho.estado) !== 1) {
            return res.status(409).json({
                error: "Solo se puede armar el picking de un despacho en borrador"
            });
        }

        const linea = await despachosModel.addDetalle(id, req.body);
        res.status(201).json(linea);
    } catch (error) {
        console.error("Error al agregar detalle de despacho:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El despacho, la ocupación o el bloque indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al agregar el detalle del despacho"
        });
    }
};


// =========================================================
// BAJAS Y CAMBIOS DE ESTADO
// =========================================================

// PUT /api/preenfrio/despachos/actualizardespacho/:id
const updateDespacho = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_edicion } = req.body;

        const actual = await despachosModel.getDespachoById(id);
        if (!actual) {
            return res.status(404).json({ error: "Despacho no encontrado" });
        }

        const estado = Number(actual.estado);
        const id_usuario =
            req.id_usuario ?? req.usuario?.id_usuario ?? null;

        // ---- Cancelado: no se toca ----
        if (estado === 0) {
            return res.status(409).json({
                error: "Un despacho cancelado no se puede editar"
            });
        }

        // ---- Cerrado: edición limitada + auditoría ----
        if (estado === 2) {
            if (!motivo_edicion || String(motivo_edicion).trim().length < 5) {
                return res.status(400).json({
                    error: "Para editar un despacho cerrado debes indicar el motivo (mínimo 5 caracteres)"
                });
            }
            // El cliente no se puede cambiar: alteraría a quién se despachó
            if (
                req.body.id_cc !== undefined &&
                Number(req.body.id_cc) !== Number(actual.id_cc)
            ) {
                return res.status(409).json({
                    error: "No se puede cambiar el cliente de un despacho cerrado. Si la fruta fue incorrecta, registra una devolución."
                });
            }

            const actualizado = await despachosModel.updateDespachoCerrado(id, req.body);

            await despachosModel.registrarAuditoria({
                id_despacho: Number(id),
                estado_al_editar: estado,
                motivo: String(motivo_edicion).trim(),
                cambios: construirCambios(actual, req.body),
                id_usuario
            });

            return res.status(200).json({
                mensaje: "Despacho corregido y registrado en la bitácora",
                despacho: actualizado
            });
        }

        // ---- Borrador: edición libre ----
        const actualizado = await despachosModel.updateDespacho(id, req.body);

        // Si viene motivo, igual se registra (trazabilidad opcional)
        if (motivo_edicion && String(motivo_edicion).trim() !== "") {
            await despachosModel.registrarAuditoria({
                id_despacho: Number(id),
                estado_al_editar: estado,
                motivo: String(motivo_edicion).trim(),
                cambios: construirCambios(actual, req.body),
                id_usuario
            });
        }

        res.status(200).json(actualizado);
    } catch (error) {
        console.error("Error al actualizar despacho:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El transporte o cliente indicado no existe"
            });
        }
        res.status(500).json({ error: "Error al actualizar el despacho" });
    }
};

// PATCH /api/preenfrio/despachos/cerrardespacho/:id
// Marca la salida real. Solo procede desde borrador.
const cerrarDespacho = async (req, res) => {
    try {
        const { id } = req.params;
        const cerrado = await despachosModel.cerrarDespacho(id, req.body);
        if (!cerrado) {
            return res.status(409).json({
                error: "El despacho no existe o ya no está en borrador"
            });
        }
        res.status(200).json({
            mensaje: "Despacho cerrado correctamente",
            despacho: cerrado
        });
    } catch (error) {
        console.error("Error al cerrar despacho:", error);
        res.status(500).json({ error: "Error al cerrar el despacho" });
    }
};

// PATCH /api/preenfrio/despachos/cancelardespacho/:id
const cancelarDespacho = async (req, res) => {
    try {
        const { id } = req.params;
        const cancelado = await despachosModel.cancelarDespacho(id);
        if (!cancelado) {
            return res.status(404).json({ error: "Despacho no encontrado" });
        }
        res.status(200).json({
            mensaje: "Despacho cancelado correctamente",
            aviso: "Las líneas del picking NO se revirtieron: quítalas una por una si necesitas devolver la fruta a las cámaras.",
            despacho: cancelado
        });
    } catch (error) {
        console.error("Error al cancelar despacho:", error);
        res.status(500).json({ error: "Error al cancelar el despacho" });
    }
};

// DELETE /api/preenfrio/despachos/detalle/:id_detalle
// Devuelve el producto a la cámara y borra el movimiento asociado.
const deleteDetalle = async (req, res) => {
    try {
        const { id_detalle } = req.params;
        const resultado = await despachosModel.deleteDetalle(id_detalle);

        // La función de BD devuelve texto: 'OK: ...' o el motivo del rechazo
        if (resultado && String(resultado).startsWith("OK")) {
            return res.status(200).json({ mensaje: resultado });
        }
        return res.status(409).json({
            error: resultado || "No se pudo quitar la línea del despacho"
        });
    } catch (error) {
        console.error("Error al eliminar detalle de despacho:", error);
        res.status(500).json({
            error: "Error al eliminar el detalle del despacho"
        });
    }
};

// DELETE /api/preenfrio/despachos/eliminardespacho/:id
// Devuelve a las cámaras todo el producto del picking antes de borrar.
const deleteDespacho = async (req, res) => {
    try {
        const { id } = req.params;

        const actual = await despachosModel.getDespachoById(id);
        if (!actual) {
            return res.status(404).json({ error: "Despacho no encontrado" });
        }
        if (Number(actual.estado) !== 1) {
            return res.status(409).json({
                error: "Solo se pueden eliminar despachos en borrador. Un despacho cerrado ya salió: si necesitas anularlo, cancélalo."
            });
        }

        const despachoEliminado = await despachosModel.deleteDespacho(id);
        res.status(200).json({
            mensaje: "Despacho eliminado; el producto se devolvió a las cámaras",
            despacho: despachoEliminado
        });
    } catch (error) {
        console.error("Error al eliminar despacho:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el despacho está referenciado en movimientos de inventario"
            });
        }
        res.status(500).json({ error: "Error al eliminar el despacho" });
    }
};

const CAMPOS_AUDITABLES = {
    id_transporte: "Transporte",
    orden_venta: "Orden de venta",
    cita: "Cita",
    fecha_cita: "Fecha de cita",
    hora_salida: "Hora de salida",
    temperatura_salida: "Temperatura de salida",
    observaciones: "Observaciones"
};

const construirCambios = (antes, despues) => {
    const lista = [];
    for (const [campo, etiqueta] of Object.entries(CAMPOS_AUDITABLES)) {
        const valAntes = antes?.[campo];
        const valDespues = despues?.[campo];
        if (
            valDespues !== undefined &&
            valDespues !== null &&
            String(valAntes ?? "") !== String(valDespues ?? "")
        ) {
            lista.push(`${etiqueta}: ${valAntes ?? "—"} → ${valDespues}`);
        }
    }
    return lista.join("; ").substring(0, 1000);
};

const getAuditoria = async (req, res) => {
    try {
        const { id_despacho } = req.params;
        if (!id_despacho || isNaN(Number(id_despacho))) {
            return res.status(400).json({
                error: "El id de despacho debe ser un número válido"
            });
        }
        const data = await despachosModel.getAuditoria(id_despacho);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener la auditoría:", error);
        res.status(500).json({ error: "Error al obtener el historial de cambios" });
    }
};

export const despachosController = {
    // inventario
    getInventarioDisponible,
    getInventarioByCliente,
    // consultas
    getDespachos,
    getDespachoById,
    getDespachoConDetalle,
    getDespachosByEstado,
    getPickingList,
    getSiguienteFolio,
    // altas
    createDespacho,
    addDetalle,
    // bajas / estados
    updateDespacho,
    cerrarDespacho,
    cancelarDespacho,
    deleteDetalle,
    deleteDespacho,
    getClientesConInventario,
    getAuditoria
};
