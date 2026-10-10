<template>
  <span>
    <q-btn
      unelevated
      no-caps
      color="primary"
      class="safic-btn"
      icon="sym_r_upload_file"
      label="Subir factura (XML)"
      :loading="importar.isPending.value"
      @click="entrada?.click()"
    />
    <input
      ref="entrada"
      type="file"
      accept=".xml,text/xml,application/xml"
      class="hidden"
      aria-label="Factura electrónica (XML)"
      @change="alElegir"
    />
  </span>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { formatoMoneda } from '@/utils/formato';

import { useImportarFacturaXml } from '../composables/useGastos';
import type { Gasto } from '../services/gastos.service';

/** Igual que el límite de la API (1 MB). */
const TAMANO_MAXIMO = 1024 * 1024;

const emit = defineEmits<{ importada: [gasto: Gasto]; error: [mensaje: string] }>();

const $q = useQuasar();
const entrada = ref<HTMLInputElement | null>(null);
const importar = useImportarFacturaXml();

async function alElegir(): Promise<void> {
  const archivo = entrada.value?.files?.[0];
  if (entrada.value) entrada.value.value = ''; // permite elegir el mismo archivo otra vez
  // Un segundo clic mientras sube no registra dos veces
  if (!archivo || importar.isPending.value) return;
  if (!archivo.name.toLowerCase().endsWith('.xml')) {
    emit('error', 'El archivo debe ser el XML de la factura (termina en .xml).');
    return;
  }
  if (archivo.size > TAMANO_MAXIMO) {
    emit('error', 'El XML pesa más de 1 MB: no parece una factura.');
    return;
  }

  try {
    const gasto = await importar.mutateAsync({ xml: archivo, pdf: null, vence_el: null });
    $q.notify({
      type: 'positive',
      message: `Factura ${gasto.numero} de ${gasto.proveedor.razon_social} registrada por ${formatoMoneda(gasto.total)}. Queda por aprobar.`,
    });
    emit('importada', gasto);
  } catch (error) {
    const apiError = aApiError(error);
    // Sin respuesta o 5xx la factura pudo guardarse: se avisa para no subirla dos veces
    const incierto = apiError.estado === 0 || apiError.estado >= 500;
    emit(
      'error',
      incierto
        ? `${apiError.mensaje} Revisa la lista antes de volver a subirla: la factura pudo registrarse.`
        : apiError.mensaje,
    );
  }
}
</script>
