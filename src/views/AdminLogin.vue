<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()
const gameStore = useGameStore()

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const success = await gameStore.adminLogin(email.value, password.value)
    if (success) {
      router.push('/admin/dashboard')
    } else {
      error.value = 'Credenciales incorrectas.'
    }
  } catch (e) {
    error.value = 'Error al iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-black text-white font-mono">
    <div class="w-full max-w-md p-8 border border-gray-800 rounded bg-gray-900">
      <h1 class="text-2xl font-bold mb-6 text-center uppercase tracking-widest">Front Man Access</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-500 mb-1">Email</label>
          <input v-model="email" type="email" class="w-full bg-black border border-gray-700 p-2 text-white focus:border-white outline-none" />
        </div>
        
        <div>
          <label class="block text-sm text-gray-500 mb-1">Password</label>
          <input v-model="password" type="password" class="w-full bg-black border border-gray-700 p-2 text-white focus:border-white outline-none" />
        </div>

        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors"
        >
          {{ loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM' }}
        </button>
      </form>
    </div>
  </div>
</template>
