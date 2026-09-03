import { createRouter, createWebHistory } from "vue-router";
import { useSession } from "./composables/useSession";

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
            component: () => import ('./views/HomeView.vue')
        },
        {
            path: '/run',
            name: 'run',
            component: () => import ('./views/RunView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/run/:id/result',
            name: 'result',
            component: () => import ('./views/ResultView.vue'),
            meta: { requiresAuth: true },
            props: true
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
    ]
})

router.beforeEach(async (to) => {
    if (!to.meta.requiresAuth) {
        return true
    }

    const { user, ready } = useSession()

    await ready

    return user.value ? true : { name: 'home' }
})

export default router