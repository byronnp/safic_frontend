<template>
  <q-page class="safic-main rep">
    <PaginaEncabezado miga="Finanzas / Reportes" titulo="Reportes">
      <template #acciones>
        <label for="rep-periodo" class="rep__etiqueta">Periodo</label>
        <q-select
          v-model="periodo"
          for="rep-periodo"
          class="safic-input rep__select"
          outlined
          dense
          emit-value
          map-options
          :options="opciones"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="rep__resultado" role="status">{{ resultado }}</div>
    <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

    <div class="rep__tarjetas">
      <article v-for="r in REPORTES" :key="r.clave" class="safic-card rep__tarjeta">
        <div class="rep__tarjeta-cab">
          <q-icon :name="r.icono" size="24px" class="rep__icono" />
          <h2 class="rep__tarjeta-titulo">{{ r.titulo }}</h2>
        </div>
        <p class="rep__descripcion">{{ r.descripcion }}</p>
        <div class="rep__botones">
          <q-btn outline no-caps color="primary" label="Ver" @click="ver(r)" />
          <q-btn
            v-if="puedeExportar"
            outline
            no-caps
            color="primary"
            icon="sym_r_download"
            label="Excel"
            :loading="exportando === r.clave"
            :disable="exportando !== null"
            @click="exportar(r)"
          />
        </div>
      </article>
    </div>

    <section class="safic-card rep__bitacora" aria-labelledby="rep-ultimas">
      <h2 id="rep-ultimas" class="rep__h2">Últimas exportaciones</h2>
      <p class="rep__descripcion">{{ POLITICA_EXPORTACION }}</p>

      <div v-if="exportaciones.isPending.value" aria-busy="true">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="36px" class="q-mb-sm" />
      </div>
      <div v-else-if="exportaciones.isError.value" class="safic-alerta" role="alert">
        {{ exportaciones.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="exportaciones.refetch()" />
      </div>
      <ul v-else-if="(exportaciones.data.value ?? []).length" class="rep__lista">
        <li v-for="e in exportaciones.data.value" :key="e.id" class="rep__fila">
          <span class="rep__fecha">{{ fechaExportacion(e.en) }}</span>
          <span class="rep__fila-titulo">{{ e.titulo }}</span>
          <span class="rep__quien"
            >{{ e.user_nombre }}<template v-if="e.user_rol"> · {{ e.user_rol }}</template></span
          >
          <code class="rep__codigo">{{ e.codigo }}</code>
        </li>
      </ul>
      <p v-else class="rep__descripcion">Todavía no se exportó ningún archivo.</p>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { guardarArchivo } from '@/core/api/descarga';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';

import ReporteVistaDialog from '../components/ReporteVistaDialog.vue';
import { useExportaciones, useExportarExcel } from '../composables/useReportes';
import { usePeriodos } from '../composables/usePeriodos';
import {
  fechaExportacion,
  nombreArchivo,
  periodoDe,
  POLITICA_EXPORTACION,
  REPORTES,
  type InfoReporte,
} from '../reportes.logica';
import { opcionesDeMes } from '../resumen.logica';
import type { ClaveReporte } from '../services/reportes.service';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar el botón es comodidad; la API exige finanzas.exportar y finanzas.ver igual.
const puedeExportar = computed(() => session.tienePermiso('finanzas.exportar'));

const periodo = ref(hoyEcuador().slice(0, 7));
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);
const exportando = ref<ClaveReporte | null>(null);

const periodos = usePeriodos();
const opciones = computed(() => opcionesDeMes(periodos.data.value ?? [], periodo.value));
const exportaciones = useExportaciones();
const exportar_ = useExportarExcel();

// Al cambiar de condominio no quedan avisos del anterior
watch(
  () => session.condominioId,
  () => {
    resultado.value = null;
    errorAccion.value = null;
  },
);

function ver(r: InfoReporte): void {
  $q.dialog({
    component: ReporteVistaDialog,
    componentProps: { info: r, periodo: periodoDe(r, periodo.value, hoyEcuador()) },
  });
}

async function exportar(r: InfoReporte): Promise<void> {
  // Un segundo clic mientras genera no cuenta dos veces para el límite diario
  if (exportando.value !== null) return;
  resultado.value = null;
  errorAccion.value = null;
  exportando.value = r.clave;
  const elegido = periodoDe(r, periodo.value, hoyEcuador());
  // Si cambia el condominio mientras se genera, el archivo no es de este: no se descarga ni se avisa
  const condominio = session.condominioId;
  try {
    const archivo = await exportar_.mutateAsync({ reporte: r.clave, periodo: elegido });
    if (session.condominioId !== condominio) return;
    guardarArchivo(archivo, nombreArchivo(r.clave, elegido));
    resultado.value = `${r.titulo}: Excel descargado. Queda en las últimas exportaciones, con su código.`;
  } catch (error) {
    if (session.condominioId !== condominio) return;
    const e = aApiError(error);
    // Decide el código: el límite diario se explica con las cifras; lo demás, con el mensaje de la API
    errorAccion.value =
      e.codigo === 'LIMITE_EXPORTACIONES'
        ? 'Llegaste al límite de 30 exportaciones por día. Inténtalo mañana o pide apoyo al administrador.'
        : e.mensaje;
  } finally {
    exportando.value = null;
  }
}
</script>

<style scoped>
.rep {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rep__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.rep__select {
  min-width: 190px;
}

.rep__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.rep__tarjetas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.rep__tarjeta {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rep__tarjeta-cab {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rep__icono {
  color: var(--q-primary);
}

.rep__tarjeta-titulo,
.rep__h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.rep__descripcion {
  margin: 0;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.rep__botones {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
}

.rep__bitacora {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rep__lista {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rep__fila {
  display: grid;
  grid-template-columns: 110px 1.6fr 1.2fr 90px;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.rep__fecha,
.rep__quien {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.rep__fila-titulo {
  font-weight: 700;
}

.rep__codigo {
  font-weight: 800;
  letter-spacing: 0.5px;
}
</style>
