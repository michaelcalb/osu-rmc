<template>
    <footer class="footer">
        <div class="f-content">
            <span class="version">
                v{{ version }}
            </span>
            <span class="f-text">made with <abbr title="love, passion &amp; coffee" class="ily">&#9825;</abbr> by <a href="http://michas.dev" target="_blank" rel="noopener noreferrer" class="michas">michas</a></span>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { version } from '../../package.json'
</script>

<style scoped>
.footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--content-padding);
    color: var(--text-muted-2);
}

.f-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    max-width: var(--content-max-width);
}

.ily {
    text-align: center;
    display: inline-block;
    color: var(--accent);
}

.michas {
    transition: .2s;
}

.michas:hover {
    color: var(--accent);
}

.version {
    opacity: .273;
}
</style>