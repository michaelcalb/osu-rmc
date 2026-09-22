import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from './composables/useSession'

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean
    }
}

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('./views/HomeView.vue')
        },
        {
            path: '/help',
            name: 'help',
            component: () => import('./views/HelpView.vue')
        },
        {
            path: '/run',
            name: 'run',
            component: () => import('./views/RunView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/boards/:board',
            name: 'board',
            component: () => import('./views/BoardView.vue')
        },
        {
            path: '/runs/:id',
            name: 'run-detail',
            component: () => import('./views/RunDetailView.vue'),
            props: true
        },
        {
            path: '/users/:id',
            name: 'profile',
            component: () => import('./views/ProfileView.vue'),
            props: true
        }
    ],
    scrollBehavior(to) {
        if (to.hash) {
            const offset = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop) || 0

            return { el: to.hash, top: offset }
        }

        return { top: 0 }
    }
})

router.beforeEach(async (to) => {
    if (!to.meta.requiresAuth) {
        return true
    }

    const { user, ready, login } = useSession()

    await ready

    if (user.value) {
        return true
    }

    login()

    return false
})

export default router
