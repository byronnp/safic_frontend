<template>
  <q-page class="safic-main bitacora">
    <PaginaEncabezado
      miga="Seguridad y comunicación / Bitácora de garita"
      titulo="Bitácora de garita"
      subtitulo="Ingresos y salidas de visitas, proveedores y delivery."
    >
      <template #acciones>
        <q-btn
          outline
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_download"
          label="Exportar"
          :loading="exportando"
          :disable="exportando"
          @click="exportar"
        />
      </template>
    </PaginaEncabezado>
    <div v-if="errorExportar" class="safic-alerta" role="alert">{{ errorExportar }}</div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="bitacora__kpis" :aria-busy="consulta.isPending.value">
      <template v-if="kpis">
        <div v-for="k in kpis" :key="k.titulo" class="safic-card bitacora__kpi">
          <div class="bitacora__kpi-titulo">{{ k.titulo }}</div>
          <div class="bitacora__kpi-valor">{{ k.valor }}</div>
          <div class="bitacora__sub">{{ k.sub }}</div>
        </div>
      </template>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 4" :key="i" type="rect" height="84px" />
      </template>
    </div>

    <div class="bitacora__filtros">
      <q-btn-toggle
        v-model="rango"
        no-caps
        unelevated
        toggle-color="primary"
        :options="[
          { label: 'Hoy', value: 'hoy' },
          { label: '7 días', value: '7dias' },
        ]"
        aria-label="Rango de fechas"
      />
      <q-btn-toggle
        v-model="tipo"
        no-caps
        unelevated
        toggle-color="primary"
        clearable
        :options="TIPOS_ACCESO.map((t) => ({ label: t.etiqueta, value: t.id }))"
        aria-label="Tipo de ingreso"
      />
      <q-input
        v-model="busqueda"
        class="safic-input bitacora__buscar"
        outlined
        dense
        clearable
        placeholder="Buscar nombre, unidad o lugar"
        aria-label="Buscar"
      >
        <template #prepend><q-icon name="sym_r_search" /></template>
      </q-input>
    </div>

    <section class="safic-card bitacora__tabla" aria-label="Ingresos y salidas">
      <div class="bitacora__fila bitacora__fila--cabecera" role="row">
        <div>ENTRADA</div>
        <div>SALIDA</div>
        <div>QUIÉN</div>
        <div>TIPO</div>
        <div>UNIDAD</div>
        <div>AUTORIZÓ</div>
        <div>ESTADO</div>
      </div>

      <div v-if="consulta.isPending.value" class="q-pa-md" aria-busy="true">
        <q-skeleton v-for="i in 6" :key="i" type="rect" height="40px" class="q-mb-sm" />
      </div>
      <template v-else-if="consulta.data.value">
        <div v-for="a in consulta.data.value.accesos" :key="a.id" class="bitacora__fila">
          <div>
            <span v-if="diaDe(a.entrada_en, hoy) !== 'Hoy'" class="bitacora__dia"
              >{{ diaDe(a.entrada_en, hoy) }}
            </span>
            {{ horaDe(a.entrada_en) }}
          </div>
          <div>{{ horaDe(a.salida_en) }}</div>
          <div class="text-weight-bold">
            {{ a.nombre
            }}<q-icon
              v-if="a.sin_conexion"
              name="sym_r_cloud_off"
              size="16px"
              class="q-ml-xs"
              aria-label="Registrado sin conexión"
            >
              <q-tooltip>Registrado sin conexión{{ a.nota ? ` · ${a.nota}` : '' }}</q-tooltip>
            </q-icon>
          </div>
          <div>{{ singularDeTipo(a.tipo) }}</div>
          <div>{{ a.unidad ?? a.destino ?? '—' }}</div>
          <div>{{ ETIQUETA_AUTORIZO[a.autorizado_por] }}</div>
          <div>
            <EstadoBadge :tono="a.estado === 'dentro' ? 'alerta' : 'neutro'">{{
              a.estado === 'dentro' ? 'Dentro' : 'Salió'
            }}</EstadoBadge>
          </div>
        </div>

        <div v-if="consulta.data.value.accesos.length === 0" class="bitacora__vacio">
          <q-icon name="sym_r_badge" size="40px" class="text-suave" />
          <div class="text-weight-bold">No hay ingresos en este rango</div>
          <div class="text-suave">Prueba con otro rango o quita los filtros.</div>
        </div>
        <div v-if="consulta.data.value.hay_mas" class="bitacora__vacio" role="status">
          Hay más ingresos de los que se muestran. Acota el rango o busca por nombre.
        </div>
      </template>
    </section>

    <div class="bitacora__pie">
      Los datos de los visitantes (nombre, cédula y placa) se anonimizan a los 12 meses.
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { guardarArchivo } from '@/core/api/descarga';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';
import { hoyEcuador } from '@/utils/fecha';

import { useBitacoraGarita } from '../composables/useGarita';
import {
  diaDe,
  ETIQUETA_AUTORIZO,
  filtrosPorRango,
  horaDe,
  singularDeTipo,
  TIPOS_ACCESO,
  type RangoBitacora,
} from '../garita.logica';
import { garitaService, type TipoAcceso } from '../services/garita.service';

const session = useSessionStore();
const hoy = hoyEcuador();

const rango = ref<RangoBitacora>('hoy');
const tipo = ref<TipoAcceso | null>(null);
const busqueda = ref<string | null>('');
const buscar = refDebounced(
  computed(() => busqueda.value ?? ''),
  350,
);

const filtros = computed(() => filtrosPorRango(rango.value, hoy, tipo.value, buscar.value));
const consulta = useBitacoraGarita(filtros);

watch(
  () => session.condominioId,
  () => {
    rango.value = 'hoy';
    tipo.value = null;
    busqueda.value = '';
  },
);

const ultimaSync = (iso: string | null): string =>
  iso === null ? 'Sincronizados hoy' : `Sincronizados hoy · última ${horaDe(iso)}`;

const exportando = ref(false);
const errorExportar = ref<string | null>(null);

async function exportar(): Promise<void> {
  if (exportando.value) return;
  exportando.value = true;
  errorExportar.value = null;
  const condominio = session.condominioId;
  const f = filtros.value;
  try {
    const archivo = await garitaService.exportarBitacora(f);
    // Si cambió de condominio mientras se generaba, no se entrega un archivo de otro
    if (condominio === session.condominioId)
      guardarArchivo(archivo, `bitacora-garita-${f.desde}-${f.hasta}.xlsx`);
  } catch (error) {
    errorExportar.value = aApiError(error).mensaje;
  } finally {
    exportando.value = false;
  }
}

const kpis = computed(() => {
  const i = consulta.data.value?.indicadores;
  if (!i) return null;
  return [
    { titulo: 'Dentro ahora', valor: i.dentro_ahora, sub: `${i.proveedores_dentro} proveedores` },
    { titulo: 'Ingresos hoy', valor: i.ingresos_hoy, sub: `${i.con_qr_hoy} con QR` },
    { titulo: 'Sin anunciar hoy', valor: i.sin_anunciar_hoy, sub: 'Visitas sin QR' },
    {
      titulo: 'Accesos sin conexión',
      valor: i.sin_conexion,
      sub: ultimaSync(consulta.data.value?.ultima_sincronizacion ?? null),
    },
  ];
});
</script>

<style scoped>
.bitacora {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bitacora__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.bitacora__kpi {
  padding: 16px 18px;
}

.bitacora__kpi-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.bitacora__kpi-valor {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.bitacora__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.bitacora__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.bitacora__buscar {
  min-width: 240px;
}

.bitacora__tabla {
  overflow-x: auto;
}

.bitacora__fila {
  display: grid;
  grid-template-columns: 110px 70px 1.6fr 100px 1fr 130px 90px;
  gap: 12px;
  align-items: center;
  min-width: 820px;
  padding: 10px 18px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.bitacora__fila--cabecera {
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.bitacora__dia {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.bitacora__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 16px;
  text-align: center;
}

.bitacora__pie {
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
