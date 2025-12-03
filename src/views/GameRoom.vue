<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()
const answer = ref('')
const submitting = ref(false)

onMounted(() => {
  if (!gameStore.player) {
    router.push('/')
  }
})

const currentLevel = computed(() => gameStore.gameState.currentLevel)
const playerStatus = computed(() => gameStore.player?.status || 'ALIVE')
const hasAnswered = computed(() => {
  const answers = gameStore.player?.answers || {}
  return !!answers[`level_${currentLevel.value}`]
})

const handleSubmit = async () => {
  if (!answer.value) return
  submitting.value = true
  try {
    await gameStore.submitAnswer(currentLevel.value, answer.value)
    answer.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-squid-dark text-white font-mono relative overflow-hidden">

    <!-- ELIMINATED SCREEN -->
    <div v-if="playerStatus === 'ELIMINATED'"
      class="absolute inset-0 z-50 bg-red-600 flex flex-col items-center justify-center">
      <h1 class="text-6xl font-black tracking-tighter mb-4">ELIMINADO</h1>
      <div class="text-9xl">💀</div>
      <p class="mt-8 text-2xl uppercase tracking-widest">Jugador {{ gameStore.player?.id }}</p>
    </div>

    <!-- WINNER SCREEN -->
    <div v-if="playerStatus === 'WINNER' || (currentLevel > 8 && playerStatus === 'ALIVE')"
      class="absolute inset-0 z-50 bg-squid-green flex flex-col items-center justify-center text-black overflow-hidden">
      <!-- Falling Money Animation (CSS only for simplicity) -->
      <div class="absolute inset-0 opacity-20 pointer-events-none"
        style="background-image: url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22black%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z%22/%3E%3C/svg%3E'); background-size: 100px;">
      </div>

      <h1 class="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-center uppercase drop-shadow-lg">¡GANASTE!
      </h1>
      <div class="text-9xl animate-bounce">🐖💰</div>
      <p class="mt-8 text-2xl md:text-4xl uppercase tracking-widest font-bold">Jugador {{
        gameStore.player?.id?.split('-')[1] }}</p>
      <p class="mt-4 text-xl">Has sobrevivido a los 8 niveles.</p>
    </div>

    <!-- GAME UI -->
    <div v-else class="container mx-auto px-4 py-8 flex flex-col min-h-screen">
      <!-- Header -->
      <header class="flex justify-between items-center mb-12 border-b border-gray-800 pb-4">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-full border-2 border-squid-pink flex items-center justify-center text-squid-pink font-bold">
            {{ gameStore.player?.id?.split('-')[1] || '000' }}
          </div>
          <div>
            <h2 class="text-xl font-bold">{{ gameStore.player?.name }}</h2>
            <span class="text-xs text-squid-green tracking-widest">JUGADOR ACTIVO</span>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-400">NIVEL ACTUAL</p>
          <p class="text-4xl font-bold text-squid-pink">{{ currentLevel }}</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">

        <!-- Waiting State -->
        <div v-if="hasAnswered" class="text-center animate-fade-in">
          <div class="w-24 h-24 border-4 border-squid-green rounded-full flex items-center justify-center mx-auto mb-8">
            <svg class="w-12 h-12 text-squid-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold mb-4">Respuesta Enviada</h2>
          <p class="text-gray-400 text-lg">Espera instrucciones del Front Man.</p>
          <div class="mt-12 flex justify-center gap-2">
            <div class="w-3 h-3 bg-squid-pink rounded-full animate-bounce"></div>
            <div class="w-3 h-3 bg-squid-pink rounded-full animate-bounce delay-100"></div>
            <div class="w-3 h-3 bg-squid-pink rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        <!-- Input State -->
        <div v-else class="w-full animate-slide-up">
          <div class="bg-squid-card p-8 rounded-xl border border-gray-700 shadow-2xl">
            <label class="block text-sm text-squid-pink mb-4 uppercase tracking-widest font-bold">
              Ingresa tu respuesta
            </label>

            <textarea v-model="answer" rows="4"
              class="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-white text-lg focus:border-squid-pink focus:ring-1 focus:ring-squid-pink focus:outline-none transition-all mb-6 font-mono"
              placeholder="SELECT * FROM..."></textarea>

            <button @click="handleSubmit" :disabled="!answer || submitting"
              class="w-full bg-squid-pink hover:bg-pink-600 text-white font-bold py-4 rounded transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <span v-if="submitting">ENVIANDO...</span>
              <span v-else>ENVIAR RESPUESTA</span>
            </button>

            <p class="mt-4 text-xs text-center text-gray-500">
              ⚠️ Tienes solo una oportunidad. Verifica tu respuesta.
            </p>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
