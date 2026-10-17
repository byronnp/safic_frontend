<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="rep__dialogo">
      <div class="rep__cabecera">
        <h2 class="rep__titulo">{{ info.titulo }}</h2>
        <q-btn flat round dense icon="sym_r_close" aria-label="Cerrar" @click="onDialogCancel" />
      </div>

      <div v-if="consulta.isPending.value" class="q-pa-lg" aria-busy="true">
        <q-skeleton v-for="i in 6" :key="i" type="rect" height="34px" class="q-mb-sm" />
      </div>
      <div v-else-if="consulta.isError.value" class="q-pa-lg">
        <div class="safic-alerta" role="alert">
          {{ consulta.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
        </div>
      </div>
      <template v-else-if="reporte">
        <div class="rep__subtitulo">{{ reporte.titulo }}</div>
        <div class="rep__tabla">
          <table>
            <thead>
              <tr>
                <th
                  v-for="c in reporte.columnas"
                  :key="c.clave"
                  :class="{ rep__num: esNumerica(c.tipo) }"
                  scope="col"
                >
                  {{ c.etiqueta }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(f, i) in reporte.filas" :key="i">
                <td
                  v-for="c in reporte.columnas"
                  :key="c.clave"
                  :class="{ rep__num: esNumerica(c.tipo) }"
                >
                  {{ formatoCelda(f[c.clave], c.tipo) }}
                </td>
              </tr>
              <tr v-if="reporte.filas.length === 0">
                <td :colspan="reporte.columnas.length" class="rep__vacio">
                  No hay datos para este reporte.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, ref, watch } from 'vue';

import { useSessionStore } from '@/stores/session';

import { useReporte } from '../composables/useReportes';
import { esNumerica, formatoCelda, type InfoReporte } from '../reportes.logica';

const props = defineProps<{ info: InfoReporte; periodo: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const session = useSessionStore();

const consulta = useReporte(
  ref(props.info.clave),
  computed(() => props.periodo),
);
const reporte = computed(() => consulta.data.value ?? null);

// Si cambia el condominio con la vista abierta, se cierra: ya no son sus datos
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);
</script>

<style scoped>
.rep__dialogo {
  width: 900px;
  max-width: 96vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.rep__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.rep__titulo {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.rep__subtitulo {
  padding: 4px 20px 12px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.rep__tabla {
  overflow: auto;
  padding: 0 20px 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 9px 10px;
  text-align: left;
  border-top: 1px solid var(--safic-borde);
}

th {
  position: sticky;
  top: 0;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
  border-top: none;
}

.rep__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.rep__vacio {
  text-align: center;
  color: var(--safic-texto-suave);
  padding: 28px;
}
</style>
