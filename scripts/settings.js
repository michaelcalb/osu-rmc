const warningText = document.getElementById('warning-text')
const SettingsAlert = document.getElementById('settings-alert')

// title-bar
const closeSettings = document.getElementById('close-settings')

// nav
const navSetup = document.getElementById('nav-setup')
const navSettings = document.getElementById('nav-settings')

// pages
const setupContent = document.getElementById('setup-content')
const settingsContent = document.getElementById('settings-content')

const nav = {
    setup: {
        btn: navSetup,
        content: setupContent
    },
    settings: {
        btn: navSettings,
        content: settingsContent
    }
}

// settings
const richPresenceCheckbox = document.getElementById('rich-presence-checkbox')
const customPortInput = document.getElementById('port-input')

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const config = await electron.getConfig()

        richPresenceCheckbox.checked = !!config.settings.rich_presence
        customPortInput.placeholder = config.port

        for (const key in nav) {
            nav[key].btn.addEventListener('click', () => {
                for (const otherKey in nav) {
                    nav[otherKey].btn.classList.remove('active-nav')
                    nav[otherKey].content.classList.remove('visible')
                    nav[otherKey].content.classList.add('invisible')
                }

                nav[key].btn.classList.add('active-nav')
                nav[key].content.classList.replace('invisible', 'visible')
            })
        }

        if (config.client_id && config.client_secret) {
            nav.setup.btn.classList.remove('active-nav')
            nav.settings.btn.classList.add('active-nav')

            nav.setup.content.classList.replace('visible', 'invisible')
            nav.settings.content.classList.replace('invisible', 'visible')
        }

    } catch (error) {
        console.error('Failed to load config:', error)
    }
})

richPresenceCheckbox.addEventListener('change', () => {
    electron.toggleRichPresence(richPresenceCheckbox.checked)
})

customPortInput.addEventListener('change', () => {
    electron.changeConfig('port', customPortInput.value)
    warning('Please restart to apply changes.')
})

document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    try {        
        const form = e.target
        const formData = new FormData(form)

        const clientId = formData.get('client-id')
        const clientSecret = formData.get('client-secret')
    
        await axios.post(`/setup`, {
            'client_id': clientId,
            'client_secret': clientSecret
        })

        electron.closeWindow()
    } catch (error) {        
        if (error.response.status === 401) {
            warning("Invalid client credentials.")
        } else {
            console.error('Unexpected error validating client:', error)
        }
    }
})

closeSettings.addEventListener('click', () => {
    electron.closeWindow()
})

function warning(msg) {
    warningText.textContent = msg
    SettingsAlert.classList.replace('invisible', 'visible')

    setTimeout(() => {
        SettingsAlert.classList.replace('visible', 'invisible')
    }, 3000);
}