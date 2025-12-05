<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

// Editable correct answer
const correctAnswer = ref('')

// Update local correct answer when level changes, but allow manual edits
watch(() => gameStore.currentLevelData, (newVal) => {
  if (newVal) {
    correctAnswer.value = newVal.answer
  }
}, { immediate: true })

const currentLevel = computed(() => gameStore.gameState.currentLevel)
const players = computed(() => gameStore.allPlayers)

const nextLevel = () => {
  if (confirm('¿Estás seguro de avanzar al siguiente nivel?')) {
    gameStore.setLevel(currentLevel.value + 1)
  }
}

const prevLevel = () => {
  if (currentLevel.value > 1) {
    gameStore.setLevel(currentLevel.value - 1)
  }
}

const getPlayerAnswer = (player: any) => {
  return player.answers?.[`level_${currentLevel.value}`]?.value || '-'
}

const getAnswerStatus = (player: any) => {
  const ans = getPlayerAnswer(player)
  if (ans === '-') return 'pending'
  if (!correctAnswer.value) return 'submitted'
  return ans === correctAnswer.value ? 'correct' : 'incorrect'
}

const toggleStatus = (player: any) => {
  if (player.status === 'ALIVE') {
    if (confirm(`¿Eliminar a ${player.name}?`)) {
      gameStore.eliminatePlayer(player.id)
    }
  } else {
    gameStore.revivePlayer(player.id)
  }
}

// Update local correct answer when level changes
// watch already defined above
</script>

<template>
  <div class="min-h-screen bg-black text-white font-mono p-4">
    <!-- Header Controls -->
    <header
      class="flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-900 p-4 rounded border border-gray-800">
      <div>
        <h1 class="text-2xl font-bold uppercase tracking-widest text-squid-pink">Front Man Panel</h1>
        <p class="text-gray-400 text-sm">Jugadores Activos: {{players.filter(p => p.status === 'ALIVE').length}} / {{
          players.length }}</p>
      </div>

      <div class="flex items-center gap-6 mt-4 md:mt-0">
        <div class="flex items-center gap-2">
          <button @click="prevLevel" class="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700">&lt;</button>
          <div class="text-center">
            <span class="block text-xs text-gray-500">NIVEL</span>
            <span class="text-3xl font-bold">{{ currentLevel > 8 ? 'FIN' : currentLevel }}</span>
          </div>
          <button @click="nextLevel" class="px-3 py-1 rounded font-bold"
            :class="currentLevel === 8 ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-squid-pink hover:bg-pink-600'">
            {{ currentLevel === 8 ? 'FINALIZAR JUEGO' : '&gt;' }}
          </button>
        </div>

        <!-- Lock Control -->
        <button @click="gameStore.toggleLevelLock(!gameStore.gameState.isLevelLocked)"
          class="px-4 py-2 rounded font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          :class="gameStore.gameState.isLevelLocked ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-green-600 hover:bg-green-500'">
          <span>{{ gameStore.gameState.isLevelLocked ? '🔒 BLOQUEADO' : '🔓 ABIERTO' }}</span>
        </button>

        <div class="flex flex-col">
          <label class="text-xs text-gray-500">RESPUESTA CORRECTA</label>
          <input v-model="correctAnswer" type="text"
            class="bg-black border border-gray-600 p-2 rounded text-squid-green font-bold w-48 focus:border-squid-green outline-none"
            placeholder="Set Answer" />
        </div>
      </div>

      <!-- Current Level Info -->
      <div v-if="gameStore.currentLevelData" class="mt-4 p-4 bg-gray-800 rounded border border-gray-700">
        <p class="text-xs text-squid-pink uppercase tracking-widest mb-1">Pregunta Actual</p>
        <p class="text-lg font-bold text-white">{{ gameStore.currentLevelData.question }}</p>
        <p class="text-xs text-gray-500 mt-2">Respuesta Esperada: <span class="text-squid-green">{{
          gameStore.currentLevelData.answer }}</span></p>
      </div>
    </header>

    <!-- Players Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="player in players" :key="player.id"
        class="bg-gray-900 border rounded p-4 relative overflow-hidden transition-all" :class="{
          'border-red-600 opacity-50': player.status === 'ELIMINATED',
          'border-squid-green': player.status === 'WINNER',
          'border-gray-700': player.status === 'ALIVE'
        }">
        <!-- Status Badge -->
        <div class="absolute top-2 right-2">
          <span class="text-xs px-2 py-1 rounded font-bold" :class="{
            'bg-red-900 text-red-300': player.status === 'ELIMINATED',
            'bg-green-900 text-green-300': player.status === 'WINNER',
            'bg-gray-800 text-gray-300': player.status === 'ALIVE'
          }">
            {{ player.status }}
          </span>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="text-2xl font-bold text-gray-500">{{ player.id.split('-')[1] || player.id }}</div>
          <div class="font-bold truncate">{{ player.name }}</div>
        </div>

        <!-- Current Answer -->
        <div class="mb-4">
          <div class="text-xs text-gray-500 mb-1">RESPUESTA NIVEL {{ currentLevel }}</div>
          <div class="p-3 rounded text-lg font-mono border" :class="{
            'bg-gray-800 border-gray-700 text-gray-400': getAnswerStatus(player) === 'pending',
            'bg-blue-900/30 border-blue-500 text-white': getAnswerStatus(player) === 'submitted',
            'bg-green-900/30 border-green-500 text-green-400': getAnswerStatus(player) === 'correct',
            'bg-red-900/30 border-red-500 text-red-400': getAnswerStatus(player) === 'incorrect'
          }">
            {{ getPlayerAnswer(player) }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end">
          <button @click="toggleStatus(player)"
            class="text-xs px-3 py-2 rounded font-bold uppercase tracking-wider transition-colors" :class="{
              'bg-red-600 hover:bg-red-700 text-white': player.status === 'ALIVE',
              'bg-squid-green hover:bg-green-400 text-black': player.status !== 'ALIVE'
            }">
            {{ player.status === 'ALIVE' ? 'ELIMINAR' : 'REVIVIR' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
