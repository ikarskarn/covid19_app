'use strict';

const STORE = {
    searchURL: 'https://covidtracking.com/api/v1/',
    usDaily: 'us/daily.json',
    searchState: '',
    sevenDay: 0,
    fourteenDay: 0,
    graphNumbers: [],
    resizeTimer: 0,
    dropdownList: {
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
        ALL: "United States",
    },    
}

//#region DISPLAY TO DOM
function displayNumbers(r0, last, current, sevenDay, fourteenDay) {
    $("#js-r0-number").text(`${r0.toFixed(2)}`);
    $("#js-last-number").text(parseNumbers(`${last}`));
    $("#js-current-number").text(parseNumbers(`${current}`));
    $("#js-seven-number").text(parseNumbers(`${sevenDay}`));
    $("#js-fourteen-number").text(parseNumbers(`${fourteenDay}`));
}

function displayURL(responseJson, query) {
    $('#js-state-dashboard').empty();
    $('#js-state-dashboard').removeClass('hidden');
    let stateUrl = " ";
    for(let i = 0; i < responseJson.length; i++) {
        if(responseJson[i].stateId === query) {
            stateUrl = `${responseJson[i].url}`;
        }
    }
    $('#js-state-dashboard').append(
        `<p>For more information about your state's available resources follow the link below</p>
        <a href="${stateUrl}" target="_blank">${STORE.dropdownList[query]} Covid Site</a>`);
}
//#endregion

//#region FORMULAS
function r0Formula(responseJson) {
    //start 15 days prior to current date, clear graph array to redraw
    //get daily values of new cases from that date until now and pass into an array
    const dailyArr = [];
    STORE.graphNumbers.splice(0);
    for(let n = 15; n > 0; n--) {
        dailyArr.push(responseJson[n].positive);
        if(responseJson[n].positiveIncrease <= 0) {
            STORE.graphNumbers.push(0);
        } else {
            STORE.graphNumbers.push(responseJson[n].positiveIncrease);
        }

    }
    handleGraph(STORE.graphNumbers);
    
    //get reproduction rate (r0) between each day in dailyArr
    const r0_arr = [];
    for(let i = 0; i < dailyArr.length -1; i++) {
        const newR0 = dailyArr[i+1]/dailyArr[i];
        r0_arr.push(newR0);
    }
    
    //show up/down arrow if r0 has gone up/down since previous day respectively
    if(r0_arr[0] > r0_arr[1]) {
        //up and red (bad)
        $('#arrow').text('\u25B2')
        .css({'color':'#BE3636'});
    } else {
        //down and green (good)
        $('#arrow').text(`\u25BC`)
        .css({'color':'#86C231'});
    }
    
    ////////////////
    ///R0 FORMULA///
    ////////////////
    
    //inf = Fraction of Infectious Individuals: 
    //(Currently Recovered - Currently Infected)/Currently Infected 
    const currentInfected = responseJson[0].positive;
    const currentRecovered = responseJson[0].recovered;
    const inf = (currentInfected - currentRecovered)/currentInfected;
    
    //r0 = transmission rate (average of r0 values each day)
    const r0 = avgArr(r0_arr);
    
    //run function to predict future numbers
    //need infectious percentage, currently infected, r0 as parameters
    futureFormula(currentInfected, r0, inf);
    
    //get last week's infected
    const lastWeekInfected = responseJson[7].positive;
    
    //pass in all returned values to feed to the DOM
    displayNumbers(r0, lastWeekInfected, currentInfected, STORE.sevenDay, STORE.fourteenDay);
}

//with new r0, take current number of cases to predict 7 days and 14 days if number stays the same
function futureFormula (currentInfected, r0, inf) {
        
    const current = currentInfected;
    let newCurrent = current;
    STORE.sevenDay = current;
    STORE.fourteenDay = current;
    
    for(let i = 0; i < 14; i++) {
        //multiply newCurrent cases by the r0 and subtract the newCurrent cases to get next days potential new cases
        //not all people are infectious, so for each 100 cases, 20% will be dropped
        const newCases = ((newCurrent*r0)-newCurrent)*inf;
        
        //add together new cases to new current to get next day's confirmed cases
        //1 in 3 people will not contract it the first time they encounter this person
        //Therefore, multiply by .67
        newCurrent += newCases*.67;
        if(i === 6) {
            //get value for seventh day prediction
            STORE.sevenDay = Math.floor((newCurrent));
        }
        else if(i === 13) {
            //get value for 14th cay prediction
            STORE.fourteenDay = Math.floor(newCurrent);
        } 
    }
}
//#endregion

//#region GET DATA FROM API
function getCovidDataUS() {
    
    $('#js-state-dashboard').addClass('hidden');
    const url = STORE.searchURL + STORE.usDaily;

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => r0Formula(responseJson))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
        $('.svg-text').text('Something went wrong.  Server may be acting up.  Please try again later.');
    });
}

function getCovidDataState(query) {
    
    const url = STORE.searchURL + `states/${query}/daily.json`;
    
    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => r0Formula(responseJson))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function getStateURLs(query) {
    const url = STORE.searchURL + `urls.json`;
    
    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => displayURL(responseJson, query))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}
//#endregion

//#region MAINTENANCE FUNCTIONS
function createDropdown() {
    //use the dropdown object to create a dropdown in the DOM
    for (let [key, value] of Object.entries(STORE.dropdownList)) {
        $('.js-search-state').append(
            `<option class="${key}" value="${key}">${value}</option>`
    )};
}

//function for averaging my arrays
function avgArr (arr) {
    let num = 0;
    for(let i = 0; i < arr.length; i++) {
        num += arr[i];
    }
    return num / arr.length;
}

//#region GRAPH FUNCTIONS
//create the graph
function handleGraph(arr) {
    $('#previous-data').empty();
    const dataset = [];
    const maxVal = Math.max(...arr);
    
    for(let i = 0; i < arr.length; i++) {
        const p = arr[i]/maxVal*100;
        dataset.push(p.toFixed(3));
    }
    
    const w = $('#previous-data').width();
    const h = 256;
    
    const spacing = $('#previous-data').width()/15.5;
    let yesterday = 0;
    let today = 0;
    const svg = d3.select('#previous-data')
        .append('svg')
        .attr('height', h)
        .attr('width', w);

    svg.selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect')
        .attr('height', (d)=>`${d*2}px`)
        .attr('width', $('#previous-data').width()/30)
        .attr('x', (d, i)=>(i*spacing)+spacing/2)
        .attr('y', (d, i)=>h-(2*d))
        .attr('value', (d, i)=>i+1)
        .attr('class', 'bar')
        .attr('tabindex', (d, i)=>i+1)
        .style('fill', (d, i)=> {
            if(i > 0) {
                yesterday = parseFloat(dataset[i-1])
            }
            today = parseFloat(dataset[i]);
            if(today > yesterday && i > 0) {
                return '#BE3636';
            } else {
                return '#86C232';
            }
        });

    svg.append('text')
        .attr('x', w/2)
        .attr('y', 30)
        .text('Mouse Over Bar for Details')
        .attr('class', 'svg-text hidden');

    $(window).bind('resize', function(e) {
        clearTimeout(STORE.resizeTimer);
        STORE.resizeTimer = setTimeout(function() {
            handleGraph(arr);
        }, 250);
    });
}

//function for graph hover
function handleHover() { 
    $('#previous-data').on('mouseover', '.bar', function(e) {
        const v = this.getAttribute('value');
        const f = reverseValues(v);
        $(".svg-text").text(`${parseNumbers(`${STORE.graphNumbers[v]}`)} new cases ${f} day(s) ago`);
    });

    $('#previous-data').on('focus', '.bar', function(e) {
        const v = this.getAttribute('value');
        const f = reverseValues(v);
        $(".svg-text").text(`${parseNumbers(`${STORE.graphNumbers[v]}`)} new cases ${f} day(s) ago`);
    });
    
    $('#previous-data').on('mouseleave', '.bar', function(e) {
        $(".svg-text").text("Touch Bar for Details");
    });
}

function reverseValues(v) {
    let n = '';
    switch (v) {
        case '0': n = '15'; break;
        case '1': n = '14'; break;
        case '2': n = '13'; break;
        case '3': n = '12'; break;
        case '4': n = '11'; break;
        case '5': n = '10'; break;
        case '6': n = '9'; break;
        case '7': n = '8'; break;
        case '8': n = '7'; break;
        case '9': n = '6'; break;
        case '10': n = '5'; break;
        case '11': n = '4'; break;
        case '12': n = '3'; break;
        case '13': n = '2'; break;
        case '14': n = '1'; break;
        case '15': n = '0'; break;
        default: n = 'Mouse Over Bar'; break
    }
    return n; 
}
//#endregion

//add commas for readability
function parseNumbers (num) {
    const numArr = num.toString().split(".");
    numArr[0] = numArr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return numArr.join(".");
  }
//#endregion

function watchForm() {
    $('#js-pick-state').on('click', event => {
        event.preventDefault();
        STORE.searchState = $('.js-search-state').val();
        if(STORE.searchState === null) {
            alert('Please Choose a State');
            return;    
        }
        
        $(".js-search-state option:first").prop("selected", "selected");
        $(".js-state-name").text(STORE.dropdownList[STORE.searchState]);
        
        if(STORE.searchState === 'ALL') {
            getCovidDataUS();
            return;
        }

        getCovidDataState(STORE.searchState);
        getStateURLs(STORE.searchState);
        
    });
}

function handleInit() {
    watchForm();
    createDropdown();
    getCovidDataUS();
    handleHover();
}

$(handleInit);