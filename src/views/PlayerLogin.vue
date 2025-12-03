<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const name = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()
const gameStore = useGameStore()

const handleLogin = async () => {
  if (!name.value || !code.value) {
    error.value = 'Por favor ingresa tu nombre y código.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const success = await gameStore.login(name.value, code.value)
    if (success) {
      router.push('/game')
    } else {
      error.value = 'Código inválido o error de conexión.'
    }
  } catch (e) {
    error.value = 'Ocurrió un error inesperado.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-squid-dark text-white font-mono p-4">
    <!-- Shapes Decoration -->
    <div class="flex gap-8 mb-12 opacity-80">
      <div class="w-16 h-16 border-4 border-white rounded-full"></div>
      <div class="w-16 h-16 border-4 border-white transform rotate-45"></div> <!-- Triangle approx -->
      <div class="w-16 h-16 border-4 border-white"></div>
    </div>

    <div class="w-full max-w-md bg-squid-card p-8 rounded-xl shadow-2xl border border-gray-800">
      <h1 class="text-3xl font-bold text-center mb-8 tracking-widest text-squid-pink uppercase">
        Jugador
      </h1>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm text-gray-400 mb-2">Nombre</label>
          <input 
            v-model="name"
            type="text" 
            class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-squid-pink focus:outline-none transition-colors"
            placeholder="Tu Nombre"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">Código de Acceso</label>
          <input 
            v-model="code"
            type="text" 
            class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-squid-pink focus:outline-none transition-colors uppercase"
            placeholder="SQ-000"
          />
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-squid-pink hover:bg-pink-600 text-white font-bold py-4 rounded transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Verificando...</span>
          <span v-else>INGRESAR</span>
        </button>
      </form>
    </div>
  </div>
</template>
