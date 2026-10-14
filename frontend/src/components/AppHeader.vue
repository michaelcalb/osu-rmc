<template>
    <header class="header">
        <div class="h-content">
            <nav class="h-group">
                <RouterLink to="/" class="rmc-logo"
                    ><img
                        src="../assets/rmc-logo.png"
                        alt="osu!rmc"
                        :height="48"
                /></RouterLink>

                <AppPopover>
                    <template #trigger>
                        <RouterLink
                            to="/boards/no_mod"
                            class="option nav-option"
                        >
                            <Trophy :size="ICON_SIZE" class="nav-icon" />
                            <span class="h-text">leaderboards</span>
                        </RouterLink>
                    </template>

                    <RouterLink
                        to="/boards/no_mod"
                        class="option popover-option"
                    >
                        <span class="popover-text">no mod</span>
                    </RouterLink>

                    <RouterLink
                        to="/boards/free_mod"
                        class="option popover-option"
                    >
                        <span class="popover-text">free mod</span>
                    </RouterLink>
                </AppPopover>

                <RouterLink to="/help" class="option nav-option">
                    <CircleQuestionMark :size="ICON_SIZE" class="nav-icon" />
                    <span class="h-text">how to play</span>
                </RouterLink>
            </nav>

            <section class="h-group">
                <RouterLink
                    to="/run"
                    :class="`start-run ${!user ? 'login-blocked' : null}`"
                >
                    <div v-if="!user" class="option login-blocked-msg">
                        <LogIn :size="ICON_SIZE" />
                    </div>
                    <span class="h-text">
                        <span
                            v-for="(char, i) in [...'play']"
                            :key="i"
                            class="char"
                            :style="{ '--i': i }"
                        >
                            {{ char === ' ' ? '&nbsp;' : char }}
                        </span>
                    </span>
                </RouterLink>

                <LoaderCircle v-if="loading" class="loading" :size="48" />

                <AppPopover v-else-if="user">
                    <template #trigger>
                        <RouterLink class="pfp-box" :to="`/users/${user.id}`">
                            <img
                                :src="`https://a.ppy.sh/${user.id}`"
                                :alt="user.username"
                                class="pfp"
                            />
                        </RouterLink>
                    </template>

                    <RouterLink
                        :to="`/users/${user.id}`"
                        class="option popover-option"
                    >
                        <UserRound :size="ICON_SIZE" />
                        <span class="popover-text">profile</span>
                    </RouterLink>

                    <button class="option popover-option">
                        <Asterisk :size="ICON_SIZE" />
                        <span class="popover-text">useless option</span>
                    </button>

                    <button
                        @click="signOut"
                        class="option popover-option logout"
                    >
                        <LogOut :size="ICON_SIZE" />
                        <span class="popover-text">logout</span>
                    </button>
                </AppPopover>

                <button v-else @click="login" class="option login">
                    <div class="pfp-box">
                        <LogIn :size="ICON_SIZE * 1.2" class="login-icon" />
                        <img
                            src="https://osu.ppy.sh/images/layout/avatar-guest.png"
                            alt="guest avatar"
                            class="pfp"
                        />
                    </div>
                </button>
            </section>
        </div>
    </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useSession } from '../composables/useSession'
import AppPopover from './AppPopover.vue'
import {
    Asterisk,
    CircleQuestionMark,
    LoaderCircle,
    LogIn,
    LogOut,
    Trophy,
    UserRound
} from '@lucide/vue'

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
    padding: 0 var(--default-spacing);
    background-color: var(--h-bg);
    height: var(--h-height);
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(
            to right,
            var(--h-bg),
            var(--surface),
            var(--h-bg)
        )
        1;
    position: sticky;
    top: 0;
    z-index: 1;
}

.h-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    max-width: var(--content-max-width);
}

.h-group {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.rmc-logo,
.nav-icon {
    transition: 0.2s;
}

.rmc-logo:hover {
    transform: scale(1.05);
}

.option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.nav-option:hover .nav-icon {
    transform: scale(1.1) rotate(-2deg);
}

.h-text {
    font-size: 1.25rem;
}

.popover-option > span {
    transition: transform 0.3s;
}

.popover-option:hover > span {
    transform: translateX(10px);
}

.popover-text {
    font-size: 1rem;
}

.start-run,
.start-run * {
    transition: 0.2s;
}

.start-run {
    padding: 0.5rem 1rem;
    background-color: var(--accent-2);
    corner-shape: squircle;
    border-radius: 1rem;
    transition: 0.2s;
}

.char {
    display: inline-block;
    animation-fill-mode: backwards;
}

.start-run:not(.login-blocked):hover {
    background-color: var(--accent);
}

.start-run:not(.login-blocked):hover .char {
    animation: hop 0.4s;
    animation-delay: calc(var(--i) * 0.02s);
}

.login-blocked {
    position: relative;
}

.login-blocked-msg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    z-index: 1;
}

.login-blocked:hover > span {
    opacity: 0;
}

.login-blocked:hover .login-blocked-msg {
    opacity: 1;
}

.logout {
    color: var(--danger);
}

.logout:hover {
    background-color: rgb(from var(--danger) r g b / 25%);
}

.login-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    opacity: 0;
    transition: 0.2s;
}

.login:hover .login-icon {
    opacity: 1;
    color: var(--accent);
}

.login:hover .pfp {
    filter: blur(1px);
}

.loading {
    animation: spin 1s infinite;
}

.pfp {
    height: 48px;
}

@keyframes hop {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-2px);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
