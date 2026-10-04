<template>
  <q-page class="safic-main nueva-unidad">
    <div class="nueva-unidad__encabezado">
      <router-link
        :to="{ name: 'unidades' }"
        class="nueva-unidad__volver"
        aria-label="Volver a unidades"
      >
        <q-icon :name="ICONOS.volver" size="20px" />
      </router-link>
      <div>
        <div class="safic-miga">Inicio / Unidades / Nueva</div>
        <h1 class="safic-titulo">Nueva unidad</h1>
      </div>
    </div>

    <div
      v-if="resumen.isError.value"
      class="safic-alerta row items-center"
      role="alert"
      style="gap: 12px"
    >
      <span class="col-grow">{{ resumen.error.value?.mensaje }}</span>
      <q-btn flat no-caps dense label="Reintentar" @click="resumen.refetch()" />
    </div>

    <q-skeleton v-else-if="resumen.isLoading.value" height="420px" class="nueva-unidad__skeleton" />

    <template v-else-if="resumen.data.value">
      <div class="nueva-unidad__cuerpo">
        <form class="nueva-unidad__formulario" novalidate @submit.prevent="guardar(false)">
          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <section class="nueva-unidad__seccion">
            <div class="nueva-unidad__titulo-seccion">IDENTIFICACIÓN</div>

            <div class="nueva-unidad__dos">
              <div class="safic-campo">
                <label for="nu-codigo" class="safic-campo__etiqueta">
                  Código <span class="nueva-unidad__obligatorio">*</span>
                </label>
                <q-input
                  v-model="formulario.codigo"
                  for="nu-codigo"
                  class="safic-input"
                  outlined
                  maxlength="20"
                  autofocus
                  hide-bottom-space
                  :error="!!errores.codigo"
                  :error-message="errores.codigo"
                />
                <div v-if="!errores.codigo" class="nueva-unidad__ayuda">
                  Único en el condominio, ej. A-104.
                </div>
              </div>

              <div class="safic-campo">
                <label for="nu-bloque" class="safic-campo__etiqueta">Bloque</label>
                <q-select
                  v-model="formulario.bloqueId"
                  for="nu-bloque"
                  class="safic-input"
                  outlined
                  emit-value
                  map-options
                  :options="opcionesBloque"
                  :loading="bloques.isLoading.value"
                  hide-bottom-space
                  :error="!!errores.bloqueId"
                  :error-message="errores.bloqueId"
                />
                <div class="nueva-unidad__ayuda">Los bloques se crean en Unidades › Bloques.</div>
              </div>
            </div>

            <div class="safic-campo">
              <div id="nu-tipo" class="safic-campo__etiqueta">
                Tipo <span class="nueva-unidad__obligatorio">*</span>
              </div>
              <div role="radiogroup" aria-labelledby="nu-tipo" class="nueva-unidad__pildoras">
                <button
                  v-for="t in TIPOS_UNIDAD"
                  :key="t.valor"
                  type="button"
                  role="radio"
                  :aria-checked="formulario.tipo === t.valor"
                  class="nueva-unidad__pildora"
                  :class="{ 'nueva-unidad__pildora--activa': formulario.tipo === t.valor }"
                  @click="formulario.tipo = t.valor"
                >
                  {{ t.texto }}
                </button>
              </div>
              <div v-if="errores.tipo" class="nueva-unidad__error" role="alert">
                {{ errores.tipo }}
              </div>
            </div>

            <div class="nueva-unidad__dos">
              <div class="safic-campo">
                <label for="nu-piso" class="safic-campo__etiqueta">Piso</label>
                <q-input
                  v-model="formulario.piso"
                  for="nu-piso"
                  class="safic-input"
                  outlined
                  inputmode="numeric"
                  hide-bottom-space
                  :error="!!errores.piso"
                  :error-message="errores.piso"
                />
              </div>
              <div class="safic-campo">
                <label for="nu-area" class="safic-campo__etiqueta">
                  Área (m²) <span class="nueva-unidad__obligatorio">*</span>
                </label>
                <q-input
                  v-model="formulario.area"
                  for="nu-area"
                  class="safic-input"
                  outlined
                  inputmode="decimal"
                  hide-bottom-space
                  :error="!!errores.area"
                  :error-message="errores.area"
                />
              </div>
            </div>
          </section>

          <section class="nueva-unidad__seccion">
            <div class="nueva-unidad__titulo-seccion">COBRO</div>

            <div class="safic-campo">
              <div id="nu-resp" class="safic-campo__etiqueta">
                Responsable de pago <span class="nueva-unidad__obligatorio">*</span>
              </div>
              <div role="radiogroup" aria-labelledby="nu-resp" class="nueva-unidad__dos">
                <button
                  v-for="r in RESPONSABLES"
                  :key="r.valor"
                  type="button"
                  role="radio"
                  :aria-checked="formulario.responsable === r.valor"
                  class="nueva-unidad__opcion"
                  :class="{ 'nueva-unidad__opcion--activa': formulario.responsable === r.valor }"
                  @click="formulario.responsable = r.valor"
                >
                  <span class="nueva-unidad__punto" />
                  <span class="column">
                    <span class="nueva-unidad__opcion-nombre">{{ r.texto }}</span>
                    <span class="nueva-unidad__ayuda">{{ r.detalle }}</span>
                  </span>
                </button>
              </div>
            </div>

            <div class="nueva-unidad__dos">
              <div class="safic-campo">
                <label for="nu-alicuota" class="safic-campo__etiqueta">
                  Alícuota (%)
                  <span v-if="cobro.alicuota === 'obligatoria'" class="nueva-unidad__obligatorio"
                    >*</span
                  >
                </label>
                <q-input
                  v-model="formulario.alicuota"
                  for="nu-alicuota"
                  class="safic-input"
                  outlined
                  inputmode="decimal"
                  placeholder="0,6200"
                  hide-bottom-space
                  :error="!!errores.alicuota"
                  :error-message="errores.alicuota"
                />
                <div v-if="!errores.alicuota" class="nueva-unidad__ayuda">{{ notaAlicuota }}</div>
              </div>

              <div v-if="cobro.cuotaMensual" class="safic-campo">
                <label for="nu-cuota" class="safic-campo__etiqueta">
                  Cuota mensual <span class="nueva-unidad__obligatorio">*</span>
                </label>
                <q-input
                  v-model="formulario.cuotaMensual"
                  for="nu-cuota"
                  class="safic-input"
                  outlined
                  inputmode="decimal"
                  prefix="$"
                  hide-bottom-space
                  :error="!!errores.cuotaMensual"
                  :error-message="errores.cuotaMensual"
                />
              </div>

              <div v-if="cobro.valorPersonalizado" class="safic-campo">
                <label for="nu-valor" class="safic-campo__etiqueta">Valor personalizado</label>
                <q-input
                  v-model="formulario.valorPersonalizado"
                  for="nu-valor"
                  class="safic-input"
                  outlined
                  inputmode="decimal"
                  prefix="$"
                  hide-bottom-space
                  :error="!!errores.valorPersonalizado"
                  :error-message="errores.valorPersonalizado"
                />
                <div v-if="!errores.valorPersonalizado" class="nueva-unidad__ayuda">
                  Reemplaza el valor
                  {{ resumen.data.value.metodo_cobro === 'tipo' ? 'del tipo' : 'de la alícuota' }}
                  solo para esta unidad (excepción aprobada en asamblea).
                </div>
              </div>
            </div>
          </section>
        </form>

        <aside class="nueva-unidad__lateral">
          <div class="nueva-unidad__tarjeta">
            <div class="nueva-unidad__titulo-seccion">CUPO DEL PLAN</div>
            <div class="nueva-unidad__cupo">
              <span class="nueva-unidad__cupo-valor">{{ resumen.data.value.registradas }}</span>
              <span class="nueva-unidad__cupo-total"
                >de {{ resumen.data.value.total_contratadas }} unidades</span
              >
            </div>
            <div
              class="nueva-unidad__barra"
              role="progressbar"
              aria-label="Unidades registradas del total contratado"
              :aria-valuenow="resumen.data.value.registradas"
              aria-valuemin="0"
              :aria-valuemax="resumen.data.value.total_contratadas"
            >
              <div class="nueva-unidad__barra-relleno" :style="{ width: `${porcentajeCupo}%` }" />
            </div>
            <div class="nueva-unidad__ayuda q-mt-sm">{{ notaCupo }}</div>
          </div>

          <div
            v-if="resumen.data.value.metodo_cobro === 'general'"
            class="nueva-unidad__aviso"
            role="note"
          >
            <q-icon :name="ICONOS.info" size="22px" class="nueva-unidad__aviso-icono" />
            <div class="col-grow">
              <div class="nueva-unidad__aviso-titulo">Esta unidad pagará el valor general</div>
              <div class="nueva-unidad__aviso-texto">
                Igual para casas y departamentos. Se cambia en Configuración › Cobro de cuotas.
              </div>
            </div>
            <div v-if="resumen.data.value.cuota_general" class="nueva-unidad__aviso-monto">
              {{ formatoMoneda(resumen.data.value.cuota_general) }}
            </div>
          </div>

          <div class="nueva-unidad__consejo">
            <div class="text-weight-bolder q-mb-xs">¿Muchas unidades?</div>
            Cárgalas todas de una vez con Importar Excel. Después de crear la unidad podrás asignar
            propietario e inquilinos desde su detalle.
          </div>
        </aside>
      </div>

      <div class="nueva-unidad__pie">
        <router-link :to="{ name: 'unidades' }" class="nueva-unidad__cancelar"
          >Cancelar</router-link
        >
        <div class="col-grow" />
        <q-btn
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          label="Guardar y crear otra"
          :disable="sinCupo || crear.isPending.value"
          @click="guardar(true)"
        />
        <q-btn
          color="primary"
          unelevated
          no-caps
          class="safic-btn"
          label="Crear unidad"
          :disable="sinCupo"
          :loading="crear.isPending.value"
          @click="guardar(false)"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';
import { formatoMoneda } from '@/utils/formato';

import { useBloques } from '../composables/useBloques';
import { useCrearUnidad, useResumenUnidades } from '../composables/useUnidades';
import type { ResponsablePago } from '../services/unidades.service';
import {
  CAMPOS_API,
  TIPOS_UNIDAD,
  camposDeCobro,
  cuentaParaCupo,
  formularioVacio,
  validarUnidad,
  type CampoUnidad,
} from '../unidad.formulario';

const RESPONSABLES: { valor: ResponsablePago; texto: string; detalle: string }[] = [
  { valor: 'propietario', texto: 'Propietario', detalle: 'Recibe las cuotas (por defecto)' },
  { valor: 'inquilino', texto: 'Inquilino', detalle: 'Paga mientras haya contrato' },
];

const $q = useQuasar();
const router = useRouter();

const resumen = useResumenUnidades();
const bloques = useBloques();
const crear = useCrearUnidad();

const formulario = reactive(formularioVacio());
const errores = reactive<Partial<Record<CampoUnidad, string>>>({});
const errorGeneral = ref<string | null>(null);

const opcionesBloque = computed(() => [
  { label: 'Sin bloque', value: null },
  ...(bloques.data.value ?? []).map((b) => ({ label: b.nombre, value: b.id })),
]);

const cobro = computed(() => camposDeCobro(resumen.data.value?.metodo_cobro ?? 'general'));

const porcentajeCupo = computed(() => {
  const r = resumen.data.value;
  if (!r || r.total_contratadas === 0) return 0;
  return Math.min(100, (r.registradas / r.total_contratadas) * 100);
});

/** Sin cupo no se puede crear un departamento, casa o local (la API responde 409). */
const sinCupo = computed(() => {
  const r = resumen.data.value;
  return !!r && cuentaParaCupo(formulario.tipo) && r.registradas >= r.total_contratadas;
});

const notaCupo = computed(() => {
  const r = resumen.data.value;
  if (!r) return '';
  if (!cuentaParaCupo(formulario.tipo)) {
    return 'Los parqueaderos y bodegas no cuentan para el total contratado.';
  }
  if (sinCupo.value) {
    return 'Alcanzaste el total de unidades contratadas; solicita un aumento.';
  }
  const quedan = r.total_contratadas - r.registradas - 1;
  return quedan === 1
    ? 'Al crearla quedará 1 disponible.'
    : `Al crearla quedarán ${quedan} disponibles.`;
});

const notaAlicuota = computed(() =>
  cobro.value.alicuota === 'obligatoria'
    ? 'Porcentaje de la declaratoria, hasta 4 decimales. Define la cuota de la unidad.'
    : 'Opcional. Se usa para votar en asambleas; también se carga con Importar Excel.',
);

// Al cambiar un campo se quita su error
watch(
  () => ({ ...formulario }),
  (nuevo, anterior) => {
    for (const campo of Object.keys(nuevo) as CampoUnidad[]) {
      if (nuevo[campo] !== anterior[campo]) delete errores[campo];
    }
  },
);

function limpiarErrores(): void {
  for (const campo of Object.keys(errores) as CampoUnidad[]) delete errores[campo];
  errorGeneral.value = null;
}

async function guardar(otra: boolean): Promise<void> {
  if (!resumen.data.value || crear.isPending.value) return;
  limpiarErrores();

  const validacion = validarUnidad(formulario, resumen.data.value.metodo_cobro);
  if (!validacion.ok) {
    Object.assign(errores, validacion.errores);
    return;
  }

  try {
    const unidad = await crear.mutateAsync(validacion.datos);
    $q.notify({ type: 'positive', message: `Unidad ${unidad.codigo} creada.` });

    if (otra) {
      // Se conservan bloque, tipo y responsable para cargar varias seguidas
      Object.assign(formulario, {
        codigo: '',
        piso: '',
        area: '',
        alicuota: '',
        cuotaMensual: '',
        valorPersonalizado: '',
      });
    } else {
      await router.push({ name: 'unidades' });
    }
  } catch (error) {
    const apiError = aApiError(error);
    let enCampo = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API)) {
      const mensaje = apiError.campo(campoApi);
      if (mensaje) {
        errores[campo] = mensaje;
        enCampo = true;
      }
    }
    if (!enCampo) {
      errorGeneral.value = apiError.mensaje;
    }
    if (apiError.codigo === 'LIMITE_UNIDADES') {
      // El cupo cambió (otra persona registró unidades): se actualiza el panel
      void resumen.refetch();
    }
  }
}
</script>

<style scoped>
.nueva-unidad {
  gap: 18px;
}

.nueva-unidad__encabezado {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nueva-unidad__volver {
  width: 44px;
  height: 44px;
  border-radius: var(--safic-radio-control);
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  color: var(--safic-texto);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nueva-unidad__skeleton {
  border-radius: var(--safic-radio);
}

.nueva-unidad__cuerpo {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.nueva-unidad__formulario {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nueva-unidad__seccion {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: var(--safic-radio);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nueva-unidad__titulo-seccion {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--safic-texto-suave);
}

.nueva-unidad__dos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.nueva-unidad__obligatorio,
.nueva-unidad__error {
  color: #9b1c12;
}

.nueva-unidad__error {
  font-size: 12px;
  font-weight: 700;
}

.nueva-unidad__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.nueva-unidad__pildoras {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nueva-unidad__pildora {
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  color: var(--safic-texto-2);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.nueva-unidad__pildora--activa {
  border-color: var(--q-primary);
  background: var(--q-primary);
  color: #ffffff;
}

.nueva-unidad__opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.nueva-unidad__opcion--activa {
  border: 2px solid var(--q-primary);
  background: #f1f6f5;
}

.nueva-unidad__punto {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 2px solid #a9a498;
}

.nueva-unidad__opcion--activa .nueva-unidad__punto {
  border: 6px solid var(--q-primary);
}

.nueva-unidad__opcion-nombre {
  font-size: 14px;
  font-weight: 700;
  color: var(--safic-texto);
}

.nueva-unidad__pildora:focus-visible,
.nueva-unidad__opcion:focus-visible,
.nueva-unidad__volver:focus-visible,
.nueva-unidad__cancelar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.nueva-unidad__lateral {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nueva-unidad__tarjeta {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: var(--safic-radio);
  padding: 18px 20px;
}

.nueva-unidad__cupo {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
}

.nueva-unidad__cupo-valor {
  font-size: 30px;
  font-weight: 800;
}

.nueva-unidad__cupo-total {
  font-size: 15px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.nueva-unidad__barra {
  height: 8px;
  border-radius: 4px;
  background: var(--safic-linea);
  margin-top: 10px;
  overflow: hidden;
}

.nueva-unidad__barra-relleno {
  height: 8px;
  background: var(--q-primary);
}

.nueva-unidad__aviso {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f1f6f5;
  border: 1px solid #d3e3e0;
}

.nueva-unidad__aviso-icono {
  color: var(--q-primary);
  flex-shrink: 0;
}

.nueva-unidad__aviso-titulo {
  font-size: 13px;
  font-weight: 700;
  color: #0b4a47;
}

.nueva-unidad__aviso-texto {
  font-size: 12px;
  color: var(--safic-texto-2);
  margin-top: 2px;
}

.nueva-unidad__aviso-monto {
  font-size: 22px;
  font-weight: 800;
  color: #0b4a47;
  white-space: nowrap;
}

.nueva-unidad__consejo {
  background: var(--safic-fondo-2);
  border: 1px solid var(--safic-linea);
  border-radius: var(--safic-radio);
  padding: 16px 18px;
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.nueva-unidad__pie {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0 0 0;
  border-top: 1px solid var(--safic-borde);
}

.nueva-unidad__cancelar {
  height: 46px;
  padding: 0 16px;
  border-radius: var(--safic-radio-control);
  font-size: 14px;
  font-weight: 700;
  color: var(--safic-texto-2);
  display: flex;
  align-items: center;
  text-decoration: none;
}

@media (max-width: 1023px) {
  .nueva-unidad__cuerpo {
    flex-direction: column;
    align-items: stretch;
  }

  .nueva-unidad__lateral {
    width: auto;
  }
}

@media (max-width: 599px) {
  .nueva-unidad__dos {
    grid-template-columns: minmax(0, 1fr);
  }

  .nueva-unidad__pie {
    flex-wrap: wrap;
  }
}
</style>
