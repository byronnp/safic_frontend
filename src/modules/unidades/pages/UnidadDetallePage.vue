<template>
  <q-page class="safic-main unidad-detalle">
    <q-skeleton v-if="consulta.isLoading.value" height="320px" class="safic-card" />

    <div
      v-else-if="consulta.isError.value && consulta.error.value?.estado !== 404"
      class="safic-alerta row items-center"
      role="alert"
      style="gap: 12px"
    >
      <span class="col-grow">{{ consulta.error.value?.mensaje }}</span>
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <template v-else-if="unidad">
      <div class="unidad-detalle-encabezado">
        <router-link
          :to="{ name: 'unidades' }"
          class="unidad-detalle-volver"
          aria-label="Volver a unidades"
        >
          <q-icon :name="ICONOS.volver" size="20px" />
        </router-link>
        <div class="unidad-detalle-encabezado__textos">
          <div class="unidad-detalle-encabezado__titulo">
            <h1>Unidad {{ unidad.codigo }}</h1>
            <EstadoBadge :tono="ESTADOS_UNIDAD[unidad.estado].tono">
              {{ ESTADOS_UNIDAD[unidad.estado].texto }}
            </EstadoBadge>
          </div>
          <div class="unidad-detalle-encabezado__resumen">{{ resumen }}</div>
        </div>
        <div class="unidad-detalle-encabezado__acciones">
          <button v-if="puedeEditar" type="button" class="unidad-detalle-boton" @click="asignar">
            Asignar ocupante
          </button>
        </div>
      </div>

      <div class="unidad-detalle-pestanas" role="tablist">
        <button
          v-for="p in PESTANAS"
          :key="p.clave"
          type="button"
          role="tab"
          class="unidad-detalle-pestana"
          :class="{ 'unidad-detalle-pestana--activa': p.clave === pestana }"
          :aria-selected="p.clave === pestana"
          @click="pestana = p.clave"
        >
          {{ p.texto }}
        </button>
      </div>

      <div class="unidad-detalle-cuerpo">
        <div class="unidad-detalle-principal">
          <template v-if="pestana === 'ocupantes'">
            <div class="unidad-detalle-seccion">OCUPANTES VIGENTES</div>
            <UnidadDetalleOcupante
              v-for="(o, i) in unidad.ocupantes"
              :key="o.id"
              :ocupante="o"
              :indice="i"
              :puede-editar="puedeEditar"
              @finalizar="darDeBaja"
            />
            <div
              v-if="unidad.ocupantes.length === 0"
              class="unidad-detalle-vacio column items-start"
              style="gap: 10px"
            >
              <span>Esta unidad no tiene ocupantes registrados.</span>
              <button
                v-if="puedeEditar"
                type="button"
                class="unidad-detalle-boton"
                @click="asignar"
              >
                Asignar el primer ocupante
              </button>
            </div>
          </template>

          <template v-else-if="pestana === 'historial'">
            <div class="unidad-detalle-seccion">HISTORIAL DE OCUPANTES</div>
            <div
              v-if="historial.isError.value"
              class="safic-alerta row items-center"
              role="alert"
              style="gap: 12px"
            >
              <span class="col-grow">{{ historial.error.value?.mensaje }}</span>
              <q-btn flat no-caps dense label="Reintentar" @click="historial.refetch()" />
            </div>
            <div v-else class="unidad-detalle-lista" :aria-busy="historial.isLoading.value">
              <q-skeleton v-if="historial.isLoading.value" type="text" class="q-ma-md" />
              <div
                v-for="o in historial.data.value ?? []"
                :key="o.id"
                class="unidad-detalle-lista__fila unidad-detalle-lista__fila--arriba"
              >
                <div class="unidad-detalle-historial__fecha">
                  {{ formatoFecha(o.fecha_inicio) }}
                </div>
                <div class="unidad-detalle-lista__texto">
                  {{ o.persona.nombre_completo }} · {{ textoRelacion(o.relacion) }}
                  <template v-if="o.es_principal"> (principal)</template>
                  <template v-if="o.fecha_fin"> · hasta {{ formatoFecha(o.fecha_fin) }}</template>
                  <template v-else> · vigente</template>
                </div>
              </div>
              <div
                v-if="!historial.isLoading.value && (historial.data.value ?? []).length === 0"
                class="unidad-detalle-lista__vacio"
              >
                Sin movimientos registrados.
              </div>
            </div>
          </template>

          <template v-else-if="pestana === 'vehiculos'">
            <div class="row items-center justify-between">
              <div class="unidad-detalle-seccion">VEHÍCULOS</div>
              <button
                v-if="puedeEditar"
                type="button"
                class="unidad-detalle-enlace unidad-detalle-agregar"
                @click="editarVehiculo()"
              >
                + Registrar vehículo
              </button>
            </div>
            <div class="unidad-detalle-lista">
              <div v-for="v in unidad.vehiculos" :key="v.id" class="unidad-detalle-lista__fila">
                <UnidadDetallePlaca :placa="v.placa" />
                <div class="unidad-detalle-lista__texto unidad-detalle-lista__crece">
                  {{ descripcionVehiculo(v) }}
                </div>
                <template v-if="puedeEditar">
                  <button type="button" class="unidad-detalle-enlace" @click="editarVehiculo(v)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="unidad-detalle-enlace unidad-detalle-enlace--quitar"
                    @click="quitar('vehiculo', v.id, `el vehículo ${v.placa}`)"
                  >
                    Quitar
                  </button>
                </template>
              </div>
              <div v-if="unidad.vehiculos.length === 0" class="unidad-detalle-lista__vacio">
                Sin vehículos registrados.
              </div>
            </div>

            <div class="row items-center justify-between">
              <div class="unidad-detalle-seccion">MASCOTAS</div>
              <button
                v-if="puedeEditar"
                type="button"
                class="unidad-detalle-enlace unidad-detalle-agregar"
                @click="editarMascota()"
              >
                + Registrar mascota
              </button>
            </div>
            <div class="unidad-detalle-lista">
              <div v-for="m in unidad.mascotas" :key="m.id" class="unidad-detalle-lista__fila">
                <div class="unidad-detalle-lista__crece">
                  <div class="unidad-detalle-lista__nombre">{{ m.nombre }}</div>
                  <div class="unidad-detalle-lista__detalle">
                    {{ [textoEspecie(m.especie), m.raza].filter(Boolean).join(' · ') }}
                  </div>
                </div>
                <template v-if="puedeEditar">
                  <button type="button" class="unidad-detalle-enlace" @click="editarMascota(m)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="unidad-detalle-enlace unidad-detalle-enlace--quitar"
                    @click="quitar('mascota', m.id, m.nombre)"
                  >
                    Quitar
                  </button>
                </template>
              </div>
              <div v-if="unidad.mascotas.length === 0" class="unidad-detalle-lista__vacio">
                Sin mascotas registradas.
              </div>
            </div>
          </template>

          <template v-else>
            <div class="unidad-detalle-seccion">DOCUMENTOS</div>
            <div class="unidad-detalle-lista">
              <div class="unidad-detalle-lista__vacio">
                La carga de documentos (escrituras, contratos de arriendo) llega con el
                almacenamiento de archivos.
              </div>
            </div>
          </template>
        </div>

        <!-- Resumen siempre visible, como en el mockup -->
        <aside class="unidad-detalle-lateral">
          <div class="unidad-detalle-tarjeta">
            <div class="unidad-detalle-tarjeta__titulo unidad-detalle-tarjeta__titulo--amplio">
              VEHÍCULOS
            </div>
            <div v-for="v in unidad.vehiculos" :key="v.id" class="unidad-detalle-vehiculo">
              <UnidadDetallePlaca :placa="v.placa" />
              <div class="unidad-detalle-vehiculo__texto">{{ descripcionVehiculo(v) }}</div>
            </div>
            <div v-if="unidad.vehiculos.length === 0" class="unidad-detalle-tarjeta__vacio">
              Sin vehículos registrados.
            </div>
          </div>
          <div class="unidad-detalle-tarjeta">
            <div class="unidad-detalle-tarjeta__titulo">MASCOTAS</div>
            <div v-for="m in unidad.mascotas" :key="m.id">
              <div class="unidad-detalle-mascota__nombre">{{ m.nombre }}</div>
              <div class="unidad-detalle-mascota__detalle">
                {{ [textoEspecie(m.especie), m.raza].filter(Boolean).join(' · ') }}
              </div>
            </div>
            <div v-if="unidad.mascotas.length === 0" class="unidad-detalle-tarjeta__vacio">
              Sin mascotas registradas.
            </div>
          </div>
        </aside>
      </div>
    </template>

    <div v-else class="unidad-detalle-no-encontrada safic-card">
      <q-icon :name="ICONOS.sinResultados" size="40px" />
      <div class="unidad-detalle-no-encontrada__titulo">Unidad no encontrada</div>
      <div class="unidad-detalle-no-encontrada__texto">
        La unidad no existe en este condominio o fue eliminada.
      </div>
      <router-link :to="{ name: 'unidades' }" class="unidad-detalle-boton">
        Volver a unidades
      </router-link>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import EstadoBadge from '@/components/EstadoBadge.vue';
import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';
import { formatoFecha } from '@/utils/formato';

import AsignarOcupanteDialog from '../components/AsignarOcupanteDialog.vue';
import FinalizarOcupanteDialog from '../components/FinalizarOcupanteDialog.vue';
import MascotaDialog from '../components/MascotaDialog.vue';
import UnidadDetallePlaca from '../components/UnidadDetallePlaca.vue';
import VehiculoDialog from '../components/VehiculoDialog.vue';
import UnidadDetalleOcupante from '../components/UnidadDetalleOcupante.vue';
import { useEliminarRegistro, useHistorialOcupantes, useUnidad } from '../composables/useUnidades';
import { textoRelacion } from '../persona.formulario';
import type { Mascota, Ocupante, Vehiculo } from '../services/unidades.service';
import { ESTADOS_UNIDAD, TIPO_LARGO } from '../unidad.textos';
import { descripcionVehiculo, textoEspecie } from '../vehiculo.formulario';

type Pestana = 'ocupantes' | 'vehiculos' | 'documentos' | 'historial';

const PESTANAS: { clave: Pestana; texto: string }[] = [
  { clave: 'ocupantes', texto: 'Ocupantes' },
  { clave: 'vehiculos', texto: 'Vehículos y mascotas' },
  { clave: 'documentos', texto: 'Documentos' },
  { clave: 'historial', texto: 'Historial' },
];

const $q = useQuasar();
const route = useRoute();
const session = useSessionStore();

// Mostrar el botón es comodidad; la API exige unidades.editar de todas formas.
const puedeEditar = computed(() => session.tienePermiso('unidades.editar'));

const id = computed(() => Number(route.params.id) || 0);
const pestana = ref<Pestana>('ocupantes');
watch(id, () => (pestana.value = 'ocupantes'));

const consulta = useUnidad(id);
const unidad = computed(() => consulta.data.value ?? null);
const historial = useHistorialOcupantes(
  id,
  computed(() => pestana.value === 'historial'),
);

/** "Torre A · Piso 1 · Departamento · 84 m² · Alícuota 0,62 %" */
const resumen = computed(() => {
  const u = unidad.value;
  if (!u) return '';
  const partes = [
    u.bloque?.nombre,
    u.piso !== null ? `Piso ${u.piso}` : null,
    TIPO_LARGO[u.tipo],
    `${Number(u.area_m2).toLocaleString('es-EC', { maximumFractionDigits: 2 })} m²`,
    u.alicuota
      ? `Alícuota ${Number(u.alicuota).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} %`
      : null,
  ];
  return partes.filter(Boolean).join(' · ');
});

function asignar(): void {
  if (!unidad.value) return;
  $q.dialog({
    component: AsignarOcupanteDialog,
    componentProps: { unidadId: unidad.value.id, codigo: unidad.value.codigo },
  }).onOk((o: Ocupante) => {
    $q.notify({ type: 'positive', message: `${o.persona.nombre_completo} asignado a la unidad.` });
  });
}

const eliminar = useEliminarRegistro();

function editarVehiculo(vehiculo?: Vehiculo): void {
  if (!unidad.value) return;
  $q.dialog({
    component: VehiculoDialog,
    componentProps: { unidadId: unidad.value.id, vehiculo: vehiculo ?? null },
  }).onOk((v: Vehiculo) => {
    $q.notify({ type: 'positive', message: `Vehículo ${v.placa} guardado.` });
  });
}

function editarMascota(mascota?: Mascota): void {
  if (!unidad.value) return;
  $q.dialog({
    component: MascotaDialog,
    componentProps: { unidadId: unidad.value.id, mascota: mascota ?? null },
  }).onOk((m: Mascota) => {
    $q.notify({ type: 'positive', message: `${m.nombre} guardada.` });
  });
}

function quitar(tipo: 'vehiculo' | 'mascota', id: number, nombre: string): void {
  $q.dialog({
    title: tipo === 'vehiculo' ? 'Quitar vehículo' : 'Quitar mascota',
    message: `¿Quitar ${nombre} de esta unidad?`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Quitar', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    eliminar.mutate(
      { tipo, id },
      {
        onSuccess: () => $q.notify({ type: 'positive', message: 'Listo, se quitó de la unidad.' }),
        onError: (error) => $q.notify({ type: 'negative', message: error.mensaje }),
      },
    );
  });
}

function darDeBaja(o: Ocupante): void {
  $q.dialog({
    component: FinalizarOcupanteDialog,
    componentProps: {
      ocupanteId: o.id,
      nombre: o.persona.nombre_completo,
      relacion: textoRelacion(o.relacion),
      fechaInicio: o.fecha_inicio,
    },
  }).onOk(() => {
    $q.notify({ type: 'positive', message: 'Ocupación finalizada.' });
  });
}
</script>

<style scoped>
.unidad-detalle {
  padding-top: 24px;
  padding-bottom: 24px;
}

.unidad-detalle-encabezado {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.unidad-detalle-volver {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto);
  flex-shrink: 0;
  text-decoration: none;
}

.unidad-detalle-encabezado__textos {
  flex-grow: 1;
  min-width: 200px;
}

.unidad-detalle-encabezado__titulo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unidad-detalle-encabezado__titulo h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.unidad-detalle-encabezado__resumen {
  font-size: 14px;
  color: var(--safic-texto-suave);
  margin-top: 2px;
}

.unidad-detalle-encabezado__acciones {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.unidad-detalle-boton {
  height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.unidad-detalle-boton--secundario {
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  color: var(--safic-texto);
}

.unidad-detalle-volver:focus-visible,
.unidad-detalle-boton:focus-visible,
.unidad-detalle-pestana:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.unidad-detalle-pestanas {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--safic-borde);
  overflow-x: auto;
}

.unidad-detalle-pestana {
  height: 44px;
  padding: 0 16px;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: var(--safic-texto-suave);
  cursor: pointer;
  white-space: nowrap;
}

.unidad-detalle-pestana--activa {
  font-weight: 800;
  color: var(--q-primary);
  border-bottom-color: var(--q-primary);
}

.unidad-detalle-cuerpo {
  display: flex;
  gap: 20px;
  flex-grow: 1;
  min-height: 0;
}

.unidad-detalle-principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.unidad-detalle-seccion {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.unidad-detalle-vacio {
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.unidad-detalle-lista {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 6px 18px;
}

.unidad-detalle-lista__fila {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--safic-linea-2);
}

.unidad-detalle-lista__fila:last-child {
  border-bottom: none;
}

.unidad-detalle-lista__fila--arriba {
  align-items: flex-start;
}

.unidad-detalle-lista__crece {
  flex-grow: 1;
  min-width: 0;
}

.unidad-detalle-lista__icono {
  color: var(--safic-texto-suave);
}

.unidad-detalle-lista__texto {
  font-size: 14px;
  color: var(--safic-texto-2);
}

.unidad-detalle-lista__nombre {
  font-size: 14px;
  font-weight: 700;
}

.unidad-detalle-lista__detalle {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.unidad-detalle-lista__vacio {
  padding: 12px 0;
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.unidad-detalle-historial__fecha {
  width: 90px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.unidad-detalle-lateral {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.unidad-detalle-tarjeta {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
}

.unidad-detalle-tarjeta__titulo {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}

.unidad-detalle-tarjeta__titulo--amplio {
  margin-bottom: 12px;
}

.unidad-detalle-tarjeta__vacio {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.unidad-detalle-vehiculo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.unidad-detalle-vehiculo__texto {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.unidad-detalle-mascota__nombre {
  font-size: 14px;
  font-weight: 700;
}

.unidad-detalle-mascota__detalle {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.unidad-detalle-contrato {
  font-size: 14px;
  color: var(--safic-texto-2);
}

.unidad-detalle-enlace {
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  color: var(--q-primary);
}

.unidad-detalle-contrato__enlace {
  display: inline-block;
  margin-top: 8px;
}

.unidad-detalle-agregar {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

.unidad-detalle-enlace--quitar {
  color: #9b1c12;
}

button.unidad-detalle-enlace {
  border: none;
  background: none;
  padding: 0 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
}

button.unidad-detalle-enlace:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.unidad-detalle-no-encontrada {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  text-align: center;
  color: var(--safic-texto-suave);
}

.unidad-detalle-no-encontrada__titulo {
  font-size: 20px;
  font-weight: 800;
  color: var(--safic-texto);
}

.unidad-detalle-no-encontrada__texto {
  font-size: 14px;
  margin-bottom: 8px;
}

@media (max-width: 1023px) {
  .unidad-detalle-cuerpo {
    flex-direction: column;
  }

  .unidad-detalle-lateral {
    width: auto;
  }
}
</style>
