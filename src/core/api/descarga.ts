import { api } from './client';

/**
 * Pide un archivo (PDF, Excel…) a la API con la sesión. Si falla, el cliente HTTP ya leyó el
 * cuerpo del error (llega como Blob) y lanza un `ApiError` con el código y el mensaje de la API.
 */
export async function pedirArchivo(ruta: string): Promise<Blob> {
  const { data } = await api.get<Blob>(ruta, { responseType: 'blob' });
  return data;
}

/** Entrega el archivo al navegador como descarga. */
export function guardarArchivo(blob: Blob, nombre: string): void {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  enlace.click();
  // Algunos navegadores cancelan la descarga si se revoca al instante
  setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000);
}
