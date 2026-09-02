import { db } from "../database/connection.database.js";

// ============================================================================
// MIDDLEWARE DE ALCANCE POR CÁMARA
// ============================================================================
// PROPÓSITO
//   Determinar QUÉ CÁMARAS puede ver el usuario que hace la petición, y
//   dejarlo en req.camaras para que los modelos filtren sus consultas.
//
//   ADMIN (1) y COORDINADOR (2) → todas las cámaras.
//   SUPERVISOR (3) y OPERATIVO (4) → solo las de usuarios_camaras.
//
// POR QUÉ EN EL BACKEND Y NO SOLO EN LA VISTA
//   Ocultar cámaras en el frontend no protege nada: con el token, cualquiera
//   puede llamar el endpoint directo y recibir todo. El recorte tiene que
//   pasar aquí, antes de responder.
//
// CÓMO SE USA
//   1. En la ruta, después de verifyToken:
//        router.get("/x", verifyToken, verifyOperativo, cargarAlcance, ctrl.x);
//   2. En el controller, se pasa al modelo:
//        await modelo.getAlgo(req.camaras);
//   3. En el modelo, se filtra:
//        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))
//
//   req.camaras = null   → sin restricción (admin/coordinador)
//   req.camaras = [1,2]  → solo esas cámaras
//   req.camaras = []     → no ve nada (supervisor sin asignación)
// ============================================================================

// Roles con alcance total. Se dejan explícitos para que el criterio sea
// visible aquí y no haya que rastrearlo por el código.
const ROLES_ALCANCE_TOTAL = [1, 2]; // 1=Admin · 2=Coordinador

/**
 * Carga en req.camaras el arreglo de cámaras visibles para el usuario.
 * Requiere que verifyToken ya haya corrido.
 */
export const cargarAlcance = async (req, res, next) => {
    try {
        const id_usuario =
            req.id_usuario ?? req.usuario?.id_usuario ?? null;
        const id_role =
            req.id_role ?? req.usuario?.id_role ?? null;

        if (!id_usuario) {
            return res.status(401).json({
                error: "No se pudo identificar al usuario de la sesión"
            });
        }

        // Alcance total: null significa "sin filtro"
        if (ROLES_ALCANCE_TOTAL.includes(Number(id_role))) {
            req.camaras = null;
            req.alcanceTotal = true;
            return next();
        }

        // Alcance limitado: se consultan sus cámaras asignadas
        const result = await db.query(
            `SELECT fn_camaras_usuario($1) AS camaras`,
            [id_usuario]
        );
        const camaras = result.rows[0]?.camaras ?? [];

        req.camaras = camaras;
        req.alcanceTotal = false;

        // Un supervisor sin cámaras no ve nada. Se avisa en el log para que
        // se note en configuración y no se confunda con un error del sistema.
        if (camaras.length === 0) {
            console.warn(
                `[alcance] El usuario ${id_usuario} (rol ${id_role}) no tiene cámaras asignadas: no verá datos.`
            );
        }

        next();
    } catch (error) {
        console.error("Error al cargar el alcance del usuario:", error);
        res.status(500).json({
            error: "Error al determinar las cámaras del usuario"
        });
    }
};

/**
 * Valida que una cámara concreta esté dentro del alcance del usuario.
 * Se usa en endpoints que reciben id_camara por params o body, para que
 * nadie opere sobre una cámara ajena mandando el id a mano.
 *
 * @param {String} campo  De dónde leer el id: 'params' | 'body'
 * @param {String} nombre Nombre del campo (por defecto 'id_camara')
 */
export const validarCamaraEnAlcance = (campo = "params", nombre = "id_camara") => {
    return (req, res, next) => {
        // Alcance total: no hay nada que validar
        if (req.alcanceTotal || req.camaras === null) {
            return next();
        }

        const origen = campo === "body" ? req.body : req.params;
        const valor = origen?.[nombre];

        // Si el endpoint no trae cámara, no aplica esta validación
        if (valor === undefined || valor === null || valor === "") {
            return next();
        }

        const id = Number(valor);
        if (isNaN(id)) {
            return res.status(400).json({
                error: `El campo "${nombre}" debe ser numérico`
            });
        }

        if (!req.camaras.includes(id)) {
            return res.status(403).json({
                error: "No tienes acceso a esa cámara"
            });
        }

        next();
    };
};

/**
 * Helper para los modelos: normaliza el alcance a un valor apto para SQL.
 * Devuelve null (sin filtro) o el arreglo de ids.
 *
 * En el modelo:
 *   const result = await db.query(
 *       `SELECT * FROM vw_x
 *        WHERE ($1::INT[] IS NULL OR id_camara = ANY($1))`,
 *       [alcanceSQL(camaras)]
 *   );
 */
export const alcanceSQL = (camaras) => {
    if (camaras === null || camaras === undefined) return null;
    if (!Array.isArray(camaras)) return null;
    return camaras;
};

export default { cargarAlcance, validarCamaraEnAlcance, alcanceSQL };
