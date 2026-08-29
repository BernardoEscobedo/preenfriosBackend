import { db } from "../database/connection.database.js";

// ============================================================================
// EVIDENCIAS FOTOGRÁFICAS DE DESPACHO
// ============================================================================
// Las fotos viven en disco (backend/uploads/despachos/). Aquí solo se
// guarda la ruta y los metadatos.
// Tope: 3 fotos por despacho, validado en el controller.
// ============================================================================

const MAX_FOTOS = 3;

// Evidencias de un despacho
const getEvidenciasByDespacho = async (id_despacho) => {
    const result = await db.query(
        `SELECT * FROM vw_despachos_evidencia WHERE id_despacho = $1`,
        [id_despacho]
    );
    return result.rows;
};

// Una evidencia (se usa al eliminar, para saber qué archivo borrar)
const getEvidenciaById = async (id_evidencia) => {
    const result = await db.query(
        `SELECT * FROM despachos_evidencia WHERE id_evidencia = $1`,
        [id_evidencia]
    );
    return result.rows[0];
};

// Cuántas fotos tiene ya el despacho (para respetar el tope)
const contarEvidencias = async (id_despacho) => {
    const result = await db.query(
        `SELECT COUNT(*)::INT AS total FROM despachos_evidencia WHERE id_despacho = $1`,
        [id_despacho]
    );
    return result.rows[0]?.total ?? 0;
};

// Registrar la evidencia (el archivo ya se guardó y comprimió en disco)
const createEvidencia = async ({
    id_despacho,
    foto_url,
    nombre_archivo,
    tamano_bytes,
    descripcion,
    id_usuario
}) => {
    const result = await db.query(
        `
        INSERT INTO despachos_evidencia (
            id_despacho, foto_url, nombre_archivo,
            tamano_bytes, descripcion, id_usuario
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            id_despacho,
            foto_url,
            nombre_archivo,
            tamano_bytes ?? null,
            descripcion ?? null,
            id_usuario ?? null
        ]
    );
    return result.rows[0];
};

// Borra el registro. El archivo físico lo elimina el controller.
const deleteEvidencia = async (id_evidencia) => {
    const result = await db.query(
        `DELETE FROM despachos_evidencia WHERE id_evidencia = $1 RETURNING *`,
        [id_evidencia]
    );
    return result.rows[0];
};

const evidenciasModel = {
    MAX_FOTOS,
    getEvidenciasByDespacho,
    getEvidenciaById,
    contarEvidencias,
    createEvidencia,
    deleteEvidencia
};

export default evidenciasModel;
