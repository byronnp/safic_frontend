<template>
  <q-page class="safic-main preparar">
    <section class="preparar__principal">
      <PaginaEncabezado miga="Asambleas / Preparar" :titulo="BORRADOR_ASAMBLEA.titulo">
        <template #acciones>
          <span class="preparar__estado" :class="{ 'preparar__estado--convocada': convocada }">
            {{ convocada ? 'Convocada' : 'Borrador' }}
          </span>
        </template>
      </PaginaEncabezado>

      <div class="preparar__datos">
        <label class="preparar__campo">
          Tipo<select v-model="form.tipo" class="preparar__control preparar__control--select">
            <option v-for="t in TIPOS_ASAMBLEA" :key="t">{{ t }}</option>
          </select>
        </label>
        <label class="preparar__campo">
          Modalidad<select
            v-model="form.modalidad"
            class="preparar__control preparar__control--select"
          >
            <option v-for="m in MODALIDADES_ASAMBLEA" :key="m">{{ m }}</option>
          </select>
        </label>
        <label class="preparar__campo">
          Fecha y hora<input v-model="form.fechaHora" class="preparar__control" />
        </label>
        <label class="preparar__campo">
          Lugar<input v-model="form.lugar" class="preparar__control" />
        </label>
        <div class="preparar__legal">
          <q-icon name="sym_r_check" size="20px" class="preparar__legal-icono" />
          {{ AVISO_ANTICIPACION }}
        </div>
      </div>

      <div class="preparar__orden">
        <div class="preparar__orden-cab">
          <h2 class="preparar__orden-titulo">Orden del día</h2>
          <button type="button" class="preparar__agregar" @click="dialogo = true">
            Agregar punto
          </button>
        </div>
        <div class="preparar__scroll">
          <div class="preparar__fila preparar__fila--cabecera">
            <div>N.º</div>
            <div>PUNTO</div>
            <div>TIPO</div>
            <div>MAYORÍA</div>
            <div>ADJUNTO</div>
          </div>
          <div v-for="(p, i) in puntos" :key="`${i}-${p.titulo}`" class="preparar__fila">
            <div class="preparar__n">{{ i + 1 }}</div>
            <div class="preparar__punto">{{ p.titulo }}</div>
            <div>
              <EstadoBadge :tono="TIPOS_PUNTO[p.tipo].tono" :texto="TIPOS_PUNTO[p.tipo].nombre" />
            </div>
            <div class="preparar__mayoria">{{ p.mayoria }}</div>
            <div class="preparar__adjunto">{{ p.adjunto }}</div>
          </div>
        </div>
      </div>
    </section>

    <aside class="preparar__lateral">
      <div class="preparar__padron">
        <h2 class="preparar__padron-titulo">Padrón para la asamblea</h2>
        <div class="preparar__dato">
          <span>Unidades con propietario</span
          ><strong>{{ PADRON_ASAMBLEA.unidadesConPropietario }}</strong>
        </div>
        <div class="preparar__dato">
          <span>Suma de alícuotas</span><strong>{{ PADRON_ASAMBLEA.sumaAlicuotas }}</strong>
        </div>
        <div class="preparar__dato preparar__dato--mora">
          <span>En mora hoy (no votan)</span><strong>{{ PADRON_ASAMBLEA.enMora }}</strong>
        </div>
        <div class="preparar__dato">
          <span>Quórum 1.ª convocatoria</span><strong>{{ PADRON_ASAMBLEA.quorum }}</strong>
        </div>
        <div class="preparar__padron-nota">
          La foto definitiva de alícuotas, propietarios y mora se congela al instalar la asamblea.
        </div>
      </div>
      <div class="preparar__aviso">
        Al convocar se publica un anuncio con <strong>confirmación de lectura</strong> a las
        {{ PADRON_ASAMBLEA.unidadesConPropietario }} unidades; la constancia queda como respaldo
        legal.
      </div>
      <div class="preparar__relleno" />
      <button type="button" class="preparar__guardar" @click="guardarBorrador">
        Guardar borrador
      </button>
      <button type="button" class="preparar__convocar" :disabled="convocada" @click="convocar">
        {{ convocada ? 'Asamblea convocada' : 'Convocar asamblea' }}
      </button>
    </aside>

    <PrepararAsambleaPuntoDialogo v-model="dialogo" @agregar="agregarPunto" />
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import PrepararAsambleaPuntoDialogo from '@/modules/asambleas/components/PrepararAsambleaPuntoDialogo.vue';
import {
  AVISO_ANTICIPACION,
  BORRADOR_ASAMBLEA,
  MODALIDADES_ASAMBLEA,
  PADRON_ASAMBLEA,
  PUNTOS_ORDEN_DIA,
  TIPOS_ASAMBLEA,
  TIPOS_PUNTO,
} from '@/modules/asambleas/demo/preparar';
import type { PuntoOrdenDia } from '@/modules/asambleas/demo/preparar';

const $q = useQuasar();

const form = reactive({ ...BORRADOR_ASAMBLEA });
const puntos = ref<PuntoOrdenDia[]>([...PUNTOS_ORDEN_DIA]);
const dialogo = ref(false);
const convocada = ref(false);

function agregarPunto(punto: PuntoOrdenDia): void {
  puntos.value = [...puntos.value, punto];
  $q.notify({ type: 'positive', message: 'Punto agregado al orden del día' });
}

function guardarBorrador(): void {
  $q.notify({ type: 'positive', message: 'Borrador guardado' });
}

function convocar(): void {
  $q.dialog({
    title: 'Convocar asamblea',
    message: `Se publicará la convocatoria con confirmación de lectura a las ${PADRON_ASAMBLEA.unidadesConPropietario} unidades.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Convocar', color: 'primary', unelevated: true, noCaps: true },
  }).onOk(() => {
    convocada.value = true;
    $q.notify({ type: 'positive', message: 'Asamblea convocada y anuncio publicado' });
  });
}
</script>

<style scoped>
.preparar.safic-main {
  padding: 24px 32px;
  flex-direction: row;
  gap: 20px;
  align-items: stretch;
}

.preparar__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.preparar__estado {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f1efe8;
  color: var(--safic-texto-2);
  font-size: 13px;
  font-weight: 700;
}

.preparar__estado--convocada {
  background: #e3efec;
  color: #0b4a47;
}

.preparar__datos {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
}

.preparar__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.preparar__control {
  height: 44px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  font-weight: 400;
  color: var(--safic-texto);
  background: #ffffff;
  min-width: 0;
}

.preparar__control--select {
  padding: 0 10px;
}

.preparar__control:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.preparar__legal {
  grid-column: span 4;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e3efec;
  color: #0b4a47;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
}

.preparar__legal-icono {
  flex-shrink: 0;
}

.preparar__orden {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  flex-grow: 1;
}

.preparar__orden-cab {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--safic-linea);
}

.preparar__orden-titulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
  flex-grow: 1;
}

.preparar__agregar {
  height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.preparar__scroll {
  overflow-x: auto;
}

.preparar__fila {
  display: grid;
  grid-template-columns: 40px minmax(220px, 1fr) 170px 200px 90px;
  align-items: center;
  padding: 0 20px;
  height: 54px;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
  min-width: 720px;
}

.preparar__fila--cabecera {
  height: auto;
  padding: 10px 20px;
  border-top: none;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.preparar__n {
  font-weight: 800;
}

.preparar__punto {
  font-weight: 600;
}

.preparar__mayoria {
  color: var(--safic-texto-2);
  font-size: 13px;
}

.preparar__adjunto {
  color: var(--q-primary);
  font-weight: 700;
  font-size: 13px;
}

.preparar__lateral {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preparar__padron {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preparar__padron-titulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
}

.preparar__dato {
  display: flex;
}

.preparar__dato span {
  flex-grow: 1;
  color: var(--safic-texto-2);
}

.preparar__dato--mora span,
.preparar__dato--mora strong {
  color: #9b1c12;
}

.preparar__padron-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.preparar__aviso {
  background: #fff7ec;
  border: 1px solid #f1d6ae;
  border-radius: 14px;
  padding: 16px 18px;
  font-size: 13px;
  color: #7a3808;
  line-height: 1.5;
}

.preparar__relleno {
  flex-grow: 1;
}

.preparar__guardar,
.preparar__convocar {
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.preparar__guardar {
  height: 46px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
}

.preparar__convocar {
  height: 50px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 15px;
}

.preparar__convocar:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (max-width: 1100px) {
  .preparar.safic-main {
    flex-direction: column;
  }

  .preparar__lateral {
    width: 100%;
  }

  .preparar__datos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preparar__legal {
    grid-column: span 2;
  }
}

@media (max-width: 599px) {
  .preparar.safic-main {
    padding: 20px 16px;
  }

  .preparar__datos {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }

  .preparar__legal {
    grid-column: span 1;
  }
}
</style>
