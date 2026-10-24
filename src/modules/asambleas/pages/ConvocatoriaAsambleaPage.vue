<template>
  <q-page class="safic-main conv">
    <PaginaEncabezado miga="Asambleas / Convocatoria" :titulo="detalle?.titulo ?? 'Convocatoria'">
      <template #acciones>
        <EstadoBadge
          v-if="detalle"
          :tono="ESTADOS[detalle.estado].tono"
          :texto="ESTADOS[detalle.estado].nombre"
        />
        <q-btn
          flat
          no-caps
          icon="sym_r_arrow_back"
          label="Volver"
          class="safic-btn safic-btn--secundario"
          :to="{ name: 'asambleas-preparar' }"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="safic-alerta conv__ok" role="status">{{ resultado }}</div>
    <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
    <div v-if="consultaAsamblea.isError.value" class="safic-alerta" role="alert">
      {{ consultaAsamblea.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consultaAsamblea.refetch()" />
    </div>

    <div v-if="detalle?.estado === 'cancelada'" class="safic-alerta" role="status">
      Esta asamblea se canceló. Motivo: {{ detalle.motivo_cancelacion }}
    </div>

    <template v-if="detalle">
      <div class="conv__cita">
        <q-icon name="sym_r_event" size="22px" />
        <div>
          <strong>{{ fechaHoraLarga(detalle.fecha_hora) }}</strong>
          <span> · 2.ª convocatoria a las {{ detalle.segunda_convocatoria }} · </span>
          <span>{{ nombreModalidad(detalle.modalidad) }}</span>
          <span v-if="detalle.lugar"> · {{ detalle.lugar }}</span>
        </div>
      </div>

      <div v-if="consulta.isPending.value" class="conv__kpis">
        <q-skeleton v-for="n in 3" :key="n" type="rect" height="84px" />
      </div>
      <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>

      <template v-else-if="c">
        <div class="conv__kpis">
          <div class="conv__kpi">
            <span>Unidades convocadas</span><strong>{{ c.unidades }}</strong>
          </div>
          <div class="conv__kpi">
            <span>Leyeron</span><strong>{{ c.leyeron }}</strong>
          </div>
          <div class="conv__kpi conv__kpi--grande">
            <span>Confirmaron recepción</span>
            <strong
              >{{ c.confirmaron }} de {{ c.unidades }} · {{ c.porcentaje_confirmaron }} %</strong
            >
            <q-linear-progress
              :value="c.porcentaje_confirmaron / 100"
              color="primary"
              track-color="grey-3"
              rounded
              size="8px"
              aria-label="Porcentaje que confirmó"
            />
          </div>
        </div>

        <div class="conv__acciones">
          <q-btn
            v-if="detalle.puede_cancelar"
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            icon="sym_r_forward_to_inbox"
            :label="`Reenviar a las ${c.pendientes.length} pendientes`"
            :disable="c.pendientes.length === 0 || ocupado"
            :loading="reenviando.isPending.value"
            @click="reenviar"
          />
          <q-btn
            flat
            no-caps
            class="safic-btn safic-btn--secundario"
            icon="sym_r_picture_as_pdf"
            label="Exportar constancia (PDF)"
            :disable="ocupado"
            :loading="exportando"
            @click="exportar"
          />
          <q-btn
            v-if="detalle.puede_cancelar"
            flat
            no-caps
            color="negative"
            class="safic-btn"
            icon="sym_r_event_busy"
            label="Cancelar asamblea"
            :disable="ocupado"
            @click="cancelar"
          />
        </div>

        <div class="conv__recordatorios">
          Recordatorios automáticos por correo: 3 días antes (a quienes no confirmaron) y 2 horas
          antes (a todos).
          <span v-if="c.recordatorios.tres_dias">
            El de 3 días se envió el {{ fechaHoraLarga(aLocal(c.recordatorios.tres_dias)) }}.
          </span>
          <span v-if="c.recordatorios.dos_horas">
            El de 2 horas se envió el {{ fechaHoraLarga(aLocal(c.recordatorios.dos_horas)) }}.
          </span>
        </div>

        <div class="conv__tabla">
          <h2 class="conv__titulo">Pendientes de confirmar</h2>
          <div v-if="c.pendientes.length === 0" class="conv__vacio">
            Todas las unidades confirmaron la recepción.
          </div>
          <ul v-else class="conv__lista">
            <li v-for="p in c.pendientes" :key="p.unidad_id" class="conv__item">
              <strong>{{ p.codigo }}</strong>
              <EstadoBadge
                :tono="p.leyo ? 'info' : 'alerta'"
                :texto="p.leyo ? 'Leyó, falta confirmar' : 'No la ha leído'"
              />
            </li>
          </ul>
        </div>
      </template>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { guardarArchivo } from '@/core/api/descarga';
import { aApiError } from '@/core/api/errors';

import { ESTADOS, fechaHoraLarga, nombreModalidad } from '../asambleas.logica';
import {
  useAsamblea,
  useCancelarAsamblea,
  useConvocatoria,
  useReenviarConvocatoria,
} from '../composables/useAsambleas';
import { asambleasService } from '../services/asambleas.service';

const $q = useQuasar();
const route = useRoute();
const id = computed(() => Number(route.params.id));

const consultaAsamblea = useAsamblea(id);
const detalle = computed(() => consultaAsamblea.data.value ?? null);
// El seguimiento solo existe si ya se convocó (un borrador responde 409)
const convocada = computed(() => detalle.value !== null && detalle.value.estado !== 'borrador');
const consulta = useConvocatoria(id, convocada);
const c = computed(() => consulta.data.value ?? null);

const reenviando = useReenviarConvocatoria();
const cancelando = useCancelarAsamblea();
const exportando = ref(false);
const ocupado = computed(
  () => reenviando.isPending.value || cancelando.isPending.value || exportando.value,
);
const resultado = ref<string | null>(null);
const errorGeneral = ref<string | null>(null);

/** Instante ISO → hora local «YYYY-MM-DDTHH:MM» para mostrarlo (el servidor ya lo manda en la zona del condominio). */
const aLocal = (iso: string): string => iso.slice(0, 16);

function fallar(error: unknown): void {
  resultado.value = null;
  errorGeneral.value = aApiError(error).mensaje;
}

function reenviar(): void {
  errorGeneral.value = null;
  reenviando.mutate(id.value, {
    onSuccess: (n) => {
      resultado.value =
        n === 0 ? 'No hay unidades pendientes.' : `Convocatoria reenviada a ${n} unidades.`;
    },
    onError: fallar,
  });
}

async function exportar(): Promise<void> {
  errorGeneral.value = null;
  exportando.value = true;
  try {
    guardarArchivo(
      await asambleasService.constancia(id.value),
      `constancia-asamblea-${id.value}.pdf`,
    );
  } catch (error) {
    fallar(error);
  } finally {
    exportando.value = false;
  }
}

function cancelar(): void {
  $q.dialog({
    title: 'Cancelar asamblea',
    message:
      'Se retira la convocatoria y se avisa a todos con el motivo. Escribe por qué se cancela (mínimo 3 caracteres).',
    prompt: { model: '', type: 'text', isValid: (v: string) => v.trim().length >= 3 },
    cancel: { label: 'Volver', flat: true, noCaps: true },
    ok: { label: 'Cancelar asamblea', color: 'negative', unelevated: true, noCaps: true },
  }).onOk((motivo: string) => {
    errorGeneral.value = null;
    cancelando.mutate(
      { id: id.value, motivo: motivo.trim() },
      {
        onSuccess: () => {
          resultado.value = 'Asamblea cancelada. Se avisó a los residentes.';
        },
        onError: fallar,
      },
    );
  });
}
</script>

<style scoped>
.conv.safic-main {
  padding: 24px 32px;
  gap: 16px;
}

.conv__cita {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
}

.conv__kpis {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 12px;
}

.conv__kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
}

.conv__kpi span {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.conv__kpi strong {
  font-size: 22px;
}

.conv__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.conv__recordatorios {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.conv__tabla {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 16px 20px;
}

.conv__titulo {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 800;
}

.conv__vacio {
  padding: 16px 0;
  color: var(--safic-texto-suave);
}

.conv__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}

.conv__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
}

@media (max-width: 1023px) {
  .conv.safic-main {
    padding: 16px;
  }

  .conv__kpis {
    grid-template-columns: 1fr;
  }
}
</style>
