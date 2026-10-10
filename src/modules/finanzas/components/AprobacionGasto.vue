<template>
  <section class="aprob" aria-label="Aprobación de la factura">
    <div class="aprob__seccion">APROBACIÓN</div>

    <div v-if="detalle.isPending.value" aria-busy="true">
      <q-skeleton type="rect" height="90px" />
    </div>
    <div v-else-if="detalle.isError.value" class="safic-alerta" role="alert">
      {{ detalle.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="detalle.refetch()" />
    </div>

    <template v-else-if="gasto">
      <ol class="aprob__pasos">
        <li class="aprob__paso aprob__paso--hecho">
          <q-icon name="sym_r_check_circle" size="20px" />
          <div>
            <div class="text-weight-bold">
              Registrada{{ gasto.registrada_por ? ` por ${gasto.registrada_por}` : '' }}
            </div>
            <div class="aprob__sub">
              {{ fechaHora(gasto.registrada_en) }} ·
              {{ gasto.origen === 'xml' ? 'XML del SRI leído' : 'Registrada a mano' }}
            </div>
          </div>
        </li>

        <li
          v-for="a in gasto.aprobaciones"
          :key="`${a.nivel}-${a.decision}`"
          class="aprob__paso"
          :class="a.decision === 'aprobada' ? 'aprob__paso--hecho' : 'aprob__paso--rechazo'"
        >
          <q-icon
            :name="a.decision === 'aprobada' ? 'sym_r_check_circle' : 'sym_r_cancel'"
            size="20px"
          />
          <div>
            <div class="text-weight-bold">{{ textoAprobacion(a) }}</div>
            <div class="aprob__sub">
              {{ fechaHora(a.en) }}<template v-if="a.comentario"> · «{{ a.comentario }}»</template>
            </div>
          </div>
        </li>

        <li v-if="gasto.estado === 'por_aprobar'" class="aprob__paso">
          <q-icon name="sym_r_pending" size="20px" />
          <div>
            <div class="text-weight-bold">
              {{
                gasto.nivel_pendiente === 2
                  ? 'Nivel 2 · presidente o vicepresidente'
                  : 'Nivel 1 · administración'
              }}
            </div>
            <div v-if="gasto.requiere_segunda_aprobacion" class="aprob__sub">
              Supera el umbral de segunda aprobación del condominio.
            </div>
          </div>
        </li>
      </ol>

      <template v-if="nivel !== null">
        <div v-if="error" class="safic-alerta" role="alert">{{ error }}</div>

        <div v-if="puedeAprobarla" class="safic-campo">
          <label :for="`aprob-motivo-${gasto.id}`" class="safic-campo__etiqueta">
            Comentario o motivo (obligatorio si rechazas)
          </label>
          <q-input
            :id="`aprob-motivo-${gasto.id}`"
            v-model="texto"
            class="safic-input"
            outlined
            type="textarea"
            autogrow
            maxlength="300"
            hide-bottom-space
            :error="!!errorMotivo"
            :error-message="errorMotivo"
          />
        </div>
        <div v-else class="aprob__sub">Registraste esta factura: otra persona debe aprobarla.</div>

        <div v-if="puedeAprobarla" class="aprob__botones">
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Rechazar"
            :disable="ocupado"
            :loading="rechazar.isPending.value"
            @click="alRechazar"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            :label="`Aprobar ${formatoMoneda(gasto.total)}`"
            :disable="ocupado"
            :loading="aprobar.isPending.value"
            @click="alAprobar"
          />
        </div>
      </template>
      <div v-else-if="gasto.estado === 'por_aprobar'" class="aprob__sub">
        {{
          gasto.nivel_pendiente === 2
            ? 'Espera la segunda aprobación de la directiva.'
            : 'Espera la primera aprobación de la administración.'
        }}
      </div>
      <div v-if="gasto.estado === 'rechazada' && gasto.motivo_rechazo" class="aprob__rechazo">
        Motivo del rechazo: {{ gasto.motivo_rechazo }}
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { formatoMoneda } from '@/utils/formato';

import { useAprobarGasto, useGasto, useRechazarGasto } from '../composables/useGastos';
import { fechaHora, nivelQuePuedeDar, textoAprobacion, validarMotivo } from '../proveedores.logica';

const props = defineProps<{ gastoId: number }>();
const emit = defineEmits<{ resuelto: [mensaje: string] }>();

const session = useSessionStore();

const detalle = useGasto(computed(() => props.gastoId));
const gasto = computed(() => detalle.data.value ?? null);
const aprobar = useAprobarGasto();
const rechazar = useRechazarGasto();

// Mostrar los botones es comodidad; la API exige el permiso del nivel y que no la haya registrado quien aprueba.
const nivel = computed(() =>
  gasto.value ? nivelQuePuedeDar(gasto.value, (p) => session.tienePermiso(p)) : null,
);
const puedeAprobarla = computed(() => nivel.value !== null && !gasto.value?.registrada_por_mi);

const texto = ref('');
const errorMotivo = ref<string | undefined>(undefined);
const error = ref<string | null>(null);
const ocupado = computed(() => aprobar.isPending.value || rechazar.isPending.value);

watch(
  () => props.gastoId,
  () => {
    texto.value = '';
    errorMotivo.value = undefined;
    error.value = null;
  },
);

async function alAprobar(): Promise<void> {
  // Un segundo clic mientras responde no aprueba dos veces
  if (ocupado.value) return;
  error.value = null;
  try {
    const g = await aprobar.mutateAsync({
      id: props.gastoId,
      comentario: texto.value.trim() || null,
    });
    texto.value = '';
    emit(
      'resuelto',
      g.estado === 'aprobada'
        ? 'Factura aprobada. Ya se puede pagar.'
        : 'Primera aprobación registrada. Falta la de la directiva.',
    );
  } catch (e) {
    error.value = aApiError(e).mensaje;
  }
}

async function alRechazar(): Promise<void> {
  if (ocupado.value) return;
  error.value = null;
  errorMotivo.value = validarMotivo(texto.value);
  if (errorMotivo.value) return;
  try {
    await rechazar.mutateAsync({ id: props.gastoId, motivo: texto.value.trim() });
    texto.value = '';
    emit('resuelto', 'Factura rechazada.');
  } catch (e) {
    const apiError = aApiError(e);
    errorMotivo.value = apiError.campo('motivo');
    if (!errorMotivo.value) error.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.aprob {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aprob__seccion {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: var(--safic-texto-suave);
}

.aprob__pasos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aprob__paso {
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.aprob__paso--hecho {
  color: #0b4a47;
}

.aprob__paso--rechazo {
  color: #9b1c12;
}

.aprob__paso > div {
  color: var(--safic-texto);
}

.aprob__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.aprob__botones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.aprob__rechazo {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fde8e6;
  color: #9b1c12;
  font-size: 13px;
  font-weight: 700;
}
</style>
