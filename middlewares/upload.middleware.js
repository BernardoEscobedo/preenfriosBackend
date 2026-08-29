import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ============================================================================
// MIDDLEWARE DE SUBIDA DE EVIDENCIAS FOTOGRÁFICAS
// ============================================================================
// Estrategia: opción B (disco del servidor).
//   1. Multer recibe el archivo EN MEMORIA (no lo escribe todavía).
//   2. Sharp lo comprime y redimensiona.
//   3. Se guarda el resultado ya optimizado en backend/uploads/despachos/.
//
// Por qué en memoria y no directo a disco:
//   Evita escribir el archivo original de 5 MB y luego reemplazarlo. Se
//   escribe una sola vez, ya comprimido.
//
// Requiere:  npm install multer sharp
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/uploads/despachos
export const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "despachos");

// Se crea la carpeta al arrancar si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ---------------------------------------------------------
// Configuración de compresión
// ---------------------------------------------------------
// 1600px de ancho es suficiente para ver detalle en un reclamo
// (sellos, etiquetas, estado de la tarima) sin gastar disco.
const MAX_ANCHO = 1600;
const CALIDAD_JPG = 78;          // 78 es el punto dulce calidad/peso
const MAX_ARCHIVO_MB = 15;       // límite de entrada (antes de comprimir)

// ---------------------------------------------------------
// Multer: recibe en memoria y filtra por tipo
// ---------------------------------------------------------
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const permitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (permitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP, HEIC)"), false);
    }
};

export const uploadMemoria = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_ARCHIVO_MB * 1024 * 1024 }
});

// ---------------------------------------------------------
// Comprime y guarda en disco
// ---------------------------------------------------------
// Devuelve { nombre_archivo, foto_url, tamano_bytes }
// El nombre incluye el folio para poder ubicar el archivo a simple vista:
//   despacho_70001_1.jpg
export const comprimirYGuardar = async (buffer, folio, consecutivo) => {
    const limpio = String(folio || "sinfolio").replace(/[^a-zA-Z0-9-_]/g, "");
    const nombre_archivo = `despacho_${limpio}_${consecutivo}_${Date.now()}.jpg`;
    const rutaFisica = path.join(UPLOAD_DIR, nombre_archivo);

    await sharp(buffer)
        // withoutEnlargement: si la foto ya es chica, no la agranda
        .resize({ width: MAX_ANCHO, withoutEnlargement: true })
        .jpeg({ quality: CALIDAD_JPG, mozjpeg: true })
        .toFile(rutaFisica);

    const stats = fs.statSync(rutaFisica);

    return {
        nombre_archivo,
        // Ruta pública que sirve Express (ver index.js)
        foto_url: `/uploads/despachos/${nombre_archivo}`,
        tamano_bytes: stats.size
    };
};

// ---------------------------------------------------------
// Elimina el archivo físico del disco
// ---------------------------------------------------------
// Se llama al borrar la evidencia, para que no queden huérfanos.
export const eliminarArchivo = (nombre_archivo) => {
    try {
        const ruta = path.join(UPLOAD_DIR, nombre_archivo);
        if (fs.existsSync(ruta)) {
            fs.unlinkSync(ruta);
            return true;
        }
    } catch (error) {
        console.error("No se pudo eliminar el archivo:", nombre_archivo, error);
    }
    return false;
};

// ---------------------------------------------------------
// Manejo de errores de multer
// ---------------------------------------------------------
// Sin esto, un archivo muy grande devuelve un error feo de Express.
export const manejarErrorUpload = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                error: `La imagen supera el límite de ${MAX_ARCHIVO_MB} MB`
            });
        }
        return res.status(400).json({ error: `Error al subir: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};
