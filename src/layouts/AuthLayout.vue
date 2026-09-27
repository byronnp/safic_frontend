<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="auth">
        <!-- Panel de marca (mockup Login): se oculta en pantallas pequeñas -->
        <aside class="auth__marca gt-sm">
          <div class="row items-center no-wrap" style="gap: 12px">
            <div class="auth__logo">S</div>
            <div>
              <div class="auth__nombre">SAFIC</div>
              <div class="auth__descripcion">{{ t('app.descripcion') }}</div>
            </div>
          </div>

          <div class="col-grow" />

          <h1 class="auth__lema">Las finanzas de tu condominio, claras y al día.</h1>
          <p class="auth__texto">
            Cuotas, pagos por transferencia, conciliación bancaria y reportes para cada condominio,
            con acceso para administradores, residentes y guardias.
          </p>
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

          <svg
            class="auth__edificios"
            width="420"
            height="420"
            viewBox="0 0 420 420"
            fill="none"
            stroke="#1E4A48"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="60" y="120" width="110" height="260" />
            <rect x="190" y="60" width="130" height="320" />
            <rect x="340" y="180" width="70" height="200" />
            <path
              d="M80 150h70M80 190h70M80 230h70M80 270h70M210 100h90M210 140h90M210 180h90M210 220h90M210 260h90"
            />
          </svg>
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

.auth__marca {
  width: 620px;
  flex-shrink: 0;
  background: var(--safic-tinta);
  color: #e8f0ee;
  padding: 56px 64px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
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
}

.auth__descripcion {
  font-size: 12px;
  color: #b9cdc9;
  font-weight: 600;
}

.auth__lema {
  margin: 0;
  font-size: 46px;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -1px;
  color: #ffffff;
}

.auth__texto {
  margin: 20px 0 0 0;
  font-size: 17px;
  line-height: 1.55;
  color: #b9cdc9;
  max-width: 440px;
}

.auth__rasgos {
  display: flex;
  gap: 28px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.auth__rasgo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #d6e3e0;
}

.auth__rasgo .q-icon {
  color: var(--q-accent);
}

.auth__edificios {
  position: absolute;
  right: -120px;
  top: -90px;
  pointer-events: none;
}

.auth__contenido {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.auth__columna {
  width: 440px;
  max-width: 100%;
}
</style>
