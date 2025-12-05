import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '../firebase'
import { doc, setDoc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

export const useGameStore = defineStore('game', () => {
    const player = ref<any>(null)
    const allPlayers = ref<any[]>([])
    const isAdmin = ref(false)
    const gameState = ref({
        currentLevel: 1,
        isLevelActive: true,
        isLevelLocked: false
    })

    const levels = [
        { id: 1, question: 'Listar todos los juegos ordenados alfabeticamente (de A a Z). RESPONDER "DIFICULTAD" DE LA FILA 6', answer: 'baja' },
        { id: 2, question: 'Listar todos los jugadores entre 30 y 50 años, ordenados por orden de registro descendente. RESPONDER "EDAD" DE LA FILA 5', answer: '32' },
        { id: 3, question: 'Alianzas que se formaron el día 18 de enero del 2024 y no se han disuelto. RESPONDER "NOMBRE_ALIANZA" DE LA FILA 1', answer: 'familia primero' },
        { id: 4, question: 'El vicio que más se repite entre los jugadores. RESPONDER "VICIO" DE LA FILA 1', answer: 'Procastinar' },
        { id: 5, question: 'Total de pagos realizados por cada uno de los jugadores, indicando su acreedor, ordenado por el total pagado de mayor a menor. RESPONDER "ACREEDOR" DE LA FILA 1', answer: 'Prestamistas Colombianos' },
        { id: 6, question: 'Jugadores que sobrevivieron al tercer juego, ordenado por puntaje de desempeño de mayor a menor. RESPONDER "APELLIDO" DE LA FILA 3', answer: 'Silva' },
        { id: 7, question: 'Jugadores vivos con alianzas activas y deuda mayor al promedio. RESPONDER "NOMBRE_ALIANZA" DE LA FILA 2', answer: 'Alianza del norte' },
        { id: 8, question: 'Listado de participaciones con su respectivo estado (favorable o desfavorable) agrupados por vicio detallando: total de participaciones, total de supervivencias, total de eliminaciones y si el vicio tuvo un rendimiento favorable o desfavorable (supervivencia mayor a eliminaciones es un rendimiento favorable, supervivencia menor a eliminaciones es un rendimiento desfavorable); RESPONDER "VICIO" Y "BALANCE" DE LA FILA 4', answer: 'Impulsivo y Favorable' },
    ]

    const currentLevelData = computed(() => {
        return levels.find(l => l.id === gameState.value.currentLevel) || { question: 'Esperando...', answer: '' }
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

            // Manually set player state immediately to avoid race condition
            player.value = {
                id: codeUpper,
                name,
                status: 'ALIVE',
                joinedAt: new Date(), // Temporary, will be overwritten by snapshot
                ...playerDoc.data()
            }

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
                gameState.value = {
                    currentLevel: 1,
                    isLevelActive: true,
                    isLevelLocked: false,
                    ...doc.data()
                } as any
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
                isLevelActive: true,
                isLevelLocked: false
            }, { merge: true })
        } catch (e) {
            console.error("Set Level Error", e)
        }
    }

    const toggleLevelLock = async (locked: boolean) => {
        try {
            await updateDoc(doc(db, 'game_state', 'global'), {
                isLevelLocked: locked
            })
        } catch (e) {
            console.error("Toggle Lock Error", e)
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
        revivePlayer,
        toggleLevelLock,
        levels,
        currentLevelData
    }
})
