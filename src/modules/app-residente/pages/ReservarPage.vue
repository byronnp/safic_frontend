<template>
  <div class="app-pagina reservar">
    <!-- El mockup usa una barra blanca con "volver" en lugar del encabezado de color. -->
    <header class="reservar-barra">
      <router-link
        :to="{ name: 'app-mi-hogar' }"
        class="reservar-barra__volver"
        aria-label="Volver"
      >
        <q-icon name="sym_r_chevron_left" size="26px" />
      </router-link>
      <h1 class="reservar-barra__titulo">Reservar</h1>
    </header>

    <template v-if="!hecho">
      <div class="reservar-cuerpo">
        <div v-if="enMora" class="reservar-mora" role="alert">
          <strong>Reservas restringidas por cuotas vencidas.</strong> Paga o solicita un convenio y
          se habilitan en máximo 24 horas.
          <router-link :to="{ name: 'app-mi-cuenta' }" class="reservar-mora__enlace">
            Ver mi cuenta
          </router-link>
        </div>

        <div class="reservar-areas" role="group" aria-label="Área">
          <button
            v-for="(item, i) in areas"
            :key="item.nombre"
            type="button"
            class="reservar-area"
            :class="{ 'reservar-area--activa': i === areaIndice }"
            :aria-pressed="i === areaIndice"
            @click="elegirArea(i)"
          >
            {{ item.nombre }}
          </button>
        </div>

        <div class="app-tarjeta reservar-info">
          <span>{{ area.capacidad }}</span
          ><span>{{ area.costoResumen }}</span
          ><span>{{ area.aprobacion }}</span>
        </div>

        <h2 class="reservar-subtitulo">Fecha</h2>
        <div class="reservar-dias" role="group" aria-label="Fecha">
          <button
            v-for="(dia, i) in dias"
            :key="dia.numero"
            type="button"
            class="reservar-dia"
            :class="{ 'reservar-dia--activo': i === diaIndice }"
            :aria-pressed="i === diaIndice"
            @click="elegirDia(i)"
          >
            <span class="reservar-dia__semana">{{ dia.diaSemana }}</span>
            <span class="reservar-dia__numero">{{ dia.numero }}</span>
          </button>
        </div>

        <h2 class="reservar-subtitulo">Horario</h2>
        <div class="reservar-horarios" role="group" aria-label="Horario">
          <button
            v-for="horario in horarios"
            :key="horario.etiqueta"
            type="button"
            class="reservar-horario"
            :class="{
              'reservar-horario--ocupado': horario.ocupado,
              'reservar-horario--activo': horario.elegido,
            }"
            :disabled="horario.ocupado"
            :aria-pressed="horario.elegido"
            @click="horarioIndice = horario.indice"
          >
            {{ horario.etiqueta }}
            <span class="reservar-horario__estado">{{ horario.estado }}</span>
          </button>
        </div>

        <div class="reservar-espacio" />

        <div class="app-tarjeta reservar-costos">
          <div class="reservar-costos__fila">
            <span class="reservar-costos__etiqueta">Costo de uso</span
            ><strong>{{ area.costo }}</strong>
          </div>
          <div v-if="area.conGarantia" class="reservar-costos__fila">
            <span class="reservar-costos__etiqueta">Garantía (se devuelve)</span
            ><strong>{{ garantia }}</strong>
          </div>
          <div class="reservar-costos__nota">
            Paga hasta 24 h antes o la reserva se cancela sola.
          </div>
        </div>

        <label class="reservar-acepto">
          <input v-model="acepta" type="checkbox" class="reservar-check" />
          <span>
            Acepto el
            <a href="#" class="reservar-acepto__enlace" @click.prevent="verReglamento"
              >reglamento del área</a
            >
          </span>
        </label>
      </div>

      <div class="reservar-pie">
        <button
          type="button"
          class="reservar-principal"
          :class="{ 'reservar-principal--listo': listo }"
          :aria-disabled="!listo"
          @click="reservar"
        >
          {{ etiquetaBoton }}
        </button>
      </div>
    </template>

    <div v-else class="reservar-resultado">
      <div
        class="reservar-resultado__icono"
        :class="{ 'reservar-resultado__icono--revision': area.conGarantia }"
      >
        <q-icon name="sym_r_check" size="34px" />
      </div>
      <h2 class="reservar-resultado__titulo">
        {{ area.conGarantia ? 'Solicitud enviada' : 'Reserva confirmada' }}
      </h2>
      <p class="reservar-resultado__texto">{{ textoHecho }}</p>
      <div class="app-tarjeta reservar-resumen">
        <div class="reservar-costos__fila">
          <span class="reservar-costos__etiqueta">Área</span
          ><strong>{{ area.nombreCompleto }}</strong>
        </div>
        <div class="reservar-costos__fila">
          <span class="reservar-costos__etiqueta">Fecha</span><strong>{{ fechaTexto }}</strong>
        </div>
        <div class="reservar-costos__fila">
          <span class="reservar-costos__etiqueta">Horario</span><strong>{{ horarioTexto }}</strong>
        </div>
      </div>
      <router-link
        v-if="!area.gratis && !area.conGarantia"
        :to="{ name: 'app-mi-cuenta' }"
        class="reservar-principal reservar-principal--listo reservar-principal--enlace"
      >
        Ir a pagar
      </router-link>
      <button type="button" class="reservar-secundario" @click="otraReserva">
        Hacer otra reserva
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import {
  RESERVAR_AREAS,
  RESERVAR_DIAS,
  RESERVAR_EN_MORA,
  RESERVAR_GARANTIA,
  RESERVAR_MES,
  reservarHorarioOcupado,
  type ReservarArea,
} from '../demo/reservar';

const $q = useQuasar();

const areas = RESERVAR_AREAS;
const dias = RESERVAR_DIAS;
const garantia = RESERVAR_GARANTIA;
const enMora = RESERVAR_EN_MORA;

const areaIndice = ref(1);
const diaIndice = ref(1);
const horarioIndice = ref(-1);
const acepta = ref(false);
const hecho = ref(false);

const area = computed<ReservarArea>(() => areas[areaIndice.value]!);

const horarios = computed(() =>
  area.value.horarios.map((etiqueta, indice) => {
    const ocupado = reservarHorarioOcupado(areaIndice.value, diaIndice.value, indice);
    const elegido = indice === horarioIndice.value;
    return {
      etiqueta,
      indice,
      ocupado,
      elegido,
      estado: ocupado ? 'Ocupado' : elegido ? 'Elegido' : 'Libre',
    };
  }),
);

const listo = computed(() => !enMora && horarioIndice.value >= 0 && acepta.value);

const etiquetaBoton = computed(() => {
  if (enMora) {
    return 'Reservas restringidas';
  }
  return area.value.conGarantia ? 'Solicitar reserva' : 'Reservar';
});

const fechaTexto = computed(() => {
  const dia = dias[diaIndice.value]!;
  const semana = dia.diaSemana.charAt(0) + dia.diaSemana.slice(1).toLowerCase();
  return `${semana} ${dia.numero} ${RESERVAR_MES}`;
});

const horarioTexto = computed(() => area.value.horarios[horarioIndice.value] ?? '');

const textoHecho = computed(() => {
  if (area.value.conGarantia) {
    return 'La administración revisará tu solicitud en máximo 48 horas. Al aprobarla se generan el costo de uso y la garantía.';
  }
  if (area.value.gratis) {
    return 'Tu horario quedó reservado. El guardia registrará tu ingreso.';
  }
  return `Paga ${area.value.costo} hasta 24 horas antes; si no, la reserva se cancela sola.`;
});

function elegirArea(indice: number): void {
  areaIndice.value = indice;
  horarioIndice.value = -1;
}

function elegirDia(indice: number): void {
  diaIndice.value = indice;
  horarioIndice.value = -1;
}

function reservar(): void {
  if (listo.value) {
    hecho.value = true;
  }
}

function otraReserva(): void {
  hecho.value = false;
  horarioIndice.value = -1;
  acepta.value = false;
}

function verReglamento(): void {
  $q.notify({ type: 'info', message: 'El reglamento del área estará disponible con la API.' });
}
</script>

<style scoped>
/* Los mockups usan el interlineado normal del navegador. */
.reservar {
  line-height: normal;
}

.reservar-barra {
  height: 60px;
  flex-shrink: 0;
  background: var(--safic-superficie);
  border-bottom: 1px solid var(--safic-borde);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.reservar-barra__volver {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto);
  border-radius: 10px;
  text-decoration: none;
}

.reservar-barra__titulo {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.reservar-cuerpo {
  flex-grow: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reservar-mora {
  background: #fde8e6;
  border: 1px solid #f3b8b2;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  color: #7f1810;
  line-height: 1.45;
}

.reservar-mora__enlace {
  color: #7f1810;
  font-weight: 800;
}

.reservar-areas {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  /* Deja ver el área táctil ampliada de las píldoras. */
  padding: 2px 0;
  margin: -2px 0;
}

/* Píldora de 40px como el mockup, con área táctil de 44px. */
.reservar-area {
  position: relative;
  flex-shrink: 0;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.reservar-area::after {
  content: '';
  position: absolute;
  inset: -3px 0;
}

.reservar-area--activa {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.reservar-info {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--safic-texto-2);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.reservar-subtitulo {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.reservar-dias {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.reservar-dia {
  height: 56px;
  border-radius: 12px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde);
}

.reservar-dia--activo {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.reservar-dia__semana {
  display: block;
  font-size: 11px;
  font-weight: 700;
}

.reservar-dia__numero {
  display: block;
  font-size: 17px;
  font-weight: 800;
}

.reservar-horarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.reservar-horario {
  height: 54px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.reservar-horario--activo {
  background: #e3efec;
  color: #0b4a47;
  border: 2px solid var(--q-primary);
}

.reservar-horario--ocupado {
  background: #eceae4;
  color: #8a857a;
  border-color: var(--safic-borde);
  cursor: not-allowed;
}

.reservar-horario__estado {
  display: block;
  font-size: 11px;
  font-weight: 600;
}

.reservar-espacio {
  flex-grow: 1;
}

.reservar-costos {
  padding: 12px 14px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reservar-costos__fila {
  display: flex;
}

.reservar-costos__etiqueta {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.reservar-costos__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.reservar-acepto {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 13px;
  color: var(--safic-texto-2);
  cursor: pointer;
}

.reservar-check {
  width: 20px;
  height: 20px;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--q-primary);
  cursor: pointer;
}

.reservar-acepto__enlace {
  font-weight: 700;
}

.reservar-pie {
  padding: 0 16px 16px;
  flex-shrink: 0;
}

.reservar-principal {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.reservar-principal--listo {
  background: var(--q-primary);
  color: #ffffff;
}

.reservar-principal--enlace {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.reservar-principal--enlace:hover {
  color: #ffffff;
  filter: brightness(0.92);
}

.reservar-resultado {
  flex-grow: 1;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.reservar-resultado__icono {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e3efec;
  color: #0b4a47;
}

.reservar-resultado__icono--revision {
  background: #fff1dc;
  color: #8a3f0a;
}

.reservar-resultado__titulo {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.reservar-resultado__texto {
  margin: 0;
  font-size: 15px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.reservar-resumen {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reservar-secundario {
  height: 44px;
  border: none;
  background: transparent;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
