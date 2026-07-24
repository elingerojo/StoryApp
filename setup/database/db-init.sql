-- Ejecutar en la consola de Neon
CREATE TYPE paso_flujo AS ENUM ('IA_RAW', 'EDITANDO_FIGMA', 'LISTO_PARA_PRODUCCION');

CREATE TABLE historias_scrolly (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,      -- Ej: 'oauth2-explicado'
    titulo VARCHAR(255) NOT NULL,
    estado paso_flujo DEFAULT 'IA_RAW',
    json_original JSONB NOT NULL,            -- Estructura nativa que devolvió Gemini
    json_modificado JSONB,                  -- Estructura corregida por ti (textos, keyframes)
    svg_final_url VARCHAR(512),             -- URL pública apuntando a Vercel Blobs
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
