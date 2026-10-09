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

      <div v-if="amenidades.isPending.value" class="amenidades__principal" aria-busy="true">
        <q-skeleton type="rect" height="72px" class="amenidades__skeleton" />
        <q-skeleton type="rect" height="320px" class="amenidades__skeleton" />
      </div>

      <div v-else-if="amenidades.isError.value" class="safic-alerta" role="alert">
        {{ amenidades.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="amenidades.refetch()" />
      </div>

      <template v-else>
        <div class="kpis">
          <div v-for="k in kpis" :key="k.l" class="kpi">
            <div class="kpi__etiqueta">{{ k.l }}</div>
            <div class="kpi__valor">{{ k.v }}</div>
          </div>
        </div>

        <div v-if="!lista.length" class="amenidades__vacio">
          <q-icon :name="ICONOS.vacio" size="36px" />
          <div>Todavía no hay amenidades. Agrega las del catálogo o crea las propias.</div>
        </div>

        <div v-else class="tabla">
          <div class="tabla__desplazable">
            <div class="tabla__fila tabla__cabecera">
              <div>AMENIDAD</div>
              <div>ORIGEN</div>
              <div>UBICACIÓN</div>
              <div>USO</div>
              <div>ESTADO</div>
            </div>
            <button
              v-for="a in lista"
              :key="a.id"
              type="button"
              class="tabla__fila tabla__item"
              :class="{ 'tabla__item--activa': modo === 'detalle' && a.id === seleccionada?.id }"
              :aria-pressed="modo === 'detalle' && a.id === seleccionada?.id"
              @click="elegir(a.id)"
            >
              <div class="amenidad">
                <span class="amenidad__icono" :style="{ background: colorAmenidad(a) }">
                  {{ inicialesAmenidad(a.nombre) }}
                </span>
                <div class="amenidad__textos">
                  <div class="amenidad__nombre" :title="a.nombre">{{ a.nombre }}</div>
                  <div class="amenidad__tipo" :title="a.tipo ?? 'Propia del condominio'">
                    {{ a.tipo ?? 'Propia del condominio' }}
                  </div>
                </div>
              </div>
              <div>
                <span class="chip" :class="a.origen === 'catalogo' ? 'chip--neutro' : 'chip--info'">
                  {{ a.origen === 'catalogo' ? 'Catálogo' : 'Propia' }}
                </span>
              </div>
              <div class="tabla__texto">{{ a.ubicacion ?? '—' }}</div>
              <div class="tabla__texto">{{ usoAmenidad(a) }}</div>
              <div>
                <span class="chip" :class="`chip--${tonoEstadoAmenidad(a)}`">
                  {{ estadoAmenidad(a) }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </template>
    </section>

    <aside class="panel" :aria-label="modo === 'detalle' ? 'Detalle de la amenidad' : 'Agregar'">
      <AmenidadesDetalle
        v-if="modo === 'detalle' && seleccionada"
        :key="seleccionada.id"
        :amenidad="seleccionada"
      />
      <AmenidadesAgregar
        v-else-if="modo === 'agregar'"
        :amenidades="lista"
        @cerrar="modo = 'detalle'"
        @agregadas="agregadas"
      />
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { useIsMutating } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';

import AmenidadesAgregar from '../components/AmenidadesAgregar.vue';
import AmenidadesDetalle from '../components/AmenidadesDetalle.vue';
import {
  colorAmenidad,
  estadoAmenidad,
  inicialesAmenidad,
  kpisAmenidades,
  tonoEstadoAmenidad,
  usoAmenidad,
} from '../amenidades.logica';
import { useAmenidades } from '../composables/useAmenidades';
import type { AmenidadCondominio } from '../services/amenidades.service';

const session = useSessionStore();
const amenidades = useAmenidades();
// Mientras se guarda algo no se cambia de amenidad ni se abre otro formulario
const guardando = useIsMutating();

const modo = ref<'detalle' | 'agregar'>('detalle');
const seleccionId = ref<number | null>(null);

const lista = computed(() => amenidades.data.value ?? []);
const kpis = computed(() => kpisAmenidades(lista.value));

// Por omisión la primera; si la elegida desaparece de la lista, vuelve a la primera
const seleccionada = computed(
  () => lista.value.find((a) => a.id === seleccionId.value) ?? lista.value[0] ?? null,
);

// Al cambiar de condominio no queda una amenidad ni un formulario del anterior
watch(
  () => session.condominioId,
  () => {
    seleccionId.value = null;
    modo.value = 'detalle';
  },
);

function elegir(id: number) {
  if (guardando.value > 0) {
    return;
  }
  seleccionId.value = id;
  modo.value = 'detalle';
}

function abrirAgregar() {
  if (guardando.value > 0) {
    return;
  }
  modo.value = 'agregar';
}

function agregadas(creadas: AmenidadCondominio[]) {
  seleccionId.value = creadas[0]?.id ?? null;
  modo.value = 'detalle';
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

.amenidades__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--safic-texto-suave);
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
}

.amenidades__skeleton {
  border-radius: 14px;
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
