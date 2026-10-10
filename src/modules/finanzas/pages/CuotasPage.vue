<template>
  <q-page class="safic-main cuotas">
    <PaginaEncabezado miga="Finanzas / Cuotas del mes" :titulo="titulo" :subtitulo="subtitulo">
      <template #acciones>
        <q-btn
          v-if="puedeExtraordinaria"
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          icon="sym_r_add"
          label="Cuota extraordinaria"
          :disable="!lista || lista.resumen.estado === 'cerrado'"
          @click="abrirExtraordinaria"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div v-if="resultado" class="cuotas__resultado" role="status">{{ resultado }}</div>

    <div class="cuotas__kpis" :aria-busy="consulta.isPending.value">
      <template v-if="lista">
        <div class="safic-card cuotas__kpi">
          <div class="cuotas__kpi-titulo">Emitido</div>
          <div class="cuotas__kpi-valor">{{ formatoMoneda(lista.resumen.emitido.monto) }}</div>
          <div class="cuotas__kpi-nota">{{ lista.resumen.emitido.unidades }} unidades</div>
        </div>
        <div class="safic-card cuotas__kpi">
          <div class="cuotas__kpi-titulo">Cobrado</div>
          <div class="cuotas__kpi-valor cuotas__kpi-valor--exito">
            {{ formatoMoneda(lista.resumen.cobrado.monto) }}
          </div>
          <div class="cuotas__kpi-nota">
            {{ textoPorcentaje(lista.resumen.cobrado.porcentaje) }}
          </div>
        </div>
        <div class="safic-card cuotas__kpi">
          <div class="cuotas__kpi-titulo">Por aprobar</div>
          <div class="cuotas__kpi-valor cuotas__kpi-valor--alerta">
            {{ formatoMoneda(lista.resumen.por_aprobar.monto) }}
          </div>
          <div class="cuotas__kpi-nota">
            {{ lista.resumen.por_aprobar.comprobantes }} comprobantes
          </div>
        </div>
        <div class="safic-card cuotas__kpi">
          <div class="cuotas__kpi-titulo">Vencido de meses anteriores</div>
          <div class="cuotas__kpi-valor cuotas__kpi-valor--error">
            {{ formatoMoneda(lista.resumen.vencido_anterior.monto) }}
          </div>
          <div class="cuotas__kpi-nota">{{ lista.resumen.vencido_anterior.unidades }} unidades</div>
        </div>
      </template>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 4" :key="i" type="rect" height="92px" />
      </template>
    </div>

    <div class="cuotas__filtros">
      <div class="cuotas__periodo">
        <label for="cuotas-periodo" class="safic-campo__etiqueta">Periodo</label>
        <q-select
          v-model="periodoElegido"
          for="cuotas-periodo"
          class="safic-input"
          outlined
          dense
          emit-value
          map-options
          :options="opciones"
        />
      </div>
      <div role="tablist" aria-label="Estado de las cuotas" class="cuotas__pildoras">
        <button
          v-for="f in FILTROS_CUOTAS"
          :key="f.valor"
          type="button"
          role="tab"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': f.valor === filtro }"
          :aria-selected="f.valor === filtro"
          @click="cambiarFiltro(f.valor)"
        >
          {{ f.etiqueta }}{{ lista ? ` (${lista.conteos[f.valor]})` : '' }}
        </button>
      </div>
      <q-input
        v-model="buscar"
        class="safic-input cuotas__buscar"
        outlined
        dense
        clearable
        placeholder="Unidad o responsable"
        aria-label="Unidad o responsable"
      >
        <template #prepend><q-icon name="sym_r_search" /></template>
      </q-input>
    </div>

    <section class="safic-card cuotas__tabla" aria-label="Cuotas por unidad">
      <div class="cuotas__fila cuotas__fila--cabecera" role="row">
        <div>UNIDAD</div>
        <div>RESPONSABLE</div>
        <div class="text-right">CUOTA</div>
        <div class="text-right">PAGADO</div>
        <div>ESTADO</div>
      </div>

      <div v-if="consulta.isPending.value" class="q-pa-md" aria-busy="true">
        <q-skeleton v-for="i in 6" :key="i" type="rect" height="40px" class="q-mb-sm" />
      </div>
      <template v-else-if="lista">
        <div v-for="u in lista.unidades" :key="u.unidad_id" class="cuotas__fila">
          <router-link
            v-if="puedeVerUnidad"
            class="cuotas__unidad"
            :to="{ name: 'unidad-detalle', params: { id: u.unidad_id } }"
          >
            {{ u.codigo }}
          </router-link>
          <strong v-else>{{ u.codigo }}</strong>
          <div>
            <div class="text-weight-bold">{{ u.responsable?.nombre ?? 'Sin responsable' }}</div>
            <div class="cuotas__sub">
              {{ u.responsable ? textoRelacion(u.responsable.relacion) : '' }}
            </div>
          </div>
          <div class="text-right cuotas__monto">{{ formatoMoneda(u.cuota) }}</div>
          <div class="text-right cuotas__monto">{{ formatoMoneda(u.pagado) }}</div>
          <div>
            <EstadoBadge :tono="ESTADO_CUOTA[u.estado].tono">{{
              ESTADO_CUOTA[u.estado].texto
            }}</EstadoBadge>
            <div v-if="u.estado === 'vencida'" class="cuotas__sub">
              Venció el {{ formatoFechaCorta(u.vence_el) }}
            </div>
          </div>
        </div>

        <div v-if="lista.unidades.length === 0" class="cuotas__vacio">
          <q-icon name="sym_r_receipt_long" size="40px" class="text-suave" />
          <div class="text-weight-bold">{{ vacio.titulo }}</div>
          <div class="text-suave">{{ vacio.detalle }}</div>
          <q-btn
            v-if="!lista.resumen.emitida"
            flat
            no-caps
            color="primary"
            label="Ir al resumen para emitirlas"
            :to="{ name: 'finanzas-resumen' }"
          />
        </div>
      </template>
    </section>

    <q-pagination
      v-if="lista && lista.paginacion.last_page > 1"
      v-model="pagina"
      class="self-center"
      :max="lista.paginacion.last_page"
      :max-pages="7"
      direction-links
      boundary-links
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';

import CuotaExtraordinariaDialog from '../components/CuotaExtraordinariaDialog.vue';
import { useCuotasDelMes } from '../composables/useCuotas';
import { usePeriodos } from '../composables/usePeriodos';
import {
  ESTADO_CUOTA,
  FILTROS_CUOTAS,
  subtituloDelMes,
  textoPorcentaje,
  textoRelacion,
  tituloDelMes,
} from '../cuotas.logica';
import { opcionesDeMes } from '../resumen.logica';
import type { CuotaExtraordinariaCreada, FiltroCuotas } from '../services/cuotas.service';

const $q = useQuasar();
const session = useSessionStore();

// Ocultar es comodidad; la API exige finanzas.ver, cuotas.emitir y unidades.ver igual.
const puedeExtraordinaria = computed(() => session.tienePermiso('cuotas.emitir'));
const puedeVerUnidad = computed(() => session.tienePermiso('unidades.ver'));

/** null = el mes en curso del condominio (lo resuelve la API). */
const elegido = ref<string | null>(null);
const filtro = ref<FiltroCuotas>('todas');
const buscar = ref<string | null>('');
const buscarFino = refDebounced(
  computed({ get: () => buscar.value ?? '', set: (v: string) => (buscar.value = v) }),
  300,
);
const pagina = ref(1);
const resultado = ref<string | null>(null);

const consulta = useCuotasDelMes(
  computed(() => ({
    ...(elegido.value ? { periodo: elegido.value } : {}),
    filtro: filtro.value,
    buscar: buscarFino.value,
    pagina: pagina.value,
  })),
);
const periodos = usePeriodos();

const lista = computed(() => consulta.data.value);
const periodoActual = computed(() => elegido.value ?? lista.value?.periodo ?? '');
const periodoElegido = computed({
  get: () => periodoActual.value,
  set: (valor: string) => {
    elegido.value = valor;
    resultado.value = null;
  },
});
const opciones = computed(() => opcionesDeMes(periodos.data.value ?? [], periodoActual.value));

const titulo = computed(() =>
  periodoActual.value ? tituloDelMes(periodoActual.value) : 'Cuotas del mes',
);
const subtitulo = computed(() => (lista.value ? subtituloDelMes(lista.value.resumen) : ''));

watch([filtro, buscarFino, elegido], () => (pagina.value = 1));

function cambiarFiltro(valor: FiltroCuotas): void {
  filtro.value = valor;
}

const vacio = computed(() => {
  if (lista.value && !lista.value.resumen.emitida) {
    return {
      titulo: 'Aún no se emiten las cuotas de este mes',
      detalle: 'Emítelas desde el resumen financiero.',
    };
  }
  if (buscarFino.value.trim() !== '' || filtro.value !== 'todas') {
    return { titulo: 'Sin resultados', detalle: 'Prueba con otro filtro o con otra búsqueda.' };
  }
  return { titulo: 'No hay cuotas', detalle: 'Este mes no tiene cuotas.' };
});

function abrirExtraordinaria(): void {
  if (!periodoActual.value) return;
  $q.dialog({
    component: CuotaExtraordinariaDialog,
    componentProps: { periodo: periodoActual.value },
  }).onOk((r: CuotaExtraordinariaCreada) => {
    resultado.value = `Cuota extraordinaria creada para ${r.creadas} unidades · total ${formatoMoneda(r.total)}.`;
  });
}
</script>

<style scoped>
.cuotas {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cuotas__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.cuotas__kpi {
  padding: 16px 18px;
}

.cuotas__kpi-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.cuotas__kpi-valor {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}

.cuotas__kpi-valor--exito {
  color: #0b4a47;
}

.cuotas__kpi-valor--alerta {
  color: #8a3f0a;
}

.cuotas__kpi-valor--error {
  color: #9b1c12;
}

.cuotas__kpi-nota {
  margin-top: 4px;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cuotas__filtros {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cuotas__periodo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cuotas__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cuotas__buscar {
  margin-left: auto;
  width: 240px;
}

.cuotas__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.cuotas__tabla {
  overflow-x: auto;
}

.cuotas__fila {
  display: grid;
  grid-template-columns: 90px 1.4fr 120px 120px 1.2fr;
  gap: 12px;
  align-items: center;
  min-width: 640px;
  padding: 8px 18px;
  min-height: 50px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.cuotas__fila--cabecera {
  min-height: 0;
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.cuotas__unidad {
  font-weight: 800;
  color: var(--q-primary);
}

.cuotas__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cuotas__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.cuotas__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}
</style>
