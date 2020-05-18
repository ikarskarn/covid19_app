'use strict';

const apiKey = 'q5CJDWvLbDbcPNJI1ZsLf3VtyFvkEMFuymeR9LTL'; 
const searchURL = 'https://developer.nps.gov/api/v1/parks';
const dropdownList = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District Of Columbia",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
};

//let currentState = '';
let searchState = '';

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

function displayResults(responseJson) {
    //if there are previous results, remove them
    $('#results-list').empty();
    
    // iterate through the items array
    //const chosenStateNames = currentState.join(', ');
    //$('#js-state').text(`${responseJson.data[i].addresses.stateCode}`);
    for (let i = 0; i < responseJson.data.length; i++) {
        //for each data object in the items array, add a list item to the results list with the
        //r0 data
        //last week's numbers
        //current numbers
        
        //$('#results-list').append(
        //    `<li><h3>${responseJson.data[i].name}</h3>
        //    <p>${responseJson.data[i].description}</p>
        //    <a href='${responseJson.data[i].url}' target="_blank">${responseJson.data[i].name} Website</a>
        //    </li>`
        //)};
    }
    //display the results section
    //$('#results').removeClass('hidden');
};

function rFormula(num) {
    //start 30 days prior to current date
    //go back from that date until the first day with 0 new cases
    //get daily values of new cases from that date until now and pass into an array
    //example [0, 2, 9, 22, 100, 80, 210, 500]
    //get r0 from this
    const arr = [0, 2, 9, 22, 100, 80, 210, 500];
    //reproduction rate (r0) for each day in arr
    const ro_arr = [];
    //starting
    for(let i = 1; i < arr.length - 1; i++) {
        //get the 
        let newRO = arr[i+1]/arr[i];
        ro_arr.push(newRO);
        console.log(newRO);
    }
    
    let finalR0 = 0;
    let avgNum = 0;
    for(let r = 0; r < ro_arr.length; r++) {
          avgNum += ro_arr[r];
    }
    //s = Fraction of Susceptible People: .95 (95%)
    const s = .95;
    console.log(`Fraction of Susceptible People: ${s}`);
    //i = Fraction of Infectious Individuals: current infected / current population
    /////currentInfected = 1479856
    let currentInfected = 1247567;
    let currentPopulation = 328000000;
    const i = currentInfected / currentPopulation;
    console.log(`Fraction of Infectious Individuals: ${i}`); 
    //b = transmission rate (average of r0 values each day)
    const b = 3;//avgNum / ro_arr.length;
    console.log(`transimssion rate: ${b}`);
    //y = recovery rate (avg. .98 (98%))
    const y = .98;
    console.log(`Recovery Rate: ${y}`);
    //c = number of new cases per unit time (b * s * i);
    finalR0 = b * i; 
        
    //final r0 is equal to:
    //the sum of the days above divided by the number of days (average) (call this b)
    //multiplied by the fraction of susceptible people: .95 (s);
    //
    console.log('Final R0: ' + finalR0); 
    //start day after zero and get initial value
    futureFormula(currentInfected, finalR0);
    
}

//with new r0 take current number of cases to predict 7 days and 14 days if number stays the same
function futureFormula (currentInfected, finalR0) {
    //current number of cases = 500;
    const current = currentInfected;
    let newCurrent = current;
    let sevenDay = current;
    let fourteenDay = current;
    
    for(let i = 1; i < 15; i++) {
        //multiply newCurrent cases * finalR0 to get next days potential
        //for every 3 people potentially infected, drop 1 due to transmission rate.
        //      
        let newCases = (newCurrent*finalR0);
        console.log('new cases: ' + newCases);
        //add together new cases to new current to get next day's confirmed cases
        newCurrent += newCases;
        console.log(`Day ${i}`);
        console.log(newCurrent); 
    }
    
    
    //continue formula until 7 days have passed.  Continue formula until 14 days have passed.
    

}

function getCovidData(query) {
    console.log(query);
    
    
    //const params = {
    //    stateCode: list,
    //};

    //const queryString = formatQueryParams(params);
    //const url = 'https://cors-anywhere.herokuapp.com/' + searchURL + '?' + queryString;

    //console.log(url);

    //const options = {
    //    headers: new Headers({
    //        "x-api-key": apiKey})
    //};

    //fetch(url, options)
    //.then(response => {
    //    if (response.ok) {
    //        return response.json();
    //    }
    //    throw new Error(response.statusText);
    //})
    //.then(responseJson => displayResults(responseJson))
    //.catch(err => {
    //    $('#js-error-message').text(`Something went wrong: ${err.message}`);
    //});
}

function createDropdown() {
    //use the dropdown object to create a dropdown in the DOM
    for (let [key, value] of Object.entries(dropdownList)) {
        $('.js-search-state').append(
            `<option class="${key}" value="${key}">${value}</option>`
    )};
}

function watchForm() {

    $('#js-pick-state').on('click', event => {
        event.preventDefault();
        searchState = $('.js-search-state').val();
        if(searchState === null) {
            alert('Please Choose a State');
            return;    
        }
        
        $(".js-search-state option:first").prop("selected", "selected");
        $(".js-state-name").text(dropdownList[searchState]);
        
        getCovidData(searchState);
        //console.log('hit add state button');
    });
}

function handleInit() {
    watchForm();
    createDropdown();
    rFormula(10);
}

$(handleInit);