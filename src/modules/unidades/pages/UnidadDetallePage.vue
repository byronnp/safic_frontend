<template>
  <q-page class="safic-main unidad-detalle">
    <template v-if="unidad && detalle">
      <div class="unidad-detalle-encabezado">
        <router-link
          :to="{ name: 'unidades' }"
          class="unidad-detalle-volver"
          aria-label="Volver a unidades"
        >
          <q-icon name="sym_r_chevron_left" size="20px" />
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
          <button
            type="button"
            class="unidad-detalle-boton unidad-detalle-boton--secundario"
            @click="avisar('La edición de unidades estará disponible pronto.')"
          >
            Editar unidad
          </button>
          <button
            type="button"
            class="unidad-detalle-boton"
            @click="avisar('La asignación de ocupantes estará disponible pronto.')"
          >
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
              v-for="o in detalle.ocupantes"
              :key="o.nombre"
              :ocupante="o"
              @accion="avisar"
            />
            <div v-if="detalle.ocupantes.length === 0" class="unidad-detalle-vacio">
              Esta unidad no tiene ocupantes registrados.
            </div>
          </template>

          <template v-else-if="pestana === 'vehiculos'">
            <div class="unidad-detalle-seccion">VEHÍCULOS</div>
            <div class="unidad-detalle-lista">
              <div v-for="v in detalle.vehiculos" :key="v.placa" class="unidad-detalle-lista__fila">
                <UnidadDetallePlaca :placa="v.placa" />
                <div class="unidad-detalle-lista__texto">{{ v.descripcion }}</div>
              </div>
              <div v-if="detalle.vehiculos.length === 0" class="unidad-detalle-lista__vacio">
                Sin vehículos registrados.
              </div>
            </div>
            <div class="unidad-detalle-seccion">MASCOTAS</div>
            <div class="unidad-detalle-lista">
              <div v-for="m in detalle.mascotas" :key="m.nombre" class="unidad-detalle-lista__fila">
                <div>
                  <div class="unidad-detalle-lista__nombre">{{ m.nombre }}</div>
                  <div class="unidad-detalle-lista__detalle">{{ m.descripcion }}</div>
                </div>
              </div>
              <div v-if="detalle.mascotas.length === 0" class="unidad-detalle-lista__vacio">
                Sin mascotas registradas.
              </div>
            </div>
          </template>

          <template v-else-if="pestana === 'documentos'">
            <div class="unidad-detalle-seccion">DOCUMENTOS</div>
            <div class="unidad-detalle-lista">
              <div
                v-for="d in detalle.documentos"
                :key="d.nombre"
                class="unidad-detalle-lista__fila"
              >
                <q-icon name="sym_r_description" size="22px" class="unidad-detalle-lista__icono" />
                <div class="unidad-detalle-lista__crece">
                  <div class="unidad-detalle-lista__nombre">{{ d.nombre }}</div>
                  <div class="unidad-detalle-lista__detalle">{{ d.detalle }}</div>
                </div>
                <a href="#" class="unidad-detalle-enlace" @click.prevent="verDocumento">Ver</a>
              </div>
              <div v-if="detalle.documentos.length === 0" class="unidad-detalle-lista__vacio">
                Sin documentos cargados.
              </div>
            </div>
          </template>

          <template v-else>
            <div class="unidad-detalle-seccion">HISTORIAL</div>
            <div class="unidad-detalle-lista">
              <div
                v-for="(e, i) in detalle.historial"
                :key="i"
                class="unidad-detalle-lista__fila unidad-detalle-lista__fila--arriba"
              >
                <div class="unidad-detalle-historial__fecha">{{ e.fecha }}</div>
                <div class="unidad-detalle-lista__texto">{{ e.texto }}</div>
              </div>
              <div v-if="detalle.historial.length === 0" class="unidad-detalle-lista__vacio">
                Sin movimientos registrados.
              </div>
            </div>
          </template>
        </div>

        <aside class="unidad-detalle-lateral">
          <div class="unidad-detalle-tarjeta">
            <div class="unidad-detalle-tarjeta__titulo unidad-detalle-tarjeta__titulo--amplio">
              VEHÍCULOS
            </div>
            <div v-for="v in detalle.vehiculos" :key="v.placa" class="unidad-detalle-vehiculo">
              <UnidadDetallePlaca :placa="v.placa" />
              <div class="unidad-detalle-vehiculo__texto">{{ v.descripcion }}</div>
            </div>
            <div v-if="detalle.vehiculos.length === 0" class="unidad-detalle-tarjeta__vacio">
              Sin vehículos registrados.
            </div>
          </div>
          <div class="unidad-detalle-tarjeta">
            <div class="unidad-detalle-tarjeta__titulo">MASCOTAS</div>
            <div v-for="m in detalle.mascotas" :key="m.nombre">
              <div class="unidad-detalle-mascota__nombre">{{ m.nombre }}</div>
              <div class="unidad-detalle-mascota__detalle">{{ m.descripcion }}</div>
            </div>
            <div v-if="detalle.mascotas.length === 0" class="unidad-detalle-tarjeta__vacio">
              Sin mascotas registradas.
            </div>
          </div>
          <div v-if="detalle.contrato" class="unidad-detalle-tarjeta">
            <div class="unidad-detalle-tarjeta__titulo">CONTRATO DE ARRIENDO</div>
            <div class="unidad-detalle-contrato">
              Vigente hasta {{ detalle.contrato.vigenteHasta }}
            </div>
            <a
              href="#"
              class="unidad-detalle-enlace unidad-detalle-contrato__enlace"
              @click.prevent="verDocumento"
            >
              Ver documento
            </a>
          </div>
        </aside>
      </div>
    </template>

    <div v-else class="unidad-detalle-no-encontrada safic-card">
      <q-icon name="sym_r_search_off" size="40px" />
      <div class="unidad-detalle-no-encontrada__titulo">Unidad no encontrada</div>
      <div class="unidad-detalle-no-encontrada__texto">
        No existe una unidad con el código {{ codigo }} en este condominio.
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
import { colorAvatar, iniciales } from '@/core/theme/avatar';

import UnidadDetalleOcupante from '../components/UnidadDetalleOcupante.vue';
import UnidadDetallePlaca from '../components/UnidadDetallePlaca.vue';
import {
  DETALLES_UNIDAD,
  ESTADOS_UNIDAD,
  UNIDADES,
  type DetalleUnidadDemo,
  type OcupanteDemo,
  type UnidadDemo,
} from '../demo/unidades';

type Pestana = 'ocupantes' | 'vehiculos' | 'documentos' | 'historial';

const PESTANAS: { clave: Pestana; texto: string }[] = [
  { clave: 'ocupantes', texto: 'Ocupantes' },
  { clave: 'vehiculos', texto: 'Vehículos y mascotas' },
  { clave: 'documentos', texto: 'Documentos' },
  { clave: 'historial', texto: 'Historial' },
];

const $q = useQuasar();
const route = useRoute();

const codigo = computed(() => {
  const valor = route.params.codigo;
  return (Array.isArray(valor) ? valor[0] : valor) ?? '';
});

const unidad = computed(() => UNIDADES.find((u) => u.codigo === codigo.value) ?? null);

const pestana = ref<Pestana>('ocupantes');
watch(codigo, () => (pestana.value = 'ocupantes'));

/** Ocupantes armados con los datos de la tabla cuando la muestra no trae el detalle. */
function detalleBasico(u: UnidadDemo): DetalleUnidadDemo {
  const persona = (nombre: string, relacion: string, principal: boolean, i: number) => {
    const color = colorAvatar(i);
    const ocupante: OcupanteDemo = {
      iniciales: iniciales(nombre),
      nombre,
      relacion,
      desde: '—',
      telefono: '—',
      documento: '—',
      cuenta: 'activa',
      principal,
      fondo: color.fondo,
      texto: color.texto,
    };
    return ocupante;
  };
  const ocupantes: OcupanteDemo[] = [];
  const inquilino = u.ocupante.replace(/\s*\(.*\)$/, '');
  if (u.estado === 'arrendada') {
    ocupantes.push(persona(u.propietario, 'Propietario (no reside)', false, 2));
    ocupantes.push(persona(inquilino, 'Inquilino', true, 0));
  } else if (u.estado === 'ocupada') {
    ocupantes.push(persona(u.propietario, 'Propietario', true, 0));
  } else {
    ocupantes.push(persona(u.propietario, 'Propietario (no reside)', false, 2));
  }
  return {
    ocupantes,
    vehiculos: [],
    mascotas: [],
    contrato: null,
    documentos: [],
    historial: [],
  };
}

const detalle = computed(() => {
  if (!unidad.value) return null;
  return DETALLES_UNIDAD[unidad.value.codigo] ?? detalleBasico(unidad.value);
});

/** "Torre A · Piso 1 · Departamento · 84 m² · Alícuota 0,62 %" */
const resumen = computed(() => {
  const u = unidad.value;
  if (!u) return '';
  return [
    u.bloque,
    u.piso !== null ? `Piso ${u.piso}` : null,
    u.tipoLargo,
    u.area,
    `Alícuota ${u.alicuota}`,
  ]
    .filter(Boolean)
    .join(' · ');
});

function avisar(mensaje: string) {
  $q.notify({ type: 'info', message: mensaje });
}

function verDocumento() {
  avisar('Los documentos estarán disponibles cuando se conecte la API.');
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
