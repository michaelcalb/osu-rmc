<template>
    <p>this run was abandoned and will be deleted within the hour.</p>
    <p>{{ message }}</p>
</template>

<script setup lang="ts">
// i swear i will add more
const MESSAGES = [
    "it will exit this earth's atomosphere soon.",
    "it's time to say goodbye."
]

const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
</script>
