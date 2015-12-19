var express = require('express');
var _ = require('underscore');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine', 'jade');

app.get('/', function(req, res) {
    res.render('index');
});
app.use(express.static(__dirname + '/bower_components'));
http.listen(9292, function() {
    console.log('listening on 9292');
});

var all = ['c', 'a', 'b'];
var waitingCmds = [];
var waitingTimeout = null;

var newWrite = function() {
    waitingTimeout = null;
    if (waitingCmds.length) {
        serialPort.write(waitingCmds.shift());
        waitingTimeout = setTimeout(newWrite, 750);
    }
};

var writeId = function(id) {
    if (!waitingTimeout) {
        // not waiting for a write, go ahead and write right away
        serialPort.write(id);
        waitingTimeout = setTimeout(newWrite, 750);
    } else {
        waitingCmds.push(id);
    }
};

io.on('connection', function(socket) {
    socket.on('switch', function(id) {
        console.log('toggling switch: ' + id);
        writeId(id);
    });
    socket.on('all', function() {
        console.log('toggling all off');
        all.forEach(function(id) {
            writeId(id);
        });
    });
});

var SerialPort = require('serialport').SerialPort;

var serialPort = null;
var openSerialPort = function(err) {
    if (serialPort) {
        serialPort.close(function() {
            serialPort = null;
            setTimeout(openSerialPort, 1000);
        });
    } else {
        serialPort = new SerialPort('/dev/ttyUSB1', {
            baudrate: 9600
        }, false);

        serialPort.on('error', function(err) {
            setTimeout(function() {
                console.log('serial port error: ' + err);
                console.log('retrying in 1000 ms...');
                openSerialPort();
            }, 1000);
        });
        serialPort.open(function(err) {
            if (err) {
                console.log('failed to open serial: ' + err);
                console.log('retrying in 1000 ms...');
                openSerialPort();
            } else {
                console.log('serial opened');
            }
        });
    }
};

openSerialPort();
