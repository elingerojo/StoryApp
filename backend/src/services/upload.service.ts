import { put } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🚀 SERVICIO DE UPLOAD — Vercel Blobs
 * 
 * [MVP]  Subir SVG requería: Dashboard Vercel manual → arrastrar archivo → copiar URL
 * [V1]   Un solo llamado a esta función: recibe el SVG string, lo sube, retorna la URL pública.
 * 
 * Requisito: Configurar BLOB_READ_WRITE_TOKEN en Railway (o .env local)
 * 
 * @param filename  Nombre del archivo (ej: 'bitcoin-pow-consensus.svg')
 * @param svgContent  Código SVG completo como string
 * @returns URL pública del CDN de Vercel Blobs
 */
export async function subirSvgABlob(filename: string, svgContent: string): Promise<string> {
  // Validar que el token de Vercel Blobs esté configurado
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'Falta BLOB_READ_WRITE_TOKEN en las variables de entorno. ' +
      'Configúralo en Railway > Variables > BLOB_READ_WRITE_TOKEN'
    );
  }

  try {
    const blob = await put(filename, svgContent, {
      access: 'public',        // CDN público — cualquiera con la URL puede ver el SVG
      contentType: 'image/svg+xml',  // MIME type correcto para SVGs
      addRandomSuffix: true,   // Evita colisiones de nombres (Vercel añade hash)
    });

    console.log(`✅ SVG subido exitosamente a Vercel Blobs: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error('❌ Error al subir SVG a Vercel Blobs:', error);
    throw error;
  }
}
