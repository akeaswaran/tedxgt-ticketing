var express = require('express'),
mongoose = require('mongoose'),
bodyParser = require('body-parser'),
fs = require('fs'),
sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var moment = require('moment');

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/ticketing-ake';
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoUri);
});

var app = express();

//App setup
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

require('./models/event');
require('./models/attendee');
require('./models/ticket');
require('./routes')(app);

/* ADMIN PAGES */
app.get('/admin', function (request, response) {
    response.render('pages/adminBarrier', { adminKey : process.env.adminKey });
});

app.get('/adminPortal', function (request, response) {
    return mongoose.model('Event').find( function(error, results) {
        if (error) {
            console.log('ERROR: ' + error);
        }

        response.render('pages/adminPortal', {
            orgName : 'TEDxGeorgiaTech',
            events : results,
            moment: moment
        });
    });
});

app.get('/admin/events-list', function(req, res) {
    return mongoose.model('Event').find(function(error, result) {
        if (error) {
            res.redirect('/adminPortal');
        } else {
            res.render('pages/events-list', {
                event: result
            });
        }
    });
});

app.get('/admin/attendees-list', function(req, res) {
    return mongoose.model('Attendees').find(function(error, result) {
        if (error) {
            res.redirect('/adminPortal');
        } else {
            res.render('pages/events-list', {
                event: result
            });
        }
    });
});

app.get('/admin/event/:id/attendees', function(req, res) {
    return mongoose.model('Event').findOne({'_id' : req.params.id}, function(error, result) {
        if (error) {
            console.log("Could not find event with id " + req.params.id);
            res.redirect('/adminPortal');
        } else {
            res.render('pages/attendee-list', {
                event: result
            });
        }
    });
});

app.get('/admin/event/:id/tickets', function(req, res) {
    return mongoose.model('Event').findOne({'_id' : req.params.id}, function(error, result) {
        if (error) {
            console.log("Could not find event with id " + req.params.id);
            res.redirect('/adminPortal');
        } else {
            res.render('pages/ticket-list', {
                event: result
            });
        }
    });
});

app.get('/admin/event/:id/settings', function(req, res) {
    return mongoose.model('Event').findOne({'_id' : req.params.id}, function(error, result) {
        if (error) {
            console.log("Could not find event with id " + req.params.id);
            res.redirect('/adminPortal');
        } else {
            res.render('pages/event-settings', {
                event: result
            });
        }
    });
});

/* USER-FACING PAGES */
app.get('/', function (request, response) {
    response.render('pages/index');
});

app.get('/event/:id', function(req, res) {
    return mongoose.model('Event').findOne({'_id' : req.params.id}, function(error, result) {
        if (error) {
            console.log("Could not find event with id " + req.params.id);
            res.redirect('/');
        } else {
            res.render('pages/event', {
                event: result
            });
        }
    });
});

//post listening
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
