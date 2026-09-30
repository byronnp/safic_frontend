<template>
  <q-page class="safic-main config">
    <PaginaEncabezado miga="Plataforma / Configuración" titulo="Configuración de cobro" />

    <div v-if="!cancelado" class="config__pendiente" role="status">
      <q-icon name="sym_r_schedule" size="22px" class="config__pendiente-icono" />
      <div class="config__pendiente-texto">
        <strong>Cambio pendiente:</strong> nueva cuenta {{ cambio.cuenta }} agregada por
        {{ cambio.agregadaPor }} el {{ cambio.agregadaEl }}. Se activa el
        <strong>{{ cambio.seActiva }}</strong> (24 h). Se notificó a los
        {{ cambio.superAdministradores }} super administradores.
      </div>
      <button type="button" class="config__cancelar" @click="cancelar">Cancelar cambio</button>
    </div>
    <div v-else class="config__cancelado" role="status">
      Cambio cancelado. La cuenta {{ cambio.cuenta }} no se activará y quedó registrado en la
      auditoría.
    </div>

    <div class="config__cuerpo">
      <section class="config__cuentas">
        <div class="config__cuentas-barra">
          <div class="config__cuentas-textos">
            <h2 class="config__subtitulo">Cuentas bancarias para recibir pagos</h2>
            <div class="config__ayuda">
              Los condominios las ven en Mi suscripción. Agregar o cambiar exige contraseña + código
              OTP.
            </div>
          </div>
          <button type="button" class="config__agregar" @click="agregarCuenta">
            Agregar cuenta
          </button>
        </div>
        <div class="config__lista">
          <div
            v-for="c in cuentas"
            :key="c.id"
            class="config__cuenta"
            :class="{ 'config__cuenta--pendiente': c.pendiente }"
          >
            <div class="config__banco-logo" :style="{ background: c.color }" aria-hidden="true">
              {{ c.iniciales }}
            </div>
            <div class="config__banco-textos">
              <div class="config__banco">{{ c.banco }}</div>
              <div class="config__detalle">{{ c.detalle }}</div>
            </div>
            <EstadoBadge class="config__estado" :tono="c.tono" :texto="c.estado" />
          </div>
        </div>
        <div class="config__relleno" />
        <div class="config__pie">
          Toda cuenta nueva espera 24 h antes de mostrarse a los condominios. Durante ese tiempo
          cualquier super administrador puede cancelarla.
        </div>
      </section>

      <form class="config__emisor" @submit.prevent="guardarEmisor">
        <div>
          <h2 class="config__subtitulo">Datos del emisor</h2>
          <div class="config__ayuda">Se usan en las facturas electrónicas al condominio (SRI).</div>
        </div>
        <label class="config__campo"
          >Razón social<input v-model="emisor.razonSocial" class="config__input"
        /></label>
        <div class="config__grilla">
          <label class="config__campo"
            >RUC<input v-model="emisor.ruc" class="config__input" inputmode="numeric"
          /></label>
          <label class="config__campo"
            >IVA<input v-model="emisor.iva" class="config__input"
          /></label>
          <label class="config__campo"
            >Establecimiento<input v-model="emisor.establecimiento" class="config__input"
          /></label>
          <label class="config__campo"
            >Punto de emisión<input v-model="emisor.puntoEmision" class="config__input"
          /></label>
          <label class="config__campo"
            >Día de facturación<input v-model="emisor.diaFacturacion" class="config__input"
          /></label>
          <label class="config__campo"
            >Días para pagar<input
              v-model="emisor.diasPagar"
              class="config__input"
              inputmode="numeric"
          /></label>
        </div>
        <label class="config__campo"
          >Dirección matriz<input v-model="emisor.direccionMatriz" class="config__input"
        /></label>
        <label class="config__campo"
          >Proveedor de facturación electrónica<select
            v-model="emisor.proveedor"
            class="config__input config__select"
          >
            <option v-for="p in PROVEEDORES_FACTURACION" :key="p" :value="p">{{ p }}</option>
          </select></label
        >
        <div class="config__relleno" />
        <q-btn
          type="submit"
          no-caps
          unelevated
          color="primary"
          class="safic-btn config__guardar"
          label="Guardar datos del emisor"
        />
      </form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import {
  CAMBIO_PENDIENTE_COBRO,
  CUENTAS_COBRO,
  EMISOR_COBRO,
  PROVEEDORES_FACTURACION,
} from '../demo/configuracion-cobro';

const $q = useQuasar();
const cambio = CAMBIO_PENDIENTE_COBRO;
const cancelado = ref(false);
const emisor = reactive({ ...EMISOR_COBRO });

const cuentas = computed(() =>
  cancelado.value ? CUENTAS_COBRO.filter((c) => c.id !== cambio.cuentaId) : CUENTAS_COBRO,
);

function cancelar(): void {
  cancelado.value = true;
}

function agregarCuenta(): void {
  $q.notify({
    type: 'info',
    message: 'Agregar una cuenta pedirá tu contraseña y un código OTP.',
  });
}

function guardarEmisor(): void {
  $q.notify({ type: 'positive', message: 'Datos del emisor guardados.' });
}
</script>

<style scoped>
.config.safic-main {
  padding: 28px 36px;
  gap: 16px;
}

.config__pendiente {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff7ec;
  border: 1px solid #f1d6ae;
  border-radius: 14px;
  padding: 14px 18px;
  color: #7a3808;
}

.config__pendiente-icono {
  flex-shrink: 0;
}

.config__pendiente-texto {
  flex-grow: 1;
  font-size: 13px;
  line-height: 1.45;
}

.config__cancelar {
  height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid #b8641c;
  background: #ffffff;
  color: #8a3f0a;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  font-family: inherit;
}

.config__cancelado {
  background: #fde8e6;
  border: 1px solid #f3b8b2;
  border-radius: 14px;
  padding: 14px 18px;
  color: #7f1810;
  font-size: 13px;
  font-weight: 600;
}

.config__cuerpo {
  display: flex;
  gap: 20px;
  flex-grow: 1;
  min-height: 0;
}

.config__cuentas {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.config__cuentas-barra {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #ece9e0;
}

.config__cuentas-textos {
  flex-grow: 1;
  min-width: 0;
}

.config__subtitulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 800;
  letter-spacing: 0;
}

.config__ayuda {
  font-size: 12px;
  color: #5f5b52;
}

.config__agregar {
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
  flex-shrink: 0;
}

.config__lista {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config__cuenta {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #e4e1d8;
  background: #ffffff;
}

.config__cuenta--pendiente {
  border: 1px dashed #e0b77f;
  background: #fffbf4;
}

.config__banco-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}

.config__banco-textos {
  flex-grow: 1;
  min-width: 0;
}

.config__banco {
  font-size: 15px;
  font-weight: 800;
}

.config__detalle {
  font-size: 13px;
  color: #3d3a33;
  overflow-wrap: anywhere;
}

.config__estado {
  padding: 5px 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.config__relleno {
  flex-grow: 1;
}

.config__pie {
  padding: 12px 20px;
  background: #faf9f5;
  border-top: 1px solid #ece9e0;
  font-size: 12px;
  color: #5f5b52;
}

.config__emisor {
  width: 460px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  margin: 0;
}

.config__grilla {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.config__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #3d3a33;
  min-width: 0;
}

.config__input {
  font-weight: 400;
  height: 42px;
  border: 1px solid #cfcbbf;
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: #1c1b18;
  background: #ffffff;
  min-width: 0;
}

.config__select {
  padding: 0 10px;
}

.config__input:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
  border-color: transparent;
}

.config__guardar.q-btn {
  min-height: 46px;
  height: 46px;
}

@media (max-width: 1199px) {
  .config__cuerpo {
    flex-direction: column;
  }

  .config__emisor {
    width: auto;
  }
}

@media (max-width: 599px) {
  .config.safic-main {
    padding: 20px 16px;
  }

  .config__pendiente,
  .config__cuentas-barra {
    flex-wrap: wrap;
  }

  .config__cuenta {
    flex-wrap: wrap;
  }
}
</style>
