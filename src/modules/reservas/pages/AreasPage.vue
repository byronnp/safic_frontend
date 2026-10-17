<template>
  <q-page class="safic-main areas">
    <aside class="areas__lista">
      <PaginaEncabezado
        class="areas__encabezado"
        miga="Áreas comunes / Áreas y reglas"
        titulo="Áreas"
      />
      <div class="areas__nota">Salen de las amenidades reservables del condominio.</div>

      <template v-if="consulta.isPending.value">
        <q-skeleton v-for="i in 4" :key="i" type="rect" height="64px" aria-busy="true" />
      </template>
      <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <div v-else-if="areas.length === 0" class="areas__vacio">
        <q-icon :name="ICONOS.vacio" size="32px" class="text-suave" />
        <div>
          Aún no hay amenidades reservables. Márcalas como reservables en Configuración ›
          Amenidades.
        </div>
      </div>
      <button
        v-for="a in areas"
        :key="a.id"
        type="button"
        class="areas__opcion"
        :class="{ 'areas__opcion--activa': a.id === seleccionId }"
        :aria-pressed="a.id === seleccionId"
        @click="elegir(a.id)"
      >
        <span class="areas__opcion-nombre">{{ a.nombre }}</span>
        <span class="areas__opcion-resumen">{{
          a.configurada ? resumenArea(a) : 'Sin reglas guardadas'
        }}</span>
      </button>
    </aside>

    <section v-if="seleccionada" class="areas__detalle">
      <div class="areas__cab">
        <div class="areas__cab-textos">
          <h2 class="areas__titulo">{{ seleccionada.nombre }}</h2>
          <div class="areas__subtitulo">
            Amenidad: {{ seleccionada.nombre
            }}<template v-if="seleccionada.ubicacion"> · {{ seleccionada.ubicacion }}</template>
            <template v-if="seleccionada.estado !== 'disponible'">
              · {{ seleccionada.estado === 'mantenimiento' ? 'En mantenimiento' : 'Inactiva' }}
            </template>
          </div>
        </div>
        <button
          type="button"
          class="areas__boton"
          :disabled="guardando.isPending.value"
          @click="cancelar"
        >
          Cancelar
        </button>
        <button
          v-if="puedeGestionar"
          type="button"
          class="areas__boton areas__boton--primario"
          :disabled="guardando.isPending.value"
          @click="guardar"
        >
          {{ guardando.isPending.value ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>

      <div v-if="errorGeneral" class="safic-alerta areas__alerta" role="alert">
        {{ errorGeneral }}
      </div>

      <div class="areas__columnas">
        <div class="areas__columna areas__columna--izq">
          <div class="areas__seccion">HORARIO Y REGLAS</div>
          <div class="areas__grilla">
            <label v-for="c in camposHorario" :key="c.clave" class="areas__campo">
              {{ c.etiqueta }}
              <input
                v-model="form[c.clave]"
                class="areas__input"
                :type="c.tipo"
                :inputmode="c.tipo === 'text' ? 'numeric' : undefined"
                :placeholder="c.ayuda"
                :aria-invalid="!!errores[c.clave]"
              />
              <span v-if="errores[c.clave]" class="areas__error" role="alert">{{
                errores[c.clave]
              }}</span>
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
          <span v-if="errores.dias" class="areas__error" role="alert">{{ errores.dias }}</span>
          <label class="areas__campo">
            Reglamento que el residente acepta al reservar
            <textarea v-model="form.reglamento" rows="4" class="areas__textarea" />
            <span v-if="errores.reglamento" class="areas__error" role="alert">{{
              errores.reglamento
            }}</span>
          </label>
        </div>

        <div class="areas__columna">
          <div class="areas__seccion">COSTOS Y APROBACIÓN</div>
          <div class="areas__grilla">
            <label class="areas__campo">
              Costo de uso
              <input
                v-model="form.costo"
                class="areas__input"
                inputmode="decimal"
                :aria-invalid="!!errores.costo"
              />
              <span v-if="errores.costo" class="areas__error" role="alert">{{
                errores.costo
              }}</span>
            </label>
            <label class="areas__campo">
              Garantía (opcional)
              <input
                v-model="form.garantia"
                class="areas__input"
                inputmode="decimal"
                :aria-invalid="!!errores.garantia"
              />
              <span v-if="errores.garantia" class="areas__error" role="alert">{{
                errores.garantia
              }}</span>
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
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';

import {
  DIAS_SEMANA_AREA,
  formularioDeArea,
  hayCambiosArea,
  peticionArea,
  resumenArea,
  validarArea,
  type ErroresArea,
  type FormularioArea,
} from '../areas.logica';
import { useAreas, useGuardarReglasArea } from '../composables/useAreas';

type CampoTexto =
  | 'abre'
  | 'cierra'
  | 'duracionMin'
  | 'duracionMax'
  | 'anticipacionMinHoras'
  | 'anticipacionMaxDias'
  | 'capacidad'
  | 'reservasPorMes';

const camposHorario: {
  clave: CampoTexto;
  etiqueta: string;
  tipo: 'time' | 'text';
  ayuda?: string;
}[] = [
  { clave: 'abre', etiqueta: 'Abre', tipo: 'time' },
  { clave: 'cierra', etiqueta: 'Cierra', tipo: 'time' },
  { clave: 'duracionMin', etiqueta: 'Duración mínima (horas)', tipo: 'text' },
  { clave: 'duracionMax', etiqueta: 'Duración máxima (horas)', tipo: 'text' },
  { clave: 'anticipacionMinHoras', etiqueta: 'Reservar con al menos (horas)', tipo: 'text' },
  { clave: 'anticipacionMaxDias', etiqueta: 'Hasta con (días)', tipo: 'text' },
  { clave: 'capacidad', etiqueta: 'Capacidad (personas)', tipo: 'text', ayuda: 'Sin límite' },
  {
    clave: 'reservasPorMes',
    etiqueta: 'Reservas por unidad al mes',
    tipo: 'text',
    ayuda: 'Sin límite',
  },
];

const $q = useQuasar();
const session = useSessionStore();

// Mostrar el botón es comodidad; la API exige reservas.gestionar igual.
const puedeGestionar = computed(() => session.tienePermiso('reservas.gestionar'));

const consulta = useAreas();
const guardando = useGuardarReglasArea();
const areas = computed(() => consulta.data.value ?? []);

const seleccionId = ref<number | null>(null);
const seleccionada = computed(() => areas.value.find((a) => a.id === seleccionId.value) ?? null);

const formularioVacio = (): FormularioArea => ({
  abre: '',
  cierra: '',
  duracionMin: '',
  duracionMax: '',
  anticipacionMinHoras: '',
  anticipacionMaxDias: '',
  capacidad: '',
  reservasPorMes: '',
  dias: [],
  costo: '',
  garantia: '',
  reglamento: '',
  requiereAprobacion: false,
  restringiblePorMora: true,
});
const form = reactive<FormularioArea>(formularioVacio());
const errores = reactive<ErroresArea>({});
const errorGeneral = ref<string | null>(null);

function cargar(): void {
  const area = seleccionada.value;
  if (!area) return;
  Object.assign(form, formularioDeArea(area));
  for (const k of Object.keys(errores) as (keyof ErroresArea)[]) errores[k] = undefined;
  errorGeneral.value = null;
}

function seleccionar(id: number): void {
  seleccionId.value = id;
  cargar();
}

/** Cambiar de área con cambios sin guardar pide confirmación. */
function elegir(id: number): void {
  const actual = seleccionada.value;
  if (!actual || id === actual.id || !hayCambiosArea(actual, form)) {
    seleccionar(id);
    return;
  }
  $q.dialog({
    title: 'Cambios sin guardar',
    message: `Si cambias de área se pierden los cambios de ${actual.nombre}.`,
    cancel: { label: 'Seguir editando', flat: true, noCaps: true },
    ok: { label: 'Descartar', unelevated: true, noCaps: true, color: 'primary' },
    persistent: true,
  }).onOk(() => seleccionar(id));
}

// Al llegar (o cambiar) la lista se conserva el área elegida, o se elige la primera
watch(
  areas,
  (lista) => {
    if (lista.length === 0) {
      seleccionId.value = null;
      return;
    }
    if (!lista.some((a) => a.id === seleccionId.value)) seleccionar(lista[0]!.id);
    else if (!guardando.isPending.value && seleccionId.value !== null) cargar();
  },
  { immediate: true },
);

// Otro condominio: no queda nada del anterior
watch(
  () => session.condominioId,
  () => {
    seleccionId.value = null;
    errorGeneral.value = null;
    Object.assign(form, formularioVacio());
    for (const k of Object.keys(errores) as (keyof ErroresArea)[]) errores[k] = undefined;
  },
);

function cancelar(): void {
  cargar();
}

function alternarDia(i: number): void {
  form.dias[i] = !form.dias[i];
}

async function guardar(): Promise<void> {
  const area = seleccionada.value;
  if (!area || guardando.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresArea)[]) errores[k] = undefined;

  const problemas = validarArea(form);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await guardando.mutateAsync({ id: area.id, reglas: peticionArea(form) });
    // La lista ya se refrescó: el formulario muestra lo que guardó el servidor (50 → 50.00)
    cargar();
    $q.notify({ type: 'positive', message: `Cambios de ${area.nombre} guardados` });
  } catch (error) {
    const apiError = aApiError(error);
    errores.abre = apiError.campo('abre');
    errores.cierra = apiError.campo('cierra');
    errores.duracionMin = apiError.campo('duracion_min_horas');
    errores.duracionMax = apiError.campo('duracion_max_horas');
    errores.anticipacionMinHoras = apiError.campo('anticipacion_min_horas');
    errores.anticipacionMaxDias = apiError.campo('anticipacion_max_dias');
    errores.capacidad = apiError.campo('capacidad');
    errores.reservasPorMes = apiError.campo('reservas_por_unidad_mes');
    errores.dias = apiError.campo('dias_semana');
    errores.costo = apiError.campo('costo');
    errores.garantia = apiError.campo('garantia');
    errores.reglamento = apiError.campo('reglamento');
    if (!Object.values(errores).some(Boolean)) errorGeneral.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.areas__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 8px;
  text-align: center;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.areas__error {
  font-size: 12px;
  font-weight: 600;
  color: #b3261e;
}

.areas__alerta {
  margin: 12px 24px 0;
}

.areas__boton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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
