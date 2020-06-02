'use strict';

const STORE = {
	apiKey: '...',
	searchURL: 'https://covidtracking.com/api/v1/',
};

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function displayResults(responseJson) {
     console.log(responseJson);
     $('#results-list').empty();

     for (let i = 0; i < responseJson.length; i++) {
          $('#results-list').append(`<h3>${responseJson}</h3>`);
     }

     $('#results').removeClass('hidden');
};

function getData(query) {
    const params = {
        key: apiKey,
        q: query,
    };

    const queryString = formatQueryParams(params);
    const url = searchURL + '?' + queryString;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then(responseJson => displayResults(responseJson))
        .catch(err => {
            $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function watchForm() {
     $('form').submit(event => {
          event.preventDefault();
          const searchTerm = $('#js-search-term').val();
          getData(searchTerm);
     });
}

$(watchForm);