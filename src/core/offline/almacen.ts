/**
 * Almacén local del dispositivo (IndexedDB) para lo que debe sobrevivir a un corte de red: la copia de los QR del día y los
 * ingresos de la garita pendientes de enviar. No usa localStorage (reservado a preferencias) y se vacía al cerrar sesión.
 *
 * Es mínimo a propósito: clave → valor JSON. Si IndexedDB no existe o falla (navegación privada, almacenamiento lleno), todo
 * responde como «no hay nada guardado» y la app sigue funcionando solo con conexión.
 */
const BASE = 'safic-offline';
const ALMACEN = 'kv';

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolver) => {
    if (typeof indexedDB === 'undefined') {
      resolver(null);
      return;
    }
    try {
      const peticion = indexedDB.open(BASE, 1);
      peticion.onupgradeneeded = () => peticion.result.createObjectStore(ALMACEN);
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => resolver(null);
      peticion.onblocked = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
}

async function operar<T>(
  modo: IDBTransactionMode,
  accion: (a: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const db = await abrir();
  if (!db) return null;
  return new Promise((resolver) => {
    try {
      const tx = db.transaction(ALMACEN, modo);
      const peticion = accion(tx.objectStore(ALMACEN));
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => resolver(null);
      tx.oncomplete = () => db.close();
      tx.onabort = () => {
        db.close();
        resolver(null);
      };
    } catch {
      db.close();
      resolver(null);
    }
  });
}

export async function leerLocal<T>(clave: string): Promise<T | null> {
  const valor = await operar('readonly', (a) => a.get(clave) as IDBRequest<T | undefined>);
  return valor ?? null;
}

/** true si quedó guardado. */
export async function guardarLocal(clave: string, valor: unknown): Promise<boolean> {
  return (await operar('readwrite', (a) => a.put(valor, clave))) !== null;
}

export async function borrarLocal(clave: string): Promise<void> {
  await operar('readwrite', (a) => a.delete(clave));
}

/** Borra todas las claves que terminan en `sufijo` (de cualquier usuario). */
export async function borrarClavesConSufijo(sufijo: string): Promise<void> {
  const claves = await operar('readonly', (a) => a.getAllKeys());
  for (const clave of claves ?? []) {
    if (typeof clave === 'string' && clave.endsWith(sufijo)) await borrarLocal(clave);
  }
}
