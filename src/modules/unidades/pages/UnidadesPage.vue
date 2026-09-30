<template>
  <q-page class="safic-main unidades">
    <PaginaEncabezado miga="Inicio / Unidades" titulo="Unidades">
      <template #acciones>
        <button type="button" class="unidades-boton unidades-boton--secundario" @click="importar">
          <q-icon name="sym_r_upload" size="18px" />Importar Excel
        </button>
        <button type="button" class="unidades-boton" @click="nuevaUnidad">
          <q-icon name="sym_r_add" size="18px" />Nueva unidad
        </button>
      </template>
    </PaginaEncabezado>

    <div class="safic-indicadores">
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Unidades</div>
        <div class="safic-indicador__valor">{{ INDICADORES_UNIDADES.unidades }}</div>
        <div class="safic-indicador__nota">{{ INDICADORES_UNIDADES.unidadesNota }}</div>
      </div>
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Ocupadas</div>
        <div class="safic-indicador__valor">{{ INDICADORES_UNIDADES.ocupadas }}</div>
        <div
          class="unidades-barra"
          role="progressbar"
          aria-label="Porcentaje de unidades ocupadas"
          :aria-valuenow="INDICADORES_UNIDADES.ocupadasPorcentaje"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="unidades-barra__relleno"
            :style="{ width: `${INDICADORES_UNIDADES.ocupadasPorcentaje}%` }"
          />
        </div>
      </div>
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Residentes registrados</div>
        <div class="safic-indicador__valor">{{ INDICADORES_UNIDADES.residentes }}</div>
        <div class="safic-indicador__nota">{{ INDICADORES_UNIDADES.residentesNota }}</div>
      </div>
      <div class="safic-indicador unidades-indicador-alerta">
        <div class="safic-indicador__etiqueta">Alícuotas</div>
        <div class="safic-indicador__valor">{{ INDICADORES_UNIDADES.alicuotas }}</div>
        <div class="safic-indicador__nota">{{ INDICADORES_UNIDADES.alicuotasNota }}</div>
      </div>
    </div>

    <section class="safic-tabla-seccion unidades-tabla">
      <div class="unidades-barra-herramientas">
        <label class="unidades-buscar">
          <q-icon name="sym_r_search" size="18px" class="unidades-buscar__icono" />
          <input
            v-model="busqueda"
            placeholder="Buscar por código, propietario o placa"
            aria-label="Buscar unidades"
          />
        </label>

        <UnidadesFiltro
          v-for="filtro in filtros"
          :key="filtro.clave"
          v-model="seleccion[filtro.clave]"
          :etiqueta="filtro.etiqueta"
          :opciones="filtro.opciones"
        />

        <div class="unidades-espaciador" />
        <div class="unidades-conteo">{{ conteo }}</div>
      </div>

      <div class="unidades-desplazable">
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

        <router-link
          v-for="fila in filas"
          :key="fila.codigo"
          :to="{ name: 'unidad-detalle', params: { codigo: fila.codigo } }"
          class="unidades-rejilla unidades-fila"
          :aria-label="`Ver unidad ${fila.codigo}`"
        >
          <div class="unidades-fila__codigo">{{ fila.codigo }}</div>
          <div class="unidades-fila__suave">{{ fila.bloque }}</div>
          <div class="unidades-fila__suave">{{ fila.tipo }}</div>
          <div class="unidades-fila__propietario">{{ fila.propietario }}</div>
          <div class="unidades-fila__suave">{{ fila.ocupante }}</div>
          <div class="unidades-fila__suave">{{ fila.area }}</div>
          <div class="unidades-fila__suave">{{ fila.alicuota }}</div>
          <div>
            <EstadoBadge :tono="ESTADOS_UNIDAD[fila.estado].tono">
              {{ ESTADOS_UNIDAD[fila.estado].texto }}
            </EstadoBadge>
          </div>
          <div class="unidades-fila__flecha">
            <q-icon name="sym_r_chevron_right" size="18px" />
          </div>
        </router-link>

        <div v-if="filas.length === 0" class="unidades-vacio">
          <q-icon name="sym_r_search_off" size="36px" />
          <div class="unidades-vacio__titulo">Ninguna unidad coincide con la búsqueda.</div>
          <button type="button" class="unidades-vacio__limpiar" @click="limpiar">
            Quitar filtros
          </button>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';

import UnidadesFiltro, { type OpcionFiltro } from '../components/UnidadesFiltro.vue';
import {
  DETALLES_UNIDAD,
  ESTADOS_UNIDAD,
  INDICADORES_UNIDADES,
  TOTAL_UNIDADES,
  UNIDADES,
  type UnidadDemo,
} from '../demo/unidades';

type ClaveFiltro = 'bloque' | 'tipo' | 'estado';

const $q = useQuasar();

const busqueda = ref('');
const seleccion = reactive<Record<ClaveFiltro, string>>({ bloque: '', tipo: '', estado: '' });

function unicos(valores: string[]): OpcionFiltro[] {
  return [...new Set(valores)].map((v) => ({ valor: v, texto: v }));
}

const filtros: { clave: ClaveFiltro; etiqueta: string; opciones: OpcionFiltro[] }[] = [
  { clave: 'bloque', etiqueta: 'Bloque', opciones: unicos(UNIDADES.map((u) => u.bloque)) },
  { clave: 'tipo', etiqueta: 'Tipo', opciones: unicos(UNIDADES.map((u) => u.tipo)) },
  {
    clave: 'estado',
    etiqueta: 'Estado',
    opciones: Object.entries(ESTADOS_UNIDAD).map(([valor, e]) => ({ valor, texto: e.texto })),
  },
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function coincide(u: UnidadDemo, termino: string): boolean {
  if (!termino) return true;
  const placas = (DETALLES_UNIDAD[u.codigo]?.vehiculos ?? []).map((v) => v.placa);
  return [u.codigo, u.propietario, u.ocupante, ...placas].some((t) =>
    normalizar(t).includes(termino),
  );
}

const filas = computed(() => {
  const termino = normalizar(busqueda.value.trim());
  return UNIDADES.filter(
    (u) =>
      (!seleccion.bloque || u.bloque === seleccion.bloque) &&
      (!seleccion.tipo || u.tipo === seleccion.tipo) &&
      (!seleccion.estado || u.estado === seleccion.estado) &&
      coincide(u, termino),
  );
});

const hayFiltros = computed(
  () => !!busqueda.value.trim() || !!seleccion.bloque || !!seleccion.tipo || !!seleccion.estado,
);

/** "Mostrando 1–8 de 148", como en el mockup. */
const conteo = computed(() => {
  const n = filas.value.length;
  if (n === 0) return 'Sin resultados';
  return `Mostrando 1–${n} de ${hayFiltros.value ? n : TOTAL_UNIDADES}`;
});

function limpiar() {
  busqueda.value = '';
  seleccion.bloque = '';
  seleccion.tipo = '';
  seleccion.estado = '';
}

function importar() {
  $q.notify({ type: 'info', message: 'La importación desde Excel estará disponible pronto.' });
}

function nuevaUnidad() {
  $q.notify({ type: 'info', message: 'El registro de unidades estará disponible pronto.' });
}
</script>

<style scoped>
.unidades-boton {
  height: 44px;
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
.unidades-fila:focus-visible,
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
  grid-template-columns: 110px 140px 90px 1.4fr 1.2fr 90px 90px 120px 48px;
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
