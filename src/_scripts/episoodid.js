const gscriptBase = 'https://script.google.com/macros/s'
const feedbackApiId =
    'AKfycbzVtTRjfZxD-U5wrzQ-OrcupXY_3W19cOay6632XK-jJcxhLyY6tSwKiraAgDTYUCBRsA'
const feedbackApi = `${gscriptBase}/${feedbackApiId}/exec`
const episodesApiId =
    'AKfycbzVtTRjfZxD-U5wrzQ-OrcupXY_3W19cOay6632XK-jJcxhLyY6tSwKiraAgDTYUCBRsA'
const episodesApi = `${gscriptBase}/${episodesApiId}/exec?Episoodid`

const episodes = []

// Helper function to trigger window resize
const triggerWindowResize = () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        console.log('Window resize event triggered');
    }, 100);
}

document.addEventListener('DOMContentLoaded', function () {
    // fetch episodes from api and add to global episodes array
    populateEpisodes().then(episodes => {
        episodes.forEach(episode => {
            episodes.push(episode)
        })
    })
    prefillFromLocalstorage()
    const submitE = get('db-feedback2-submit')
    if (submitE) {
        submitE.addEventListener('click', submitEpisode)
    }
    
    // Trigger resize event to fix resolution and scaling issues
    triggerWindowResize();
})
document.onkeydown = function (evnt) {
    if (evnt.key === "Escape") {
        closeModal()
    }
}

closeModal = () => {
    get('popup-content').classList.add('d-none')
    get('popup-background').classList.add('d-none')
}

const populateEpisodes = async () => {
    const episodes = await getEpisodes()
    const select = document.getElementById('db-feedback2-episode-select')
    if (!select) {
        console.warn('Episode select element not found')
        return episodes
    }
    episodes.forEach(episode => {
        const option = document.createElement('option')
        option.value = episode.id
        option.text = `${episode.Nimetus} (${episode.Allikas})`
        select.appendChild(option)
    })
    return episodes
}

const getEpisodes = async () => {
    try {
        const response = await fetch(episodesApi)
        return await response.json()
    } catch (err) {
        throw err
    }
}

const prefillFromLocalstorage = () => {
    // if selected episode in local storage, set it
    const episodeSelect = document.getElementById('db-feedback2-episode-select')
    const selectedEpisode = localStorage.getItem('selectedEpisode')
    if (episodeSelect && selectedEpisode) {
        episodeSelect.value = selectedEpisode
    }
    // if email in local storage, set it
    const emailInput = document.getElementById('db-feedback2-email')
    const email = localStorage.getItem('email')
    if (email) {
        emailInput.value = email
    }
}

const submitEpisode = (evnt) => {
    // if email is not valid, do not submit
    if (!validateEmail()) {
        return
    }

    // save selected episode to local storage
    const episodeId = get('db-feedback2-episode-select').value
    localStorage.setItem('selectedEpisode', episodeId)

    // save email to local storage
    const email = get('db-feedback2-email').value
    localStorage.setItem('email', email)

    const xhr2 = new XMLHttpRequest()
    xhr2.open('POST', feedbackApi, true)

    xhr2.onload = function () { // request successful
        console.log('response', xhr2.responseText)
        closeModal()
    }

    xhr2.onerror = function () {
        console.log('Error:', xhr2.status)
    }

    const formE = get('db-feedback2')
    const formData = new FormData(formE)
    // add current url to form data
    formData.append('url', window.location.href)
    // add user language to form data
    formData.append('nav_lang', navigator.language)
    // get html lang property
    formData.append('locale', document.documentElement.lang)

    xhr2.send(formData)
    evnt.preventDefault()
}

const validateEmail = () => {
    const emailInput = get('db-feedback2-email')
    const email = emailInput.value
    if (!email || email.length === 0) {
        emailInput.classList.add('is-invalid')
        alert('Palun sisesta e-posti aadress')
        return false
    }
    if (!email.includes('@')) {
        emailInput.classList.add('is-invalid')
        alert('Palun sisesta korrektne e-posti aadress')
        return false
    }
    const emailRe = /\S+@\S+\.\S+/
    if (!emailRe.test(email)) {
        emailInput.classList.add('is-invalid')
        alert('Palun sisesta korrektne e-posti aadress')
        return false
    }
    emailInput.classList.remove('is-invalid')
    return true
}
