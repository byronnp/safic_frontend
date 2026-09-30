<template>
  <q-page class="safic-main areas">
    <aside class="areas__lista">
      <PaginaEncabezado
        class="areas__encabezado"
        miga="Áreas comunes / Áreas y reglas"
        titulo="Áreas"
      />
      <div class="areas__nota">Salen de las amenidades reservables del condominio.</div>
      <button
        v-for="a in areas"
        :key="a.id"
        type="button"
        class="areas__opcion"
        :class="{ 'areas__opcion--activa': a.id === seleccionId }"
        :aria-pressed="a.id === seleccionId"
        @click="seleccionar(a.id)"
      >
        <span class="areas__opcion-nombre">{{ a.nombre }}</span>
        <span class="areas__opcion-resumen">{{ a.resumen }}</span>
      </button>
    </aside>

    <section class="areas__detalle">
      <div class="areas__cab">
        <div class="areas__cab-textos">
          <h2 class="areas__titulo">{{ form.nombre }}</h2>
          <div class="areas__subtitulo">Amenidad: {{ form.nombre }} · {{ form.ubicacion }}</div>
        </div>
        <button type="button" class="areas__boton" @click="cancelar">Cancelar</button>
        <button type="button" class="areas__boton areas__boton--primario" @click="guardar">
          Guardar cambios
        </button>
      </div>

      <div class="areas__columnas">
        <div class="areas__columna areas__columna--izq">
          <div class="areas__seccion">HORARIO Y REGLAS</div>
          <div class="areas__grilla">
            <label v-for="c in camposHorario" :key="c.clave" class="areas__campo">
              {{ c.etiqueta }}<input v-model="form[c.clave]" class="areas__input" />
            </label>
          </div>
          <div class="areas__dias" role="group" aria-label="Días habilitados">
            <button
              v-for="(d, i) in DIAS_SEMANA_AREA"
              :key="d"
              type="button"
              class="areas__dia"
              :class="{ 'areas__dia--off': !form.dias[i] }"
              :aria-pressed="form.dias[i]"
              @click="alternarDia(i)"
            >
              {{ d }}
            </button>
          </div>
          <label class="areas__campo">
            Reglamento que el residente acepta al reservar
            <textarea v-model="form.reglamento" rows="4" class="areas__textarea" />
          </label>
        </div>

        <div class="areas__columna">
          <div class="areas__seccion">COSTOS Y APROBACIÓN</div>
          <div class="areas__grilla">
            <label class="areas__campo">
              Costo de uso<input v-model="form.costoUso" class="areas__input" />
            </label>
            <label class="areas__campo">
              Garantía (opcional)<input v-model="form.garantia" class="areas__input" />
            </label>
          </div>
          <div class="areas__ayuda">
            Con garantía en $ 0, los daños se cobran como cargo a la cuenta de la unidad.
          </div>

          <label class="areas__interruptor">
            <span class="areas__interruptor-textos">
              <span class="areas__interruptor-titulo">Requiere aprobación del administrador</span>
              <span class="areas__interruptor-nota"
                >Sin respuesta en 48 h, la solicitud vence y libera el horario</span
              >
            </span>
            <q-toggle
              v-model="form.requiereAprobacion"
              color="primary"
              aria-label="Requiere aprobación del administrador"
            />
          </label>
          <div class="areas__info">
            <strong>Pago:</strong> por transferencia o efectivo registrado por el administrador. Si
            el costo y la garantía no están pagados <strong>24 horas antes</strong>, la reserva se
            cancela sola.
          </div>

          <div class="areas__seccion areas__seccion--mora">MOROSIDAD</div>
          <label class="areas__interruptor">
            <span class="areas__interruptor-textos">
              <span class="areas__interruptor-titulo">Restringible por mora</span>
              <span class="areas__interruptor-nota">Área no esencial · Decreto Ejecutivo 462</span>
            </span>
            <q-toggle
              v-model="form.restringiblePorMora"
              color="primary"
              aria-label="Restringible por mora"
            />
          </label>
          <div class="areas__aviso">
            Las unidades en mora reciben aviso con el detalle de la deuda; la restricción aplica
            pasados 5 días y se levanta en máximo 24 horas tras el pago o convenio.
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { AREAS_CONFIG, DIAS_SEMANA_AREA } from '@/modules/reservas/demo/areas';
import type { ConfigArea } from '@/modules/reservas/demo/areas';

type CampoTexto =
  | 'abre'
  | 'cierra'
  | 'duracionMinima'
  | 'duracionMaxima'
  | 'anticipacionMinima'
  | 'anticipacionMaxima'
  | 'capacidad'
  | 'reservasPorMes';

const camposHorario: { clave: CampoTexto; etiqueta: string }[] = [
  { clave: 'abre', etiqueta: 'Abre' },
  { clave: 'cierra', etiqueta: 'Cierra' },
  { clave: 'duracionMinima', etiqueta: 'Duración mínima' },
  { clave: 'duracionMaxima', etiqueta: 'Duración máxima' },
  { clave: 'anticipacionMinima', etiqueta: 'Reservar con al menos' },
  { clave: 'anticipacionMaxima', etiqueta: 'Hasta con' },
  { clave: 'capacidad', etiqueta: 'Capacidad' },
  { clave: 'reservasPorMes', etiqueta: 'Reservas por unidad al mes' },
];

const $q = useQuasar();

function copiar(a: ConfigArea): ConfigArea {
  return { ...a, dias: [...a.dias] };
}

const areas = ref<ConfigArea[]>(AREAS_CONFIG.map(copiar));
const seleccionId = ref(areas.value[0]!.id);
const form = reactive<ConfigArea>(copiar(areas.value[0]!));

function seleccionar(id: string): void {
  const area = areas.value.find((a) => a.id === id);
  if (!area) return;
  seleccionId.value = id;
  Object.assign(form, copiar(area));
}

function cancelar(): void {
  seleccionar(seleccionId.value);
}

function alternarDia(i: number): void {
  form.dias[i] = !form.dias[i];
}

function guardar(): void {
  areas.value = areas.value.map((a) => (a.id === form.id ? copiar(form) : a));
  $q.notify({ type: 'positive', message: `Cambios de ${form.nombre} guardados` });
}
</script>

<style scoped>
.areas.safic-main {
  padding: 24px 32px;
  flex-direction: row;
  gap: 20px;
  align-items: stretch;
}

.areas__lista {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.areas__encabezado :deep(.safic-titulo) {
  margin: 10px 0 6px 0;
  font-size: 26px;
}

.areas__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.areas__opcion {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  padding: 12px 14px;
  color: var(--safic-texto);
  cursor: pointer;
  font-family: inherit;
  /* Compensa el borde de 2px de la opción activa para que no salte */
  margin: 1px;
}

.areas__opcion--activa {
  border: 2px solid var(--q-primary);
  margin: 0;
}

.areas__opcion-nombre {
  font-size: 15px;
  font-weight: 800;
}

.areas__opcion-resumen {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.areas__detalle {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.areas__cab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--safic-linea);
  flex-wrap: wrap;
}

.areas__cab-textos {
  flex-grow: 1;
  min-width: 200px;
}

.areas__titulo {
  margin: 0;
  font-size: 22px;
  line-height: 1.35;
  font-weight: 800;
  letter-spacing: 0;
}

.areas__subtitulo {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.areas__boton {
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.areas__boton--primario {
  padding: 0 18px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.areas__columnas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex-grow: 1;
  min-height: 0;
}

.areas__columna {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.areas__columna--izq {
  border-right: 1px solid var(--safic-linea);
}

.areas__seccion {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.areas__seccion--mora {
  margin-top: 4px;
}

.areas__grilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.areas__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.areas__input,
.areas__textarea {
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
  font-weight: 400;
  min-width: 0;
}

.areas__input {
  height: 44px;
  padding: 0 12px;
  font-size: 15px;
}

.areas__textarea {
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.areas__input:focus,
.areas__textarea:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.areas__dias {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.areas__dia {
  padding: 8px 12px;
  border-radius: 999px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-family: inherit;
  line-height: normal;
}

.areas__dia--off {
  background: #f1efe8;
  color: var(--safic-texto-tenue);
  text-decoration: line-through;
}

.areas__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
  margin-top: -6px;
}

.areas__interruptor {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  cursor: pointer;
}

.areas__interruptor-textos {
  flex-grow: 1;
}

.areas__interruptor-titulo {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.areas__interruptor-nota {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.areas__info {
  background: #f7f6f2;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.areas__aviso {
  background: #fff7ec;
  border: 1px solid #f1d6ae;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  color: #7a3808;
  line-height: 1.5;
}

@media (max-width: 1100px) {
  .areas.safic-main {
    flex-direction: column;
  }

  .areas__lista {
    width: 100%;
  }

  .areas__columnas {
    grid-template-columns: minmax(0, 1fr);
  }

  .areas__columna--izq {
    border-right: none;
    border-bottom: 1px solid var(--safic-linea);
  }
}

@media (max-width: 599px) {
  .areas.safic-main {
    padding: 20px 16px;
  }

  .areas__columna {
    padding: 16px;
  }

  .areas__cab {
    padding: 16px;
  }
}
</style>
