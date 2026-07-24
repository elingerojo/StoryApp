UPDATE historias_scrolly 
SET svg_final_url = 'https://vercel-storage.com',
    estado = 'LISTO_PARA_PRODUCCION'::paso_flujo_mvp
WHERE slug = 'oauth2-flow';