
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var Aerogel = require('../index');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var mSocket;

io.sockets.on('connection', function (socket) {
  mSocket = socket;

  //startCF();

  mSocket.on('command', function (data) {
  	console.log(data);
    if(data.action == 'start'){
    	takeOff();
    }else if(data.action == 'stop'){
    	land();
    }
  });

  mSocket.on('disconnect', function () {
        console.log('Shutting down crazyflie...');
        //bail();
    });
});





// crazy flie

var driver;
var copter;
process.on('SIGINT', bail);


function bail()
{
    return copter.shutdown()
}

function land()
{
    copter.land()
    //.then(function() { return copter.shutdown(); })
    .then(function(response)
    {
        console.log(response);
        //process.exit(0);
        if(mSocket){
    		mSocket.emit('end', 0);	
 		}   	
    
    })
    .fail(function(err)
    {
        console.log(err);
        copter.shutdown()
        .then(function(response)
        {
            console.log(response);
            //process.exit(1);
        });
    })
    .done();
}


function takeOff(){

	copter.takeoff()
	.then(function()
	{
	    //setTimeout(land, 30000);
	    return copter.hover();
	})
	.fail(function(err)
	{
	    console.log(err);
	    console.log(err.stack);
	    bail();
	})
	.done();
}


function startCF(){
	driver = new Aerogel.CrazyDriver();
	copter = new Aerogel.Copter(driver);
	driver.findCopters()
	.then(function(copters)
	{
	    if (copters.length === 0)
	    {
	        console.error('No copters found! Is your copter turned on?');
	        if(mSocket){
    			mSocket.emit('message', "No copters found! Is your copter turned on?");	
    		}
	       // process.exit(1);
	    }

	    var uri = copters[0];

	    for(var i=0; i < copters.length;i++){
	    console.log(copters[i]);    
	    }
	    console.log('Using copter at', uri);
	    return uri;
	})
	.then(function(uri) { return copter.connect(uri); })
	.then(function(){
		copter.driver.telemetry.subscribe('battery', handleBatteryTelemetry.bind(copter));
		copter.driver.telemetry.subscribe('motor', handleMotorTelemetry.bind(copter));
	    copter.driver.telemetry.subscribe('stabilizer', handleStabilizerTelemetry.bind(copter));
	    copter.driver.telemetry.subscribe('accelerometer', handleAccelerometerTelemetry.bind(copter));
	    copter.driver.telemetry.subscribe('gyro', handleGyroTelemetry.bind(copter));
	})
	.fail(function(err)
	{
	    console.log(err);
	    console.log(err.stack);
	    bail();
	})
	.done();
}


function handleBatteryTelemetry(data){
    if(mSocket){
    	mSocket.emit('battery', data);		
    }
    
	
}

function handleMotorTelemetry(data){
    if(mSocket){
    	mSocket.emit('motor', data);		
    }
    
	
}

function handleStabilizerTelemetry(data){
    if(mSocket){
    	mSocket.emit('stabilizer', data);	
 	}   	
    
}

function handleAccelerometerTelemetry(data){
    if(mSocket){
    	mSocket.emit('accelerometer', data);	
    }
    
}

function handleGyroTelemetry(data){
    if(mSocket){
    	mSocket.emit('gyro', data);	
    }
    
}


