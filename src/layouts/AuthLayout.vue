<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="auth">
        <!-- Panel de marca (mockup Login): foto del condominio con el lema encima.
             Se oculta en pantallas pequeñas; la foto es un fondo CSS para que el
             celular no la descargue. -->
        <aside class="auth__marca gt-sm">
          <div
            class="auth__foto"
            role="img"
            aria-label="Conjunto residencial con edificios, áreas verdes, juegos infantiles y el letrero de bienvenida del condominio"
          />
          <div class="auth__velo auth__velo--arriba" />
          <div class="auth__velo auth__velo--abajo" />

          <div class="row items-center no-wrap" style="gap: 12px">
            <div class="auth__logo">S</div>
            <div>
              <div class="auth__nombre">SAFIC</div>
              <div class="auth__descripcion">{{ t('app.descripcion') }}</div>
            </div>
          </div>

          <h1 class="auth__lema">Las finanzas de tu condominio, claras y al día.</h1>
          <p class="auth__texto">
            Cuotas, pagos por transferencia, conciliación bancaria y reportes para cada condominio,
            con acceso para administradores, residentes y guardias.
          </p>
          <div class="auth__espacio" />
          <div class="auth__rasgos">
            <div class="auth__rasgo">
              <q-icon name="sym_r_shield" size="20px" />
              Datos aislados por condominio
            </div>
            <div class="auth__rasgo">
              <q-icon name="sym_r_smartphone" size="20px" />
              Web y app móvil
            </div>
          </div>
        </aside>

        <main class="auth__contenido">
          <div class="auth__columna">
            <!-- Marca compacta en celular -->
            <div class="row items-center no-wrap lt-md q-mb-lg" style="gap: 10px">
              <div class="safic-logo">S</div>
              <div class="text-weight-bold" style="font-size: 18px">SAFIC</div>
            </div>
            <router-view />
          </div>
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.auth {
  display: flex;
  min-height: 100vh;
  background: var(--safic-fondo);
}

/* Mockup Login: 70 % foto y lema, 30 % formulario (el formulario nunca baja de 400px). */
.auth__marca {
  flex: 1 1 auto;
  min-width: 0;
  background: var(--safic-tinta);
  color: #e8f0ee;
  padding: 56px 88px 44px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

/* La foto y los velos quedan detrás del texto (z-index negativo dentro de .auth__marca). */
.auth__foto,
.auth__velo {
  position: absolute;
  z-index: -1;
  pointer-events: none;
}

.auth__foto {
  inset: 0;
  background: url('../assets/login-condominio.jpg') 35% 50% / cover no-repeat;
}

/* Velos con la tinta fija de SAFIC (no el primario del condominio): el texto blanco
   siempre cumple el contraste sobre la foto. */
.auth__velo--arriba {
  top: 0;
  left: 0;
  right: 0;
  height: 62%;
  background: linear-gradient(
    180deg,
    rgb(18 48 47 / 94%) 0%,
    rgb(18 48 47 / 82%) 45%,
    rgb(18 48 47 / 0%) 100%
  );
}

.auth__velo--abajo {
  left: 0;
  right: 0;
  bottom: 0;
  height: 150px;
  background: linear-gradient(0deg, rgb(18 48 47 / 88%) 0%, rgb(18 48 47 / 0%) 100%);
}

.auth__espacio {
  flex-grow: 1;
}

.auth__logo {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: var(--q-accent);
  color: var(--safic-tinta);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
}

.auth__nombre {
  font-weight: 800;
  font-size: 22px;
  letter-spacing: 1px;
  color: #ffffff;
}

.auth__descripcion {
  font-size: 12px;
  color: #d6e3e0;
  font-weight: 600;
}

.auth__lema {
  margin: 48px 0 0 0;
  max-width: 640px;
  font-size: 48px;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -1px;
  color: #ffffff;
}

.auth__texto {
  margin: 18px 0 0 0;
  font-size: 17px;
  line-height: 1.55;
  color: #e1ebe9;
  max-width: 540px;
}

.auth__rasgos {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}

.auth__rasgo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.auth__rasgo .q-icon {
  color: var(--q-accent);
}

.auth__contenido {
  flex: 0 0 max(30%, 400px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 36px;
  box-sizing: border-box;
}

.auth__columna {
  width: 100%;
  max-width: 360px;
}

/* Celular y tablet: sin panel de marca, el formulario ocupa todo el ancho. */
@media (max-width: 1023px) {
  .auth__contenido {
    flex: 1 1 auto;
    padding: 32px 16px;
  }
}
</style>
