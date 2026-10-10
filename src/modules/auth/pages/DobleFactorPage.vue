<template>
  <div class="doble column" style="gap: 20px">
    <div>
      <h2 class="doble__titulo">Verificación en dos pasos</h2>
      <p class="doble__subtitulo">
        Además de tu contraseña, pide un código de una app en tu teléfono al iniciar sesión.
      </p>
    </div>

    <div v-if="session.dobleFactorPendiente" class="safic-alerta" role="alert">
      Tu perfil de contador exige la verificación en dos pasos. Actívala para poder trabajar.
    </div>
    <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

    <!-- 3. Códigos de respaldo (solo se ven esta vez) -->
    <template v-if="codigos">
      <div class="doble__tarjeta">
        <h3 class="doble__h3">Guarda tus códigos de respaldo</h3>
        <p class="doble__texto">
          Si pierdes tu teléfono, cada código te deja entrar una sola vez. No los volverás a ver:
          guárdalos fuera de tu teléfono.
        </p>
        <ul class="doble__codigos" aria-label="Códigos de respaldo">
          <li v-for="c in codigos" :key="c">{{ c }}</li>
        </ul>
        <div class="row" style="gap: 8px">
          <q-btn
            outline
            no-caps
            color="primary"
            icon="sym_r_content_copy"
            label="Copiar"
            @click="copiar"
          />
          <q-btn
            outline
            no-caps
            color="primary"
            icon="sym_r_download"
            label="Descargar"
            @click="descargar"
          />
        </div>
      </div>
      <q-checkbox v-model="guardados" label="Ya guardé mis códigos de respaldo" />
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="safic-btn safic-btn--grande full-width"
        label="Listo"
        :disable="!guardados"
        @click="terminar"
      />
    </template>

    <!-- 2. Escanear y confirmar -->
    <template v-else-if="preparacion">
      <div class="doble__tarjeta">
        <h3 class="doble__h3">1. Escanea el código</h3>
        <p class="doble__texto">
          Abre Google Authenticator, Microsoft Authenticator, Authy o 1Password y escanea el código
          QR.
        </p>
        <img
          v-if="qr"
          :src="qr"
          alt="Código QR para configurar la app autenticadora"
          class="doble__qr"
        />
        <div v-else-if="sinQr" class="safic-alerta" role="alert">
          No se pudo mostrar el código QR. Escribe la clave de abajo en tu app.
        </div>
        <q-skeleton v-else type="rect" width="220px" height="220px" />
        <p class="doble__texto">¿No puedes escanear? Escribe esta clave en tu app:</p>
        <code class="doble__secreto">{{ secretoAgrupado(preparacion.secreto) }}</code>
      </div>
      <q-form novalidate class="column" style="gap: 14px" @submit="confirmar">
        <div class="safic-campo">
          <label for="codigo-confirmar" class="safic-campo__etiqueta">
            2. Escribe el código de 6 dígitos que muestra tu app
          </label>
          <q-input
            v-model="codigo"
            for="codigo-confirmar"
            class="safic-input"
            outlined
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="7"
            hide-bottom-space
            :error="!!errorCodigo"
            :error-message="errorCodigo ?? undefined"
          />
        </div>
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          class="safic-btn safic-btn--grande full-width"
          label="Activar"
          :loading="confirmando"
        />
        <q-btn flat no-caps label="Cancelar" :disable="confirmando" @click="cancelar" />
      </q-form>
    </template>

    <!-- 4. Ya activa -->
    <template v-else-if="session.usuario?.doble_factor.activo">
      <div class="doble__tarjeta">
        <div class="row items-center" style="gap: 8px">
          <q-icon name="sym_r_verified_user" size="24px" color="positive" />
          <h3 class="doble__h3" style="margin: 0">Verificación activa</h3>
        </div>
        <p class="doble__texto">
          Al iniciar sesión te pedimos el código de tu app. Puedes generar códigos de respaldo
          nuevos (los anteriores dejan de servir).
        </p>
        <div class="row" style="gap: 8px">
          <q-btn
            outline
            no-caps
            color="primary"
            label="Códigos de respaldo nuevos"
            @click="abrirRegenerar"
          />
          <q-btn
            outline
            no-caps
            color="negative"
            label="Desactivar"
            :disable="session.usuario.doble_factor.obligatorio"
            @click="abrirDesactivar"
          />
        </div>
        <p v-if="session.usuario.doble_factor.obligatorio" class="doble__texto">
          Tu perfil de contador exige la verificación en dos pasos: no se puede desactivar.
        </p>
      </div>
      <q-btn flat no-caps label="Volver" :to="{ name: 'inicio' }" />
    </template>

    <!-- 1. Empezar -->
    <q-form v-else novalidate class="column" style="gap: 14px" @submit="empezar">
      <div class="safic-campo">
        <label for="password-2fa" class="safic-campo__etiqueta">Confirma tu contraseña</label>
        <q-input
          v-model="password"
          for="password-2fa"
          class="safic-input"
          outlined
          type="password"
          autocomplete="current-password"
          hide-bottom-space
          :error="!!errorPassword"
          :error-message="errorPassword ?? undefined"
        />
      </div>
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        class="safic-btn safic-btn--grande full-width"
        label="Activar la verificación en dos pasos"
        :loading="preparando"
      />
      <q-btn
        v-if="!session.dobleFactorPendiente"
        flat
        no-caps
        label="Volver"
        :to="{ name: 'inicio' }"
      />
      <q-btn v-else flat no-caps color="negative" label="Cerrar sesión" @click="cerrarSesion" />
    </q-form>

    <DobleFactorConfirmacion
      v-model="dialogo"
      :titulo="
        accion === 'desactivar' ? 'Desactivar la verificación' : 'Códigos de respaldo nuevos'
      "
      :mensaje="
        accion === 'desactivar'
          ? 'Tu cuenta quedará protegida solo con la contraseña.'
          : 'Los códigos anteriores dejarán de servir. Se muestran una sola vez.'
      "
      :etiqueta="accion === 'desactivar' ? 'Desactivar' : 'Generar'"
      :peligro="accion === 'desactivar'"
      :enviando="regenerar.isPending.value || desactivar.isPending.value"
      :error="errorDialogo"
      :error-campos="erroresDialogo"
      @confirmar="confirmarAccion"
    />
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { useQuasar } from 'quasar';
import { computed, onBeforeUnmount, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { aApiError } from '@/core/api/errors';
import { redireccionSegura } from '@/router/guards';
import { useSessionStore } from '@/stores/session';

import DobleFactorConfirmacion from '../components/DobleFactorConfirmacion.vue';
import {
  useConfirmarDobleFactor,
  useDesactivarDobleFactor,
  usePrepararDobleFactor,
  useRegenerarCodigosRespaldo,
} from '../composables/useDobleFactor';
import {
  codigoDeApp,
  errorCodigoDeApp,
  errorContrasena,
  secretoAgrupado,
  textoCodigosRespaldo,
} from '../doble-factor.logica';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const queryClient = useQueryClient();

const preparar = usePrepararDobleFactor();
const confirmarActivacion = useConfirmarDobleFactor();
const regenerar = useRegenerarCodigosRespaldo();
const desactivar = useDesactivarDobleFactor();

const password = ref('');
const errorPassword = ref<string | null>(null);
const errorGeneral = ref<string | null>(null);
const preparando = computed(() => preparar.isPending.value);
const confirmando = computed(() => confirmarActivacion.isPending.value);

const preparacion = computed(() => preparar.data.value ?? null);
const qr = ref<string | null>(null);
/** No se pudo dibujar el QR: se ofrece solo la clave para escribirla en la app. */
const sinQr = ref(false);
const codigo = ref('');
const errorCodigo = ref<string | null>(null);

/** Códigos de respaldo recién generados: viven solo en esta pantalla y se borran al salir. */
const codigos = ref<string[] | null>(null);
const guardados = ref(false);

const dialogo = ref(false);
const accion = ref<'regenerar' | 'desactivar'>('regenerar');
const errorDialogo = ref<string | null>(null);
const erroresDialogo = ref<{ password?: string | undefined; codigo?: string | undefined }>({});

// Los códigos solo se ven una vez: no se sale de la pantalla sin confirmar que se guardaron
onBeforeRouteLeave(() => {
  if (codigos.value === null || guardados.value) return true;
  return new Promise<boolean>((resolver) => {
    $q.dialog({
      title: 'Aún no guardas tus códigos',
      message: 'No los volverás a ver. Si sales ahora, tendrás que generar códigos nuevos.',
      cancel: { label: 'Seguir aquí', flat: true, noCaps: true },
      ok: { label: 'Salir', color: 'negative', noCaps: true },
      persistent: true,
    })
      .onOk(() => resolver(true))
      .onCancel(() => resolver(false));
  });
});

onBeforeUnmount(() => {
  // Ni el secreto ni los códigos deben quedar en memoria al salir de la pantalla
  codigos.value = null;
  password.value = '';
  preparar.reset();
  confirmarActivacion.reset();
  regenerar.reset();
  desactivar.reset();
});

async function empezar(): Promise<void> {
  if (preparando.value) return;
  errorGeneral.value = null;
  errorPassword.value = errorContrasena(password.value);
  if (errorPassword.value) return;

  try {
    const datos = await preparar.mutateAsync(password.value);
    password.value = '';
    try {
      // Se carga solo aquí: la librería del QR no pesa en el resto de la aplicación
      const { default: QRCode } = await import('qrcode');
      qr.value = await QRCode.toDataURL(datos.uri, { width: 220, margin: 1 });
    } catch {
      // Sin QR se puede configurar con la clave escrita a mano
      sinQr.value = true;
    }
  } catch (error) {
    const e = aApiError(error);
    errorPassword.value = e.campo('password') ?? null;
    if (!errorPassword.value) errorGeneral.value = e.mensaje;
  }
}

async function confirmar(): Promise<void> {
  if (confirmando.value) return;
  errorGeneral.value = null;
  errorCodigo.value = errorCodigoDeApp(codigo.value);
  if (errorCodigo.value) return;

  try {
    const r = await confirmarActivacion.mutateAsync(codigoDeApp(codigo.value));
    codigos.value = r.codigos_respaldo;
    qr.value = null;
    codigo.value = '';
    $q.notify({ type: 'positive', message: 'Verificación en dos pasos activada.' });
  } catch (error) {
    const e = aApiError(error);
    errorCodigo.value = e.campo('codigo') ?? null;
    if (!errorCodigo.value) errorGeneral.value = e.mensaje;
  }
}

function cancelar(): void {
  preparar.reset();
  qr.value = null;
  sinQr.value = false;
  codigo.value = '';
  errorCodigo.value = null;
}

async function copiar(): Promise<void> {
  if (!codigos.value) return;
  try {
    await navigator.clipboard.writeText(codigos.value.join('\n'));
    $q.notify({ type: 'positive', message: 'Códigos copiados.' });
  } catch {
    $q.notify({ type: 'warning', message: 'No se pudo copiar. Descárgalos o cópialos a mano.' });
  }
}

function descargar(): void {
  if (!codigos.value) return;
  const texto = textoCodigosRespaldo(codigos.value, session.usuario?.email ?? '');
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
  enlace.download = 'safic-codigos-respaldo.txt';
  enlace.click();
  // Algunos navegadores cancelan la descarga si se revoca al instante
  setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000);
}

async function terminar(): Promise<void> {
  codigos.value = null;
  preparar.reset();
  await router.replace(redireccionSegura(route.query.redirect) ?? { name: 'inicio' });
}

async function cerrarSesion(): Promise<void> {
  try {
    await session.cerrarSesion();
  } finally {
    queryClient.clear();
    await router.replace({ name: 'login' });
  }
}

function abrirDialogo(cual: 'regenerar' | 'desactivar'): void {
  accion.value = cual;
  errorDialogo.value = null;
  erroresDialogo.value = {};
  dialogo.value = true;
}
const abrirRegenerar = (): void => abrirDialogo('regenerar');
const abrirDesactivar = (): void => abrirDialogo('desactivar');

async function confirmarAccion(datos: { password: string; codigo: string }): Promise<void> {
  if (regenerar.isPending.value || desactivar.isPending.value) return;
  errorDialogo.value = null;
  erroresDialogo.value = {};
  try {
    if (accion.value === 'desactivar') {
      await desactivar.mutateAsync(datos);
      dialogo.value = false;
      preparar.reset();
      $q.notify({ type: 'positive', message: 'Verificación en dos pasos desactivada.' });
      return;
    }
    const r = await regenerar.mutateAsync(datos);
    dialogo.value = false;
    codigos.value = r.codigos_respaldo;
    guardados.value = false;
  } catch (error) {
    const e = aApiError(error);
    erroresDialogo.value = { password: e.campo('password'), codigo: e.campo('codigo') };
    if (!e.campo('password') && !e.campo('codigo')) errorDialogo.value = e.mensaje;
  }
}
</script>

<style scoped>
.doble__titulo {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.doble__subtitulo {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: var(--safic-texto-suave);
}

.doble__tarjeta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  background: var(--safic-superficie);
}

.doble__h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.doble__texto {
  margin: 0;
  font-size: 14px;
  color: var(--safic-texto-2);
  line-height: 1.45;
}

.doble__qr {
  width: 220px;
  height: 220px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
  background: #ffffff;
}

.doble__secreto {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  word-break: break-all;
  background: #f1efe8;
  border-radius: 8px;
  padding: 8px 10px;
}

.doble__codigos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 15px;
  font-weight: 700;
}
</style>
