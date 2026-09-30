<template>
  <q-page class="catalogo">
    <section class="catalogo__lista">
      <PaginaEncabezado miga="Plataforma / Catálogo de amenidades" titulo="Catálogo de amenidades">
        <template #acciones>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn catalogo__nueva"
            label="Nueva amenidad"
            @click="nueva"
          />
        </template>
      </PaginaEncabezado>

      <div class="safic-pestanas" role="tablist" aria-label="Ámbito del catálogo">
        <button
          v-for="a in ambitos"
          :key="a.valor"
          type="button"
          role="tab"
          class="safic-pestana catalogo__pestana"
          :class="{ 'safic-pestana--activa': a.valor === ambito }"
          :aria-selected="a.valor === ambito"
          @click="cambiarAmbito(a.valor)"
        >
          {{ a.etiqueta }}
        </button>
      </div>

      <div class="catalogo__filtros" role="group" aria-label="Filtrar por categoría">
        <button
          v-for="c in categorias"
          :key="c.valor"
          type="button"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': c.valor === categoria }"
          :aria-pressed="c.valor === categoria"
          @click="categoria = c.valor"
        >
          {{ c.etiqueta }}
        </button>
      </div>

      <div class="catalogo__tabla">
        <div class="catalogo__desplazable">
          <div class="catalogo__fila catalogo__cabecera" :style="{ gridTemplateColumns: columnas }">
            <div>AMENIDAD</div>
            <div>CATEGORÍA</div>
            <div>COMPORTAMIENTO</div>
            <div>{{ ambito === 'global' ? 'EN USO' : 'CONDOMINIO' }}</div>
            <div>ESTADO</div>
          </div>
          <button
            v-for="x in filas"
            :key="x.id"
            type="button"
            class="catalogo__fila catalogo__registro"
            :class="{
              'catalogo__registro--activo': !nuevoActivo && x.id === seleccion?.id,
              'catalogo__registro--inactivo': !x.activa,
            }"
            :style="{ gridTemplateColumns: columnas }"
            :aria-pressed="!nuevoActivo && x.id === seleccion?.id"
            @click="seleccionar(x.id)"
          >
            <div class="catalogo__amenidad">
              <CatalogoAmenidadesIcono
                :texto="iniciales(x.nombre)"
                :categoria="x.categoria"
                :tamano="36"
              />
              <div class="catalogo__textos">
                <div class="catalogo__nombre" :title="x.nombre">{{ x.nombre }}</div>
                <div class="catalogo__descripcion" :title="x.descripcion">{{ x.descripcion }}</div>
              </div>
            </div>
            <div class="catalogo__celda">{{ CATEGORIAS_AMENIDAD[x.categoria].nombre }}</div>
            <div class="catalogo__chips">
              <span
                v-for="t in etiquetas(x)"
                :key="t.texto"
                class="chip"
                :class="`chip--${t.tono}`"
              >
                {{ t.texto }}
              </span>
            </div>
            <div class="catalogo__celda catalogo__celda--fuerte">
              {{
                ambito === 'global' ? (x.uso ? `${x.uso} condominios` : 'Sin uso') : x.condominio
              }}
            </div>
            <div>
              <span class="chip" :class="x.activa ? 'chip--exito' : 'chip--apagada'">
                {{ x.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
          </button>
          <div v-if="!filas.length" class="catalogo__vacio">
            No hay amenidades en esta categoría.
          </div>
        </div>
      </div>
    </section>

    <aside v-if="actual" class="panel" aria-label="Detalle de la amenidad">
      <div class="panel__cabecera">
        <CatalogoAmenidadesIcono
          :texto="nuevoActivo ? '+' : iniciales(actual.nombre)"
          :categoria="actual.categoria"
          :tamano="48"
        />
        <div class="panel__titulos">
          <div class="panel__tipo">{{ tituloPanel }}</div>
          <div class="panel__nombre">{{ actual.nombre || 'Nueva amenidad' }}</div>
        </div>
      </div>

      <div v-if="ambito === 'propias' && !nuevoActivo" class="panel__propia">
        Creada por el administrador de <strong>{{ actual.condominio }}</strong
        >. Solo ese condominio la ve. Si otros la piden, promuévela al catálogo global.
      </div>

      <label class="panel__campo">
        Nombre
        <input v-model="actual.nombre" class="panel__control" />
      </label>
      <div class="panel__par">
        <label class="panel__campo">
          Categoría
          <select v-model="actual.categoria" class="panel__control panel__control--select">
            <option v-for="(c, clave) in CATEGORIAS_AMENIDAD" :key="clave" :value="clave">
              {{ c.nombre }}
            </option>
          </select>
        </label>
        <label class="panel__campo">
          Orden
          <input
            class="panel__control"
            inputmode="numeric"
            :value="actual.orden"
            @input="actual.orden = Number(($event.target as HTMLInputElement).value) || 0"
          />
        </label>
      </div>

      <div class="panel__interruptores">
        <div v-for="s in INTERRUPTORES" :key="s.campo" class="panel__interruptor">
          <div class="panel__interruptor-textos">
            <div class="panel__interruptor-etiqueta">{{ s.etiqueta }}</div>
            <div class="panel__interruptor-ayuda">{{ s.ayuda }}</div>
          </div>
          <CatalogoAmenidadesInterruptor
            :model-value="actual[s.campo]"
            :etiqueta="s.etiqueta"
            @update:model-value="alternar(s.campo, $event)"
          />
        </div>
      </div>

      <div v-if="actual.reservable" class="panel__par">
        <label class="panel__campo">
          Capacidad sugerida
          <input
            class="panel__control"
            inputmode="numeric"
            :value="actual.capacidad || ''"
            @input="actual.capacidad = Number(($event.target as HTMLInputElement).value) || 0"
          />
        </label>
        <label class="panel__campo">
          Duración máxima
          <input
            class="panel__control"
            :value="actual.duracion === '—' ? '' : actual.duracion"
            @input="actual.duracion = ($event.target as HTMLInputElement).value || '—'"
          />
        </label>
      </div>

      <div class="panel__aviso" :class="`panel__aviso--${aviso.tono}`" aria-live="polite">
        {{ aviso.texto }}
      </div>
      <div class="panel__espacio" />
      <div class="panel__acciones">
        <button
          type="button"
          class="panel__boton panel__boton--secundario"
          :class="`panel__boton--${secundario.tono}`"
          @click="accionSecundaria"
        >
          {{ secundario.texto }}
        </button>
        <button type="button" class="panel__boton panel__boton--principal" @click="guardar">
          {{ nuevoActivo ? 'Crear amenidad' : 'Guardar cambios' }}
        </button>
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import CatalogoAmenidadesIcono from '@/modules/plataforma/components/CatalogoAmenidadesIcono.vue';
import CatalogoAmenidadesInterruptor from '@/modules/plataforma/components/CatalogoAmenidadesInterruptor.vue';
import {
  AMENIDADES_GLOBALES,
  AMENIDADES_PROPIAS,
  CATEGORIAS_AMENIDAD,
} from '@/modules/plataforma/demo/catalogo-amenidades';
import type {
  AmenidadCatalogo,
  CategoriaAmenidad,
} from '@/modules/plataforma/demo/catalogo-amenidades';

type Ambito = 'global' | 'propias';
type CampoInterruptor = 'reservable' | 'esencial' | 'requiereAprobacion' | 'activa';
type Tono = 'exito' | 'info' | 'alerta' | 'neutro' | 'error';

const $q = useQuasar();

const INTERRUPTORES: { campo: CampoInterruptor; etiqueta: string; ayuda: string }[] = [
  {
    campo: 'reservable',
    etiqueta: 'Reservable',
    ayuda: 'Los residentes pueden reservarla (fase 3)',
  },
  { campo: 'esencial', etiqueta: 'Esencial', ayuda: 'Nunca se restringe a morosos (Decreto 462)' },
  {
    campo: 'requiereAprobacion',
    etiqueta: 'Requiere aprobación',
    ayuda: 'La reserva queda pendiente hasta que el admin la apruebe',
  },
  { campo: 'activa', etiqueta: 'Activa', ayuda: 'Inactiva: no aparece para nuevos condominios' },
];

const globales = ref<AmenidadCatalogo[]>(AMENIDADES_GLOBALES.map((x) => ({ ...x })));
const propias = ref<AmenidadCatalogo[]>(AMENIDADES_PROPIAS.map((x) => ({ ...x })));

const ambito = ref<Ambito>('global');
const categoria = ref<CategoriaAmenidad | 'todas'>('todas');
const seleccionId = ref<number>(globales.value[0]?.id ?? 0);
const nuevoActivo = ref(false);
const guardado = ref(false);
const errorNombre = ref('');
const borrador = ref<AmenidadCatalogo>(borradorVacio());

function borradorVacio(): AmenidadCatalogo {
  return {
    id: 0,
    nombre: 'Nueva amenidad',
    categoria: 'rec',
    descripcion: '',
    reservable: true,
    esencial: false,
    requiereAprobacion: false,
    activa: true,
    capacidad: 0,
    duracion: '—',
    orden: globales.value.length + 1,
    uso: 0,
    condominio: '',
  };
}

const lista = computed(() => (ambito.value === 'global' ? globales.value : propias.value));
const columnas = computed(() =>
  ambito.value === 'global' ? '1.6fr 110px 190px 130px 100px' : '1.6fr 110px 190px 170px 100px',
);

const ambitos = computed<{ valor: Ambito; etiqueta: string }[]>(() => [
  { valor: 'global', etiqueta: `Globales (${globales.value.length})` },
  { valor: 'propias', etiqueta: `Propias de condominios (${propias.value.length})` },
]);

const categorias: { valor: CategoriaAmenidad | 'todas'; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  ...(Object.keys(CATEGORIAS_AMENIDAD) as CategoriaAmenidad[]).map((k) => ({
    valor: k,
    etiqueta: CATEGORIAS_AMENIDAD[k].nombre,
  })),
];

const filas = computed(() =>
  lista.value.filter((x) => categoria.value === 'todas' || x.categoria === categoria.value),
);

const seleccion = computed(
  () => lista.value.find((x) => x.id === seleccionId.value) ?? lista.value[0],
);
const actual = computed(() => (nuevoActivo.value ? borrador.value : seleccion.value));

/** Iniciales como en el mockup: palabras de más de 2 letras o con números. */
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter((w) => w.length > 2 || /\d/.test(w))
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

function etiquetas(x: AmenidadCatalogo): { texto: string; tono: Tono | 'apagada' }[] {
  const t: { texto: string; tono: Tono | 'apagada' }[] = [];
  if (x.reservable) t.push({ texto: 'Reservable', tono: 'exito' });
  if (x.esencial) t.push({ texto: 'Esencial', tono: 'info' });
  if (x.requiereAprobacion) t.push({ texto: 'Con aprobación', tono: 'alerta' });
  if (!t.length) t.push({ texto: 'Informativa', tono: 'neutro' });
  return t;
}

const tituloPanel = computed(() => {
  if (nuevoActivo.value) return 'Nueva amenidad global';
  return ambito.value === 'global' ? 'Amenidad global' : 'Amenidad propia';
});

const aviso = computed<{ texto: string; tono: Tono | 'uso' }>(() => {
  const x = actual.value;
  if (errorNombre.value) return { texto: errorNombre.value, tono: 'error' };
  if (guardado.value) {
    return {
      texto: 'Cambios guardados. Los condominios que ya la usan conservan su propia configuración.',
      tono: 'exito',
    };
  }
  if (nuevoActivo.value) {
    return { texto: 'El nombre no puede repetirse en el catálogo global.', tono: 'neutro' };
  }
  if (ambito.value === 'global' && x && x.uso > 0) {
    return {
      texto: `Usada en ${x.uso} condominios: no se puede eliminar, solo desactivar. Cambiar los valores sugeridos no altera a quienes ya la configuraron.`,
      tono: 'uso',
    };
  }
  if (ambito.value === 'global') {
    return { texto: 'Ningún condominio la usa. Se puede eliminar.', tono: 'neutro' };
  }
  return {
    texto: 'Al promoverla pasa al catálogo global y el condominio la conserva sin cambios.',
    tono: 'info',
  };
});

const secundario = computed<{ texto: string; tono: 'normal' | 'peligro' | 'azul' }>(() => {
  if (ambito.value === 'propias' && !nuevoActivo.value) {
    return { texto: 'Promover a global', tono: 'azul' };
  }
  if (nuevoActivo.value) return { texto: 'Cancelar', tono: 'normal' };
  const x = actual.value;
  if (x && x.uso > 0) return { texto: x.activa ? 'Desactivar' : 'Activar', tono: 'normal' };
  return { texto: 'Eliminar', tono: 'peligro' };
});

// Cualquier edición del registro abierto quita el aviso de "guardado".
watch(
  () => (actual.value ? { ...actual.value } : null),
  (nuevo, anterior) => {
    if (nuevo && anterior && nuevo.id === anterior.id) {
      guardado.value = false;
      errorNombre.value = '';
    }
  },
);

function cambiarAmbito(valor: Ambito): void {
  ambito.value = valor;
  categoria.value = 'todas';
  nuevoActivo.value = false;
  guardado.value = false;
  errorNombre.value = '';
  seleccionId.value = lista.value[0]?.id ?? 0;
}

function seleccionar(id: number): void {
  seleccionId.value = id;
  nuevoActivo.value = false;
  guardado.value = false;
  errorNombre.value = '';
}

function nueva(): void {
  ambito.value = 'global';
  borrador.value = borradorVacio();
  nuevoActivo.value = true;
  guardado.value = false;
  errorNombre.value = '';
}

function alternar(campo: CampoInterruptor, valor: boolean): void {
  const x = actual.value;
  if (!x) return;
  x[campo] = valor;
  // Reservable y esencial se excluyen: una esencial no se reserva.
  if (campo === 'esencial' && valor) x.reservable = false;
  if (campo === 'reservable' && valor) x.esencial = false;
}

function guardar(): void {
  const x = actual.value;
  if (!x) return;
  const nombre = x.nombre.trim();
  if (!nombre) {
    errorNombre.value = 'Escribe el nombre de la amenidad.';
    return;
  }
  if (nuevoActivo.value) {
    const repetida = globales.value.some((g) => g.nombre.toLowerCase() === nombre.toLowerCase());
    if (repetida) {
      errorNombre.value = `Ya existe «${nombre}» en el catálogo global.`;
      return;
    }
    const id = Math.max(0, ...globales.value.map((g) => g.id)) + 1;
    globales.value.push({ ...x, id, nombre });
    nuevoActivo.value = false;
    seleccionId.value = id;
    $q.notify({ type: 'positive', message: `${nombre} se agregó al catálogo global.` });
    return;
  }
  guardado.value = true;
}

function accionSecundaria(): void {
  const x = actual.value;
  if (!x) return;
  if (nuevoActivo.value) {
    nuevoActivo.value = false;
    return;
  }
  if (ambito.value === 'propias') {
    propias.value = propias.value.filter((p) => p.id !== x.id);
    globales.value.push({
      ...x,
      id: Math.max(0, ...globales.value.map((g) => g.id)) + 1,
      uso: 1,
      condominio: '',
      orden: globales.value.length + 1,
    });
    seleccionId.value = propias.value[0]?.id ?? 0;
    $q.notify({ type: 'positive', message: `${x.nombre} pasó al catálogo global.` });
    return;
  }
  if (x.uso > 0) {
    x.activa = !x.activa;
    $q.notify({
      type: 'positive',
      message: x.activa ? `${x.nombre} está activa.` : `${x.nombre} quedó desactivada.`,
    });
    return;
  }
  globales.value = globales.value.filter((g) => g.id !== x.id);
  seleccionId.value = globales.value[0]?.id ?? 0;
  $q.notify({ type: 'positive', message: `${x.nombre} se eliminó del catálogo.` });
}
</script>

<style scoped>
.catalogo {
  padding: 26px 32px;
  display: flex;
  gap: 18px;
  box-sizing: border-box;
}

.catalogo__lista {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.catalogo__nueva.q-btn {
  padding: 0 16px;
}

.catalogo__pestana {
  height: 42px;
}

.catalogo__filtros {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.catalogo__tabla {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.catalogo__desplazable {
  overflow-x: auto;
}

.catalogo__fila {
  display: grid;
  gap: 12px;
  align-items: center;
  min-width: 700px;
}

.catalogo__cabecera {
  padding: 9px 16px;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.catalogo__registro {
  width: 100%;
  text-align: left;
  padding: 0 16px;
  height: 56px;
  border: none;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
}

.catalogo__registro:hover {
  background: var(--safic-fondo-2);
}

.catalogo__registro--activo,
.catalogo__registro--activo:hover {
  background: #f2f7f6;
  box-shadow: inset 3px 0 0 var(--q-primary);
}

.catalogo__registro--inactivo {
  opacity: 0.6;
}

.catalogo__registro:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.catalogo__amenidad {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.catalogo__textos {
  min-width: 0;
}

.catalogo__nombre {
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.catalogo__descripcion {
  font-size: 12px;
  color: var(--safic-texto-suave);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.catalogo__celda {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.catalogo__celda--fuerte {
  font-weight: 600;
}

.catalogo__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.catalogo__vacio {
  padding: 24px 16px;
  font-size: 14px;
  color: var(--safic-texto-suave);
  border-top: 1px solid var(--safic-linea-2);
}

.chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.chip--exito {
  background: #e3efec;
  color: #0b4a47;
}

.chip--info {
  background: #e6ecf7;
  color: #23407a;
}

.chip--alerta {
  background: #fff1dc;
  color: #8a3f0a;
}

.chip--neutro {
  background: #f1efe8;
  color: #5f5b52;
}

.chip--apagada {
  background: #f1efe8;
  color: #6b675d;
}

/* ---------- Panel de edición ---------- */

.panel {
  width: 380px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.panel__cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel__titulos {
  flex-grow: 1;
  min-width: 0;
}

.panel__tipo {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.panel__nombre {
  font-size: 18px;
  font-weight: 800;
}

.panel__propia {
  background: #e6ecf7;
  color: #23407a;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
}

.panel__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.panel__control {
  height: 40px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  font-weight: 400;
  color: var(--safic-texto);
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.panel__control:focus {
  outline: 2px solid color-mix(in srgb, var(--q-primary) 35%, transparent);
  border-color: var(--q-primary);
}

.panel__control--select {
  padding: 0 8px;
  font-size: 14px;
}

.panel__par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.panel__interruptores {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
}

.panel__interruptor {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--safic-linea-2);
}

.panel__interruptor-textos {
  flex-grow: 1;
}

.panel__interruptor-etiqueta {
  font-size: 13px;
  font-weight: 700;
}

.panel__interruptor-ayuda {
  font-size: 11px;
  color: var(--safic-texto-suave);
}

.panel__aviso {
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
}

.panel__aviso--exito {
  background: #e3efec;
  color: #0b4a47;
}

.panel__aviso--neutro {
  background: #f1efe8;
  color: #3d3a33;
}

.panel__aviso--uso {
  background: #fff7ec;
  color: #7a3808;
}

.panel__aviso--info {
  background: #e6ecf7;
  color: #23407a;
}

.panel__aviso--error {
  background: #fde8e6;
  color: #9b1c12;
}

.panel__espacio {
  flex-grow: 1;
}

.panel__acciones {
  display: flex;
  gap: 10px;
}

.panel__boton {
  height: 46px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.panel__boton--secundario {
  padding: 0 14px;
  background: #ffffff;
  border: 1px solid var(--safic-borde-2);
  color: var(--safic-texto);
}

.panel__boton--peligro {
  border-color: #9b1c12;
  color: #9b1c12;
}

.panel__boton--azul {
  border-color: #23407a;
  color: #23407a;
}

.panel__boton--principal {
  flex-grow: 1;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

@media (max-width: 1100px) {
  .catalogo {
    flex-direction: column;
  }

  .panel {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .catalogo {
    padding: 20px 16px;
  }
}
</style>
