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

        <div class="conv__tabla" aria-labelledby="conv-poderes">
          <h2 id="conv-poderes" class="conv__titulo">
            Poderes
            <span v-if="poderes" class="conv__cuenta">
              · {{ poderes.pendientes }} por validar · {{ poderes.validados }} validados
            </span>
          </h2>
          <div v-if="consultaPoderes.isError.value" class="safic-alerta" role="alert">
            {{ consultaPoderes.error.value?.mensaje }}
            <q-btn flat no-caps dense label="Reintentar" @click="consultaPoderes.refetch()" />
          </div>
          <q-skeleton v-else-if="consultaPoderes.isPending.value" type="rect" height="60px" />
          <div v-else-if="(poderes?.poderes.length ?? 0) === 0" class="conv__vacio">
            Aún no hay poderes. Los propietarios que no asistan los suben desde la app, hasta que se
            instale la asamblea.
          </div>
          <ul v-else class="conv__lista conv__lista--poderes">
            <li v-for="p in poderes?.poderes" :key="p.id" class="conv__poder">
              <div class="conv__poder-cab">
                <strong>{{ p.unidad_codigo }}</strong>
                <EstadoBadge
                  :tono="ESTADOS_PODER[p.estado].tono"
                  :texto="ESTADOS_PODER[p.estado].nombre"
                />
              </div>
              <div>
                {{ p.otorgante ?? 'Propietario' }} → <strong>{{ p.representante_nombre }}</strong>
                <span class="conv__sub"> · {{ p.representante_documento }}</span>
              </div>
              <div class="conv__sub">
                {{ nombreTipoPoder(p.tipo) }} · cargado por {{ p.cargado_por ?? '—' }}
              </div>
              <div v-if="p.unidad_en_mora" class="conv__aviso">
                La unidad está en mora: no vota aunque el poder esté validado.
              </div>
              <div v-if="p.estado === 'rechazado'" class="conv__sub">
                Motivo: {{ p.motivo_rechazo }}
              </div>
              <div class="conv__poder-acc">
                <a
                  v-if="urlSegura(p.documento_url)"
                  :href="urlSegura(p.documento_url) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="conv__enlace"
                >
                  <q-icon name="sym_r_picture_as_pdf" size="18px" />{{ p.documento_nombre }}
                </a>
                <template v-if="p.estado === 'pendiente' && detalle.puede_cancelar">
                  <q-btn
                    unelevated
                    no-caps
                    dense
                    color="primary"
                    label="Validar"
                    :disable="ocupado"
                    @click="validar(p)"
                  />
                  <q-btn
                    flat
                    no-caps
                    dense
                    color="negative"
                    label="Rechazar"
                    :disable="ocupado"
                    @click="rechazar(p)"
                  />
                </template>
              </div>
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
import { urlSegura } from '@/modules/comunicacion/anuncios.logica';

import { ESTADOS, fechaHoraLarga, nombreModalidad } from '../asambleas.logica';
import {
  useAsamblea,
  useCancelarAsamblea,
  useConvocatoria,
  usePoderes,
  useRechazarPoder,
  useReenviarConvocatoria,
  useValidarPoder,
} from '../composables/useAsambleas';
import { ESTADOS_PODER, nombreTipoPoder } from '../poderes.logica';
import { asambleasService, type PoderAsamblea } from '../services/asambleas.service';

const $q = useQuasar();
const route = useRoute();
const id = computed(() => Number(route.params.id));

const consultaAsamblea = useAsamblea(id);
const detalle = computed(() => consultaAsamblea.data.value ?? null);
// El seguimiento solo existe si ya se convocó (un borrador responde 409)
const convocada = computed(() => detalle.value !== null && detalle.value.estado !== 'borrador');
const consulta = useConvocatoria(id, convocada);
const c = computed(() => consulta.data.value ?? null);

const consultaPoderes = usePoderes(id, convocada);
const poderes = computed(() => consultaPoderes.data.value ?? null);
const validando = useValidarPoder();
const rechazando = useRechazarPoder();
const reenviando = useReenviarConvocatoria();
const cancelando = useCancelarAsamblea();
const exportando = ref(false);
const ocupado = computed(
  () =>
    reenviando.isPending.value ||
    cancelando.isPending.value ||
    validando.isPending.value ||
    rechazando.isPending.value ||
    exportando.value,
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

function validar(p: PoderAsamblea): void {
  errorGeneral.value = null;
  validando.mutate(p.id, {
    onSuccess: () => {
      resultado.value = `Poder de ${p.unidad_codigo} validado.`;
    },
    onError: fallar,
  });
}

function rechazar(p: PoderAsamblea): void {
  $q.dialog({
    title: `Rechazar el poder de ${p.unidad_codigo}`,
    message: 'El propietario verá el motivo y podrá subir otro (mínimo 3 caracteres).',
    prompt: { model: '', type: 'text', isValid: (v: string) => v.trim().length >= 3 },
    cancel: { label: 'Volver', flat: true, noCaps: true },
    ok: { label: 'Rechazar', color: 'negative', unelevated: true, noCaps: true },
  }).onOk((motivo: string) => {
    errorGeneral.value = null;
    rechazando.mutate(
      { poderId: p.id, motivo: motivo.trim() },
      {
        onSuccess: () => {
          resultado.value = `Poder de ${p.unidad_codigo} rechazado.`;
        },
        onError: fallar,
      },
    );
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

.conv__cuenta {
  font-weight: 600;
  font-size: 13px;
  color: var(--safic-texto-2);
}

.conv__lista--poderes {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.conv__poder {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
  font-size: 14px;
}

.conv__poder-cab,
.conv__poder-acc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.conv__sub {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.conv__aviso {
  font-size: 13px;
  color: #7a3808;
}

.conv__enlace {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
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
