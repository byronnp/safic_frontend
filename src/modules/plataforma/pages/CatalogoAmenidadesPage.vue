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
            :disable="ocupado"
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

          <div v-if="consulta.isPending.value" class="catalogo__estado" aria-busy="true">
            <q-skeleton v-for="i in 5" :key="i" type="rect" height="44px" class="q-mb-sm" />
          </div>
          <div
            v-else-if="consulta.isError.value"
            class="catalogo__estado safic-alerta"
            role="alert"
          >
            {{ consulta.error.value?.mensaje }}
            <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
          </div>
          <template v-else>
            <button
              v-for="x in filas"
              :key="`${ambito}-${x.id}-${'condominio_id' in x ? x.condominio_id : 0}`"
              type="button"
              class="catalogo__fila catalogo__registro"
              :class="{
                'catalogo__registro--activo': !nuevoActivo && clave(x) === claveSeleccion,
                'catalogo__registro--inactivo': !x.activa,
              }"
              :style="{ gridTemplateColumns: columnas }"
              :aria-pressed="!nuevoActivo && clave(x) === claveSeleccion"
              @click="seleccionar(x)"
            >
              <div class="catalogo__amenidad">
                <CatalogoAmenidadesIcono
                  :texto="inicialesTipo(x.nombre)"
                  :categoria="x.categoria"
                  :tamano="36"
                />
                <div class="catalogo__textos">
                  <div class="catalogo__nombre" :title="x.nombre">{{ x.nombre }}</div>
                  <div
                    v-if="'descripcion' in x"
                    class="catalogo__descripcion"
                    :title="x.descripcion ?? ''"
                  >
                    {{ x.descripcion }}
                  </div>
                </div>
              </div>
              <div class="catalogo__celda">{{ etiquetaCategoria(x.categoria) }}</div>
              <div class="catalogo__chips">
                <span
                  v-for="t in etiquetasTipo(x)"
                  :key="t.texto"
                  class="chip"
                  :class="`chip--${t.tono}`"
                >
                  {{ t.texto }}
                </span>
              </div>
              <div class="catalogo__celda catalogo__celda--fuerte">
                {{ textoUso(x) }}
              </div>
              <div>
                <span class="chip" :class="x.activa ? 'chip--exito' : 'chip--apagada'">
                  {{ x.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </button>
            <div v-if="!filas.length" class="catalogo__vacio">
              {{
                ambito === 'global'
                  ? 'No hay amenidades en esta categoría.'
                  : 'Ningún condominio ha creado amenidades propias en esta categoría.'
              }}
            </div>
          </template>
        </div>
      </div>
    </section>

    <aside v-if="formulario" class="panel" aria-label="Detalle de la amenidad">
      <div class="panel__cabecera">
        <CatalogoAmenidadesIcono
          :texto="nuevoActivo ? '+' : inicialesTipo(formulario.nombre)"
          :categoria="formulario.categoria"
          :tamano="48"
        />
        <div class="panel__titulos">
          <div class="panel__tipo">{{ tituloPanel }}</div>
          <div class="panel__nombre">{{ formulario.nombre || 'Nueva amenidad' }}</div>
        </div>
      </div>

      <div v-if="propiaActual" class="panel__propia">
        Creada por el administrador de <strong>{{ propiaActual.condominio }}</strong
        >. Solo ese condominio la ve. Si otros la piden, promuévela al catálogo global.
      </div>

      <label class="panel__campo">
        Nombre
        <input
          v-model="formulario.nombre"
          class="panel__control"
          maxlength="80"
          :disabled="soloLectura"
        />
      </label>
      <label v-if="!propiaActual" class="panel__campo">
        Descripción
        <input v-model="formulario.descripcion" class="panel__control" maxlength="200" />
      </label>
      <div class="panel__par">
        <label class="panel__campo">
          Categoría
          <select
            v-model="formulario.categoria"
            class="panel__control panel__control--select"
            :disabled="soloLectura"
          >
            <option v-for="c in CATEGORIAS" :key="c.valor" :value="c.valor">
              {{ c.etiqueta }}
            </option>
          </select>
        </label>
        <label class="panel__campo">
          Orden
          <input
            v-model="formulario.orden"
            class="panel__control"
            inputmode="numeric"
            :disabled="soloLectura"
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
            :model-value="formulario[s.campo]"
            :etiqueta="s.etiqueta"
            :disabled="soloLectura"
            @update:model-value="alternar(s.campo, $event)"
          />
        </div>
      </div>

      <div v-if="formulario.reservable" class="panel__par">
        <label class="panel__campo">
          Capacidad sugerida
          <input
            v-model="formulario.capacidad"
            class="panel__control"
            inputmode="numeric"
            :disabled="soloLectura"
          />
        </label>
        <label class="panel__campo">
          Duración máxima
          <input
            v-model="formulario.duracion"
            class="panel__control"
            placeholder="3 h"
            :disabled="soloLectura"
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
          :disabled="ocupado || (secundario.accion === 'alternar' && hayCambios)"
          :title="
            secundario.accion === 'alternar' && hayCambios
              ? 'Guarda o descarta los cambios antes'
              : undefined
          "
          @click="ejecutarSecundaria"
        >
          {{ secundario.texto }}
        </button>
        <button
          v-if="!propiaActual"
          type="button"
          class="panel__boton panel__boton--principal"
          :disabled="ocupado || (!nuevoActivo && !hayCambios)"
          @click="guardar"
        >
          {{ ocupado ? 'Guardando…' : nuevoActivo ? 'Crear amenidad' : 'Guardar cambios' }}
        </button>
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, nextTick, reactive, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { CATEGORIAS } from '@/modules/configuracion/amenidades.logica';
import type { CategoriaAmenidad } from '@/modules/configuracion/services/amenidades.service';
import CatalogoAmenidadesIcono from '@/modules/plataforma/components/CatalogoAmenidadesIcono.vue';
import CatalogoAmenidadesInterruptor from '@/modules/plataforma/components/CatalogoAmenidadesInterruptor.vue';

import {
  accionSecundaria,
  alternarInterruptor,
  avisoTipo,
  CAMPOS_API_TIPO,
  cambiosTipo,
  etiquetasTipo,
  formularioDesde,
  formularioNuevo,
  inicialesTipo,
  peticionNueva,
  validarTipo,
  type CampoInterruptor,
  type FormularioTipo,
} from '../catalogo-amenidades.logica';
import {
  useCrearTipo,
  useEditarTipo,
  useEliminarTipo,
  usePromoverPropia,
  usePropiasCatalogo,
  useTiposCatalogo,
} from '../composables/useCatalogoAmenidades';
import type { AmenidadPropia, TipoCatalogo } from '../services/catalogo-amenidades.service';

type Ambito = 'global' | 'propias';
type Fila = TipoCatalogo | AmenidadPropia;

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

const ambito = ref<Ambito>('global');
const categoria = ref<CategoriaAmenidad | 'todas'>('todas');
const claveSeleccion = ref<string | null>(null);
const nuevoActivo = ref(false);
const guardado = ref(false);
const errorGeneral = ref<string | null>(null);

const tipos = useTiposCatalogo();
const propias = usePropiasCatalogo(computed(() => ambito.value === 'propias'));
const crear = useCrearTipo();
const editar = useEditarTipo();
const eliminar = useEliminarTipo();
const promover = usePromoverPropia();

const consulta = computed(() => (ambito.value === 'global' ? tipos : propias));
const ocupado = computed(
  () =>
    crear.isPending.value ||
    editar.isPending.value ||
    eliminar.isPending.value ||
    promover.isPending.value,
);

const lista = computed<Fila[]>(
  () => (ambito.value === 'global' ? tipos.data.value : propias.data.value) ?? [],
);
const columnas = computed(() =>
  ambito.value === 'global' ? '1.6fr 110px 190px 130px 100px' : '1.6fr 110px 190px 170px 100px',
);

const ambitos = computed<{ valor: Ambito; etiqueta: string }[]>(() => [
  {
    valor: 'global',
    etiqueta: `Globales${tipos.data.value ? ` (${tipos.data.value.length})` : ''}`,
  },
  {
    valor: 'propias',
    etiqueta: `Propias de condominios${propias.data.value ? ` (${propias.data.value.length})` : ''}`,
  },
]);

const categorias = computed<{ valor: CategoriaAmenidad | 'todas'; etiqueta: string }[]>(() => [
  { valor: 'todas', etiqueta: 'Todas' },
  ...CATEGORIAS.map((c) => ({ valor: c.valor, etiqueta: c.etiqueta })),
]);

const filas = computed(() =>
  lista.value.filter((x) => categoria.value === 'todas' || x.categoria === categoria.value),
);

/** Una fila se identifica por ámbito, condominio (si es propia) e id. */
function clave(x: Fila): string {
  return `${ambito.value}:${'condominio_id' in x ? x.condominio_id : 0}:${x.id}`;
}

const seleccion = computed<Fila | null>(
  () => lista.value.find((x) => clave(x) === claveSeleccion.value) ?? lista.value[0] ?? null,
);
const propiaActual = computed(() =>
  !nuevoActivo.value &&
  ambito.value === 'propias' &&
  seleccion.value &&
  'condominio_id' in seleccion.value
    ? seleccion.value
    : null,
);
const tipoActual = computed(() =>
  !nuevoActivo.value && ambito.value === 'global' && seleccion.value && 'orden' in seleccion.value
    ? seleccion.value
    : null,
);
const soloLectura = computed(() => propiaActual.value !== null);

const formulario = ref<FormularioTipo | null>(null);
const errores = reactive<{
  nombre?: string | undefined;
  orden?: string | undefined;
  capacidad?: string | undefined;
  duracion?: string | undefined;
}>({});

// El panel parte de lo guardado cuando cambia la fila elegida (no en cada refresco de la
// lista, que borraría lo que se está escribiendo)
const claveActual = computed(() => (seleccion.value ? clave(seleccion.value) : null));
watch(
  [claveActual, nuevoActivo],
  () => {
    if (nuevoActivo.value) {
      return;
    }
    formulario.value = seleccion.value ? formularioDesde(seleccion.value) : null;
    limpiar();
  },
  { immediate: true },
);

const hayCambios = computed(
  () =>
    !!formulario.value &&
    !!tipoActual.value &&
    Object.keys(cambiosTipo(formulario.value, tipoActual.value)).length > 0,
);

const tituloPanel = computed(() => {
  if (nuevoActivo.value) return 'Nueva amenidad global';
  return ambito.value === 'global' ? 'Amenidad global' : 'Amenidad propia';
});

const uso = computed(() => tipoActual.value?.uso ?? 0);

const aviso = computed(() =>
  avisoTipo({
    ambito: ambito.value,
    nuevo: nuevoActivo.value,
    guardado: guardado.value,
    error: errorGeneral.value ?? Object.values(errores)[0] ?? null,
    uso: uso.value,
  }),
);

const secundario = computed(() =>
  accionSecundaria({
    ambito: ambito.value,
    nuevo: nuevoActivo.value,
    uso: uso.value,
    // Lo guardado, no el interruptor sin guardar: la acción usa este mismo valor
    activa: tipoActual.value?.activa ?? true,
  }),
);

function etiquetaCategoria(c: CategoriaAmenidad | null): string {
  return CATEGORIAS.find((x) => x.valor === c)?.etiqueta ?? '—';
}

function textoUso(x: Fila): string {
  if ('condominio' in x) return x.condominio;
  return x.uso ? `${x.uso} ${x.uso === 1 ? 'condominio' : 'condominios'}` : 'Sin uso';
}

function limpiar(): void {
  errores.nombre = undefined;
  errores.orden = undefined;
  errores.capacidad = undefined;
  errores.duracion = undefined;
  errorGeneral.value = null;
  guardado.value = false;
}

// Cualquier edición quita el aviso de "guardado"
watch(
  () => (formulario.value ? { ...formulario.value } : null),
  (nuevo, anterior) => {
    if (nuevo && anterior) {
      guardado.value = false;
    }
  },
);

function cambiarAmbito(valor: Ambito): void {
  if (ocupado.value) return;
  ambito.value = valor;
  categoria.value = 'todas';
  nuevoActivo.value = false;
  claveSeleccion.value = null;
  limpiar();
}

function seleccionar(x: Fila): void {
  if (ocupado.value) return;
  claveSeleccion.value = clave(x);
  nuevoActivo.value = false;
  limpiar();
}

function nueva(): void {
  ambito.value = 'global';
  formulario.value = formularioNuevo(
    Math.max(0, ...(tipos.data.value ?? []).map((t) => t.orden)) + 1,
  );
  nuevoActivo.value = true;
  limpiar();
}

function alternar(campo: CampoInterruptor, valor: boolean): void {
  if (formulario.value && !soloLectura.value) {
    alternarInterruptor(formulario.value, campo, valor);
  }
}

function pintarErrorApi(e: unknown): void {
  const apiError = aApiError(e);
  let pintado = false;
  for (const [campoApi, campo] of Object.entries(CAMPOS_API_TIPO)) {
    const mensaje = apiError.campo(campoApi);
    if (
      mensaje &&
      (campo === 'nombre' || campo === 'orden' || campo === 'capacidad' || campo === 'duracion')
    ) {
      errores[campo] = mensaje;
      pintado = true;
    } else if (mensaje) {
      errorGeneral.value = mensaje;
      pintado = true;
    }
  }
  if (!pintado) {
    errorGeneral.value = apiError.mensaje;
  }
}

async function guardar(): Promise<void> {
  const f = formulario.value;
  if (!f || soloLectura.value) return;
  limpiar();
  Object.assign(errores, validarTipo(f));
  if (Object.values(errores).some(Boolean)) return;

  try {
    if (nuevoActivo.value) {
      const creado = await crear.mutateAsync(peticionNueva(f));
      nuevoActivo.value = false;
      claveSeleccion.value = `global:0:${creado.id}`;
      $q.notify({ type: 'positive', message: `${creado.nombre} se agregó al catálogo global.` });
    } else if (tipoActual.value) {
      const actualizado = await editar.mutateAsync({
        id: tipoActual.value.id,
        datos: cambiosTipo(f, tipoActual.value),
      });
      formulario.value = formularioDesde(actualizado);
      await nextTick(); // la edición del formulario quita el aviso: se muestra después
      guardado.value = true;
    }
  } catch (e) {
    pintarErrorApi(e);
  }
}

function confirmar(
  titulo: string,
  mensaje: string,
  boton: string,
  color: string,
  accion: () => void,
): void {
  $q.dialog({
    title: titulo,
    message: mensaje,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: boton, color, unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(accion);
}

async function promoverPropia(propia: AmenidadPropia): Promise<void> {
  try {
    await promover.mutateAsync({ condominioId: propia.condominio_id, amenidadId: propia.id });
    $q.notify({ type: 'positive', message: `${propia.nombre} pasó al catálogo global.` });
    claveSeleccion.value = null;
  } catch (e) {
    pintarErrorApi(e);
  }
}

async function eliminarTipo(tipo: TipoCatalogo): Promise<void> {
  try {
    await eliminar.mutateAsync(tipo.id);
    $q.notify({ type: 'positive', message: `${tipo.nombre} se eliminó del catálogo.` });
    claveSeleccion.value = null;
  } catch (e) {
    pintarErrorApi(e);
  }
}

function ejecutarSecundaria(): void {
  const { accion } = secundario.value;
  if (accion === 'cancelar') {
    nuevoActivo.value = false;
    return;
  }

  if (accion === 'promover' && propiaActual.value) {
    // Se toma la fila al abrir el diálogo, no al confirmar
    const propia = propiaActual.value;
    confirmar(
      'Promover a global',
      `«${propia.nombre}» pasará al catálogo global y ${propia.condominio} la conserva sin cambios.`,
      'Promover',
      'primary',
      () => void promoverPropia(propia),
    );
    return;
  }

  const tipo = tipoActual.value;
  if (!tipo) return;

  if (accion === 'alternar') {
    void editar
      .mutateAsync({ id: tipo.id, datos: { activa: !tipo.activa } })
      .then(() =>
        $q.notify({
          type: 'positive',
          message: tipo.activa
            ? `${tipo.nombre} quedó desactivada.`
            : `${tipo.nombre} está activa.`,
        }),
      )
      .catch(pintarErrorApi);
    return;
  }

  confirmar(
    'Eliminar del catálogo',
    `«${tipo.nombre}» se elimina del catálogo. Ningún condominio la usa.`,
    'Eliminar',
    'negative',
    () => void eliminarTipo(tipo),
  );
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

.catalogo__estado {
  padding: 16px;
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
