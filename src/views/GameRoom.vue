<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()
const answer = ref('')
const submitting = ref(false)
const showWinnerContent = ref(false)
const showSuspense = ref(false)

// Audio refs
const heartbeatAudio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_787553f930.mp3') // Heartbeat sound
const victoryAudio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3') // Epic cinematic hit

onMounted(() => {
  if (!gameStore.player) {
    router.push('/')
  }
})

const currentLevel = computed(() => gameStore.gameState.currentLevel)
const isLevelLocked = computed(() => gameStore.gameState.isLevelLocked)
const playerStatus = computed(() => gameStore.player?.status || 'ALIVE')
const hasAnswered = computed(() => {
  const answers = gameStore.player?.answers || {}
  return !!answers[`level_${currentLevel.value}`]
})

const isWinner = computed(() => playerStatus.value === 'WINNER' || (currentLevel.value > 8 && playerStatus.value === 'ALIVE'))

// Watch for winner state to trigger suspense
watch(isWinner, (newVal) => {
  if (newVal) {
    triggerSuspenseSequence()
  }
})

const triggerSuspenseSequence = () => {
  showSuspense.value = true
  heartbeatAudio.loop = true
  heartbeatAudio.play().catch(e => console.log("Audio play failed", e))

  setTimeout(() => {
    heartbeatAudio.pause()
    victoryAudio.play().catch(e => console.log("Audio play failed", e))
    showSuspense.value = false
    showWinnerContent.value = true
  }, 4000) // 4 seconds of suspense
}

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

    <!-- SUSPENSE SCREEN -->
    <div v-if="showSuspense" class="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center">
      <div class="w-32 h-32 bg-red-600 rounded-full animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.8)]"></div>
      <p class="mt-8 text-gray-500 tracking-[1em] text-xs animate-pulse">VERIFICANDO...</p>
    </div>

    <!-- WINNER SCREEN -->
    <div v-if="showWinnerContent"
      class="absolute inset-0 z-50 bg-squid-green flex flex-col items-center justify-center text-black overflow-hidden">
      <!-- Money Rain -->
      <div class="money-rain absolute inset-0 pointer-events-none">
        <div v-for="n in 50" :key="n" class="bill" :style="{
          left: Math.random() * 100 + '%',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: (Math.random() * 2 + 3) + 's'
        }">
          💵
        </div>
      </div>

      <div class="z-10 text-center animate-scale-in">
        <h1
          class="text-6xl md:text-9xl font-black tracking-tighter mb-4 text-center uppercase drop-shadow-2xl text-white stroke-black">
          ¡GANASTE!</h1>
        <div class="text-9xl animate-bounce mt-8">🐖</div>
        <p
          class="mt-8 text-2xl md:text-4xl uppercase tracking-widest font-bold bg-black text-squid-pink px-6 py-2 inline-block rounded">
          Jugador {{ gameStore.player?.id?.split('-')[1] }}</p>
        <p class="mt-6 text-xl font-bold">45.6 MIL MILLONES DE WON</p>
      </div>
    </div>

    <!-- TIME'S UP SCREEN -->
    <div v-else-if="isLevelLocked && !hasAnswered"
      class="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
      <div class="text-9xl mb-8 animate-pulse">⏳</div>
      <h1 class="text-6xl font-black tracking-tighter mb-4 text-red-600 uppercase">TIEMPO AGOTADO</h1>
      <p class="text-2xl text-gray-400 uppercase tracking-widest text-center max-w-lg px-4">
        No enviaste tu respuesta a tiempo.
      </p>
      <div class="mt-12 p-4 border border-red-900 bg-red-900/20 rounded">
        <p class="text-red-500 text-sm">ESPERA INSTRUCCIONES</p>
      </div>
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
            <div class="mb-6 p-4 bg-gray-800 rounded border border-gray-600">
              <h3 class="text-xs text-squid-pink uppercase tracking-widest mb-2 font-bold">Consigna</h3>
              <p class="text-xl text-white font-bold leading-relaxed">
                {{ gameStore.currentLevelData.question }}
              </p>
            </div>

            <label class="block text-sm text-squid-pink mb-4 uppercase tracking-widest font-bold">
              Ingresa tu respuesta
            </label>

            <textarea v-model="answer" rows="4"
              class="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-white text-lg focus:border-squid-pink focus:ring-1 focus:ring-squid-pink focus:outline-none transition-all mb-6 font-mono"
              placeholder=""></textarea>

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

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.bill {
  position: absolute;
  top: -50px;
  font-size: 40px;
  animation: fall linear infinite;
  opacity: 0.8;
}

@keyframes fall {
  0% {
    transform: translateY(-50px) rotate(0deg);
  }

  100% {
    transform: translateY(110vh) rotate(360deg);
  }
}
</style>
