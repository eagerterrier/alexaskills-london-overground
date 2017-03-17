'use strict';

const Alexa = require('alexa-sdk');

var http       = require("https")
  , APP_ID     = "amzn1.ask.skill.1371f436-66d4-4b57-b1a1-b1700e3e9607"
  , TFL_KEY    = "a2a0722e5dafa0984d493e6a5423ce04"
  , TFL_APP_ID = "88eef1cb"
  , currentStation = ""
  , currentDirection = "outbound"
  , debug = true
  , currentStation_id = null;

const languageStrings = {
    'en-GB': {
        translation: {
            SINGLE_AVAILABLE_TRAIN : 'The next train is in',
            MULTIPLE_AVAILABLE_TRAINS : 'The next trains are in',
            ONLY_ARRIVALS : 'Sorry, TFL currently only provide arrivals and not departures, so stations at the end of the line do not have outbound times.',
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

var stopsAsDefined = {"acton central" : "910GACTNCTL", "anerley" : "910GANERLEY", "barking" : "910GBARKING", "bush hill park" : "910GBHILLPK", "blackhorse road" : "910GBLCHSRD", "brondesbury" : "910GBRBY", "brondesbury park" : "910GBRBYPK", "brockley" : "910GBROCKLY", "bruce grove" : "910GBRUCGRV", "bethnal green" : "910GBTHNLGR", "bushey" : "910GBUSHYDC", "cambridge heath" : "910GCAMHTH", "cheshunt" : "910GCHESHNT", "chingford" : "910GCHINGFD", "clapton" : "910GCLAPTON", "caledonian road & barnsbury" : "910GCLDNNRB", "clapham high street" : "910GCLPHHS", "clapham junction" : "910GCLPHMJ1", "camden road" : "910GCMDNRD", "canada water" : "910GCNDAW", "canonbury" : "910GCNNB", "crouch hill" : "910GCROUCHH", "carpenders park" : "910GCRPNDPK", "crystal palace" : "910GCRYSTLP", "imperial wharf" : "910GCSEAH", "dalston junction" : "910GDALS", "dalston kingsland" : "910GDALSKLD", "denmark hill" : "910GDENMRKH", "edmonton green" : "910GEDMNGRN", "emerson park" : "910GEMRSPKH", "enfield town" : "910GENFLDTN", "london euston" : "910GEUSTON", "finchley road & frognal" : "910GFNCHLYR", "forest hill" : "910GFORESTH", "gunnersbury" : "910GGNRSBRY", "gospel oak" : "910GGOSPLOK", "hackney central" : "910GHACKNYC", "hackney wick" : "910GHACKNYW", "haggerston" : "910GHAGGERS", "hackney downs" : "910GHAKNYNM", "harlesden" : "910GHARLSDN", "headstone lane" : "910GHEDSTNL", "highbury & islington" : "910GHGHI", "highams park" : "910GHGHMSPK", "hampstead heath" : "910GHMPSTDH", "homerton" : "910GHOMRTON", "honor oak park" : "910GHONROPK", "hoxton" : "910GHOXTON", "harringay green lanes" : "910GHRGYGL", "harrow & wealdstone" : "910GHROW", "hatch end" : "910GHTCHEND", "kensington olympia" : "910GKENOLYM", "kensington" : "910GKENOLYM", "olympia" : "910GKENOLYM", "kensal rise" : "910GKENR", "kensal green" : "910GKENSLG", "kew gardens" : "910GKEWGRDN", "kilburn high road" : "910GKLBRNHR", "kentish town west" : "910GKNTSHTW", "kenton" : "910GKTON", "leyton midland road" : "910GLEYTNMR", "london liverpool street" : "910GLIVST", "london fields" : "910GLONFLDS", "leytonstone high road" : "910GLYTNSHR", "new cross gate" : "910GNEWXGTE", "norwood junction" : "910GNORWDJ", "new cross ell" : "910GNWCRELL", "north wembley" : "910GNWEMBLY", "queens road peckham" : "910GPCKHMQD", "peckham rye" : "910GPCKHMRY", "penge west" : "910GPENEW", "queens park" : "910GQPRK", "rectory road" : "910GRCTRYRD", "richmond" : "910GRICHMND", "romford" : "910GROMFORD", "rotherhithe" : "910GRTHERHI", "south acton" : "910GSACTON", "southbury" : "910GSBURY", "seven sisters" : "910GSEVNSIS", "shadwell" : "910GSHADWEL", "south hampstead" : "910GSHMPSTD", "shepherds bush" : "910GSHPDSB", "shoreditch high street" : "910GSHRDHST", "silver street" : "910GSIVRST", "south kenton" : "910GSKENTON", "stratford" : "910GSTFD", "st james street" : "910GSTJMSST", "stoke newington" : "910GSTKNWNG", "stamford hill" : "910GSTMFDHL", "stonebridge park" : "910GSTNBGPK", "south tottenham" : "910GSTOTNHM", "surrey quays" : "910GSURREYQ", "sydenham" : "910GSYDENHM", "theobalds grove" : "910GTHBLDSG", "turkey street" : "910GTURKYST", "upminster" : "910GUPMNSTR", "upper holloway" : "910GUPRHLWY", "wapping" : "910GWAPPING", "watford high street" : "910GWATFDHS", "watford junction" : "910GWATFDJ", "west brompton" : "910GWBRMPTN", "whitechapel" : "910GWCHAPEL", "west croydon" : "910GWCROYDN", "woodgrange park" : "910GWDGRNPK", "wood street" : "910GWDST", "white hart lane" : "910GWHHRTLA", "west hampstead" : "910GWHMDSTD", "willesden junction" : "910GWLSDJHL", "walthamstow queens road" : "910GWLTHQRD", "walthamstow central" : "910GWLTWCEN", "wembley central" : "910GWMBY", "wandsworth road" : "910GWNDSWRD", "wanstead park" : "910GWNSTDPK"};


var url = function(stopId){
    return "https://api-argon.tfl.gov.uk/Line/london-overground/Arrivals?stopPointId=" + stopId + "&app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID;
};

var stationlookup = function(stationName){
    return "https://api.tfl.gov.uk/Line/london-overground/StopPoints?app_key=" + TFL_KEY + "&app_id=" + TFL_APP_ID;
};

var log = function(log_what){
    if (!debug) return;
    console.log(log_what);
}

var getJsonFromMta = function(stopId, callback){
    log('requesting getJsonFromMta');
    log(url(stopId));
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
    log(stationlookup(stationName));
  
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
        log('we have data:');
        log(data);
        if(data.length && data[0].expectedArrival){
            var outboundtrains = new Array();
            var outboundtrainDestinations = new Array();
            var lastTrainDestination = '';
            var totalTrainDestinations = 0;
            var trainDestination = '';
            var text = that.t('FOUND_TRAINS');
            var cardText = ((data.length == 1) ? that.t('SINGLE_AVAILABLE_TRAIN') : that.t('MULTIPLE_AVAILABLE_TRAINS')) + " : ";
            for (var i = 0; i < data.length; i++) {
            	if (data[i].direction == currentDirection || (data[i].direction == '' && currentDirection == 'inbound')) {
            		outboundtrains.push(data[i].timeToStation);
            		trainDestination = data[i].destinationName.replace(' (London) Rail Station', '');
            		outboundtrainDestinations.push(trainDestination);
            		if (lastTrainDestination != trainDestination) {
            		    totalTrainDestinations++;
            		}
            		lastTrainDestination = trainDestination;
            	} else if (data[i].direction == '' && currentDirection == 'outbound') {
            	    cardText = that.t('ONLY_ARRIVALS');
            	}
            }
            if (totalTrainDestinations > 0) {
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
            }
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
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'GetNextLondonOverGroundTrainIntent': function () {
        log('GetNextLondonOverGroundTrainIntent');
        this.emit('handleNextTrainRequest');
    },
    'handleNextTrainRequest': function () {
        log('handle next train request');
        if (!this.event.request.intent.slots.station.hasOwnProperty('value')) {
            log('no station asked for');
            const speechOutput = this.t('HELP_MESSAGE');
            const reprompt = this.t('HELP_MESSAGE');
            this.emit(':ask', speechOutput, reprompt);
        } else {
            currentStation = this.event.request.intent.slots.station.value;
            currentDirection = (this.event.request.intent.slots.hasOwnProperty('inboundOrOutbound') && this.event.request.intent.slots.inboundOrOutbound.hasOwnProperty('value')) ? this.event.request.intent.slots.inboundOrOutbound.value : 'outbound';
            log('currentstation: ' + currentStation);
            log('currentDirection: ' + currentDirection);
            if (!array_key_exists(currentStation.toLowerCase(), stopsAsDefined)) {
                var self = this;
            	var tflResponse = getStationId(currentStation.toLowerCase(), function(data){
            	    log('we have matches');
              	    if(data.length){
            	        log('we have data');
              	        for (var i = 0; i < data.length; i++) {
              	            console.log(data[i]);
              	            if (data[i].commonName.toLowerCase().search(currentStation.toLowerCase())) {
              	    	        getTrainTimes(data.matches[i].id, self.event.request.intent, self.event.request.session, self.event.request.response, self);
              	    	        break;
              	    	    }
              	    	}
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
