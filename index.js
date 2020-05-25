'use strict';

//no api key needed 
const searchURL = 'https://covidtracking.com/api/v1/';
const usDaily = 'us/daily.json';
//FOR US DAILY: us/daily.json
//FOR STATE DAILY: states/{state code}/daily.json

//object for states
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

let searchState = '';

//future numbers
let sevenDay = 0;
let fourteenDay = 0;

//needed globally for graph
const graphNumbers = [];
let graphHeight = 0;

//#region DISPLAY TO DOM
function displayNumbers(r0, last, current, sevenDay, fourteenDay) {
    $("#js-r0-number").text(`${r0.toFixed(2)}`);
    $("#js-last-number").text(parseNumbers(`${last}`));
    $("#js-current-number").text(parseNumbers(`${current}`));
    $("#js-seven-number").text(parseNumbers(`${sevenDay}`));
    $("#js-fourteen-number").text(parseNumbers(`${fourteenDay}`));
}

function displayURL(responseJson, query) {
    console.log(responseJson);
    $('#js-state-dashboard').empty();
    $('#js-state-dashboard').removeClass('hidden');
    let stateUrl = " ";
    for(let i = 0; i < responseJson.length; i++) {
        if(responseJson[i].stateId === query) {
            stateUrl = `${responseJson[i].url}`;
            console.log(`We hit ${stateUrl}`);    
        }
    }
    $('#js-state-dashboard').append(
        `<p>For more information about your state's available resources follow the link below</p>
        <a href="${stateUrl}" target="_blank">${dropdownList[query]} Covid Site</a>`);
}
//#endregion

//#region FORMULAS
function r0Formula(responseJson) {
    console.log(responseJson);
    //handleGraph(responseJson);
    //start 15 days prior to current date
    //get daily values of new cases from that date until now and pass into an array
    const dailyArr = [];
    graphNumbers.splice(0);
    //const graphArr = [];
    for(let n = 15; n > 0; n--) {
        dailyArr.push(responseJson[n].positive);
        graphNumbers.push(responseJson[n].positiveIncrease);
        console.log(`${n} days ago there were ${responseJson[n].positive} total cases.`);
        console.log(`${n} days ago there were ${responseJson[n].positiveIncrease} new cases.`);
    }
    handleGraph(graphNumbers);
    
    //get reproduction rate (r0) between each day in dailyArr
    const r0_arr = [];
    for(let i = 0; i < dailyArr.length -1; i++) {
        let newR0 = dailyArr[i+1]/dailyArr[i];
        r0_arr.push(newR0);
        console.log(`New r0 for day ${i+1}: ${newR0}`);
    }
    if(r0_arr[0] > r0_arr[1]) {
        console.log('show up arrow');
        $('#arrow').text('\u25B2')
        .css({'color':'#BE3636'});
    } else {
        console.log('show down arrow');
        $('#arrow').text(`\u25BC`)
        .css({'color':'#86C231'});
    }
    ///////////////
    ////FORMULA////
    ///////////////
    
    //inf = Fraction of Infectious Individuals: 
    //(Currently Recovered - Currently Infected)/Currently Infected 
    let currentInfected = responseJson[0].positive;
    console.log(`Currently Infected: ${currentInfected}`);
    let currentRecovered = responseJson[0].recovered;
    console.log(`Currently Recovered: ${currentRecovered}`);
    let inf = (currentInfected - currentRecovered)/currentInfected;
    console.log(`Fraction of Infectious Individuals: ${inf}`);
    
    //r0 = transmission rate (average of r0 values each day)
    let r0 = avgArr(r0_arr);
    console.log(`Transimssion rate (r0): ${r0}`);
    
    //run function to predict future numbers
    //need infectious percentage, currently infected, r0 as parameters
    futureFormula(currentInfected, r0, inf);
    //get last week's infected
    let lastWeekInfected = responseJson[7].positive;
    
    //pass in all returned values to feed to the DOM
    displayNumbers(r0, lastWeekInfected, currentInfected, sevenDay, fourteenDay);
}

//with new r0, take current number of cases to predict 7 days and 14 days if number stays the same
function futureFormula (currentInfected, r0, inf) {
        
    const current = currentInfected;
    let newCurrent = current;
    sevenDay = current;
    fourteenDay = current;
    
    for(let i = 0; i < 14; i++) {
        //multiply newCurrent cases by the r0 and subtract the newCurrent cases to get next days potential new cases
        //not all people are infectious, so for each 100 cases, 20% will be dropped
        let newCases = ((newCurrent*r0)-newCurrent)*inf;
        console.log(`Day ${i} new cases: ${newCases}`);
        
        //add together new cases to new current to get next day's confirmed cases
        //1 in 3 people will not contract it the first time they encounter this person
        //Therefore, multiply by .67
        newCurrent += newCases*.67;
        if(i === 6) {
            //get value for seventh day prediction
            sevenDay = Math.floor((newCurrent));
            console.log(`Seven Days from Now: ${sevenDay}`);
        }
        else if(i === 13) {
            //get value for 14th cay prediction
            fourteenDay = Math.floor(newCurrent);
            console.log(`Fourteen Days from Now: ${fourteenDay}`);
        } 
    }
}
//#endregion

//#region GET DATA FROM API
function getCovidDataUS() {
       
    const url = searchURL + usDaily;
    console.log(url);

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => r0Formula(responseJson))
    //.then(responseJson => handleGraph(responseJson))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function getCovidDataState(query) {
    
    const url = searchURL + `states/${query}/daily.json`;
    console.log(url);
    
    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => r0Formula(responseJson))
    //.then(responseJson => console.log(responseJson))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function getStateURLs(query) {
    const url = searchURL + `urls.json`;
    console.log('state url: ' + url);
    
    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    })
    .then(responseJson => displayURL(responseJson, query))
    //.then(responseJson => console.log(responseJson))
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}
//#endregion

//#region MAINTENANCE FUNCTIONS
function createDropdown() {
    //use the dropdown object to create a dropdown in the DOM
    for (let [key, value] of Object.entries(dropdownList)) {
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
    console.log('check num ' + num);
    return num / arr.length;
}

let resizeTimer;
//create the graph
function handleGraph(arr) {
    //console.log(responseJson);
    //console.log(`data: ${data}`);
    $('#previous-data').empty();
    const dataset = [];
    const maxVal = Math.max(...arr);
    
    for(let i = 0; i < arr.length; i++) {
        let p = arr[i]/maxVal*100;
        dataset.push(p.toFixed(3));
    }
    
    let w = $('#previous-data').width();
    let h = 256;
    
    let spacing = $('#previous-data').width()/15.5;
    let yesterday = 0;
    let today = 0;
    let svg = d3.select('#previous-data')
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
        .attr('value', (d, i)=>i)
        .attr('class', 'bar')
        .style('fill', (d, i)=> {
            console.log(typeof dataset[i]);
            console.log(`data ${i} is ${dataset[i]}.`);
            console.log(`data ${i+1} is ${dataset[i+1]}`);
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
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            handleGraph(arr);
        }, 250);
    });
}

//function for graph hover
function handleHover() { 
    $('#previous-data').on('mouseover', '.bar', function(e) {
        let v = this.getAttribute('value');
        let f = reverseValues(v);
        //console.log("Value: " + v);
        $(".svg-text").text(`${parseNumbers(`${graphNumbers[v]}`)} new cases ${f} day(s) ago`);
    });
    
    $('#previous-data').on('mouseleave', '.bar', function(e) {
        $(".svg-text").text("Touch Bar for Details");
    });
    
    //$("#previous-data").on('mouseover', function (e) {
    //        console.log('hovered');
    //        
    //    }, function () {
    //        
    //});
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
        searchState = $('.js-search-state').val();
        if(searchState === null) {
            alert('Please Choose a State');
            return;    
        }
        
        $(".js-search-state option:first").prop("selected", "selected");
        $(".js-state-name").text(dropdownList[searchState]);
        
        getCovidDataState(searchState);
        getStateURLs(searchState);
        //console.log('hit add state button');
    });
}

function handleInit() {
    watchForm();
    createDropdown();
    getCovidDataUS();
    handleHover();
    //rFormula();
}

$(handleInit);