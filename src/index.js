'use strict';

const Alexa = require('alexa-sdk');

var http       = require("https")
  , APP_ID     = "amzn1.ask.skill.1371f436-66d4-4b57-b1a1-b1700e3e9607"
  , TFL_KEY    = "a2a0722e5dafa0984d493e6a5423ce04"
  , TFL_APP_ID = "88eef1cb"
  , currentStation = ""
  , currentDirection = "outbound"
  , debug = false
  , currentStation_id = null;

const languageStrings = {
    'en-GB': {
        translation: {
            SINGLE_AVAILABLE_TRAIN : 'The next train is in',
            MULTIPLE_AVAILABLE_TRAINS : 'The next trains are in',
            NO_AVAILABLE_TRAINS : '',
            FOUND_TRAINS : 'I have found some trains for you.',
            AND : 'and',
            SKILL_NAME: 'Next Trains on the London Overground',
            HELP_MESSAGE: 'You can say get the next train from and then say a station name, so for instance get the next train from Homerton',
            WELCOME_MESSAGE: 'To find out when the next train leaves an overgound station, simply ask \'when is the next outbound train from\' and then add your station name. So, for example, \'when is the next outbound train from Homerton?\'',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Have a safe journey!',
        },
    }
};

var stopsAsDefined = {"homerton" : "910GHOMRTON", "kentish town west" : "910GKNTSHTW"};


var url = function(stopId){
    return "https://api-argon.tfl.gov.uk/Line/london-overground/Arrivals?stopPointId=" + stopId + "&app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID;
};

var stationlookup = function(stationName){
    return "https://api-argon.tfl.gov.uk/StopPoint/Search?query=" + encodeURIComponent(stationName) + "&modes=overground&app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID;
};

var log = function(log_what){
    if (!debug) return;
    console.log(log_what);
}

var getJsonFromMta = function(stopId, callback){
    log('requesting getJsonFromMta');
    
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
    log('getting a station - '  + stationName);
  
    var req = http.request(stationlookup(stationName), (res) => {

        var body = '';

        res.on('data', (d) => {
            body += d;
        });

        res.on('end', function () {
            callback(body);
        });

    });
    req.end();

    req.on('error', (e) => {
        console.error(e);
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
	return _array.hasOwnProperty(_key);
};

var ucwords = function(string){
    return (string + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
      return $1.toUpperCase()
    });
}

var getTrainTimes = function(stationId, intent, session, response, that){

    log("getting train times for station id " + stationId);

    getJsonFromMta(stationId, function(data){
        if(data[0].expectedArrival){
            var outboundtrains = new Array();
            var outboundtrainDestinations = new Array();
            var lastTrainDestination = '';
            var totalTrainDestinations = 0;
            var trainDestination = '';
            var text = that.t('FOUND_TRAINS');
            var cardText = ((data.length == 1) ? that.t('SINGLE_AVAILABLE_TRAIN') : that.t('MULTIPLE_AVAILABLE_TRAINS')) + " : ";
            for (var i = 0; i < data.length; i++) {
            	if (data[i].direction == currentDirection) {
            		outboundtrains.push(data[i].timeToStation);
            		trainDestination = data[i].destinationName.replace(' (London) Rail Station', '');
            		outboundtrainDestinations.push(trainDestination);
            		if (lastTrainDestination != trainDestination) {
            		    totalTrainDestinations++;
            		}
            		lastTrainDestination = trainDestination;
            	}
            }
            outboundtrains.sort(function(a, b){return a-b});
            log(outboundtrains);
            for (var j = 0; j < outboundtrains.length; j++) {
                var minutes = secondsToMinutes(outboundtrains[j]);
            	cardText += minutes + " " + returnSingleOrPluralMinutes(minutes);
            	if (j < (outboundtrains.length - 2)) {
            		cardText += ", ";
            	} else if (j < (outboundtrains.length - 1)) {
            		cardText += " " + that.t('AND') + " ";
            	}
            }
            console.log('totalTrainDestinations: ' + totalTrainDestinations);
            console.log('outboundtrainDestinations length: ' + outboundtrainDestinations.length);
            if (totalTrainDestinations != 1) {
                cardText += ' in the direction of ';
                for (var k = 0; k < outboundtrainDestinations.length; k++) {
                	cardText += outboundtrainDestinations[k];
                	if (k < (outboundtrainDestinations.length - 2)) {
                		cardText += ", ";
                	} else if (k < (outboundtrainDestinations.length - 1)) {
                		cardText += " " + that.t('AND') + " ";
                	}
                }
                cardText += ' respectively';
            } else {
                cardText += ' all heading for ' + outboundtrainDestinations[0];
            }
            text = text + '\n\n' + cardText;
        } else {
            var text = "There are no trains from " + ucwords(currentStation) + " until tomorrow morning.";
            var cardText = text;
        }
    
        var heading = "Next train for stop: " + ucwords(currentStation);
        that.emit(':tellWithCard', cardText, heading, text);
    });
}


const handlers = {
    'LaunchRequest': function () {
        const speechOutput = this.t('WELCOME_MESSAGE'); 
        this.emit(':tell', speechOutput);
    },
    'GetNextLondonOverGroundTrainIntent': function () {
        this.emit('handleNextTrainRequest');
    },
    'handleNextTrainRequest': function () {
        if (!this.event.request.intent.slots.station.hasOwnProperty('value')) {
            const speechOutput = this.t('HELP_MESSAGE');
            const reprompt = this.t('HELP_MESSAGE');
            this.emit(':ask', speechOutput, reprompt);
        } else {
            currentStation = this.event.request.intent.slots.station.value;
            currentDirection = (this.event.request.intent.slots.hasOwnProperty('inboundOrOutbound') && this.event.request.intent.slots.inboundOrOutbound.hasOwnProperty('value')) ? this.event.request.intent.slots.inboundOrOutbound.value : 'outbound';
            log('currentstation: ' + currentStation);
            log('currentDirection: ' + currentDirection);
            log('stopsAsDefined: ');
            log(stopsAsDefined);
            if (!array_key_exists(currentStation.toLowerCase(), stopsAsDefined)) {
            	var tflResponse = getStationId(currentStation.toLowerCase(), function(data){
              	if(data.matches){
              		getTrainTimes(data.matches[0].id, this.event.request.intent, this.event.request.session, this.event.request.response, this);
              	} else {
              	  var text = "That station does not exist."
              	  var cardText = text;
              	}
              });
            } else {
              var tflResponse = getTrainTimes(stopsAsDefined[currentStation.toLowerCase()], this.event.request.intent, this.event.request.session, this.event.request.response, this);
            }
            log(tflResponse);
        }
    },
    'Unhandled': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
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
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    //alexa.dynamoDBTableName = 'stationFavourites';
    alexa.registerHandlers(handlers);
    alexa.execute();
};
