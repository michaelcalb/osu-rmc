<template>
    <header class="header">
        <div class="h-content">
            <nav class="nav">
                <RouterLink to="/" class="rmc-logo"><img src="../assets/rmc-text.png" alt="osu!rmc" :height="ICON_SIZE"></RouterLink>
            
                <AppPopover>
                    <template #trigger>
                        <RouterLink to="/boards/no_mod" class="option">
                            <Trophy :size="ICON_SIZE" />
                            <span class="h-text">leaderboards</span>
                        </RouterLink>
                    </template>
                    <RouterLink to="/boards/no_mod" class="option popover-option">
                        <span class="popover-text">no mod</span>
                    </RouterLink>
                    <RouterLink to="/boards/free_mod" class="option popover-option">
                        <span class="popover-text">free mod</span>
                    </RouterLink>
                </AppPopover>
            
                <RouterLink to="/help" class="option">
                    <CircleQuestionMark :size="ICON_SIZE" />
                    <span class="h-text">how to play</span>
                </RouterLink>
            </nav>
            <LoaderCircle v-if="loading" class="loading" :size="32" />
            <AppPopover v-else-if="user">
                <template #trigger>
                    <RouterLink :to="`/users/${user.id}`">
                        <img :src="`https://a.ppy.sh/${user.id}`" :alt="user.username" width="48" height="48" class="user-pfp" />
                    </RouterLink>
                </template>
            
                <RouterLink :to="`/users/${user.id}`" class="option popover-option">
                    <UserRound :size="ICON_SIZE" />
                    <span class="popover-text">profile</span>
                </RouterLink>
                <button @click="signOut" class="raw-btn option popover-option logout">
                    <LogOut :size="ICON_SIZE" />
                    <span class="popover-text">logout</span>
                </button>
            </AppPopover>
            <button v-else @click="login" class="raw-btn option login">
                <LogIn :size="ICON_SIZE" />
                <span class="h-text">login</span>
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useSession } from '../composables/useSession'
import AppPopover from './AppPopover.vue'
import { CircleQuestionMark, LoaderCircle, LogIn, LogOut, Trophy, UserRound } from '@lucide/vue'

const router = useRouter()
const { user, loading, login, logout } = useSession()

const ICON_SIZE = 20

async function signOut() {
    await logout()
    await router.push({ name: 'home' })
}
</script>

<style scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--h-bg);
    padding: 0 5%;
    height: 75px;
}

.h-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    max-width: 1200px;
}

.h-content > :last-child {
    justify-self: end;
}

.nav {
    justify-self: center;
    display: flex;
    align-items: center;
    gap: 2rem;
}

.rmc-logo {
    justify-self: start;
    transition: .2s;
}

.rmc-logo:hover {
    transform: scale(1.05) rotate(-0.5deg);
}

.option {
    display: flex;
    align-items: center;
    gap: .5rem;
}

.h-text {
    font-size: 1.25rem;
}

.popover-option > span {
    transition: transform .3s;
}

.popover-option:hover > span {
    transform: translateX(10px);
}

.popover-text {
    font-size: 1rem;
}

.user-pfp {
    corner-shape: squircle;
    border-radius: 1rem;
    transition: .3s;
}

.logout {
    color: var(--danger);
}

.logout:hover {
    background-color: rgb(from var(--danger) r g b / 25%);
}

.login {
    transition: .2s;
}

.login:hover {
    color: var(--accent);
}

.loading {
    animation: spin 1s infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>