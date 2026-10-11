<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 520px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Subir estado de cuenta</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Excel o CSV que baja de tu banca en línea. Si lo subes otra vez, solo se suman las
              líneas nuevas.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="imp-cuenta" class="safic-campo__etiqueta">Cuenta</label>
            <q-select
              v-model="f.cuentaBancariaId"
              for="imp-cuenta"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="opciones"
              :loading="cuentas.isPending.value"
              :error="!!errores.cuentaBancariaId"
              :error-message="errores.cuentaBancariaId"
            />
          </div>

          <div class="safic-campo">
            <span class="safic-campo__etiqueta">Mes</span>
            <div class="text-weight-bold">{{ nombreMes(f.periodo) }}</div>
          </div>

          <div class="safic-campo">
            <label for="imp-archivo" class="safic-campo__etiqueta">Archivo</label>
            <input id="imp-archivo" type="file" accept=".xlsx,.csv" @change="alElegir" />
            <div v-if="errores.archivo" class="imp__error" role="alert">{{ errores.archivo }}</div>
          </div>

          <details class="imp__saldos">
            <summary>El archivo no trae saldos</summary>
            <div class="imp__saldos-campos">
              <q-input
                v-model="f.saldoInicial"
                class="safic-input"
                outlined
                dense
                prefix="$"
                label="Saldo inicial"
                inputmode="decimal"
                hide-bottom-space
                :error="!!errores.saldoInicial"
                :error-message="errores.saldoInicial"
              />
              <q-input
                v-model="f.saldoFinal"
                class="safic-input"
                outlined
                dense
                prefix="$"
                label="Saldo final"
                inputmode="decimal"
                hide-bottom-space
                :error="!!errores.saldoFinal"
                :error-message="errores.saldoFinal"
              />
            </div>
          </details>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="importar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Importar"
              :loading="importar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { useCuentasBancarias } from '@/modules/configuracion/composables/useCuentasBancarias';
import { nombreMes } from '@/utils/periodo';

import { useImportarEstado } from '../composables/useConciliacion';
import {
  normalizarSaldo,
  validarImportar,
  type ErroresImportar,
  type FormularioImportar,
} from '../conciliacion.logica';
import type { ResultadoImportacion } from '../services/conciliacion.service';

const props = defineProps<{ periodo: string; cuentaBancariaId?: number | null }>();
const session = useSessionStore();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<ResultadoImportacion>();

const cuentas = useCuentasBancarias();
const opciones = computed(() =>
  (cuentas.data.value ?? [])
    .filter((c) => c.activa)
    .map((c) => ({
      value: c.id,
      label: `${c.banco} · ${c.tipo === 'ahorros' ? 'Ahorros' : 'Corriente'} ····${c.numero.slice(-4)}`,
    })),
);

const f = reactive<FormularioImportar>({
  cuentaBancariaId: props.cuentaBancariaId ?? null,
  periodo: props.periodo,
  saldoInicial: '',
  saldoFinal: '',
});
const archivo = ref<File | null>(null);
const errores = reactive<ErroresImportar>({});
const errorGeneral = ref<string | null>(null);
const importar = useImportarEstado();

// Si cambia el condominio con el diálogo abierto, se cierra: las cuentas ya no serían las mismas
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

function alElegir(e: Event): void {
  archivo.value = (e.target as HTMLInputElement).files?.[0] ?? null;
}

async function enviar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se importa dos veces
  if (importar.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['cuentaBancariaId', 'archivo', 'saldoInicial', 'saldoFinal'] as const)
    errores[k] = undefined;

  const problemas = validarImportar(f, archivo.value);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    onDialogOK(
      await importar.mutateAsync({
        cuentaBancariaId: f.cuentaBancariaId ?? 0,
        periodo: f.periodo,
        archivo: archivo.value as File,
        saldoInicial: f.saldoInicial.trim() === '' ? null : normalizarSaldo(f.saldoInicial),
        saldoFinal: f.saldoFinal.trim() === '' ? null : normalizarSaldo(f.saldoFinal),
      }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    errores.cuentaBancariaId = apiError.campo('cuenta_bancaria_id');
    errores.archivo = apiError.campo('archivo');
    errores.saldoInicial = apiError.campo('saldo_inicial');
    errores.saldoFinal = apiError.campo('saldo_final');
    if (
      !errores.cuentaBancariaId &&
      !errores.archivo &&
      !errores.saldoInicial &&
      !errores.saldoFinal
    ) {
      // Sin respuesta o 5xx las líneas pudieron importarse: volver a subir no las duplica
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa la lista: si ya aparece el mes, se importó.`
        : apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.imp__error {
  font-size: 12px;
  font-weight: 700;
  color: #9b1c12;
}

.imp__saldos {
  font-size: 14px;
}

.imp__saldos summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.imp__saldos-campos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
</style>
