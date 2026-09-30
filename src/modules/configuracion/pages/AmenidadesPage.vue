<template>
  <q-page class="safic-main amenidades">
    <section class="amenidades__principal">
      <PaginaEncabezado miga="Configuración / Amenidades" titulo="Amenidades del condominio">
        <template #acciones>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn amenidades__agregar"
            label="Agregar amenidad"
            @click="abrirAgregar"
          />
        </template>
      </PaginaEncabezado>

      <div class="kpis">
        <div v-for="k in kpis" :key="k.l" class="kpi">
          <div class="kpi__etiqueta">{{ k.l }}</div>
          <div class="kpi__valor">{{ k.v }}</div>
        </div>
      </div>

      <div class="tabla">
        <div class="tabla__desplazable">
          <div class="tabla__fila tabla__cabecera">
            <div>AMENIDAD</div>
            <div>ORIGEN</div>
            <div>UBICACIÓN</div>
            <div>USO</div>
            <div>ESTADO</div>
          </div>
          <button
            v-for="(a, i) in amenidades"
            :key="`${a.nombre}-${i}`"
            type="button"
            class="tabla__fila tabla__item"
            :class="{ 'tabla__item--activa': modo === 'detalle' && i === seleccion }"
            :aria-pressed="modo === 'detalle' && i === seleccion"
            @click="elegir(i)"
          >
            <div class="amenidad">
              <span class="amenidad__icono" :style="{ background: COLOR_CATEGORIA[a.categoria] }">
                {{ inicialesAmenidad(a.nombre) }}
              </span>
              <div class="amenidad__textos">
                <div class="amenidad__nombre" :title="a.nombre">{{ a.nombre }}</div>
                <div class="amenidad__tipo" :title="a.tipo">{{ a.tipo }}</div>
              </div>
            </div>
            <div>
              <span class="chip" :class="a.origen === 'cat' ? 'chip--neutro' : 'chip--info'">
                {{ a.origen === 'cat' ? 'Catálogo' : 'Propia' }}
              </span>
            </div>
            <div class="tabla__texto">{{ a.ubicacion }}</div>
            <div class="tabla__texto">{{ usoAmenidad(a) }}</div>
            <div>
              <span class="chip" :class="a.mantenimiento ? 'chip--alerta' : 'chip--exito'">
                {{ estadoAmenidad(a) }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>

    <aside class="panel" :aria-label="modo === 'detalle' ? 'Detalle de la amenidad' : 'Agregar'">
      <AmenidadesDetalle
        v-if="modo === 'detalle' && seleccionada"
        :amenidad="seleccionada"
        @mantenimiento="alternarMantenimiento"
        @desactivar="desactivar"
      />
      <AmenidadesAgregar
        v-else-if="modo === 'agregar'"
        :key="formularioId"
        :amenidades="amenidades"
        @cerrar="modo = 'detalle'"
        @agregar="agregar"
      />
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import AmenidadesAgregar from '../components/AmenidadesAgregar.vue';
import AmenidadesDetalle from '../components/AmenidadesDetalle.vue';
import { estadoAmenidad, inicialesAmenidad, usoAmenidad } from '../components/amenidades-formato';
import { AMENIDADES, COLOR_CATEGORIA, MANTENIMIENTO_HASTA } from '../demo/amenidades';
import type { Amenidad } from '../demo/amenidades';

const $q = useQuasar();

const amenidades = ref<Amenidad[]>(AMENIDADES.map((a) => ({ ...a })));
const modo = ref<'detalle' | 'agregar'>('detalle');
const seleccion = ref(2);
const formularioId = ref(0);

const seleccionada = computed(() => amenidades.value[seleccion.value] ?? amenidades.value[0]);

const kpis = computed(() => [
  { l: 'Amenidades', v: amenidades.value.length },
  { l: 'Reservables', v: amenidades.value.filter((a) => a.reservable).length },
  { l: 'En mantenimiento', v: amenidades.value.filter((a) => a.mantenimiento).length },
  { l: 'Propias', v: amenidades.value.filter((a) => a.origen === 'prop').length },
]);

function elegir(i: number) {
  seleccion.value = i;
  modo.value = 'detalle';
}

function abrirAgregar() {
  formularioId.value++;
  modo.value = 'agregar';
}

function alternarMantenimiento() {
  const a = seleccionada.value;
  if (a) {
    a.mantenimiento = a.mantenimiento ? null : MANTENIMIENTO_HASTA;
  }
}

function desactivar() {
  $q.notify({ type: 'positive', message: 'Amenidad desactivada.' });
}

function agregar(nuevas: Amenidad[]) {
  seleccion.value = amenidades.value.length;
  amenidades.value.push(...nuevas);
  modo.value = 'detalle';
  $q.notify({
    type: 'positive',
    message: nuevas.length > 1 ? `${nuevas.length} amenidades agregadas.` : 'Amenidad agregada.',
  });
}
</script>

<style scoped>
.amenidades.safic-main {
  padding: 22px 32px;
  flex-direction: row;
  gap: 18px;
}

.amenidades__agregar.q-btn {
  padding: 0 16px;
}

.amenidades__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.kpi {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 12px 16px;
}

.kpi__etiqueta {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.kpi__valor {
  font-size: 22px;
  font-weight: 800;
  margin-top: 2px;
}

.tabla {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  min-height: 0;
}

.tabla__desplazable {
  overflow-x: auto;
  height: 100%;
}

.tabla__fila {
  display: grid;
  /* Mockup: 1.5fr 120px 150px 190px 150px. Con el panel de 390px no caben en 720px,
     así que las columnas fijas se ajustan y el nombre pasa a dos líneas. */
  grid-template-columns: minmax(150px, 1.5fr) 84px 114px 112px 172px;
  gap: 10px;
  min-width: 712px;
}

.tabla__cabecera {
  padding: 9px 16px;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.tabla__item {
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 0 16px;
  height: 54px;
  border: none;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
}

.tabla__item--activa {
  background: color-mix(in srgb, var(--q-primary) 6%, #ffffff);
  box-shadow: inset 3px 0 0 var(--q-primary);
}

.tabla__texto {
  font-size: 13px;
  line-height: 1.3;
  color: var(--safic-texto-2);
}

.amenidad {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.amenidad__icono {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
}

.amenidad__textos {
  min-width: 0;
}

.amenidad__nombre {
  font-weight: 800;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.amenidad__tipo {
  font-size: 12px;
  line-height: 1.35;
  color: var(--safic-texto-suave);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.chip--neutro {
  background: #f1efe8;
  color: var(--safic-texto-2);
}

.chip--info {
  background: #e6ecf7;
  color: #23407a;
}

.chip--exito {
  background: #e3efec;
  color: #0b4a47;
}

.chip--alerta {
  background: #fff1dc;
  color: #8a3f0a;
}

.panel {
  width: 390px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  overflow: hidden;
}

@media (max-width: 1199px) {
  .amenidades.safic-main {
    flex-direction: column;
  }

  .panel {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .amenidades.safic-main {
    padding: 20px 16px;
  }

  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
