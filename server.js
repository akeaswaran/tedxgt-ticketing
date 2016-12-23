'use strict';
require('newrelic');

var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    moment = require('moment'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    winston = require('winston'),
    nodemailer = require('nodemailer'),
    wellknown = require('nodemailer-wellknown'),
    EmailTemplate = require('email-templates').EmailTemplate,
    async = require('async'),
    path = require('path');

//app setup
var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'tedx-georgiatech',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: (new Date()).toLocaleTimeString(),
            colorize: true
        })
    ]
});

logger.level = 'debug';

function handleError(error, type) {
    if (type === 'debug') {
        logger.debug('ERROR: ' + error);
    } else if (type === 'warn') {
        logger.warn('ERROR: ' + error);
    } else {
        logger.info('ERROR: ' + error);
    }
}

/* Passport Setup */
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

require('./models/event');
require('./models/ticket-category');
require('./models/attendee');
require('./models/ticket');
require('./routes')(app);

var templatesDir = __dirname + '/templates';

// Prepare nodemailer transport object
var transport = nodemailer.createTransport({
    service: 'sendgrid',
    auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
    }
});

var Event = require('./controllers/events');


//DB Setup
var mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/ticketing-ake';
mongoose.Promise = require('bluebird');
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', function () {
    throw new Error('unable to connect to database at ' + mongoUri);
});

function isAuthed(req) {
    return (req.isAuthenticated());// || process.env.ENVIRONMENT === 'dev');
}

/* ADMIN PAGES */
app.get('/admin', function (request, response) {
    if (isAuthed(request)) {
        response.redirect('/adminPortal');
    } else {
        response.render('pages/admin-barrier', {
            account: null,
            adminEmail : process.env.ADMIN_EMAIL
        });
    }
});

app.get('/accounts-list', function (request, response) {
    if (isAuthed(request)) {
        mongoose.model('Account').find()
            .where('_id', { $ne: request.user._id } )
            .sort('name')
            .then(
                function(docs) {
                    response.render('pages/accounts-list', {
                        accounts: docs,
                        moment: moment
                    });
                },
                function(error) {
                    if (error) {
                        handleError(err, 'warn');
                        response.send(500);
                    }
                }
            );
    } else {
        response.redirect('/admin');
    }
});

app.get('/adminPortal', function (request, response) {
    if (isAuthed(request)) {
        Event.findAll(request, response, function(err, results) {
            if (err) {
                handleError(err, 'warn');
                return response.send(500);
            }

            response.render('pages/admin-portal', {
                orgName : 'TEDxGeorgiaTech',
                events : results,
                moment: moment,
                account: request.user,
                env: process.env.ENVIRONMENT
            });
        });
    } else {
        response.redirect('/admin');
    }
});

app.get('/accountRequests', function(request, response) {
    if (isAuthed(request) && request.user.isAdmin) {
        mongoose.model('Account').find()
            .where('isAdmin', false)
            .where('approved', false)
            .where('_id', { $ne: request.user._id } )
            .sort('name')
            .then(
                function(docs) {
                    response.render('pages/account-requests', {
                        requests: docs,
                        moment: moment
                    });
                },
                function(error) {
                    if (error) {
                        handleError(err, 'warn');
                        response.send(500);
                    }
                }
            );
    } else {
        response.redirect('/admin');
    }
});

app.post('/requestAccount', function(req, res) {
    Account.register(new Account({ username : req.body.username, name: req.body.name, email: req.body.email, approved: false, isAdmin: false }), req.body.password, function(err, account) {
        if (err) {
            handleError(err, 'warn');
            //return res.render('register', { error : err.message });
            res.send(500);
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    handleError("ERROR IN LOCAL AUTH AFTER REQUESTACCOUNT: " + err, 'warn');
                    res.send(500);
                }
                //res.redirect('/admin', { account : account });
                res.send(200);
            });
        });

        //send notif email to both user and admins
        var userNotifTemplate = new EmailTemplate(path.join(templatesDir, 'request-user-notification'));
        userNotifTemplate.render({ account : account }, function(err, results) {
            if (err) {
                return handleError(err, 'warn');
            }

            transport.sendMail({
                from: 'TEDxGeorgiaTech Event Management System <tedxgeorgiatech@gmail.com>',
                to: account.email,
                subject: 'Account Request for ' + account.name + ' Successful!',
                html: results.html
            }, function (err, responseStatus) {
                if (err) {
                    handleError(err, 'warn');
                }
                handleError(responseStatus.message, 'info');
            })
        });

        var adminRequestTemplate = new EmailTemplate(path.join(templatesDir, 'request-notification'));
        adminRequestTemplate.render({ account : account, host: req.protocol + '://' + req.get('host') }, function (err, results) {
            if (err) {
                return handleError(err, 'warn');
            }

            transport.sendMail({
                from: 'TEDxGeorgiaTech Event Management System <tedxgeorgiatech@gmail.com>',
                to: 'tedxgeorgiatech@gmail.com',
                subject: 'New account request from ' + account.name,
                html: results.html
            }, function (err, responseStatus) {
                if (err) {
                    handleError(err, 'warn');
                }
                handleError(responseStatus.message, 'info');
            });
        });
    });
});

app.post('/login',
    passport.authenticate('local',
        {
        successRedirect: '/adminPortal',
        failureRedirect: '/admin'
        }
    )
);

app.post('/send-deny-email', function(request, response) {
    var requestTemplate = new EmailTemplate(path.join(templatesDir, 'request-denied'));
    requestTemplate.render({}, function (err, results) {
        if (err) {
            response.send(500);
            return handleError(err, 'warn');
        }

        transport.sendMail({
            from: 'TEDxGeorgiaTech Event Management System <tedxgeorgiatech@gmail.com>',
            to: request.body.email,
            subject: 'Account Request Denied',
            html: results.html
        }, function (err, responseStatus) {
            if (err) {
                handleError(err, 'warn');
                response.send(500);
            } else {
                response.send(200);
            }
            handleError(responseStatus.message, 'info');
        });
    });
});

app.post('/send-approve-email', function(request, response) {
    var requestTemplate = new EmailTemplate(path.join(templatesDir, 'request-approved'));
    requestTemplate.render({ host: req.protocol + '://' + req.get('host') }, function (err, results) {
        if (err) {
            response.send(500);
            return handleError(err, 'warn');
        }

        transport.sendMail({
            from: 'TEDxGeorgiaTech Event Management System <tedxgeorgiatech@gmail.com>',
            to: request.body.email,
            subject: 'Account Request Approved!',
            html: results.html
        }, function (err, responseStatus) {
            if (err) {
                handleError(err, 'warn');
                response.send(500);
            } else {
                response.send(200);
            }
            handleError(responseStatus.message, 'info');
        });
    });

});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

app.get('/', function (request, response) {
    Event.findAll(request, response, function(err, results) {
        if (err) {
            handleError(err, 'warn');
            return response.send(500);
        }

        response.render('pages/index', {
            events : results,
            moment: moment
        });
    });
});

app.get('/event/:id', function(req, res) {
    return Event.findById(req, res, function(error, result) {
        if (error) {
            handleError("EVENT GET REQUEST - Could not find event with id " + req.params.id, 'warn');
            res.redirect('/');
        } else {
            res.render('pages/event', {
                event: {
                    _id: result._id,
                    name: result.name,
                    description: result.description,
                    location: result.location,
                    url: result.url,
                    closed: result.closed,
                    ticketCategories: result.ticketCategories,
                    startDate : moment(result.startDate).format('LT'),
                    startDay : moment(result.endDate).format('LL')
                },
                curDate: moment().format('llll')
            });
        }
    });
});

//post listening
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


// catch 404 and forward to error handler
app.use(function(req, res) {
    var err = new Error('Not Found');
    err.status = 404;
    handleError("returning 404 for item " + req.originalUrl + " caused " + err, 'info');
    res.send(404);
});

// development error handler
// will print stacktrace
if (process.env.ENVIRONMENT === 'dev') {
    app.use(function(err, req, res) {
        handleError(err, 'debug');
        res.send(err.status || 500);
    });
}

// production error handler
// no stacktraces leaked to user
if (process.env.ENVIRONMENT === 'prod') {
    app.use(function(err, req, res) {
        handleError(err, 'warn');
        console.log(err);
        res.status(err.status || 500);
    });
}


module.exports = app;