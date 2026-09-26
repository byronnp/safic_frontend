<template>
  <q-card flat class="safic-card full-width q-pa-md">
    <q-card-section>
      <h1 class="safic-titulo">{{ t('auth.titulo') }}</h1>
      <p class="text-suave q-mb-none q-mt-xs">{{ t('auth.subtitulo') }}</p>
    </q-card-section>

    <q-form novalidate class="q-gutter-y-md q-px-md q-pb-md" @submit="ingresar">
      <q-banner v-if="errorGeneral" dense rounded class="bg-red-1 text-negative" role="alert">
        {{ errorGeneral }}
      </q-banner>

      <q-input
        v-model.trim="formulario.email"
        outlined
        type="email"
        autocomplete="username"
        :label="t('auth.correo')"
        :error="!!errores.email"
        :error-message="errores.email"
        autofocus
      />

      <q-input
        v-model="formulario.password"
        outlined
        :type="verContrasena ? 'text' : 'password'"
        autocomplete="current-password"
        :label="t('auth.contrasena')"
        :error="!!errores.password"
        :error-message="errores.password"
      >
        <template #append>
          <q-icon
            :name="verContrasena ? 'sym_r_visibility_off' : 'sym_r_visibility'"
            class="cursor-pointer"
            role="button"
            :aria-label="verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="verContrasena = !verContrasena"
          />
        </template>
      </q-input>

      <q-btn
        type="submit"
        color="primary"
        unelevated
        no-caps
        size="lg"
        class="full-width"
        :label="t('auth.ingresar')"
        :loading="enviando"
      />
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';

import { aApiError } from '@/core/api/errors';
import { redireccionSegura } from '@/router/guards';
import { useSessionStore } from '@/stores/session';

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
