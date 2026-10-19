<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 560px; max-width: 100%">
      <div class="q-pa-lg column" style="gap: 16px">
        <div>
          <div class="safic-dialogo__titulo">Daños reportados</div>
          <div v-if="detalle" class="text-suave q-mt-xs" style="font-size: 14px">
            {{ detalle.area }} · {{ detalle.unidad }} · {{ fechaCorta(detalle.fecha) }}
            {{ detalle.inicio }}–{{ detalle.fin }}
          </div>
        </div>

        <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
          {{ consulta.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
        </div>
        <q-skeleton v-else-if="consulta.isPending.value" type="rect" height="160px" />

        <template v-else-if="detalle">
          <section class="danos__reporte" aria-label="Reporte del guardia">
            <p class="danos__texto">{{ detalle.danos }}</p>
            <div class="danos__meta">
              Recibida{{ detalle.recibida_por ? ` por ${detalle.recibida_por}` : '' }}
              <template v-if="detalle.recibida_en"> · {{ horaDe(detalle.recibida_en) }}</template>
            </div>
            <div v-if="fotos.length > 0" class="danos__fotos">
              <a
                v-for="foto in fotos"
                :key="foto.id"
                :href="foto.url"
                target="_blank"
                rel="noopener noreferrer"
                class="danos__foto"
              >
                <img :src="foto.url" alt="Foto del daño" loading="lazy" />
              </a>
            </div>
            <div v-else class="danos__meta">Sin fotos.</div>
          </section>

          <div class="danos__garantia">
            Garantía de la reserva: <strong>{{ formatoMoneda(detalle.garantia) }}</strong>
          </div>

          <section v-if="detalle.resolucion" class="danos__resolucion" aria-label="Decisión">
            <div class="danos__decision">{{ textoDecision(detalle.resolucion.decision) }}</div>
            <div v-if="detalle.resolucion.monto">
              Valor del daño: {{ formatoMoneda(detalle.resolucion.monto) }}
              <template v-if="detalle.resolucion.cobrada_en_cuota">
                · cobrado en la cuenta de la unidad
              </template>
            </div>
            <div v-if="detalle.resolucion.nota" class="danos__meta">
              {{ detalle.resolucion.nota }}
            </div>
            <div v-if="textoPorDevolver(detalle.resolucion.por_devolver)" class="danos__devolver">
              {{ textoPorDevolver(detalle.resolucion.por_devolver) }}
            </div>
          </section>

          <q-form
            v-else-if="puedeGestionar"
            novalidate
            class="column"
            style="gap: 14px"
            @submit="guardar"
          >
            <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

            <div role="radiogroup" aria-label="Qué hacer con los daños" class="danos__opciones">
              <button
                v-for="o in OPCIONES_DECISION"
                :key="o.valor"
                type="button"
                role="radio"
                class="danos__opcion"
                :class="{ 'danos__opcion--elegida': f.decision === o.valor }"
                :aria-checked="f.decision === o.valor"
                @click="elegir(o.valor)"
              >
                <span class="danos__opcion-titulo">{{ o.titulo }}</span>
                <span class="danos__meta">{{ o.ayuda }}</span>
              </button>
            </div>
            <div v-if="errores.decision" class="danos__error" role="alert">
              {{ errores.decision }}
            </div>

            <div v-if="f.decision && f.decision !== 'sin_cargo'" class="safic-campo">
              <label for="dan-monto" class="safic-campo__etiqueta">Valor del daño</label>
              <q-input
                v-model="f.monto"
                for="dan-monto"
                class="safic-input"
                outlined
                inputmode="decimal"
                prefix="$"
                hide-bottom-space
                :error="!!errores.monto"
                :error-message="errores.monto"
              />
            </div>

            <div class="safic-campo">
              <label for="dan-nota" class="safic-campo__etiqueta">Nota (opcional)</label>
              <q-input
                v-model="f.nota"
                for="dan-nota"
                class="safic-input"
                outlined
                type="textarea"
                autogrow
                maxlength="300"
                hide-bottom-space
                :error="!!errores.nota"
                :error-message="errores.nota"
              />
            </div>

            <div class="danos__aviso">
              El sistema no devuelve dinero: lo que quede por devolver de la garantía se hace
              aparte. Solo «Cobrar a la cuenta» crea un cargo, y se decide una sola vez.
            </div>

            <div class="row justify-end" style="gap: 10px">
              <q-btn
                unelevated
                no-caps
                class="safic-btn safic-btn--secundario"
                label="Cerrar"
                :disable="resolviendo.isPending.value"
                @click="onDialogCancel"
              />
              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="safic-btn"
                label="Guardar decisión"
                :loading="resolviendo.isPending.value"
              />
            </div>
          </q-form>
        </template>

        <div v-if="!(puedeDecidir && puedeGestionar)" class="row justify-end">
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Cerrar"
            @click="onDialogCancel"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { urlSegura } from '@/modules/comunicacion/anuncios.logica';
import { useSessionStore } from '@/stores/session';
import { formatoMoneda } from '@/utils/formato';

import { useDetalleDanos, useResolverDanos } from '../composables/useDanos';
import {
  aSolicitud,
  danosVacio,
  OPCIONES_DECISION,
  textoDecision,
  textoPorDevolver,
  validarDanos,
  type ErroresDanos,
} from '../danos.logica';
import { fechaCorta } from '../reservas.logica';
import type { DecisionDanos } from '../services/danos.service';

const props = defineProps<{ reservaId: number }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

// Si cambia el condominio con el diálogo abierto, se cierra: la reserva ya no sería de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

// Mostrar el formulario es comodidad; la API exige reservas.gestionar igual.
const puedeGestionar = computed(() => session.tienePermiso('reservas.gestionar'));

const consulta = useDetalleDanos(computed(() => props.reservaId));
const detalle = computed(() => consulta.data.value ?? null);
// Solo enlaces https: vienen de la API, pero no se confía a ciegas
const fotos = computed(() =>
  (detalle.value?.fotos ?? []).flatMap((x) => {
    const url = urlSegura(x.url);
    return url === null ? [] : [{ id: x.id, url }];
  }),
);
const puedeDecidir = computed(() => detalle.value !== null && detalle.value.resolucion === null);

const f = reactive(danosVacio());
const errores = reactive<ErroresDanos>({});
const errorGeneral = ref<string | null>(null);
const resolviendo = useResolverDanos();

function elegir(decision: DecisionDanos): void {
  f.decision = decision;
  errores.decision = undefined;
}

function horaDe(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guayaquil',
  });
}

async function guardar(): Promise<void> {
  if (resolviendo.isPending.value || detalle.value === null) return;
  errorGeneral.value = null;
  for (const k of ['decision', 'monto', 'nota'] as const) errores[k] = undefined;

  const problemas = validarDanos(f, detalle.value.garantia);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await resolviendo.mutateAsync({ reservaId: props.reservaId, datos: aSolicitud(f) });
    onDialogOK(
      f.decision === 'cobrar_cuenta'
        ? 'Daño cobrado en la cuenta de la unidad.'
        : 'Decisión guardada. Lo que quede por devolver de la garantía se hace aparte.',
    );
  } catch (error) {
    const apiError = aApiError(error);
    if (apiError.codigo === 'DANOS_YA_RESUELTOS') {
      // Otra persona decidió antes: se muestra lo que quedó
      void consulta.refetch();
    }
    errores.decision = apiError.campo('decision');
    errores.monto = apiError.campo('monto');
    errores.nota = apiError.campo('nota');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx la decisión pudo guardarse: se avisa para no duplicar un cobro
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa la decisión antes de reintentar: pudo guardarse.`
          : apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.danos__reporte,
.danos__resolucion {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  background: #f7f6f2;
}

.danos__texto {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}

.danos__meta {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.danos__fotos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.danos__foto img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--safic-borde);
  display: block;
}

.danos__garantia {
  font-size: 14px;
}

.danos__decision {
  font-weight: 800;
}

.danos__devolver {
  font-weight: 700;
  color: #8a3f0a;
}

.danos__opciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.danos__opcion {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 10px 14px;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  background: #ffffff;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.danos__opcion--elegida {
  border: 2px solid var(--q-primary);
  padding: 9px 13px;
}

.danos__opcion-titulo {
  font-weight: 700;
}

.danos__error {
  font-size: 12px;
  color: var(--q-negative);
}

.danos__aviso {
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
