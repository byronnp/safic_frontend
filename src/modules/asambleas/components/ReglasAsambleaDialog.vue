<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 520px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 16px">
          <div>
            <div class="safic-dialogo__titulo">Reglas de asamblea</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Los valores de la ley rigen mientras no cambies nada. Ajusta solo lo que indique el
              reglamento interno del condominio.
            </div>
          </div>

          <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
            {{ consulta.error.value?.mensaje }}
            <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
          </div>
          <q-skeleton v-else-if="consulta.isPending.value" type="rect" height="160px" />

          <template v-else>
            <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

            <q-toggle v-model="f.permiteVirtual" label="Permitir asambleas virtuales o mixtas" />
            <div class="reg__ayuda">
              La ley habla de convocatoria escrita y firmas autógrafas y no regula las asambleas
              telemáticas: actívalo solo si tu reglamento interno las permite.
            </div>

            <q-toggle
              v-model="f.moraCuentaParaQuorum"
              label="La unidad en mora cuenta para el quórum (pero no vota)"
            />
            <q-toggle
              v-model="f.votoSecreto"
              label="Voto secreto (se publica solo el total por opción)"
            />

            <div class="safic-campo">
              <label for="reg-pct" class="safic-campo__etiqueta"
                >Porcentaje para reformar el reglamento</label
              >
              <q-input
                v-model="f.porcentaje"
                for="reg-pct"
                class="safic-input"
                outlined
                inputmode="decimal"
                suffix="%"
                placeholder="Sin definir"
                hide-bottom-space
                :error="!!errorPorcentaje"
                :error-message="errorPorcentaje ?? undefined"
              />
              <div class="reg__ayuda">
                Mayor que 50 y hasta 100. Sin valor, cada punto de reforma debe indicar el suyo.
                Confírmalo con asesoría legal.
              </div>
            </div>

            <div class="row justify-end" style="gap: 10px">
              <q-btn
                unelevated
                no-caps
                class="safic-btn safic-btn--secundario"
                label="Cancelar"
                :disable="guardando.isPending.value"
                @click="onDialogCancel"
              />
              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="safic-btn"
                label="Guardar reglas"
                :loading="guardando.isPending.value"
              />
            </div>
          </template>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { normalizarUmbral } from '../asambleas.logica';
import {
  useConfiguracionAsambleas,
  useGuardarConfiguracionAsambleas,
} from '../composables/useAsambleas';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const consulta = useConfiguracionAsambleas();
const guardando = useGuardarConfiguracionAsambleas();
const f = reactive({
  permiteVirtual: false,
  moraCuentaParaQuorum: true,
  votoSecreto: false,
  porcentaje: '',
});
const errorGeneral = ref<string | null>(null);
const errorPorcentaje = ref<string | null>(null);

// Se rellena una sola vez, cuando llegan las reglas vigentes (si ya estaban en la caché, de inmediato)
let rellenado = false;
watch(
  () => consulta.data.value,
  (c) => {
    if (c && !rellenado) {
      rellenado = true;
      f.permiteVirtual = c.permite_virtual;
      f.moraCuentaParaQuorum = c.mora_cuenta_para_quorum;
      f.votoSecreto = c.voto_secreto;
      f.porcentaje = c.porcentaje_reforma === null ? '' : String(Number(c.porcentaje_reforma));
    }
  },
  { immediate: true },
);

async function guardar(): Promise<void> {
  if (guardando.isPending.value) return;
  errorGeneral.value = null;
  errorPorcentaje.value = null;

  const indicado = f.porcentaje.trim() !== '';
  const porcentaje = indicado ? normalizarUmbral(f.porcentaje) : null;
  if (indicado && porcentaje === null) {
    errorPorcentaje.value = 'Indica un porcentaje mayor que 50 y hasta 100 (hasta dos decimales).';
    return;
  }

  try {
    await guardando.mutateAsync({
      permite_virtual: f.permiteVirtual,
      mora_cuenta_para_quorum: f.moraCuentaParaQuorum,
      voto_secreto: f.votoSecreto,
      porcentaje_reforma: porcentaje === null ? null : porcentaje.toFixed(2),
    });
    onDialogOK('Reglas de asamblea guardadas.');
  } catch (error) {
    const apiError = aApiError(error);
    errorPorcentaje.value = apiError.campo('porcentaje_reforma') ?? null;
    if (errorPorcentaje.value === null) errorGeneral.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.reg__ayuda {
  margin-top: -8px;
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}
</style>
