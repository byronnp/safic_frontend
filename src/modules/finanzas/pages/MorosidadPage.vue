<template>
  <q-page class="safic-main mor">
    <PaginaEncabezado
      miga="Finanzas / Morosidad"
      titulo="Morosidad"
      :subtitulo="lista ? subtitulo : ''"
    >
      <template #acciones>
        <q-btn
          v-if="puedeGestionar"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_send"
          label="Recordar a todos"
          :disable="!lista || lista.resumen.cartera_vencida.unidades === 0"
          :loading="recordar.isPending.value"
          @click="confirmarRecordarATodos"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="mor__resultado" role="status">{{ resultado }}</div>
    <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="mor__tramos" :aria-busy="consulta.isPending.value">
      <template v-if="lista">
        <div v-for="t in lista.resumen.tramos" :key="t.tramo" class="safic-card mor__tramo">
          <div class="mor__tramo-titulo">{{ t.etiqueta }}</div>
          <div class="mor__tramo-valor">{{ t.unidades }} <span class="mor__sub">unid.</span></div>
          <div class="mor__sub">{{ formatoMoneda(t.saldo) }}</div>
        </div>
      </template>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 5" :key="i" type="rect" height="84px" />
      </template>
    </div>

    <div class="mor__cuerpo">
      <section class="mor__principal" aria-label="Unidades con deuda vencida">
        <div class="mor__filtros">
          <div role="tablist" aria-label="Filtro de morosidad" class="mor__pildoras">
            <button
              v-for="f in FILTROS_MOROSIDAD"
              :key="f.valor"
              type="button"
              role="tab"
              class="safic-pildora"
              :class="{ 'safic-pildora--activa': f.valor === filtro }"
              :aria-selected="f.valor === filtro"
              @click="filtro = f.valor"
            >
              {{ f.etiqueta }}{{ lista ? ` (${lista.conteos[f.valor]})` : '' }}
            </button>
          </div>
          <q-input
            v-model="buscar"
            class="safic-input mor__buscar"
            outlined
            dense
            clearable
            placeholder="Unidad o responsable"
            aria-label="Buscar unidad o responsable"
          >
            <template #prepend><q-icon name="sym_r_search" /></template>
          </q-input>
        </div>

        <div class="safic-card mor__tabla">
          <div class="mor__fila mor__fila--cabecera" role="row">
            <div>UNIDAD</div>
            <div>RESPONSABLE Y DEUDA</div>
            <div class="text-right">SALDO</div>
            <div>SITUACIÓN</div>
            <div v-if="puedeGestionar" />
          </div>

          <div v-if="consulta.isPending.value" class="q-pa-md" aria-busy="true">
            <q-skeleton v-for="i in 5" :key="i" type="rect" height="48px" class="q-mb-sm" />
          </div>
          <template v-else-if="lista">
            <div v-for="u in lista.unidades" :key="u.unidad_id" class="mor__fila">
              <router-link
                v-if="puedeVerUnidad"
                class="mor__unidad"
                :to="{ name: 'unidad-detalle', params: { id: u.unidad_id } }"
              >
                {{ u.codigo }}
              </router-link>
              <strong v-else>{{ u.codigo }}</strong>
              <div>
                <div class="text-weight-bold">{{ u.responsable?.nombre ?? 'Sin responsable' }}</div>
                <div class="mor__sub">{{ detalleDeuda(u) }}</div>
              </div>
              <div class="text-right mor__monto">{{ formatoMoneda(u.saldo_vencido) }}</div>
              <div>
                <EstadoBadge :tono="textoSituacion(u.situacion).tono">{{
                  textoSituacion(u.situacion).texto
                }}</EstadoBadge>
              </div>
              <div v-if="puedeGestionar" class="mor__acciones">
                <q-btn
                  flat
                  round
                  dense
                  icon="sym_r_send"
                  :aria-label="`Recordar a ${u.codigo}`"
                  :disable="ocupado"
                  @click="recordarA(u)"
                >
                  <q-tooltip>Enviar recordatorio</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="sym_r_handshake"
                  :aria-label="`Convenio de ${u.codigo}`"
                  @click="convenio(u)"
                >
                  <q-tooltip>Convenio de pago</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="u.situacion.tipo === 'restringida' || u.situacion.tipo === 'notificada'"
                  flat
                  round
                  dense
                  icon="sym_r_lock_open"
                  :aria-label="`Levantar la restricción de ${u.codigo}`"
                  @click="levantar(u)"
                >
                  <q-tooltip>Levantar la restricción</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div v-if="lista.unidades.length === 0" class="mor__vacio">
              <q-icon name="sym_r_task_alt" size="40px" class="text-suave" />
              <div class="text-weight-bold">{{ vacio.titulo }}</div>
              <div class="text-suave">{{ vacio.detalle }}</div>
            </div>
          </template>
        </div>

        <q-pagination
          v-if="lista && lista.paginacion.last_page > 1"
          v-model="pagina"
          class="self-center"
          :max="lista.paginacion.last_page"
          :max-pages="7"
          direction-links
          boundary-links
        />
      </section>

      <aside v-if="lista" class="safic-card mor__reglas" aria-labelledby="mor-reglas">
        <h2 id="mor-reglas" class="mor__h2">Reglas de morosidad</h2>
        <dl class="mor__valores">
          <dt>Días de gracia</dt>
          <dd>{{ lista.reglas.dias_gracia }}</dd>
          <dt>Recordatorios</dt>
          <dd>{{ TEXTO_RECORDATORIOS }}</dd>
          <dt>Restricción de áreas comunes</dt>
          <dd>{{ textoRestriccion(lista.reglas.meses_restriccion) }}</dd>
        </dl>
        <div class="mor__sub">
          Decreto 462: se notifica con el detalle y aplica
          {{ lista.reglas.dias_aviso_restriccion }} días después. Se levanta apenas se registra el
          pago o un convenio. Visitas, paquetes y seguridad nunca se restringen.
        </div>
        <q-btn
          v-if="puedeEditarReglas"
          flat
          no-caps
          color="primary"
          label="Editar en Configuración de cobro"
          :to="{ name: 'configuracion-cobro' }"
        />
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';
import { formatoMoneda } from '@/utils/formato';

import ConvenioDialog from '../components/ConvenioDialog.vue';
import LevantarRestriccionDialog from '../components/LevantarRestriccionDialog.vue';
import { useMorosidad, useRecordar } from '../composables/useMorosidad';
import {
  detalleDeuda,
  FILTROS_MOROSIDAD,
  TEXTO_RECORDATORIOS,
  textoRecordatorios,
  textoRestriccion,
  textoSituacion,
} from '../morosidad.logica';
import type { FiltroMorosidad, UnidadMorosa } from '../services/morosidad.service';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige morosidad.gestionar y finanzas.ver igual.
const puedeGestionar = computed(() => session.tienePermiso('morosidad.gestionar'));
const puedeVerUnidad = computed(() => session.tienePermiso('unidades.ver'));
const puedeEditarReglas = computed(() => session.tienePermiso('condominio.editar'));

const filtro = ref<FiltroMorosidad>('todas');
const buscar = ref<string | null>('');
const buscarFino = refDebounced(
  computed({ get: () => buscar.value ?? '', set: (v: string) => (buscar.value = v) }),
  300,
);
const pagina = ref(1);
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

const consulta = useMorosidad(
  computed(() => ({ filtro: filtro.value, buscar: buscarFino.value, pagina: pagina.value })),
);
const recordar = useRecordar();
const lista = computed(() => consulta.data.value);
const ocupado = computed(() => recordar.isPending.value);

const subtitulo = computed(() => {
  const r = lista.value?.resumen;
  return r
    ? `Cartera vencida ${formatoMoneda(r.cartera_vencida.saldo)} · ${r.cartera_vencida.unidades} de ${r.total_unidades} unidades`
    : '';
});

const vacio = computed(() =>
  filtro.value !== 'todas' || buscar.value
    ? { titulo: 'Sin resultados', detalle: 'Prueba con otro filtro o con otra búsqueda.' }
    : {
        titulo: 'Nadie debe cuotas vencidas',
        detalle: 'Cuando una cuota venza sin pagarse, aparecerá aquí.',
      },
);

// La página vuelve a 1 antes de pedir la lista nueva (una sola petición)
watch([filtro, buscarFino], () => (pagina.value = 1), { flush: 'sync' });
// Al cambiar de condominio no quedan avisos del anterior
watch(
  () => session.condominioId,
  () => {
    resultado.value = null;
    errorAccion.value = null;
  },
);

function enviar(ids: number[] | null): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  recordar.mutate(ids, {
    onSuccess: (r) => (resultado.value = textoRecordatorios(r)),
    onError: (error) => (errorAccion.value = aApiError(error).mensaje),
  });
}

function confirmarRecordarATodos(): void {
  $q.dialog({
    title: 'Recordar a todos',
    message: `Se enviará un correo a quienes tienen cuotas vencidas (${lista.value?.resumen.cartera_vencida.unidades ?? 0} unidades). A cada unidad se le avisa una vez al día.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Enviar', color: 'primary', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => enviar(null));
}

function recordarA(u: UnidadMorosa): void {
  enviar([u.unidad_id]);
}

function convenio(u: UnidadMorosa): void {
  errorAccion.value = null;
  $q.dialog({ component: ConvenioDialog, componentProps: { unidad: u } }).onOk(
    (mensaje: string) => {
      resultado.value = mensaje;
    },
  );
}

function levantar(u: UnidadMorosa): void {
  errorAccion.value = null;
  $q.dialog({ component: LevantarRestriccionDialog, componentProps: { unidad: u } }).onOk(
    (mensaje: string) => {
      resultado.value = mensaje;
    },
  );
}
</script>

<style scoped>
.mor {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mor__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.mor__tramos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
}

.mor__tramo {
  padding: 14px 16px;
}

.mor__tramo-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.mor__tramo-valor {
  margin-top: 4px;
  font-size: 24px;
  font-weight: 800;
}

.mor__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.mor__cuerpo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.mor__principal {
  flex: 1 1 640px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mor__filtros {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mor__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mor__buscar {
  margin-left: auto;
  width: 240px;
}

.mor__tabla {
  overflow-x: auto;
}

.mor__fila {
  display: grid;
  grid-template-columns: 80px 1.4fr 110px 1.3fr auto;
  gap: 12px;
  align-items: center;
  min-width: 720px;
  padding: 10px 18px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.mor__fila--cabecera {
  min-height: 0;
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.mor__unidad {
  font-weight: 800;
  color: var(--q-primary);
}

.mor__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.mor__acciones {
  display: flex;
  gap: 2px;
}

.mor__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}

.mor__reglas {
  flex: 0 0 320px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mor__h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.mor__valores {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px 0;
  margin: 0;
  font-size: 14px;
}

.mor__valores dt {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.mor__valores dd {
  margin: 0;
  font-weight: 700;
}
</style>
