'use strict';

//no api needed 
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

//pass values into the DOM
function displayNumbers(r0, last, current, sevenDay, fourteenDay) {
    $("#js-r0-number").text(`${r0.toFixed(2)}`);
    $("#js-last-number").text(`${last}`);
    $("#js-current-number").text(`${current}`);
    $("#js-seven-number").text(`${sevenDay}`);
    $("#js-fourteen-number").text(`${fourteenDay}`);
}

function displayURL(responseJson, query) {
    console.log(responseJson);
    let stateUrl = " ";
    for(let i = 0; i < responseJson.length; i++) {
        if(responseJson[i].stateId === query) {
            stateUrl = `${responseJson[i].url}`;
            console.log(`We hit ${stateUrl}`);    
        }
    }
    $('#js-state-dashboard').append(`<a href="${stateUrl}" target="_blank">State URL</a>`);
}

//#region FORMULAS
function r0Formula(responseJson) {
    console.log(responseJson);
    
    //start 15 days prior to current date
    //get daily values of new cases from that date until now and pass into an array
    const dailyArr = [];
    for(let n = 15; n > 0; n--) {
        dailyArr.push(responseJson[n].positive);
        console.log(`${n} days ago there were ${responseJson[n].positive} total cases.`);
    }

    //get reproduction rate (r0) between each day in dailyArr
    const r0_arr = [];
    for(let i = 0; i < dailyArr.length -1; i++) {
        let newR0 = dailyArr[i+1]/dailyArr[i];
        r0_arr.push(newR0);
        console.log(`New r0 for day ${i+1}: ${newR0}`);
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
    .then(responseJson => handleGraph(responseJson))
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
    //rFormula();
}

function handleGraph(responseJson) {
    // set the dimensions and margins of the graph
    let margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 256 - margin.left - margin.right,
    height = 256 - margin.top - margin.bottom;

    let svg = d3.select("#my_dataviz")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // get the data
    d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/1_OneNum.csv", function(data) {
    
    // X axis: scale and draw:
    let x = d3.scaleLinear()
        .domain([0, 10000000]) // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
  
    // set the parameters for the histogram
    let histogram = d3.histogram()
        .value(function(d) { return d.price; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(70)); // then the numbers of bins
  
    // And apply this function to data to get the bins
    let bins = histogram(data);
  
    // Y axis: scale and draw:
    let y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
          .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
          .attr("height", function(d) { return height - y(d.length); })
          .style("fill", "#69b3a2")
  
  });
}

$(handleInit);