import despachosModel from "../models/despachos.model.js";

// ============================================================================
// DESPACHOS
// ============================================================================
// ALCANCE POR CÁMARA
//   req.camaras lo pone el middleware cargarAlcance:
//       null  -> Admin / Coordinador (ven todo)
//       [...] -> Supervisor / Operativo (solo sus cámaras)
//
//   Se filtra el INVENTARIO (de dónde se puede tomar fruta), no la lista de
//   despachos: un despacho es un documento comercial que puede llevar carga
//   de varias plantas, y recortarlo daría totales incompletos. Lo que
//   protege el inventario es acotar el picking, y eso sí se hace.
// ============================================================================

const sinAcceso = (req, id_camara) =>
    Array.isArray(req.camaras) && !req.camaras.includes(Number(id_camara));

// Campos que se pueden corregir en un despacho ya cerrado.
// Se declaran aquí para generar el resumen de cambios de la auditoría.
const CAMPOS_AUDITABLES = {
    id_transporte: "Transporte",
    orden_venta: "Orden de venta",
    cita: "Cita",
    fecha_cita: "Fecha de cita",
    hora_salida: "Hora de salida",
    temperatura_salida: "Temperatura de salida",
    observaciones: "Observaciones"
};

// Compara antes/después y deja constancia legible de qué cambió.
// Ej: 'Transporte: 3 → 5; Placas: 15AN7H → 15AN8J'
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


// =========================================================
// INVENTARIO DISPONIBLE (para armar el picking)
// =========================================================

// GET /api/preenfrio/despachos/inventario
const getInventarioDisponible = async (req, res) => {
    try {
        const data = await despachosModel.getInventarioDisponible(req.camaras);
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
        const data = await despachosModel.getInventarioByCliente(
            id_cc,
            req.camaras
        );
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener inventario del cliente:", error);
        res.status(500).json({
            error: "Error al obtener el inventario del cliente"
        });
    }
};

// GET /api/preenfrio/despachos/clientes
// Solo clientes con producto disponible EN SUS CÁMARAS: ofrecer un cliente
// cuya fruta está en otra planta llevaría a un picking vacío.
const getClientesConInventario = async (req, res) => {
    try {
        const data = await despachosModel.getClientesConInventario(req.camaras);
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

// GET /api/preenfrio/despachos/auditoria/:id_despacho
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
        res.status(500).json({
            error: "Error al obtener el historial de cambios"
        });
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
        // Si viene con detalle, se valida que TODAS las líneas salgan de
        // cámaras propias antes de tocar nada.
        if (Array.isArray(req.camaras) && Array.isArray(req.body.detalle)) {
            for (const linea of req.body.detalle) {
                let cam = linea.id_camara_origen;
                if (!cam && linea.id_ocupacion_origen) {
                    cam = await despachosModel.getCamaraDeOcupacion(
                        Number(linea.id_ocupacion_origen)
                    );
                }
                if (cam && sinAcceso(req, cam)) {
                    return res.status(403).json({
                        error: "No tienes acceso a una de las cámaras del picking"
                    });
                }
            }
        }

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
            error:
                "Error al crear el despacho" +
                (error.message ? `: ${error.message}` : "")
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

        // Alcance: la fruta debe salir de una cámara propia
        if (Array.isArray(req.camaras)) {
            let cam = req.body.id_camara_origen;
            if (!cam && req.body.id_ocupacion_origen) {
                cam = await despachosModel.getCamaraDeOcupacion(
                    Number(req.body.id_ocupacion_origen)
                );
            }
            if (cam && sinAcceso(req, cam)) {
                return res.status(403).json({
                    error: "No tienes acceso a esa cámara"
                });
            }
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
            error:
                "Error al agregar el detalle del despacho" +
                (error.message ? `: ${error.message}` : "")
        });
    }
};


// =========================================================
// EDICIÓN Y CAMBIOS DE ESTADO
// =========================================================

// PUT /api/preenfrio/despachos/actualizardespacho/:id
//
// Comportamiento según el estado:
//   BORRADOR → edición libre (aún no sale el camión).
//   CERRADO  → solo datos administrativos y con MOTIVO obligatorio.
//              Se registra en la bitácora de auditoría.
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

            const actualizado = await despachosModel.updateDespachoCerrado(
                id,
                req.body
            );

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
        res.status(500).json({
            error: "Error al actualizar el despacho"
        });
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


// =========================================================
// BAJAS
// =========================================================

// DELETE /api/preenfrio/despachos/detalle/:id_detalle
// Devuelve el producto a la cámara y borra el movimiento asociado.
const deleteDetalle = async (req, res) => {
    try {
        const { id_detalle } = req.params;

        // Alcance: no se quita fruta de una cámara ajena
        if (Array.isArray(req.camaras)) {
            const cam = await despachosModel.getCamaraDeDetalle(id_detalle);
            if (cam !== null && sinAcceso(req, cam)) {
                return res.status(403).json({
                    error: "No tienes acceso a esa cámara"
                });
            }
        }

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
//
// Solo se eliminan BORRADORES: nunca salieron, la fruta sigue en cámara.
// Un despacho cerrado no se borra (el camión ya salió); si hay que anularlo
// o devolver producto, corresponde una devolución.
const deleteDespacho = async (req, res) => {
    try {
        const { id } = req.params;

        const actual = await despachosModel.getDespachoById(id);
        if (!actual) {
            return res.status(404).json({ error: "Despacho no encontrado" });
        }
        if (Number(actual.estado) !== 1) {
            return res.status(409).json({
                error: "Solo se pueden eliminar despachos en borrador. Un despacho cerrado ya salió: si necesitas devolver producto, registra una devolución."
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
        res.status(500).json({
            error: "Error al eliminar el despacho"
        });
    }
};


export const despachosController = {
    // inventario
    getInventarioDisponible,
    getInventarioByCliente,
    getClientesConInventario,
    // consultas
    getDespachos,
    getDespachoById,
    getDespachoConDetalle,
    getDespachosByEstado,
    getPickingList,
    getSiguienteFolio,
    getAuditoria,
    // altas
    createDespacho,
    addDetalle,
    // bajas / estados
    updateDespacho,
    cerrarDespacho,
    deleteDetalle,
    deleteDespacho
};
