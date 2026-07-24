-- 1. Crear el tipo ENUM para el ciclo de vida del MVP (Sincronizado con TypeScript)
CREATE TYPE paso_flujo_mvp AS ENUM ('IA_RAW', 'EDITANDO_FIGMA', 'LISTO_PARA_PRODUCCION');

-- 2. Crear la tabla principal para almacenar las historias de Scrollytelling
CREATE TABLE historias_scrolly (
    id SERIAL PRIMARY KEY,
    
    -- El 'slug' actúa como el identificador en la URL (ej: 'oauth2-flow'). Debe ser único.
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    titulo VARCHAR(255) NOT NULL,
    
    -- Estado actual del concepto dentro de tu flujo operativo
    estado paso_flujo_mvp DEFAULT 'IA_RAW'::paso_flujo_mvp,
    
    -- Almacena el JSON intacto que devolvió Gemini (como respaldo)
    json_original JSONB NOT NULL,
    
    -- Almacena el JSON que tú modificas y editas a mano. Este es el que consumirá Angular.
    json_modificado JSONB NOT NULL,
    
    -- URL pública del SVG limpio de Figma alojado en el CDN de Vercel Blobs
    svg_final_url VARCHAR(512) DEFAULT NULL,
    
    -- Auditoría de tiempos
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear un Trigger para actualizar automáticamente la columna 'actualizado_en' en cada cambio
CREATE OR REPLACE FUNCTION actualizar_timestamp_historias()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_historias_timestamp
BEFORE UPDATE ON historias_scrolly
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_historias();

-- 4. OPTIMIZACIÓN: Índices de Búsqueda y Rendimiento

-- Índice B-Tree para el slug: Angular buscará los conceptos por URL frecuentemente.
CREATE INDEX idx_historias_scrolly_slug ON historias_scrolly(slug);

-- Índice GIN para consultas rápidas dentro del JSON modificado (Por si en la V1 decides buscar por texto interno)
CREATE INDEX idx_historias_scrolly_json_modificado ON historias_scrolly USING gin (json_modificado);
