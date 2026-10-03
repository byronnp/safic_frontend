<template>
  <div class="column" style="gap: 20px">
    <div>
      <h2 class="login__titulo">Iniciar sesión</h2>
      <p class="login__subtitulo">Ingresa con el correo que registró tu administración.</p>
    </div>

    <q-form novalidate class="column" style="gap: 20px" @submit="ingresar">
      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

      <div class="safic-campo">
        <label for="email" class="safic-campo__etiqueta">{{ t('auth.correo') }}</label>
        <q-input
          v-model.trim="formulario.email"
          for="email"
          class="safic-input"
          outlined
          type="email"
          autocomplete="username"
          hide-bottom-space
          :error="!!errores.email"
          :error-message="errores.email"
          autofocus
        />
      </div>

      <div class="safic-campo">
        <div class="row items-baseline">
          <label for="password" class="safic-campo__etiqueta col-grow">
            {{ t('auth.contrasena') }}
          </label>
          <a href="#" class="login__enlace" @click.prevent="proximamente">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <q-input
          v-model="formulario.password"
          for="password"
          class="safic-input"
          outlined
          :type="verContrasena ? 'text' : 'password'"
          autocomplete="current-password"
          hide-bottom-space
          :error="!!errores.password"
          :error-message="errores.password"
        >
          <template #append>
            <q-btn
              flat
              round
              dense
              :icon="verContrasena ? 'sym_r_visibility_off' : 'sym_r_visibility'"
              :aria-label="verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              style="color: var(--safic-texto-suave)"
              @click="verContrasena = !verContrasena"
            />
          </template>
        </q-input>
      </div>

      <q-btn
        type="submit"
        color="primary"
        unelevated
        no-caps
        class="safic-btn safic-btn--grande full-width"
        :label="t('auth.ingresar')"
        :loading="enviando"
      />
    </q-form>

    <div class="login__separador"><span />o<span /></div>

    <q-btn
      unelevated
      no-caps
      class="safic-btn safic-btn--secundario full-width"
      style="min-height: 50px; font-size: 15px"
      icon="sym_r_qr_code_2"
      label="Tengo un código de invitación"
      @click="proximamente"
    />
    <p class="login__nota">
      ¿Eres residente nuevo? Tu administrador te envía la invitación por correo.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';

import { aApiError } from '@/core/api/errors';
import { redireccionSegura } from '@/router/guards';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const esquema = z.object({
  email: z.email(t('auth.correoInvalido')),
  password: z.string().min(1, t('comun.obligatorio')),
});

const formulario = reactive({ email: '', password: '' });
const errores = reactive<{ email: string | undefined; password: string | undefined }>({
  email: undefined,
  password: undefined,
});
const errorGeneral = ref<string | null>(null);
const enviando = ref(false);
const verContrasena = ref(false);

/** Recuperar contraseña e invitaciones llegan en el Sprint 1. */
function proximamente(): void {
  $q.notify({
    type: 'info',
    message: 'Disponible pronto. Por ahora pide ayuda a tu administración.',
  });
}

async function ingresar(): Promise<void> {
  errores.email = undefined;
  errores.password = undefined;
  errorGeneral.value = null;

  const validacion = esquema.safeParse(formulario);
  if (!validacion.success) {
    for (const problema of validacion.error.issues) {
      const campo = problema.path[0];
      if (campo === 'email' || campo === 'password') {
        errores[campo] ??= problema.message;
      }
    }
    return;
  }

  enviando.value = true;
  try {
    await session.iniciarSesion(validacion.data.email, validacion.data.password);

    if (session.condominioId === null) {
      await router.replace({ name: 'seleccionar-condominio', query: route.query });
      return;
    }
    await router.replace(redireccionSegura(route.query.redirect) ?? { name: 'inicio' });
  } catch (error) {
    const apiError = aApiError(error);
    errores.email = apiError.campo('email');
    errores.password = apiError.campo('password');
    if (!errores.email && !errores.password) {
      errorGeneral.value = apiError.mensaje;
    }
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.login__titulo {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.login__subtitulo {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: var(--safic-texto-suave);
}

.login__enlace {
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.login__separador {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--safic-texto-tenue);
  font-size: 13px;
}

.login__separador span {
  flex-grow: 1;
  height: 1px;
  background: #e0dcd1;
}

.login__nota {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--safic-texto-tenue);
  text-align: center;
}
</style>
