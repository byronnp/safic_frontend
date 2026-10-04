<template>
  <q-page class="safic-main unidades">
    <PaginaEncabezado miga="Inicio / Unidades" titulo="Unidades">
      <template #acciones>
        <button type="button" class="unidades-boton unidades-boton--secundario" @click="importar">
          <q-icon :name="ICONOS.importar" size="18px" />Importar Excel
        </button>
        <router-link v-if="puedeEditar" :to="{ name: 'unidades-nueva' }" class="unidades-boton">
          <q-icon :name="ICONOS.agregar" size="18px" />Nueva unidad
        </router-link>
      </template>
    </PaginaEncabezado>

    <div v-if="resumen.data.value" class="safic-indicadores">
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Unidades</div>
        <div class="safic-indicador__valor">{{ resumen.data.value.registradas }}</div>
        <div class="safic-indicador__nota">
          de {{ resumen.data.value.total_contratadas }} contratadas
        </div>
        <div
          class="unidades-barra"
          role="progressbar"
          aria-label="Unidades registradas del total contratado"
          :aria-valuenow="resumen.data.value.registradas"
          aria-valuemin="0"
          :aria-valuemax="resumen.data.value.total_contratadas"
        >
          <div class="unidades-barra__relleno" :style="{ width: `${porcentajeCupo}%` }" />
        </div>
      </div>
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Ocupadas</div>
        <div class="safic-indicador__valor">{{ resumen.data.value.ocupadas }}</div>
        <div class="safic-indicador__nota">{{ porcentajeOcupadas }} % de las registradas</div>
      </div>
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Residentes registrados</div>
        <div class="safic-indicador__valor">{{ resumen.data.value.residentes }}</div>
        <div class="safic-indicador__nota">Propietarios, inquilinos y residentes vigentes</div>
      </div>
      <div
        class="safic-indicador"
        :class="{
          'unidades-indicador-alerta': alicuotas.estado !== 'ok' && alicuotas.estado !== 'vacio',
        }"
      >
        <div class="safic-indicador__etiqueta">Alícuotas</div>
        <div class="safic-indicador__valor">{{ alicuotas.valor }}</div>
        <div class="safic-indicador__nota">{{ alicuotas.nota }}</div>
      </div>
    </div>

    <section class="safic-tabla-seccion unidades-tabla">
      <div class="unidades-barra-herramientas">
        <label class="unidades-buscar">
          <q-icon :name="ICONOS.buscar" size="18px" class="unidades-buscar__icono" />
          <input
            v-model="busqueda"
            placeholder="Buscar por código u ocupante"
            aria-label="Buscar unidades"
          />
        </label>

        <UnidadesFiltro v-model="seleccion.bloque" etiqueta="Bloque" :opciones="opcionesBloque" />
        <UnidadesFiltro v-model="seleccion.tipo" etiqueta="Tipo" :opciones="opcionesTipo" />
        <UnidadesFiltro v-model="seleccion.estado" etiqueta="Estado" :opciones="opcionesEstado" />

        <div class="unidades-espaciador" />
        <div class="unidades-conteo">{{ conteo }}</div>
      </div>

      <div v-if="unidades.isError.value" class="q-pa-lg">
        <div class="safic-alerta row items-center" role="alert" style="gap: 12px">
          <span class="col-grow">{{ unidades.error.value?.mensaje }}</span>
          <q-btn flat no-caps dense label="Reintentar" @click="unidades.refetch()" />
        </div>
      </div>

      <div v-else class="unidades-desplazable" :aria-busy="unidades.isFetching.value">
        <div class="unidades-rejilla unidades-rejilla--cabecera" role="row">
          <div>CÓDIGO</div>
          <div>BLOQUE</div>
          <div>TIPO</div>
          <div>PROPIETARIO</div>
          <div>OCUPANTE PRINCIPAL</div>
          <div>ÁREA</div>
          <div>ALÍCUOTA</div>
          <div>ESTADO</div>
          <div />
        </div>

        <template v-if="unidades.isLoading.value">
          <div v-for="n in 6" :key="n" class="unidades-rejilla unidades-fila">
            <q-skeleton v-for="c in 8" :key="c" type="text" width="70%" />
            <div />
          </div>
        </template>

        <router-link
          v-for="fila in filas"
          v-else
          :key="fila.id"
          :to="{ name: 'unidad-detalle', params: { id: fila.id } }"
          class="unidades-rejilla unidades-fila"
          :aria-label="`Ver unidad ${fila.codigo}`"
        >
          <div class="unidades-fila__codigo">{{ fila.codigo }}</div>
          <div class="unidades-fila__suave">{{ fila.bloque?.nombre ?? '—' }}</div>
          <div class="unidades-fila__suave">{{ TIPO_CORTO[fila.tipo] }}</div>
          <div class="unidades-fila__propietario">{{ fila.propietarios.join(', ') || '—' }}</div>
          <div class="unidades-fila__suave">{{ ocupante(fila) }}</div>
          <div class="unidades-fila__suave">{{ formatoArea(fila.area_m2) }}</div>
          <div class="unidades-fila__suave">{{ formatoAlicuota(fila.alicuota) }}</div>
          <div>
            <EstadoBadge :tono="ESTADOS[fila.estado].tono">
              {{ ESTADOS[fila.estado].texto }}
            </EstadoBadge>
          </div>
          <div class="unidades-fila__flecha">
            <q-icon :name="ICONOS.siguiente" size="18px" />
          </div>
        </router-link>

        <div v-if="!unidades.isLoading.value && filas.length === 0" class="unidades-vacio">
          <template v-if="hayFiltros">
            <q-icon :name="ICONOS.sinResultados" size="36px" />
            <div class="unidades-vacio__titulo">Ninguna unidad coincide con la búsqueda.</div>
            <button type="button" class="unidades-vacio__limpiar" @click="limpiar">
              Quitar filtros
            </button>
          </template>
          <template v-else>
            <q-icon :name="ICONOS.unidades" size="40px" />
            <div class="unidades-vacio__titulo">Todavía no hay unidades.</div>
            <div>Registra los departamentos, casas, locales, parqueaderos y bodegas.</div>
            <router-link
              v-if="puedeEditar"
              :to="{ name: 'unidades-nueva' }"
              class="unidades-boton q-mt-sm"
            >
              <q-icon :name="ICONOS.agregar" size="18px" />Crear primera unidad
            </router-link>
          </template>
        </div>
      </div>

      <div v-if="paginacion && paginacion.last_page > 1" class="unidades-paginacion">
        <q-pagination
          v-model="pagina"
          :max="paginacion.last_page"
          :max-pages="7"
          direction-links
          boundary-links
          color="primary"
          aria-label="Páginas de unidades"
        />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';
import { formatoPorcentaje } from '@/utils/formato';

import UnidadesFiltro, { type OpcionFiltro } from '../components/UnidadesFiltro.vue';
import { useBloques } from '../composables/useBloques';
import { useResumenUnidades, useUnidades } from '../composables/useUnidades';
import { textoRelacion } from '../persona.formulario';
import type {
  EstadoUnidad,
  FiltroUnidades,
  TipoUnidad,
  Unidad,
} from '../services/unidades.service';
import { TIPOS_UNIDAD } from '../unidad.formulario';
import { ESTADOS_UNIDAD as ESTADOS, TIPO_CORTO } from '../unidad.textos';

const POR_PAGINA = 25;

const $q = useQuasar();
const session = useSessionStore();

// Mostrar el botón es comodidad; la API exige unidades.editar de todas formas.
const puedeEditar = computed(() => session.tienePermiso('unidades.editar'));

const busqueda = ref('');
const busquedaDebounced = refDebounced(busqueda, 300);
const seleccion = reactive<{ bloque: string; tipo: string; estado: string }>({
  bloque: '',
  tipo: '',
  estado: '',
});
const pagina = ref(1);

const filtro = computed<FiltroUnidades>(() => ({
  buscar: busquedaDebounced.value.trim(),
  tipo: seleccion.tipo as TipoUnidad | '',
  estado: seleccion.estado as EstadoUnidad | '',
  bloqueId: seleccion.bloque ? Number(seleccion.bloque) : null,
  pagina: pagina.value,
  porPagina: POR_PAGINA,
}));

// Un filtro nuevo vuelve a la primera página
watch(
  [busquedaDebounced, () => seleccion.bloque, () => seleccion.tipo, () => seleccion.estado],
  () => {
    pagina.value = 1;
  },
);

const unidades = useUnidades(filtro);
const resumen = useResumenUnidades();
const bloques = useBloques();

const filas = computed(() => unidades.data.value?.unidades ?? []);
const paginacion = computed(() => unidades.data.value?.paginacion);

const opcionesBloque = computed<OpcionFiltro[]>(() =>
  (bloques.data.value ?? []).map((b) => ({ valor: String(b.id), texto: b.nombre })),
);
const opcionesTipo: OpcionFiltro[] = TIPOS_UNIDAD.map((t) => ({ valor: t.valor, texto: t.texto }));
const opcionesEstado: OpcionFiltro[] = Object.entries(ESTADOS).map(([valor, e]) => ({
  valor,
  texto: e.texto,
}));

const hayFiltros = computed(
  () =>
    !!busquedaDebounced.value.trim() ||
    !!seleccion.bloque ||
    !!seleccion.tipo ||
    !!seleccion.estado,
);

const porcentajeCupo = computed(() => {
  const r = resumen.data.value;
  if (!r || r.total_contratadas === 0) return 0;
  return Math.min(100, (r.registradas / r.total_contratadas) * 100);
});

const porcentajeOcupadas = computed(() => {
  const r = resumen.data.value;
  if (!r || r.registradas === 0) return 0;
  return Math.round((r.ocupadas / r.registradas) * 100);
});

/** "Diego Mora (inquilino)"; el propietario que reside sin aclaración, como en el mockup. */
function ocupante(u: Unidad): string {
  const p = u.ocupante_principal;
  if (!p) return '—';
  return p.relacion === 'propietario'
    ? p.nombre
    : `${p.nombre} (${textoRelacion(p.relacion).toLowerCase()})`;
}

/** Suma de alícuotas frente a 100 % (solo se muestra: no es un monto). */
const alicuotas = computed(() => {
  const suma = Number(resumen.data.value?.suma_alicuotas ?? 0);
  if (suma === 0) {
    return { estado: 'vacio', valor: '—', nota: 'Aún no hay alícuotas registradas' };
  }
  const diferencia = Math.round((100 - suma) * 10000) / 10000;
  const valor = formatoPorcentaje(suma);
  if (diferencia === 0) return { estado: 'ok', valor, nota: 'Cuadra en 100 %' };
  return diferencia > 0
    ? { estado: 'falta', valor, nota: `Faltan ${formatoPorcentaje(diferencia)} para cuadrar` }
    : { estado: 'exceso', valor, nota: `Excede en ${formatoPorcentaje(-diferencia)}` };
});

/** "Mostrando 1–25 de 148", como en el mockup. */
const conteo = computed(() => {
  const p = paginacion.value;
  if (!p || p.total === 0) return unidades.isLoading.value ? '' : 'Sin resultados';
  const desde = (p.page - 1) * p.per_page + 1;
  const hasta = Math.min(desde + p.per_page - 1, p.total);
  return `Mostrando ${desde}–${hasta} de ${p.total}`;
});

function formatoArea(area: string): string {
  return `${Number(area).toLocaleString('es-EC', { maximumFractionDigits: 2 })} m²`;
}

function formatoAlicuota(alicuota: string | null): string {
  if (alicuota === null) return '—';
  return `${Number(alicuota).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} %`;
}

function limpiar(): void {
  busqueda.value = '';
  seleccion.bloque = '';
  seleccion.tipo = '';
  seleccion.estado = '';
}

function importar(): void {
  $q.notify({ type: 'info', message: 'La importación desde Excel estará disponible pronto.' });
}
</script>

<style scoped>
.unidades-boton {
  height: 44px;
  text-decoration: none;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.unidades-boton--secundario {
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  color: var(--safic-texto);
}

.unidades-boton:focus-visible,
.unidades-vacio__limpiar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.unidades-barra {
  height: 6px;
  border-radius: 3px;
  background: var(--safic-linea);
  margin-top: 10px;
  overflow: hidden;
}

.unidades-barra__relleno {
  height: 6px;
  background: var(--q-primary);
}

.unidades-indicador-alerta {
  background: #fff7ec;
  border-color: #f1d6ae;
}

.unidades-indicador-alerta .safic-indicador__etiqueta {
  color: #8a3f0a;
  font-weight: 700;
}

.unidades-indicador-alerta .safic-indicador__valor,
.unidades-indicador-alerta .safic-indicador__nota {
  color: #8a3f0a;
}

.unidades-tabla {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

.unidades-barra-herramientas {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--safic-linea);
  flex-wrap: wrap;
}

.unidades-buscar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  width: 340px;
  max-width: 100%;
  padding: 0 12px;
  border: 1px solid var(--safic-borde-2);
  border-radius: 10px;
  box-sizing: border-box;
}

.unidades-buscar:focus-within {
  border-color: var(--q-primary);
}

.unidades-buscar__icono {
  color: var(--safic-texto-suave);
}

.unidades-buscar input {
  border: none;
  outline: none;
  font-size: 14px;
  flex-grow: 1;
  min-width: 0;
  background: transparent;
  font-family: inherit;
  color: var(--safic-texto);
}

.unidades-espaciador {
  flex-grow: 1;
}

.unidades-conteo {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.unidades-desplazable {
  overflow-x: auto;
}

.unidades-rejilla {
  display: grid;
  grid-template-columns: 110px 140px 110px 1.4fr 1.2fr 90px 90px 120px 48px;
  min-width: 1040px;
}

.unidades-rejilla--cabecera {
  padding: 12px 20px;
  background: var(--safic-fondo-2);
  border-bottom: 1px solid var(--safic-linea);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.unidades-fila {
  align-items: center;
  padding: 0 20px;
  height: 56px;
  border-bottom: 1px solid var(--safic-linea-2);
  font-size: 14px;
  color: var(--safic-texto);
  text-decoration: none;
}

.unidades-fila:hover {
  background: var(--safic-fondo-2);
}

.unidades-fila:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.unidades-paginacion {
  display: flex;
  justify-content: center;
  padding: 14px 20px;
}

.unidades-fila__codigo {
  font-weight: 800;
}

.unidades-fila__suave {
  color: var(--safic-texto-2);
}

.unidades-fila__propietario {
  font-weight: 600;
}

.unidades-fila__flecha {
  color: var(--safic-texto-suave);
  display: flex;
  justify-content: center;
}

.unidades-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--safic-texto-suave);
}

.unidades-vacio__titulo {
  font-size: 15px;
  font-weight: 700;
  color: var(--safic-texto);
}

.unidades-vacio__limpiar {
  border: none;
  background: none;
  color: var(--q-primary);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}
</style>
