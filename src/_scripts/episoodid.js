var gscriptBase = 'https://script.google.com/macros/s';
var feedbackApiId =
    'AKfycbzVtTRjfZxD-U5wrzQ-OrcupXY_3W19cOay6632XK-jJcxhLyY6tSwKiraAgDTYUCBRsA';
var feedbackApi = gscriptBase + '/' + feedbackApiId + '/exec';
var episodesApiId =
    'AKfycbzVtTRjfZxD-U5wrzQ-OrcupXY_3W19cOay6632XK-jJcxhLyY6tSwKiraAgDTYUCBRsA';
var episodesApi = gscriptBase + '/' + episodesApiId + '/exec?Episoodid';

var episodes = [];

// Helper function to trigger window resize
var triggerWindowResize = function() {
    setTimeout(function() {
        try {
            // Use CustomEvent for better IE11 compatibility
            var resizeEvent = typeof CustomEvent === 'function' ? 
                new CustomEvent('resize') : new Event('resize');
            window.dispatchEvent(resizeEvent);
            console.log('Window resize event triggered');
        } catch (e) {
            // Fallback for very old browsers
            if (typeof window.dispatchEvent === 'function') {
                var evt = document.createEvent('UIEvents');
                evt.initUIEvent('resize', true, false, window, 0);
                window.dispatchEvent(evt);
            } else if (typeof window.fireEvent === 'function') {
                window.fireEvent('onresize');
            }
            console.log('Window resize event triggered (fallback)');
        }
    }, 100);
};

document.addEventListener('DOMContentLoaded', function () {
    // fetch episodes from api and add to global episodes array
    populateEpisodes().then(function(eps) {
        eps.forEach(function(episode) {
            episodes.push(episode);
        });
    });
    prefillFromLocalstorage();
    var submitE = get('db-feedback2-submit');
    if (submitE) {
        submitE.addEventListener('click', submitEpisode);
    }
    
    // Trigger resize event to fix resolution and scaling issues
    triggerWindowResize();
});

document.onkeydown = function (evnt) {
    if (evnt.key === "Escape") {
        closeModal();
    }
};

closeModal = function() {
    get('popup-content').classList.add('d-none');
    get('popup-background').classList.add('d-none');
};

var populateEpisodes = function() {
    return getEpisodes().then(function(eps) {
        var select = document.getElementById('db-feedback2-episode-select');
        if (!select) {
            // Silently return if element doesn't exist on this page
            return eps;
        }
        eps.forEach(function(episode) {
            var option = document.createElement('option');
            option.value = episode.id;
            option.text = episode.Nimetus + ' (' + episode.Allikas + ')';
            select.appendChild(option);
        });
        return eps;
    });
};

var getEpisodes = function() {
    return new Promise(function(resolve, reject) {
        try {
            fetch(episodesApi)
                .then(function(response) { return response.json(); })
                .then(function(data) { resolve(data); })
                .catch(function(err) { reject(err); });
        } catch (err) {
            reject(err);
        }
    });
};

var prefillFromLocalstorage = function() {
    // if selected episode in local storage, set it
    var episodeSelect = document.getElementById('db-feedback2-episode-select');
    var selectedEpisode = localStorage.getItem('selectedEpisode');
    if (episodeSelect && selectedEpisode) {
        episodeSelect.value = selectedEpisode;
    }
    // if email in local storage, set it
    var emailInput = document.getElementById('db-feedback2-email');
    var email = localStorage.getItem('email');
    if (email && emailInput) {
        emailInput.value = email;
    }
};

var submitEpisode = function(evnt) {
    // if email is not valid, do not submit
    if (!validateEmail()) {
        return;
    }

    // save selected episode to local storage
    var episodeId = get('db-feedback2-episode-select').value;
    localStorage.setItem('selectedEpisode', episodeId);

    // save email to local storage
    var email = get('db-feedback2-email').value;
    localStorage.setItem('email', email);

    var xhr2 = new XMLHttpRequest();
    xhr2.open('POST', feedbackApi, true);

    xhr2.onload = function() { // request successful
        console.log('response', xhr2.responseText);
        closeModal();
    };

    xhr2.onerror = function() {
        console.log('Error:', xhr2.status);
    };

    var formE = get('db-feedback2');
    var formData = new FormData(formE);
    // add current url to form data
    formData.append('url', window.location.href);
    // add user language to form data
    formData.append('nav_lang', navigator.language);
    // get html lang property
    formData.append('locale', document.documentElement.lang);

    xhr2.send(formData);
    evnt.preventDefault();
};

var validateEmail = function() {
    var emailInput = get('db-feedback2-email');
    var email = emailInput.value;
    if (!email || email.length === 0) {
        emailInput.classList.add('is-invalid');
        alert('Palun sisesta e-posti aadress');
        return false;
    }
    if (email.indexOf('@') === -1) {
        emailInput.classList.add('is-invalid');
        alert('Palun sisesta korrektne e-posti aadress');
        return false;
    }
    var emailRe = /\S+@\S+\.\S+/;
    if (!emailRe.test(email)) {
        emailInput.classList.add('is-invalid');
        alert('Palun sisesta korrektne e-posti aadress');
        return false;
    }
    emailInput.classList.remove('is-invalid');
    return true;
};
