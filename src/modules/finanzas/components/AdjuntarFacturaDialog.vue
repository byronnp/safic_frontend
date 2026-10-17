<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 520px; max-width: 100%">
      <div class="q-pa-lg column" style="gap: 16px">
        <div>
          <div class="safic-dialogo__titulo">Adjuntar la factura de {{ recurrente.nombre }}</div>
          <div class="text-suave q-mt-xs" style="font-size: 14px">
            {{ recurrente.proveedor.razon_social }} · {{ nombreMes(periodo) }}. Si aún no registras
            la factura, súbela primero en «Cuentas por pagar».
          </div>
        </div>

        <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

        <div v-if="facturas.isPending.value" aria-busy="true">
          <q-skeleton v-for="i in 3" :key="i" type="rect" height="48px" class="q-mb-sm" />
        </div>
        <div v-else-if="facturas.isError.value" class="safic-alerta" role="alert">
          {{ facturas.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="facturas.refetch()" />
        </div>
        <template v-else>
          <fieldset v-if="(facturas.data.value ?? []).length" class="adj__lista">
            <legend class="safic-campo__etiqueta">Facturas de este proveedor sin vincular</legend>
            <label
              v-for="g in facturas.data.value"
              :key="g.id"
              class="adj__factura"
              :class="{ 'adj__factura--activa': elegida === g.id }"
            >
              <input v-model="elegida" type="radio" name="adj-factura" :value="g.id" />
              <span class="adj__texto">
                <strong>{{ g.numero }}</strong>
                <span class="adj__sub">{{ formatoFecha(g.fecha_emision) }}</span>
              </span>
              <strong>{{ formatoMoneda(g.total) }}</strong>
            </label>
          </fieldset>
          <div v-else class="adj__vacio">
            <q-icon name="sym_r_receipt_long" size="36px" class="text-suave" />
            <div>No hay facturas de {{ recurrente.proveedor.razon_social }} por vincular.</div>
            <q-btn
              flat
              no-caps
              color="primary"
              label="Ir a Cuentas por pagar"
              :to="{ name: 'finanzas-cuentas-por-pagar' }"
              @click="onDialogCancel"
            />
          </div>
        </template>

        <div class="row justify-end" style="gap: 10px">
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Cancelar"
            :disable="vincular.isPending.value"
            @click="onDialogCancel"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            label="Adjuntar factura"
            :disable="elegida === null"
            :loading="vincular.isPending.value"
            @click="adjuntar"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { formatoFecha, formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import { useFacturasCandidatas, useVincularFactura } from '../composables/useRecurrentes';
import type { GastoRecurrente } from '../services/recurrentes.service';

const props = defineProps<{ recurrente: GastoRecurrente; periodo: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const facturas = useFacturasCandidatas(ref(props.recurrente.id));
const vincular = useVincularFactura();
const elegida = ref<number | null>(null);
const errorGeneral = ref<string | null>(null);

async function adjuntar(): Promise<void> {
  // Un segundo clic mientras responde no vincula dos veces
  if (vincular.isPending.value || elegida.value === null) return;
  errorGeneral.value = null;
  try {
    const r = await vincular.mutateAsync({
      id: props.recurrente.id,
      periodo: props.periodo,
      gastoId: elegida.value,
    });
    onDialogOK(
      r.aprobadaAutomaticamente
        ? 'Factura adjuntada y aprobada (nivel 1) automáticamente. Si supera el umbral, falta la segunda aprobación de la directiva.'
        : `Factura adjuntada a ${props.recurrente.nombre}.`,
    );
  } catch (error) {
    const apiError = aApiError(error);
    // Decide el código: ya tenía factura o esa factura ya está en otro gasto; se refresca la lista
    if (apiError.codigo === 'YA_TIENE_FACTURA' || apiError.codigo === 'FACTURA_YA_VINCULADA')
      void facturas.refetch();
    errorGeneral.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.adj__lista {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.adj__factura {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
  cursor: pointer;
}

.adj__factura--activa {
  border: 2px solid var(--q-primary);
  padding: 9px 11px;
}

.adj__texto {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.adj__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.adj__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  text-align: center;
}
</style>
