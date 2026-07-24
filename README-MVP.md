# 🚀 El Flujo Operativo del MVP (Tú Día a Día)

Sigue estos pasos secuenciales cada vez que quieras crear y publicar una nueva Single Page Application (SPA) para explicar un concepto técnico complejo:

1. 🧠 **Invocación (Generación Inicial)**
   - Envía una petición HTTP `POST` a tu endpoint de Railway: `https://railway.app`
   - Incluye en el cuerpo (JSON) el concepto deseado:
     ```json
     { "concepto": "Mecanismo de consenso Proof of Stake" }
     ```
   - *Resultado:* Gemini creará el JSON estructurado con las escenas y el diseño de un SVG preliminar (`svg_raw`), guardando todo automáticamente en tu base de datos de Neon en estado `IA_RAW`.

2. 🎨 **Diseño y Refinamiento (Figma)**
   - Abre tu cliente de base de datos (Neon Console, TablePlus o DBeaver) y busca el registro recién creado.
   - Copia todo el string de la columna `json_original.svg_raw`.
   - Ve a Figma y presiona `Ctrl+V` (Figma interpretará el código e inyectará los vectores visuales en tu lienzo al instante).
   - Ajusta la estética, limpia imperfecciones y, en el panel de capas izquierdo, renombra los elementos clave con IDs semánticos fijos (ej: `#nodo-validador`, `#bloque-transaccion`).

3. 📦 **Almacenamiento del Asset (Vercel Blobs)**
   - Da clic derecho sobre el frame de tu SVG en Figma, selecciona *Export as SVG* y asegúrate de marcar la casilla *"Include ID attributes"*.
   - Entra al dashboard web de tu cuenta de Vercel, navega a la sección **Storage -> Blobs** y arrastra el archivo SVG recién exportado.
   - Copia la URL pública generada por el CDN de Vercel (ej: `https://vercel-storage.com`).

4. ✍️ **Ajuste Fino de Datos (Neon)**
   - Regresa a tu gestor de base de datos (Neon) para actualizar el registro del concepto.
   - Pega la URL de Vercel Blobs en la columna `svg_final_url`.
   - Modifica los campos necesarios en la columna `json_modificado`:
     - Pule la ortografía o redacción técnica de los textos de cada escena si lo consideras necesario.
     - Vincula los `targetId` de las animaciones a los IDs reales exactos que definiste en el paso 2 en Figma (ej: `#nodo-validador`).
   - Cambia el valor de la columna `estado` a `'LISTO_PARA_PRODUCCION'`.

5. 🌐 **Visualización y Lanzamiento Estructurado**
   - Entra desde tu navegador a la URL de tu frontend en Angular concatenando el slug generado (ej: `https://vercel.app`).
   - El template de Angular descargará el SVG final de Vercel Blobs, lo montará dinámicamente exponiendo sus vectores al DOM y GSAP ejecutará el scrollytelling en perfecta sincronía.
