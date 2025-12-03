import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, auth } from '../firebase'
import { doc, setDoc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

export const useGameStore = defineStore('game', () => {
    const player = ref<any>(null)
    const allPlayers = ref<any[]>([])
    const isAdmin = ref(false)
    const gameState = ref({
        currentLevel: 1,
        isLevelActive: true
    })

    let playerUnsubscribe: (() => void) | null = null
    let gameUnsubscribe: (() => void) | null = null
    let allPlayersUnsubscribe: (() => void) | null = null

    // Actions
    const login = async (name: string, code: string): Promise<boolean> => {
        try {
            const codeUpper = code.toUpperCase()
            const playerRef = doc(db, 'players', codeUpper)

            // Check if code exists
            const playerDoc = await getDoc(playerRef)
            if (!playerDoc.exists()) {
                return false
            }

            // Update player with name and join time
            await updateDoc(playerRef, {
                name,
                status: 'ALIVE',
                joinedAt: serverTimestamp()
            })

            // Start Listeners
            if (playerUnsubscribe) playerUnsubscribe()
            playerUnsubscribe = onSnapshot(playerRef, (doc) => {
                player.value = { id: doc.id, ...doc.data() }
            })

            subscribeToGameState()
            return true
        } catch (e) {
            console.error("Login error:", e)
            return false
        }
    }

    const adminLogin = async (email: string, pass: string): Promise<boolean> => {
        try {
            await signInWithEmailAndPassword(auth, email, pass)
            isAdmin.value = true
            subscribeToGameState()
            subscribeToAllPlayers()
            return true
        } catch (e) {
            console.error("Admin Login Error", e)
            return false
        }
    }

    const subscribeToGameState = () => {
        if (gameUnsubscribe) return
        gameUnsubscribe = onSnapshot(doc(db, 'game_state', 'global'), (doc) => {
            if (doc.exists()) {
                gameState.value = doc.data() as any
            }
        })
    }

    const subscribeToAllPlayers = () => {
        if (allPlayersUnsubscribe) return
        const playersRef = collection(db, 'players')
        allPlayersUnsubscribe = onSnapshot(playersRef, (snapshot) => {
            allPlayers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        })
    }

    const submitAnswer = async (level: number, answer: string) => {
        if (!player.value) return
        try {
            const playerRef = doc(db, 'players', player.value.id)
            await updateDoc(playerRef, {
                [`answers.level_${level}`]: {
                    value: answer,
                    timestamp: serverTimestamp()
                }
            })
        } catch (e) {
            console.error("Submit error:", e)
            throw e
        }
    }

    const setLevel = async (level: number) => {
        try {
            await setDoc(doc(db, 'game_state', 'global'), {
                currentLevel: level,
                isLevelActive: true
            }, { merge: true })
        } catch (e) {
            console.error("Set Level Error", e)
        }
    }

    const eliminatePlayer = async (playerId: string) => {
        try {
            await updateDoc(doc(db, 'players', playerId), {
                status: 'ELIMINATED'
            })
        } catch (e) {
            console.error("Eliminate Error", e)
        }
    }

    const revivePlayer = async (playerId: string) => {
        try {
            await updateDoc(doc(db, 'players', playerId), {
                status: 'ALIVE'
            })
        } catch (e) {
            console.error("Revive Error", e)
        }
    }

    return {
        player,
        allPlayers,
        isAdmin,
        gameState,
        login,
        adminLogin,
        submitAnswer,
        setLevel,
        eliminatePlayer,
        revivePlayer
    }
})
