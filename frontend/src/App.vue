
<template>
    <header>
        <RouterLink to="/">osu!rmc</RouterLink>

        <nav>
            <span v-if="loading">loading user...</span>
            <template v-else-if="user">
                <span>{{ user.username }}</span>
                <button @click="signOut">logout</button>
            </template>
            <button v-else @click="login">login with osu!</button>
        </nav>
    </header>

    <main>
        <RouterView />
    </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useSession } from './composables/useSession';

const router = useRouter()
const { user, loading, login, logout } = useSession()

async function signOut() {
    await logout()
    await router.push({ name: 'home' })
}
</script>
