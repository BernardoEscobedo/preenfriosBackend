import { db } from "../database/connection.database.js";

// =========================================================
// PULPEOS
// Estructura jerárquica:
//   pulpeos (encabezado, por bloque)
//     -> pulpeos_detalle (por lote dentro del bloque)
//          -> pulpeos_evidencia (fotos por línea de detalle)
// createPulpeo inserta encabezado + detalle[] + evidencia[] en
// una sola transacción.
//
// Esquema: temperatura_objetivo y temperatura_promedio son
// NOT NULL en el encabezado.
// =========================================================

// Obtener todos los pulpeos (con datos del bloque y usuario)
const getPulpeos = async () => {
    const result = await db.query(
        `
        SELECT
            p.*,
            b.codigo_bloque,
            u.usuario
        FROM pulpeos p
        JOIN bloques_fruta b ON b.id_bloque = p.id_bloque
        LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
        ORDER BY p.id_pulpeo DESC
        `
    );
    return result.rows;
};

// Obtener un pulpeo por ID
const getPulpeoById = async (id_pulpeo) => {
    const result = await db.query(
        `
        SELECT
            p.*,
            b.codigo_bloque,
            u.usuario
        FROM pulpeos p
        JOIN bloques_fruta b ON b.id_bloque = p.id_bloque
        LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
        WHERE p.id_pulpeo = $1
        `,
        [id_pulpeo]
    );
    return result.rows[0];
};

// Obtener un pulpeo con su detalle y evidencia
const getPulpeoConDetalle = async (id_pulpeo) => {
    const pulpeo = await getPulpeoById(id_pulpeo);
    if (!pulpeo) {
        return null;
    }
    const detalleResult = await db.query(
        `
        SELECT
            pd.*,
            l.codigo_lote
        FROM pulpeos_detalle pd
        JOIN lotes l ON l.id_lote = pd.id_lote
        WHERE pd.id_pulpeo = $1
        ORDER BY pd.id_pulpeo_detalle ASC
        `,
        [id_pulpeo]
    );
    const detalle = detalleResult.rows;

    // Adjuntar evidencia a cada línea de detalle
    for (const linea of detalle) {
        const eviResult = await db.query(
            `
            SELECT *
            FROM pulpeos_evidencia
            WHERE id_pulpeo_detalle = $1
            ORDER BY id_evidencia ASC
            `,
            [linea.id_pulpeo_detalle]
        );
        linea.evidencia = eviResult.rows;
    }

    return {
        ...pulpeo,
        detalle
    };
};

// Obtener pulpeos por bloque
const getPulpeosByBloque = async (id_bloque) => {
    const result = await db.query(
        `
        SELECT *
        FROM pulpeos
        WHERE id_bloque = $1
        ORDER BY fecha_hora DESC
        `,
        [id_bloque]
    );
    return result.rows;
};

// Crear pulpeo + detalle[] + evidencia[] en una transacción
// body = {
//   id_bloque, fecha_hora, numero_pulpeo, temperatura_objetivo,
//   temperatura_promedio, id_usuario, observaciones,
//   detalle: [ { id_lote, cantidad_tarimas, temperatura, fecha_hora,
//                evidencia: [ { foto_url } ] } ]
// }
const createPulpeo = async ({
    id_bloque,
    fecha_hora,
    numero_pulpeo,
    temperatura_objetivo,
    temperatura_promedio,
    id_usuario,
    observaciones,
    detalle = []
}) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const pulpeoResult = await client.query(
            `
            INSERT INTO pulpeos (
                id_bloque,
                fecha_hora,
                numero_pulpeo,
                temperatura_objetivo,
                temperatura_promedio,
                id_usuario,
                observaciones
            )
            VALUES ($1, COALESCE($2, CURRENT_TIMESTAMP), $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                id_bloque,
                fecha_hora,
                numero_pulpeo || null,
                temperatura_objetivo,
                temperatura_promedio,
                id_usuario || null,
                observaciones || null
            ]
        );
        const pulpeo = pulpeoResult.rows[0];

        for (const linea of detalle) {
            const detResult = await client.query(
                `
                INSERT INTO pulpeos_detalle (
                    id_pulpeo,
                    id_lote,
                    cantidad_tarimas,
                    temperatura,
                    fecha_hora
                )
                VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP))
                RETURNING *
                `,
                [
                    pulpeo.id_pulpeo,
                    linea.id_lote,
                    linea.cantidad_tarimas,
                    linea.temperatura || null,
                    linea.fecha_hora || null
                ]
            );
            const detalleLinea = detResult.rows[0];

            const evidencia = linea.evidencia || [];
            for (const foto of evidencia) {
                await client.query(
                    `
                    INSERT INTO pulpeos_evidencia (
                        id_pulpeo_detalle,
                        foto_url,
                        fecha_hora
                    )
                    VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP))
                    `,
                    [
                        detalleLinea.id_pulpeo_detalle,
                        foto.foto_url,
                        foto.fecha_hora || null
                    ]
                );
            }
        }

        await client.query("COMMIT");
        return await getPulpeoConDetalle(pulpeo.id_pulpeo);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Agregar una línea de detalle (con evidencia opcional) a un pulpeo existente
const addDetalle = async (
    id_pulpeo,
    { id_lote, cantidad_tarimas, temperatura, fecha_hora, evidencia = [] }
) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const detResult = await client.query(
            `
            INSERT INTO pulpeos_detalle (
                id_pulpeo,
                id_lote,
                cantidad_tarimas,
                temperatura,
                fecha_hora
            )
            VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP))
            RETURNING *
            `,
            [
                id_pulpeo,
                id_lote,
                cantidad_tarimas,
                temperatura || null,
                fecha_hora || null
            ]
        );
        const detalleLinea = detResult.rows[0];

        for (const foto of evidencia) {
            await client.query(
                `
                INSERT INTO pulpeos_evidencia (
                    id_pulpeo_detalle,
                    foto_url,
                    fecha_hora
                )
                VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP))
                `,
                [detalleLinea.id_pulpeo_detalle, foto.foto_url, foto.fecha_hora || null]
            );
        }

        await client.query("COMMIT");
        return detalleLinea;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Agregar una evidencia (foto) a una línea de detalle existente
const addEvidencia = async (id_pulpeo_detalle, { foto_url, fecha_hora }) => {
    const result = await db.query(
        `
        INSERT INTO pulpeos_evidencia (
            id_pulpeo_detalle,
            foto_url,
            fecha_hora
        )
        VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP))
        RETURNING *
        `,
        [id_pulpeo_detalle, foto_url, fecha_hora || null]
    );
    return result.rows[0];
};

// Actualizar encabezado del pulpeo
const updatePulpeo = async (
    id_pulpeo,
    {
        id_bloque,
        fecha_hora,
        numero_pulpeo,
        temperatura_objetivo,
        temperatura_promedio,
        id_usuario,
        observaciones
    }
) => {
    const result = await db.query(
        `
        UPDATE pulpeos
        SET
            id_bloque = $1,
            fecha_hora = COALESCE($2, fecha_hora),
            numero_pulpeo = $3,
            temperatura_objetivo = $4,
            temperatura_promedio = $5,
            id_usuario = $6,
            observaciones = $7
        WHERE id_pulpeo = $8
        RETURNING *
        `,
        [
            id_bloque,
            fecha_hora,
            numero_pulpeo || null,
            temperatura_objetivo,
            temperatura_promedio,
            id_usuario || null,
            observaciones || null,
            id_pulpeo
        ]
    );
    return result.rows[0];
};

// Eliminar pulpeo (borra detalle y evidencia en transacción)
const deletePulpeo = async (id_pulpeo) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `
            DELETE FROM pulpeos_evidencia
            WHERE id_pulpeo_detalle IN (
                SELECT id_pulpeo_detalle
                FROM pulpeos_detalle
                WHERE id_pulpeo = $1
            )
            `,
            [id_pulpeo]
        );
        await client.query(
            `DELETE FROM pulpeos_detalle WHERE id_pulpeo = $1`,
            [id_pulpeo]
        );
        const result = await client.query(
            `DELETE FROM pulpeos WHERE id_pulpeo = $1 RETURNING *`,
            [id_pulpeo]
        );
        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const pulpeosModel = {
    getPulpeos,
    getPulpeoById,
    getPulpeoConDetalle,
    getPulpeosByBloque,
    createPulpeo,
    addDetalle,
    addEvidencia,
    updatePulpeo,
    deletePulpeo
};

export default pulpeosModel;
