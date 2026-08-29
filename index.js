import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import usuariosRouter from "./routes/usuarios.route.js";
import empleadosRouter from "./routes/empleados.route.js";
import camarasRouter from "./routes/camaras.route.js";
import mantenimientosRouter from "./routes/mantenimientos.route.js";
import ocupacionesRouter from "./routes/ocupaciones.route.js";
import productoresRouter from "./routes/productores.route.js";
import fincasRouter from "./routes/fincas.route.js";
import skuPtRouter from "./routes/skuPt.route.js";
import lotesRouter from "./routes/lotes.route.js";
import bloquesFrutaRouter from "./routes/bloquesFruta.route.js";
import bloquesLoteDetalleRouter from "./routes/bloquesLoteDetalle.route.js";
import transportesRouter from "./routes/transportes.route.js";
import cedisClienteRouter from "./routes/cedisCliente.route.js";
import despachosRouter from "./routes/despachos.route.js";
import movimientosInventarioRouter from "./routes/movimientosInventario.route.js";
import pulpeosRouter from "./routes/pulpeos.route.js";
import produccionRouter from "./routes/produccion.route.js";
import recepcionesRouter from "./routes/recepciones.route.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// CORS: el origen del frontend se toma de la variable de entorno CORS_ORIGIN.
// En el .env agrega:  CORS_ORIGIN=http://localhost:5173
// Para varios orígenes, sepáralos por coma:  CORS_ORIGIN=http://localhost:5173,https://mi-dominio.com
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = corsOrigin.split(",").map((o) => o.trim());

app.use(
    cors({
        origin: allowedOrigins
    })
);

// MIDDLEWARES
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.static("public"));

// RUTAS
app.use("/api/preenfrio/usuarios", usuariosRouter);
app.use("/api/preenfrio/empleados", empleadosRouter);
app.use("/api/preenfrio/camaras", camarasRouter);
app.use("/api/preenfrio/mantenimientos", mantenimientosRouter);
app.use("/api/preenfrio/ocupaciones", ocupacionesRouter);
app.use("/api/preenfrio/productores", productoresRouter);
app.use("/api/preenfrio/fincas", fincasRouter);
app.use("/api/preenfrio/skupt", skuPtRouter);
app.use("/api/preenfrio/lotes", lotesRouter);
app.use("/api/preenfrio/bloques", bloquesFrutaRouter);
app.use("/api/preenfrio/bloqueslotedetalle", bloquesLoteDetalleRouter);
app.use("/api/preenfrio/cedisclientes", cedisClienteRouter);
app.use("/api/preenfrio/transportes", transportesRouter);
app.use("/api/preenfrio/despachos", despachosRouter);
app.use("/api/preenfrio/movimientos", movimientosInventarioRouter);
app.use("/api/preenfrio/pulpeos", pulpeosRouter);
app.use("/api/preenfrio/produccion", produccionRouter);
app.use("/api/preenfrio/recepciones", recepcionesRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// CONFIGURACIÓN
const PORT = process.env.PORT || 3000;

console.log("ENV:", {
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD ? "***" : "Not set",
    corsOrigin: allowedOrigins
});

// SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
