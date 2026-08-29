-- =========================================================
-- CATÁLOGOS BASE
-- =========================================================
CREATE TABLE empleados(
    id_empleado SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    turno VARCHAR(60) NOT NULL,
    zona VARCHAR(60) NOT NULL
);

create table roles( 
	id_role serial primary key,
	tipo varchar(50) UNIQUE NOT NULL 
); 

CREATE TABLE usuarios(
    id_usuario SERIAL PRIMARY KEY,
    usuario VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(250) NOT NULL,
    id_empleado INT NOT NULL REFERENCES empleados(id_empleado),
    id_role INT NOT NULL REFERENCES roles(id_role),
    CONSTRAINT chk_usuario_empleado CHECK (id_empleado > 0),
    CONSTRAINT chk_usuario_role CHECK (id_role > 0)
);

CREATE TABLE camaras(
    id_camara SERIAL PRIMARY KEY,
    nombre_camara VARCHAR(60) NOT NULL,
    tipo_camara INT NOT NULL,               -- 1=preenfrio, 2=conservacion
    ubicacion VARCHAR(60) NOT NULL,
    capacidad_max_tarimas INT NOT NULL,
    capacidad_max_cajas INT NOT NULL,
    capacidad_max_bloques INT NOT NULL
);

CREATE TABLE mantenimientos(
    id_mantenimiento SERIAL PRIMARY KEY,
    id_camara INT NOT NULL REFERENCES camaras(id_camara),
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE,
    hora_fin TIME,
    tipo INT NOT NULL,
    motivo VARCHAR(60) NOT NULL,
    prioridad INT NOT NULL,
    estado INT NOT NULL,                     -- 1=programado, 2=en_proceso, 3=finalizado, 4=cancelado
    CONSTRAINT chk_mantenimiento_camara CHECK (id_camara > 0)
);

CREATE TABLE ocupaciones_camaras(
    id_ocupacion SERIAL PRIMARY KEY,
    id_camara INT NOT NULL REFERENCES camaras(id_camara),
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE,
    hora_fin TIME,
    cantidad_tarimas INT NOT NULL DEFAULT 0,
    cantidad_cajas INT NOT NULL DEFAULT 0,
    cantidad_bloques INT NOT NULL DEFAULT 0,
    tipo_ocupacion INT NOT NULL DEFAULT 1, -- 1=producto/inventario, 2=mantenimiento
    id_mantenimiento INT REFERENCES mantenimientos(id_mantenimiento),
    estado INT,                    -- 1=activa, 0=cerrada
    observaciones VARCHAR(200),
    CONSTRAINT chk_ocupacion_camara CHECK (id_camara > 0),
    CONSTRAINT chk_ocupacion_mantenimiento CHECK (id_mantenimiento > 0)
);

-- =========================================================
-- PRODUCTORES / FINCAS / SKU / LOTES
-- =========================================================
CREATE TABLE productores(
    id_productor SERIAL PRIMARY KEY,
    codigo_productor VARCHAR(4) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo INT DEFAULT 1
);

CREATE TABLE fincas(
    id_finca SERIAL PRIMARY KEY,
    codigo_finca VARCHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(70) NOT NULL,
    org_inv_nombre VARCHAR(70) NOT NULL,
    zona INT NOT NULL,
    id_productor INT NOT NULL REFERENCES productores(id_productor),
    estado INT,
    CONSTRAINT chk_finca_productor CHECK (id_productor > 0)
);

CREATE TABLE sku_pt(
    id_sku SERIAL PRIMARY KEY,
    codigo_sku VARCHAR(10) NOT NULL,
    calidad VARCHAR(70) NOT NULL
);

CREATE TABLE lotes(
    id_lote SERIAL PRIMARY KEY,
    codigo_lote VARCHAR(50) UNIQUE NOT NULL,
    id_finca INT NOT NULL REFERENCES fincas(id_finca),
    id_sku INT NOT NULL REFERENCES sku_pt(id_sku),
    semana INT NOT NULL,
    fecha_empaque DATE NOT NULL,
    turno INT NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado INT,
    CONSTRAINT chk_lote_finca CHECK (id_finca > 0),
    CONSTRAINT chk_lote_sku CHECK (id_sku > 0)
);

-- =========================================================
-- BLOQUES (control físico agregado, sin tarima individual)
-- Un bloque puede combinar tarimas de distintos lotes/sku.
-- La composición exacta vive en bloques_lote_detalle.
-- =========================================================
CREATE TABLE bloques_fruta(
    id_bloque SERIAL PRIMARY KEY,
    codigo_bloque VARCHAR(50) UNIQUE NOT NULL,
    fecha_hora_armado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cantidad_tarimas INT NOT NULL,      -- total del bloque (suma de detalle)
    cantidad_cajas INT NOT NULL,        -- total del bloque (suma de detalle)
    temperatura_ingreso NUMERIC(5,2),
    estado INT
);

-- Composición del bloque: qué lotes y cuántas tarimas/cajas de cada uno.
-- Ej: bloque B001 = 10 tarimas del lote A01003-330812-3 (480 cajas)
--                 +  5 tarimas del lote A01003-320808-1 (240 cajas)
CREATE TABLE bloques_lote_detalle(
    id_detalle SERIAL PRIMARY KEY,
    id_bloque INT NOT NULL REFERENCES bloques_fruta(id_bloque),
    id_lote INT NOT NULL REFERENCES lotes(id_lote),
    cantidad_tarimas INT NOT NULL,
    cantidad_cajas INT NOT NULL,
    UNIQUE(id_bloque, id_lote)
);

-- =========================================================
-- TRIGGER: recalcula totales de bloques_fruta a partir de
-- bloques_lote_detalle (nunca quedan descuadrados)
-- =========================================================
CREATE OR REPLACE FUNCTION fn_recalcular_totales_bloque()
RETURNS TRIGGER AS $$
DECLARE
    v_id_bloque INT;
BEGIN
    -- En DELETE, NEW no existe; usamos OLD para saber qué bloque afectar
    IF TG_OP = 'DELETE' THEN
        v_id_bloque := OLD.id_bloque;
    ELSE
        v_id_bloque := NEW.id_bloque;
    END IF;

    UPDATE bloques_fruta
    SET cantidad_tarimas = COALESCE((
            SELECT SUM(cantidad_tarimas)
            FROM bloques_lote_detalle
            WHERE id_bloque = v_id_bloque
        ), 0),
        cantidad_cajas = COALESCE((
            SELECT SUM(cantidad_cajas)
            FROM bloques_lote_detalle
            WHERE id_bloque = v_id_bloque
        ), 0)
    WHERE id_bloque = v_id_bloque;

    RETURN NULL; -- trigger AFTER, el valor de retorno se ignora
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_totales_bloque
AFTER INSERT OR UPDATE OR DELETE ON bloques_lote_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_recalcular_totales_bloque();

-- =========================================================
-- TRANSPORTE / CLIENTES / DESPACHOS
-- =========================================================
CREATE TABLE transportes(
    id_transporte SERIAL PRIMARY KEY,
    razon_social VARCHAR(100) NOT NULL,
    nombre_operador VARCHAR(100) NOT NULL,
    celular VARCHAR(10) NOT NULL,
    placas_tracto VARCHAR(10) NOT NULL,
    placas_caja VARCHAR(10) NOT NULL,
    no_economico_caja VARCHAR(10) NOT NULL,
    inocuidad INT NOT NULL
);

CREATE TABLE cedis_cliente(
    id_cc SERIAL PRIMARY KEY,
    cliente VARCHAR(80) NOT NULL,
    cedis VARCHAR(80) NOT NULL,
    acronimo VARCHAR(50) NOT NULL
);

CREATE TABLE despachos(
    id_despacho SERIAL PRIMARY KEY,
    folio_despacho VARCHAR(10) NOT NULL UNIQUE,
    id_transporte INT NOT NULL REFERENCES transportes(id_transporte),
    fecha_despacho DATE NOT NULL,
    hora_salida TIME NOT NULL,
    id_cc INT NOT NULL REFERENCES cedis_cliente(id_cc),
    orden_venta VARCHAR(50) NOT NULL,
    cita VARCHAR(50) NOT NULL,
    fecha_cita DATE NOT NULL,
    cantidad_tarimas INT DEFAULT 0,
    cantidad_cajas INT DEFAULT 0,
    temperatura_salida NUMERIC(5,2) NOT NULL,
    estado INT NOT NULL,
    observaciones VARCHAR(250) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_despacho_transporte CHECK (id_transporte > 0),
    CONSTRAINT chk_despacho_cliente_cedis CHECK (id_cc > 0)
);

-- Detalle de despacho: por bloque + lote, agregado (sin tarima individual)
CREATE TABLE despachos_detalle(
    id_detalle SERIAL PRIMARY KEY,
    id_despacho INT NOT NULL REFERENCES despachos(id_despacho),
    id_bloque INT REFERENCES bloques_fruta(id_bloque),
    id_lote INT NOT NULL REFERENCES lotes(id_lote),
    cantidad_tarimas INT NOT NULL,
    cantidad_cajas INT NOT NULL,
    temperatura NUMERIC(5,2),
    observaciones VARCHAR(250),
    CONSTRAINT chk_despacho_det_despacho CHECK (id_despacho > 0),
    CONSTRAINT chk_despacho_det_bloque CHECK (id_bloque > 0),
    CONSTRAINT chk_despacho_det_lote CHECK (id_lote > 0)
);

-- =========================================================
-- MOVIMIENTOS DE INVENTARIO
-- Unidad de registro = LOTE (agregado de tarimas/cajas).
-- Puede haber varios movimientos parciales del mismo lote
-- (ej. 20 tarimas hoy, 5 tarimas después mezcladas con otro lote).
-- =========================================================
CREATE TABLE movimientos_inventario(
    id_movimiento SERIAL PRIMARY KEY,
    id_lote INT NOT NULL REFERENCES lotes(id_lote),
    tipo_movimiento INT NOT NULL,      -- 1=ingreso_preenfrio, 2=preenfrio_a_conserva, 3=salida_despacho
    id_camara_origen INT REFERENCES camaras(id_camara),
    id_camara_destino INT REFERENCES camaras(id_camara),
    id_despacho INT REFERENCES despachos(id_despacho),
    fecha_movimiento DATE NOT NULL,
    hora_movimiento TIME NOT NULL,
    cantidad_tarimas INT NOT NULL,
    cantidad_cajas INT NOT NULL,
    temperatura NUMERIC(5,2),
    id_usuario INT REFERENCES usuarios(id_usuario),
    observaciones VARCHAR(250),
    CONSTRAINT chk_mov_inv_lote CHECK (id_lote > 0),
    CONSTRAINT chk_mov_inv_camara_org CHECK (id_camara_origen > 0),
    CONSTRAINT chk_mov_inv_camara_dest CHECK (id_camara_destino > 0),
    CONSTRAINT chk_mov_inv_despacho CHECK (id_despacho > 0)
);

-- =========================================================
-- PULPEOS (control por bloque, detalle por lote dentro del bloque)
-- =========================================================
CREATE TABLE pulpeos(
    id_pulpeo SERIAL PRIMARY KEY,
    id_bloque INT NOT NULL REFERENCES bloques_fruta(id_bloque),
    fecha_hora TIMESTAMP NOT NULL,
    numero_pulpeo INT,
    temperatura_objetivo NUMERIC(5,2) NOT NULL,
    temperatura_promedio NUMERIC(5,2) NOT NULL,
    id_usuario INT REFERENCES usuarios(id_usuario),
    observaciones VARCHAR(250),
    CONSTRAINT chk_pulpeo_bloque CHECK (id_bloque > 0),
    CONSTRAINT chk_pulpeo_usuario CHECK (id_usuario > 0)
);

-- Detalle: dentro de un pulpeo de bloque, cuántas tarimas de cada lote
-- se evaluaron y a qué temperatura (por si el bloque mezcla lotes distintos)
CREATE TABLE pulpeos_detalle(
    id_pulpeo_detalle SERIAL PRIMARY KEY,
    id_pulpeo INT NOT NULL REFERENCES pulpeos(id_pulpeo),
    id_lote INT NOT NULL REFERENCES lotes(id_lote),
    cantidad_tarimas INT NOT NULL,
    temperatura NUMERIC(5,2),
    fecha_hora TIMESTAMP NOT NULL,
    UNIQUE(id_pulpeo, id_lote),
    CONSTRAINT chk_pulpeo_det_pulpeo CHECK (id_pulpeo > 0),
    CONSTRAINT chk_pulpeo_det_lote CHECK (id_lote > 0)
);

-- Evidencia fotográfica: varias fotos por cada línea de detalle de pulpeo
CREATE TABLE pulpeos_evidencia(
    id_evidencia SERIAL PRIMARY KEY,
    id_pulpeo_detalle INT NOT NULL REFERENCES pulpeos_detalle(id_pulpeo_detalle),
    foto_url VARCHAR(500) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pulpeo_evid_pulpeo_det CHECK (id_pulpeo_detalle > 0)
);

-- =========================================================
-- VISTA DE DISPONIBILIDAD DE CÁMARAS
-- =========================================================
CREATE OR REPLACE VIEW vw_disponibilidad_camaras AS
SELECT
    c.id_camara,
    c.nombre_camara,
    c.tipo_camara,
    c.ubicacion,
    c.capacidad_max_tarimas,
    c.capacidad_max_cajas,
    c.capacidad_max_bloques,
    COALESCE(inv.tarimas_ocupadas, 0) AS tarimas_ocupadas,
    COALESCE(inv.cajas_ocupadas, 0)   AS cajas_ocupadas,
    COALESCE(inv.bloques_ocupados, 0) AS bloques_ocupados,
    c.capacidad_max_tarimas - COALESCE(inv.tarimas_ocupadas, 0) AS tarimas_disponibles,
    c.capacidad_max_cajas   - COALESCE(inv.cajas_ocupadas, 0)   AS cajas_disponibles,
    CASE WHEN mant.id_mantenimiento IS NOT NULL THEN TRUE ELSE FALSE END AS en_mantenimiento,
    CASE
        WHEN mant.id_mantenimiento IS NOT NULL THEN 0
        ELSE c.capacidad_max_tarimas - COALESCE(inv.tarimas_ocupadas, 0)
    END AS tarimas_disponibles_operativas
FROM camaras c
LEFT JOIN (
    SELECT id_camara,
           SUM(cantidad_tarimas) AS tarimas_ocupadas,
           SUM(cantidad_cajas)   AS cajas_ocupadas,
           SUM(cantidad_bloques) AS bloques_ocupados
    FROM ocupaciones_camaras
    WHERE tipo_ocupacion = 1
      AND estado = 1
    GROUP BY id_camara
) inv ON c.id_camara = inv.id_camara
LEFT JOIN (
    SELECT DISTINCT ON (id_camara) id_camara, id_mantenimiento
    FROM ocupaciones_camaras
    WHERE tipo_ocupacion = 2
      AND estado = 1
    ORDER BY id_camara, id_ocupacion DESC
) mant ON c.id_camara = mant.id_camara;

-- =========================================================
-- TRIGGER: sincroniza ocupaciones_camaras con movimientos_inventario
-- =========================================================
CREATE OR REPLACE FUNCTION fn_sync_ocupacion_movimiento()
RETURNS TRIGGER AS $$
DECLARE
    v_id_ocupacion INT;
BEGIN
    -- Descontar de la cámara de origen
    IF NEW.id_camara_origen IS NOT NULL THEN
        SELECT id_ocupacion INTO v_id_ocupacion
        FROM ocupaciones_camaras
        WHERE id_camara = NEW.id_camara_origen
          AND tipo_ocupacion = 1
          AND estado = 1
        LIMIT 1;

        IF v_id_ocupacion IS NOT NULL THEN
            UPDATE ocupaciones_camaras
            SET cantidad_tarimas = cantidad_tarimas - NEW.cantidad_tarimas,
                cantidad_cajas   = cantidad_cajas - NEW.cantidad_cajas
            WHERE id_ocupacion = v_id_ocupacion;

            UPDATE ocupaciones_camaras
            SET estado = 0,
                fecha_fin = NEW.fecha_movimiento,
                hora_fin  = NEW.hora_movimiento
            WHERE id_ocupacion = v_id_ocupacion
              AND cantidad_tarimas <= 0;
        END IF;
    END IF;

    -- Sumar a la cámara de destino
    IF NEW.id_camara_destino IS NOT NULL THEN
        SELECT id_ocupacion INTO v_id_ocupacion
        FROM ocupaciones_camaras
        WHERE id_camara = NEW.id_camara_destino
          AND tipo_ocupacion = 1
          AND estado = 1
        LIMIT 1;

        IF v_id_ocupacion IS NULL THEN
            INSERT INTO ocupaciones_camaras(
                id_camara, fecha_inicio, hora_inicio,
                cantidad_tarimas, cantidad_cajas, cantidad_bloques,
                tipo_ocupacion, estado, observaciones
            ) VALUES (
                NEW.id_camara_destino, NEW.fecha_movimiento, NEW.hora_movimiento,
                NEW.cantidad_tarimas, NEW.cantidad_cajas, 0,
                1, 1, 'Generado automáticamente por movimientos_inventario'
            );
        ELSE
            UPDATE ocupaciones_camaras
            SET cantidad_tarimas = cantidad_tarimas + NEW.cantidad_tarimas,
                cantidad_cajas   = cantidad_cajas + NEW.cantidad_cajas
            WHERE id_ocupacion = v_id_ocupacion;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_ocupacion_movimiento
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
EXECUTE FUNCTION fn_sync_ocupacion_movimiento();

-- =========================================================
-- TRIGGER: sincroniza ocupaciones_camaras con mantenimientos
-- =========================================================
CREATE OR REPLACE FUNCTION fn_sync_ocupacion_mantenimiento()
RETURNS TRIGGER AS $$
DECLARE
    v_capacidad_tarimas INT;
    v_capacidad_cajas   INT;
    v_capacidad_bloques INT;
BEGIN
    -- Inicia mantenimiento: bloquea toda la capacidad de la cámara
    IF NEW.estado = 2 AND (TG_OP = 'INSERT' OR OLD.estado IS DISTINCT FROM 2) THEN
        SELECT capacidad_max_tarimas, capacidad_max_cajas, capacidad_max_bloques
        INTO v_capacidad_tarimas, v_capacidad_cajas, v_capacidad_bloques
        FROM camaras WHERE id_camara = NEW.id_camara;

        INSERT INTO ocupaciones_camaras(
            id_camara, fecha_inicio, hora_inicio,
            cantidad_tarimas, cantidad_cajas, cantidad_bloques,
            tipo_ocupacion, estado, id_mantenimiento, observaciones
        ) VALUES (
            NEW.id_camara, NEW.fecha_inicio, NEW.hora_inicio,
            v_capacidad_tarimas, v_capacidad_cajas, v_capacidad_bloques,
            2, 1, NEW.id_mantenimiento,
            CONCAT('Bloqueo por mantenimiento: ', NEW.motivo)
        );
    END IF;

    -- Termina mantenimiento: libera el espacio bloqueado
    IF NEW.estado = 3 AND OLD.estado IS DISTINCT FROM 3 THEN
        UPDATE ocupaciones_camaras
        SET estado = 0,
            fecha_fin = NEW.fecha_fin,
            hora_fin  = NEW.hora_fin
        WHERE id_mantenimiento = NEW.id_mantenimiento
          AND tipo_ocupacion = 2
          AND estado = 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_ocupacion_mantenimiento
AFTER INSERT OR UPDATE ON mantenimientos
FOR EACH ROW
EXECUTE FUNCTION fn_sync_ocupacion_mantenimiento();

-- =========================================================
-- ÍNDICE: solo una ocupación de inventario activa por cámara
-- =========================================================
CREATE UNIQUE INDEX ux_ocupacion_inventario_camara_activa
ON ocupaciones_camaras(id_camara)
WHERE tipo_ocupacion = 1
  AND estado = 1;

-- //CONSULTAS
select *from roles
select *from empleados
select *from usuarios

-- //INSERT MANUALES

insert into empleados (nombre,apellidos,turno,zona) values ('Bernardo','Escobedo Velazquez','DIURNO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Bertin de Jesus','Arias Gutierrez','DIURNO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Mauricio Gerardo','Vazquez Gachuz','DIURNO','TECOMAN, COLIMA');
insert into empleados (nombre,apellidos,turno,zona) values ('Cristian Obet','Carballo Juarez','DIURNO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Omar','Aragon','DIURNO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Operador1','Operador1_tapachula','COMPLETO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Operador2','Operador2_tapachula','COMPLETO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Operador3','Operador3_tapachula','COMPLETO','TAPACHULA, CHIAPAS');
insert into empleados (nombre,apellidos,turno,zona) values ('Operador1','Operador1_tecoman','COMPLETO','TECOMAN, COLIMA');
insert into empleados (nombre,apellidos,turno,zona) values ('Operador2','Operador2_tecoman','COMPLETO','TECOMAN, COLIMA');
insert into empleados (nombre,apellidos,turno,zona) values ('Operador3','Operador3_tecoman','COMPLETO','TECOMAN, COLIMA');

DROP TABLE 
pulpeos_evidencia,
pulpeos_detalle,
pulpeos,
movimientos_inventario,
despachos_detalle,
despachos,
cedis_cliente,
transportes,
bloques_lote_detalle,
bloques_fruta,
lotes,
sku_pt,
fincas,
productores,
ocupaciones_camaras,
mantenimientos,
camaras,
usuarios,
roles,
empleados;