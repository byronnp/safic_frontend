<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 560px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 16px">
          <div class="safic-dialogo__titulo">{{ punto ? 'Editar punto' : 'Agregar punto' }}</div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="pto-titulo" class="safic-campo__etiqueta">Punto</label>
            <q-input
              v-model="f.titulo"
              for="pto-titulo"
              class="safic-input"
              outlined
              autofocus
              maxlength="160"
              hide-bottom-space
              :error="!!errores.titulo"
              :error-message="errores.titulo"
            />
          </div>

          <div class="safic-campo">
            <label for="pto-tipo" class="safic-campo__etiqueta">Tipo</label>
            <q-select
              v-model="f.tipo"
              for="pto-tipo"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="opcionesTipo"
            />
            <div class="pto__ayuda">{{ ayudaTipo }}</div>
          </div>

          <div v-if="f.tipo === 'votacion' || f.tipo === 'eleccion'" class="safic-campo">
            <label for="pto-mayoria" class="safic-campo__etiqueta">Mayoría</label>
            <q-select
              v-model="f.mayoria"
              for="pto-mayoria"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="[
                {
                  label: 'Simple · más de la mitad de los votos de los concurrentes',
                  value: 'simple',
                },
                { label: 'Calificada · con su porcentaje', value: 'calificada' },
              ]"
            />
          </div>

          <template v-if="seExigeUmbral(f)">
            <div class="safic-campo">
              <label for="pto-umbral" class="safic-campo__etiqueta"
                >Porcentaje que debe alcanzar el «sí»</label
              >
              <q-input
                v-model="f.umbral"
                for="pto-umbral"
                class="safic-input"
                outlined
                inputmode="decimal"
                suffix="%"
                hide-bottom-space
                :placeholder="
                  porcentajeReforma ? `Reglas del condominio: ${porcentajeReforma}` : undefined
                "
                :error="!!errores.umbral"
                :error-message="errores.umbral"
              />
              <div v-if="f.tipo === 'reforma_reglamento'" class="pto__ayuda">
                La reforma se calcula sobre el total de alícuotas (Art. 39). El porcentaje exacto de
                la ley hay que confirmarlo con asesoría legal.
              </div>
            </div>
            <div v-if="f.tipo !== 'reforma_reglamento'" class="safic-campo">
              <label for="pto-base" class="safic-campo__etiqueta">Se calcula sobre</label>
              <q-select
                v-model="f.base"
                for="pto-base"
                class="safic-input"
                outlined
                emit-value
                map-options
                hide-bottom-space
                :options="[
                  { label: 'El total de alícuotas', value: 'total' },
                  { label: 'Las alícuotas presentes', value: 'presentes' },
                ]"
              />
            </div>
          </template>

          <div class="safic-campo">
            <label for="pto-desc" class="safic-campo__etiqueta">Descripción (opcional)</label>
            <q-input
              v-model="f.descripcion"
              for="pto-desc"
              class="safic-input"
              outlined
              type="textarea"
              autogrow
              maxlength="2000"
              hide-bottom-space
              :error="!!errores.descripcion"
              :error-message="errores.descripcion"
            />
          </div>

          <div class="safic-campo">
            <label for="pto-informe" class="safic-campo__etiqueta">Informe (PDF, opcional)</label>
            <div v-if="punto?.adjunto_nombre && !quitarInforme" class="pto__informe">
              <q-icon name="sym_r_attach_file" size="18px" />
              <span class="col-grow">{{ punto.adjunto_nombre }}</span>
              <q-btn
                flat
                dense
                no-caps
                color="negative"
                label="Quitar"
                @click="quitarInforme = true"
              />
            </div>
            <q-file
              v-model="informe"
              for="pto-informe"
              class="safic-input"
              outlined
              accept="application/pdf"
              max-file-size="10485760"
              clearable
              hide-bottom-space
              :label="
                punto?.adjunto_nombre && !quitarInforme
                  ? 'Reemplazar el informe'
                  : 'Elegir el informe'
              "
              :error="!!errorInforme"
              :error-message="errorInforme ?? undefined"
              @rejected="errorInforme = 'El informe debe ser un PDF de hasta 10 MB.'"
              @update:model-value="errorInforme = null"
            >
              <template #prepend><q-icon name="sym_r_picture_as_pdf" /></template>
            </q-file>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="ocupado"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              :label="punto ? 'Guardar punto' : 'Agregar punto'"
              :loading="ocupado"
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

import {
  aSolicitudPunto,
  formularioDePunto,
  puntoVacio,
  seExigeUmbral,
  TIPOS_PUNTO,
  validarPunto,
  type ErroresPunto,
} from '../asambleas.logica';
import {
  useAdjuntarInforme,
  useAgregarPunto,
  useEditarPunto,
  useQuitarInforme,
} from '../composables/useAsambleas';
import type { PuntoAsamblea } from '../services/asambleas.service';

const props = defineProps<{
  asambleaId: number;
  punto: PuntoAsamblea | null;
  /** El % para reformar el reglamento que guardó el condominio, si lo hay. */
  porcentajeReforma: string | null;
}>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

// Si cambia el condominio con el diálogo abierto, se cierra: la asamblea ya no sería de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const f = reactive(props.punto ? formularioDePunto(props.punto) : puntoVacio());
const errores = reactive<ErroresPunto>({});
const errorGeneral = ref<string | null>(null);
const informe = ref<File | null>(null);
const errorInforme = ref<string | null>(null);
const quitarInforme = ref(false);

const agregando = useAgregarPunto();
const editando = useEditarPunto();
const adjuntando = useAdjuntarInforme();
const quitando = useQuitarInforme();
const ocupado = computed(
  () =>
    agregando.isPending.value ||
    editando.isPending.value ||
    adjuntando.isPending.value ||
    quitando.isPending.value,
);

const opcionesTipo = (Object.keys(TIPOS_PUNTO) as (keyof typeof TIPOS_PUNTO)[]).map((valor) => ({
  label: TIPOS_PUNTO[valor].nombre,
  value: valor,
}));

const AYUDAS = {
  informativo: 'Solo se trata: no se vota.',
  votacion: 'Cada unidad vota Sí, No o Abstención; se decide por mayoría.',
  eleccion: 'Elección de la directiva: se vota por candidato.',
  reforma_reglamento:
    'Reforma del reglamento interno: mayoría calificada sobre el total de alícuotas.',
} as const;
const ayudaTipo = computed(() => AYUDAS[f.tipo]);

async function guardar(): Promise<void> {
  if (ocupado.value) return;
  errorGeneral.value = null;
  for (const k of ['titulo', 'descripcion', 'umbral'] as const) errores[k] = undefined;

  const problemas = validarPunto(f, props.porcentajeReforma);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    const datos = aSolicitudPunto(f);
    const detalle = props.punto
      ? await editando.mutateAsync({ id: props.asambleaId, puntoId: props.punto.id, datos })
      : await agregando.mutateAsync({ id: props.asambleaId, datos });
    // El punto nuevo queda al final; el que se edita ya tiene su id
    const puntoId = props.punto?.id ?? detalle.puntos.at(-1)?.id;

    if (puntoId !== undefined) {
      if (informe.value !== null) {
        await adjuntando.mutateAsync({ id: props.asambleaId, puntoId, archivo: informe.value });
      } else if (quitarInforme.value) {
        await quitando.mutateAsync({ id: props.asambleaId, puntoId });
      }
    }
    onDialogOK(props.punto ? 'Punto guardado.' : 'Punto agregado al orden del día.');
  } catch (error) {
    const apiError = aApiError(error);
    errores.titulo = apiError.campo('titulo');
    errores.descripcion = apiError.campo('descripcion');
    errores.umbral =
      apiError.campo('umbral_pct') ??
      (apiError.codigo === 'UMBRAL_REQUERIDO' ? apiError.mensaje : undefined);
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el punto pudo guardarse: se avisa para no duplicarlo
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa el orden del día antes de reintentar: el punto pudo guardarse.`
          : apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.pto__ayuda {
  margin-top: 4px;
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.pto__informe {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
  background: var(--safic-fondo-2);
  font-size: 14px;
}
</style>
