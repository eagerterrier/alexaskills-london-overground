/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');

var http       = require("https")
  , APP_ID     = "amzn1.ask.skill.1371f436-66d4-4b57-b1a1-b1700e3e9607"
  , TFL_KEY    = "a2a0722e5dafa0984d493e6a5423ce04"
  , TFL_APP_ID = "88eef1cb"
  , currentStation = ""
  , currentStation_id = null;

const languageStrings = {
    'en-GB': {
        translation: {
            FACTS: [
                'A year on Mercury is just 88 days long.',
                'Despite being farther from the Sun, Venus experiences higher temperatures than Mercury.',
                'Venus rotates anti-clockwise, possibly because of a collision in the past with an asteroid.',
                'On Mars, the Sun appears about half the size as it does on Earth.',
                'Earth is the only planet not named after a god.',
                'Jupiter has the shortest day of all the planets.',
                'The Milky Way galaxy will collide with the Andromeda Galaxy in about 5 billion years.',
                'The Sun contains 99.86% of the mass in the Solar System.',
                'The Sun is an almost perfect sphere.',
                'A total solar eclipse can happen once every 1 to 2 years. This makes them a rare event.',
                'Saturn radiates two and a half times more energy into space than it receives from the sun.',
                'The temperature inside the Sun can reach 15 million degrees Celsius.',
                'The Moon is moving approximately 3.8 cm away from our planet every year.',
            ],
            SKILL_NAME: 'British Space Facts',
            GET_FACT_MESSAGE: "Here's your fact: ",
            HELP_MESSAGE: 'You can say tell me a space fact, or, you can say exit... What can I help you with?',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Goodbye!',
        },
    }
};

var stopsAsDefined = {"homerton" : "910GHOMRTON", "kentish town west" : "910GKNTSHTW"};

var url = function(stopId){
  return "https://api-argon.tfl.gov.uk/Line/london-overground/Arrivals?stopPointId=" + stopId + "&app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID;
};

var stationlookup = function(stationName){
  console.log('requesting data from...');
  console.log("https://api-argon.tfl.gov.uk/StopPoint/Search?query=" + encodeURIComponent(stationName) + "&modes=overground&app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID);
  return "https://api-argon.tfl.gov.uk/StopPoint/Search?query=" + encodeURIComponent(stationName) + "&modes=overground&app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID;
};

var getJsonFromMta = function(stopId, callback){
  http.get(url(stopId), function(res){
    var body = "";
    res.on("data", function(data){
      body += data;
    });

    res.on("end", function(){
      var result = JSON.parse(body);
      callback(result);
    });

  }).on("error", function(e){
    console.log("Error: " + e);
  });
};

var getStationId = function(stationName, callback){
  console.log('getting a station - '  + stationName);
  http.get(stationlookup(stationName), function(res){
    var body = "";

    res.on("data", function(data){
      body += data;
    });

    res.on("end", function(){
      var result = JSON.parse(body);
      callback(result);
    });

  }).on("error", function(e){
    console.log("Error: " + e);
  });
};

var secondsToMinutes = function(seconds){
	var minutes = Math.floor(parseInt(seconds, 10) / 60);
	return minutes;
};

var returnSingleOrPluralMinutes = function(minutes){
	return "minute" + (minutes == 1 ? '' : 's');
};

var array_key_exists = function(_key, _array){
	for(var key in _array){
	    if(_array[key] == _key){
			return true;
		}
	}
	return false;
};

var handleNextTrainRequest = function(intent, session, response){
  currentStation = intent.slots.station.value;
  if (!array_key_exists(currentStation.toLowerCase(), stopsAsDefined)) {
  	getStationId(currentStation.toLowerCase(), function(data){
    	if(data.matches){
    		getTrainTimes(data.matches[0].id, intent, session, response);
    	} else {
    	  var text = "That station does not exist."
    	  var cardText = text;
    	}
    });
  } else {
    getTrainTimes(stopsAsDefined[currentStation.toLowerCase()], intent, session, response);
  }
};

var getTrainTimes = function(stationId, intent, session, response){
  console.log("getting train times for station id " + stationId);
  getJsonFromMta(stationId, function(data){
    if(data[0].expectedArrival){
      var outboundtrains = new Array();
      var cardText = "The next trains are in : ";
      for (i = 0; i < data.length; i++) {
      	if (data[i].direction == "outbound") {
      		outboundtrains.push(data[i].timeToStation);
      	}
      }
      outboundtrains.sort(function(a, b){return a-b});
      console.log(outboundtrains);
      for (j = 0; j < outboundtrains.length; j++) {
      	var minutes = secondsToMinutes(outboundtrains[j]);
      	cardText += minutes + " " + returnSingleOrPluralMinutes(minutes);
      	if (j < (outboundtrains.length - 2)) {
      		cardText += ", ";
      	} else if (j < (outboundtrains.length - 1)) {
      		cardText += " and ";
      	}
      }
    } else {
      var text = "There are no trains from " + currentStation + " until tomorrow morning.";
      var cardText = text;
    }

    var heading = "Next train for stop: " + currentStation;
    response.tellWithCard(text, heading, cardText);
    });
}

var TrainSchedule = function(){
  AlexaSkill.call(this, APP_ID);
};


const handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNextLondonOverGroundTrainIntent': function () {
        this.emit('handleNextTrainRequest');
    },
    'handleNextTrainRequest': function () {
        currentStation = this.event.request.intent.slots.station.value;
        console.log('currentstation: ' + currentStation);

        // Create speech output
        //const speechOutput = this.t('GET_FACT_MESSAGE') + randomFact;
        //this.emit(':tellWithCard', speechOutput, this.t('SKILL_NAME'), randomFact);
    },
    'Unhandled': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
