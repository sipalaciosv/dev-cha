<script setup lang="ts">
import { ref } from 'vue'
import { db, auth } from '../firebase'
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'

const adminEmail = ref('')
const adminPassword = ref('')
const playerCount = ref(20)
const generatedCodes = ref<string[]>([])
const loading = ref(false)
const message = ref('')

const createAdmin = async () => {
    try {
        await createUserWithEmailAndPassword(auth, adminEmail.value, adminPassword.value)
        message.value = 'Admin created successfully!'
    } catch (e: any) {
        message.value = 'Error: ' + e.message
    }
}

const generateCodes = async () => {
    loading.value = true
    const codes = []
    const batch = writeBatch(db)

    for (let i = 1; i <= playerCount.value; i++) {
        const code = `SQ-${String(i).padStart(3, '0')}`
        codes.push(code)
        const ref = doc(db, 'players', code)
        batch.set(ref, {
            name: '', // Will be filled by player
            status: 'ALIVE',
            joinedAt: null
        })
    }

    // Also init game state
    batch.set(doc(db, 'game_state', 'global'), {
        currentLevel: 1,
        isLevelActive: true
    })

    try {
        await batch.commit()
        generatedCodes.value = codes
        message.value = `Generated ${codes.length} codes!`
    } catch (e: any) {
        message.value = 'Error: ' + e.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen bg-black text-white p-8 font-mono">
        <h1 class="text-3xl text-squid-pink mb-8">GAME SETUP (SECRET)</h1>

        <div class="grid gap-8 max-w-2xl">
            <!-- Admin Creation -->
            <section class="border border-gray-700 p-6 rounded">
                <h2 class="text-xl mb-4">1. Create Admin</h2>
                <div class="flex gap-4 mb-4">
                    <input v-model="adminEmail" placeholder="Email" class="bg-gray-900 p-2 border border-gray-600" />
                    <input v-model="adminPassword" placeholder="Password" type="password"
                        class="bg-gray-900 p-2 border border-gray-600" />
                </div>
                <button @click="createAdmin" class="bg-squid-pink px-4 py-2 rounded font-bold">Create Admin</button>
            </section>

            <!-- Code Generation -->
            <section class="border border-gray-700 p-6 rounded">
                <h2 class="text-xl mb-4">2. Generate Player Codes</h2>
                <div class="flex gap-4 mb-4 items-center">
                    <label>How many players?</label>
                    <input v-model="playerCount" type="number" class="bg-gray-900 p-2 border border-gray-600 w-20" />
                </div>
                <button @click="generateCodes" :disabled="loading"
                    class="bg-squid-green text-black px-4 py-2 rounded font-bold">
                    {{ loading ? 'Generating...' : 'Generate Codes & Init Game' }}
                </button>

                <div v-if="generatedCodes.length" class="mt-4 p-4 bg-gray-900 rounded h-64 overflow-auto">
                    <p class="mb-2 text-gray-400">Copy these codes:</p>
                    <div class="grid grid-cols-4 gap-2">
                        <div v-for="code in generatedCodes" :key="code" class="text-sm">{{ code }}</div>
                    </div>
                </div>
            </section>

            <div v-if="message" class="p-4 bg-blue-900 text-blue-200 rounded">
                {{ message }}
            </div>
        </div>
    </div>
</template>
