<template>
  <q-page class="safic-main cobro">
    <PaginaEncabezado miga="Configuración / Cobro de cuotas" titulo="Cobro de cuotas">
      <template #acciones>
        <div v-if="guardado" class="cobro-guardado" role="status">
          Cambios guardados · aplican desde {{ textoMes(guardado) }}
        </div>
      </template>
    </PaginaEncabezado>

    <div v-if="cobro.isPending.value" class="cobro-contenido" aria-busy="true">
      <q-skeleton type="rect" class="cobro-skeleton" />
      <q-skeleton type="rect" class="cobro-skeleton cobro-skeleton--lateral" />
    </div>

    <div v-else-if="cobro.isError.value" class="safic-alerta" role="alert">
      {{ cobro.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="cobro.refetch()" />
    </div>

    <div v-else-if="formulario && datos" class="cobro-contenido">
      <section class="cobro-formulario safic-card" aria-label="Cómo se cobra">
        <div class="cobro-seccion">CÓMO SE COBRA</div>

        <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
        <div v-if="aviso" class="safic-alerta" role="status">{{ aviso }}</div>

        <div class="cobro-grupo">
          <div id="mc-metodo" class="cobro-etiqueta">Método de cobro</div>
          <div role="radiogroup" aria-labelledby="mc-metodo" class="cobro-metodos">
            <button
              v-for="m in METODOS_COBRO"
              :key="m.valor"
              type="button"
              role="radio"
              class="cobro-metodo"
              :class="{ 'cobro-metodo--activo': formulario.metodo === m.valor }"
              :aria-checked="formulario.metodo === m.valor"
              @click="elegirMetodo(m.valor)"
            >
              <span class="cobro-metodo__titulo">
                <span class="cobro-metodo__punto" />
                <span class="cobro-metodo__nombre">{{ m.nombre }}</span>
              </span>
              <span class="cobro-metodo__detalle">{{ m.detalle }}</span>
            </button>
          </div>
        </div>

        <div v-if="formulario.metodo === 'general'" class="cobro-cuadricula cobro-cuadricula--2">
          <div class="cobro-campo">
            <label for="mc-cuota" class="cobro-etiqueta">Cuota mensual por unidad</label>
            <div
              class="cobro-monto cobro-monto--principal"
              :class="{ 'cobro-monto--error': errores.cuotaGeneral }"
            >
              <span class="cobro-monto__signo">$</span>
              <input
                id="mc-cuota"
                v-model="formulario.cuotaGeneral"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errores.cuotaGeneral"
                :aria-describedby="errores.cuotaGeneral ? 'mc-cuota-error' : 'mc-cuota-ayuda'"
              />
            </div>
            <div v-if="errores.cuotaGeneral" id="mc-cuota-error" class="cobro-error">
              {{ errores.cuotaGeneral }}
            </div>
            <div v-else id="mc-cuota-ayuda" class="cobro-ayuda">
              La pagan todas por igual: casas, departamentos y locales.
            </div>
          </div>
        </div>

        <div v-if="formulario.metodo === 'tipo'" class="cobro-grupo">
          <div class="cobro-cuadricula cobro-cuadricula--3">
            <label v-for="t in TIPOS_UNIDAD" :key="t.valor" class="cobro-campo cobro-etiqueta">
              {{ t.etiqueta }}
              <span class="cobro-monto">
                <span class="cobro-monto__signo">$</span>
                <input
                  v-model="formulario.valoresTipo[t.valor]"
                  inputmode="decimal"
                  autocomplete="off"
                />
              </span>
            </label>
          </div>
          <div v-if="errores.valoresTipo" class="cobro-error">{{ errores.valoresTipo }}</div>
        </div>

        <div v-if="formulario.metodo === 'alicuota'" class="cobro-cuadricula cobro-cuadricula--2">
          <div class="cobro-campo">
            <label for="mc-presupuesto" class="cobro-etiqueta"
              >Presupuesto mensual del condominio</label
            >
            <div class="cobro-monto" :class="{ 'cobro-monto--error': errores.presupuesto }">
              <span class="cobro-monto__signo">$</span>
              <input
                id="mc-presupuesto"
                v-model="formulario.presupuesto"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errores.presupuesto"
                :aria-describedby="
                  errores.presupuesto ? 'mc-presupuesto-error' : 'mc-presupuesto-ayuda'
                "
              />
            </div>
            <div v-if="errores.presupuesto" id="mc-presupuesto-error" class="cobro-error">
              {{ errores.presupuesto }}
            </div>
            <div v-else id="mc-presupuesto-ayuda" class="cobro-ayuda">
              Cada unidad paga su alícuota de este total. Ej.: 0,62 % → $ 74,40.
            </div>
          </div>
        </div>

        <div v-if="formulario.metodo === 'unidad'" class="cobro-nota">
          La cuota se escribe en cada unidad al crearla o en la columna
          <strong>cuota_mensual</strong> del Excel de unidades. Una unidad sin cuota no se puede
          guardar.
        </div>

        <div class="cobro-cuadricula cobro-cuadricula--2">
          <div class="cobro-campo">
            <label for="mc-vence" class="cobro-etiqueta">Día de vencimiento</label>
            <select id="mc-vence" v-model.number="formulario.diaVencimiento" class="cobro-select">
              <option v-for="d in diasVencimiento" :key="d.valor" :value="d.valor">
                {{ d.etiqueta }}
              </option>
            </select>
            <div class="cobro-ayuda">Pasada esta fecha la cuota queda vencida.</div>
          </div>
          <div class="cobro-campo">
            <label for="mc-desde" class="cobro-etiqueta">Aplicar desde</label>
            <select id="mc-desde" v-model="formulario.aplicaDesde" class="cobro-select">
              <option v-for="m in meses" :key="m.valor" :value="m.valor">{{ m.etiqueta }}</option>
            </select>
            <div v-if="errores.aplicaDesde" class="cobro-error">{{ errores.aplicaDesde }}</div>
            <div v-else class="cobro-ayuda">
              Primer mes que se emite con la nueva configuración.
            </div>
          </div>
        </div>

        <div class="cobro-relleno" />

        <div class="cobro-pie">
          <div class="cobro-pie__nota">
            Las cuotas ya emitidas no cambian. El cambio queda en la auditoría.
          </div>
          <button
            type="button"
            class="cobro-boton cobro-boton--secundario"
            :disabled="!hayCambios || guardar.isPending.value"
            @click="descartar"
          >
            Descartar
          </button>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="cobro-boton"
            label="Guardar cambios"
            :disable="!hayCambios"
            :loading="guardar.isPending.value"
            @click="enviar"
          />
        </div>
      </section>

      <aside class="cobro-lateral">
        <div class="cobro-emision">
          <div class="cobro-emision__titulo">
            PRÓXIMA EMISIÓN · {{ textoMes(formulario.aplicaDesde).toUpperCase() }}
          </div>
          <div class="cobro-emision__total" aria-live="polite">{{ proyeccion.total }}</div>
          <div class="cobro-emision__detalle">{{ proyeccion.detalle }}</div>
          <div class="cobro-emision__linea" />
          <div class="cobro-emision__datos">
            <div>
              <span>Método</span><strong>{{ proyeccion.metodo }}</strong>
            </div>
            <div>
              <span>Cuota por unidad</span><strong>{{ proyeccion.cuotaUnidad }}</strong>
            </div>
            <div>
              <span>Vence</span
              ><strong>{{
                textoVencimiento(formulario.diaVencimiento, formulario.aplicaDesde)
              }}</strong>
            </div>
          </div>
        </div>

        <div class="cobro-historial safic-card">
          <div class="cobro-seccion">HISTORIAL DE CAMBIOS</div>
          <div v-if="!datos.historial.length" class="cobro-ayuda">
            Todavía no hay cambios registrados.
          </div>
          <ol v-else class="cobro-historial__lista">
            <li
              v-for="(registro, i) in datos.historial"
              :key="`${registro.fecha}-${i}`"
              class="cobro-historial__item"
            >
              <span class="cobro-historial__punto" aria-hidden="true" />
              <div>
                <div class="cobro-historial__cambio">{{ textoRegistro(registro) }}</div>
                <div class="cobro-historial__quien">
                  {{ registro.quien }} · {{ fechaRegistro(registro.fecha) }}
                </div>
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </div>

    <CobroCuentasBancarias />

    <ReglasFinanzasPanel />
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';

import CobroCuentasBancarias from '../components/CobroCuentasBancarias.vue';
import ReglasFinanzasPanel from '../components/ReglasFinanzasPanel.vue';
import { aApiError } from '@/core/api/errors';
import type { MetodoCobro } from '@/modules/unidades/services/unidades.service';

import {
  aPeticionCobro,
  avisoDatosFaltantes,
  CAMPOS_API_COBRO,
  DIAS_VENCIMIENTO,
  esIgualACobro,
  fechaRegistro,
  formularioDesde,
  mesesDisponibles,
  METODOS_COBRO,
  proyeccionCobro,
  textoMes,
  textoRegistro,
  textoVencimiento,
  TIPOS_UNIDAD,
  validarCobro,
  type CampoCobro,
  type FormularioCobro,
} from '../cobro.formulario';
import { useCobro, useGuardarCobro } from '../composables/useCobro';
import type { CobroCuotas } from '../services/cobro.service';

const cobro = useCobro();
const guardar = useGuardarCobro();

const datos = computed(() => cobro.data.value ?? null);
const meses = mesesDisponibles();

const formulario = ref<FormularioCobro | null>(null);
const base = ref<FormularioCobro | null>(null);
const errores = reactive<Partial<Record<CampoCobro, string>>>({});
const errorGeneral = ref<string | null>(null);
const guardado = ref<string | null>(null);

function reiniciar(guardado: CobroCuotas): void {
  base.value = formularioDesde(guardado);
  formulario.value = formularioDesde(guardado);
}

// Al cargar, el formulario parte de lo guardado; un refresco posterior no pisa lo que se está escribiendo
watch(
  datos,
  (nuevo) => {
    if (nuevo && (!formulario.value || !hayCambios.value)) {
      reiniciar(nuevo);
    }
  },
  { immediate: true },
);

/** El día guardado también se ofrece si no es uno de los cuatro del mockup (ej. el 20). */
const diasVencimiento = computed(() => {
  const actual = formulario.value?.diaVencimiento;
  return DIAS_VENCIMIENTO.some((d) => d.valor === actual) || actual === undefined
    ? DIAS_VENCIMIENTO
    : [...DIAS_VENCIMIENTO, { valor: actual, etiqueta: `Día ${actual} de cada mes` }];
});

const hayCambios = computed(
  () => !!formulario.value && !!base.value && !esIgualACobro(formulario.value, base.value),
);

const proyeccion = computed(() => proyeccionCobro(formulario.value!, datos.value!.unidades));
const aviso = computed(() =>
  formulario.value && datos.value ? avisoDatosFaltantes(formulario.value, datos.value) : null,
);

function limpiarErrores(): void {
  for (const campo of Object.keys(errores) as CampoCobro[]) {
    delete errores[campo];
  }
  errorGeneral.value = null;
}

function elegirMetodo(metodo: MetodoCobro): void {
  if (formulario.value) {
    formulario.value.metodo = metodo;
    limpiarErrores();
  }
}

function descartar(): void {
  if (base.value) {
    formulario.value = { ...base.value, valoresTipo: { ...base.value.valoresTipo } };
    limpiarErrores();
    guardado.value = null;
  }
}

async function enviar(): Promise<void> {
  if (!formulario.value) {
    return;
  }
  limpiarErrores();
  guardado.value = null;

  Object.assign(errores, validarCobro(formulario.value));
  if (Object.keys(errores).length > 0) {
    return;
  }

  try {
    const aplicaDesde = formulario.value.aplicaDesde;
    reiniciar(await guardar.mutateAsync(aPeticionCobro(formulario.value)));
    guardado.value = aplicaDesde;
  } catch (error) {
    const apiError = aApiError(error);
    let pintado = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_COBRO)) {
      const mensaje =
        apiError.campo(campoApi) ??
        Object.entries(apiError.campos).find(([k]) => k.startsWith(`${campoApi}.`))?.[1][0];
      if (mensaje) {
        errores[campo] = mensaje;
        pintado = true;
      }
    }
    if (!pintado) {
      // UNIDADES_SIN_ALICUOTA, UNIDADES_SIN_CUOTA u otro error: el mensaje ya viene en español
      errorGeneral.value = apiError.mensaje;
    }
    if (apiError.codigo.startsWith('UNIDADES_SIN_')) {
      // Las unidades cambiaron desde que se abrió la pantalla: se actualiza el aviso
      void cobro.refetch();
    }
  }
}
</script>

<style scoped>
.cobro {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cobro-guardado {
  padding: 8px 12px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 13px;
  font-weight: 700;
}

.cobro-contenido {
  display: flex;
  gap: 18px;
  flex-grow: 1;
  min-height: 0;
  align-items: flex-start;
}

.cobro-skeleton {
  flex-grow: 1;
  height: 420px;
  border-radius: 14px;
}

.cobro-skeleton--lateral {
  flex-grow: 0;
  width: 380px;
}

.cobro-formulario {
  flex-grow: 1;
  min-width: 0;
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.cobro-seccion {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--safic-texto-suave);
}

.cobro-grupo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cobro-etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.cobro-ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cobro-error {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-negative);
}

.cobro-metodos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.cobro-metodo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-height: 76px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  font-family: inherit;
  background: #ffffff;
  border: 1px solid var(--safic-borde-2);
  text-align: left;
}

.cobro-metodo--activo {
  background: #f1f6f5;
  border: 2px solid var(--q-primary);
}

.cobro-metodo:focus-visible {
  outline: 3px solid var(--q-accent);
  outline-offset: 2px;
}

.cobro-metodo__titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cobro-metodo__punto {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 2px solid #a9a498;
}

.cobro-metodo--activo .cobro-metodo__punto {
  border: 5px solid var(--q-primary);
}

.cobro-metodo__nombre {
  font-size: 14px;
  font-weight: 800;
  color: var(--safic-texto);
}

.cobro-metodo__detalle {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.4;
}

.cobro-cuadricula {
  display: grid;
  gap: 16px;
}

.cobro-cuadricula--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cobro-cuadricula--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.cobro-campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cobro-monto {
  display: flex;
  align-items: center;
  height: 44px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  padding: 0 12px;
  box-sizing: border-box;
  gap: 6px;
  font-weight: 700;
}

.cobro-monto--principal {
  height: 46px;
  border: 2px solid var(--q-primary);
}

.cobro-monto--error {
  border-color: var(--q-negative);
}

.cobro-monto:focus-within {
  outline: 3px solid var(--q-accent);
  outline-offset: 0;
}

.cobro-monto__signo {
  color: var(--safic-texto-suave);
}

.cobro-monto input {
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  flex-grow: 1;
  background: transparent;
  min-width: 0;
}

.cobro-select {
  height: 46px;
  padding: 0 12px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  font-family: inherit;
  font-size: 15px;
  background: #ffffff;
  box-sizing: border-box;
  width: 100%;
}

.cobro-nota {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--safic-fondo-2);
  border: 1px solid var(--safic-linea);
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.cobro-relleno {
  flex-grow: 1;
}

.cobro-pie {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--safic-linea);
  padding-top: 16px;
}

.cobro-pie__nota {
  flex-grow: 1;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.cobro-boton {
  height: 46px;
  padding: 0 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

.cobro-boton--secundario {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  cursor: pointer;
  font-family: inherit;
  padding: 0 16px;
}

.cobro-boton--secundario:disabled {
  opacity: 0.5;
  cursor: default;
}

.cobro-lateral {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cobro-emision {
  background: var(--safic-tinta);
  color: #e8f0ee;
  border-radius: 14px;
  padding: 18px 20px;
}

.cobro-emision__titulo {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--safic-menu-seccion);
}

.cobro-emision__total {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin-top: 8px;
}

.cobro-emision__detalle {
  font-size: 13px;
  color: #b9cdc9;
  margin-top: 2px;
}

.cobro-emision__linea {
  height: 1px;
  background: var(--safic-tinta-2);
  margin: 14px 0;
}

.cobro-emision__datos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.cobro-emision__datos > div {
  display: flex;
  gap: 12px;
}

.cobro-emision__datos span {
  flex-grow: 1;
  color: #b9cdc9;
}

.cobro-historial {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.cobro-historial__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cobro-historial__item {
  display: flex;
  gap: 12px;
}

.cobro-historial__punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--q-primary);
  margin-top: 6px;
  flex-shrink: 0;
}

.cobro-historial__cambio {
  font-size: 13px;
  font-weight: 700;
}

.cobro-historial__quien {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 2px;
}

@media (max-width: 1100px) {
  .cobro-contenido {
    flex-direction: column;
    align-items: stretch;
  }

  .cobro-lateral {
    width: auto;
  }

  .cobro-metodos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
