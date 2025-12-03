import { createRouter, createWebHistory } from 'vue-router'
import PlayerLogin from '../views/PlayerLogin.vue'
import GameRoom from '../views/GameRoom.vue'
import AdminLogin from '../views/AdminLogin.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'player-login',
            component: PlayerLogin
        },
        {
            path: '/game',
            name: 'game-room',
            component: GameRoom
        },
        {
            path: '/admin',
            name: 'admin-login',
            component: AdminLogin
        },
        {
            path: '/admin/dashboard',
            name: 'admin-dashboard',
            component: AdminDashboard
        },
        {
            path: '/setup',
            name: 'setup-game',
            component: () => import('../views/SetupGame.vue')
        }
    ]
})

export default router
