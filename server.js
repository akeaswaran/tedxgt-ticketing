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
    path = require('path'),
    stripe = require('stripe')(process.env.STRIPE_API_SECRET_KEY);

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
var Attendee = mongoose.model('Attendee');
var Ticket = mongoose.model('Ticket');

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

app.get('/.well-known/acme-challenge/D7P6mMA3QJ9yv6_4D-YJKTDpRMu3UMcP6X5oKiHvPO0', function (req, res) {
   return res.send('D7P6mMA3QJ9yv6_4D-YJKTDpRMu3UMcP6X5oKiHvPO0.GZEsEveplCw8jE-uFO_ZOHHElrazVJjR8CBZUCxxhiU');
});

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

app.get('/attendees-list', function (request, response) {
    if (isAuthed(request)) {
        mongoose.model('Event').find()
            .populate('attendees')
            .populate('ticketCategories')
            .sort('name')
            .then(
                function(docs) {
                    response.render('pages/attendees-list', {
                        events: docs,
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

app.get('/admin/event/:id/attendees', function(req, res) {
    if (isAuthed(req)) {
        mongoose.model('Event').find()
            .where('_id', req.params.id)
            .populate('attendees')
            .sort('name')
            .then(
                function(docs) {
                    res.render('pages/attendees', {
                        event: docs[0],
                        moment: moment
                    });
                },
                function(error) {
                    if (error) {
                        handleError(err, 'warn');
                        res.send(500);
                    }
                }
            );
    } else {
        res.redirect('/admin');
    }
});

app.get('/admin/event/:id/tickets', function (req, res) {
    if (isAuthed(req)) {
        mongoose.model('Event').find()
            .where('_id', req.params.id)
            .populate('ticketCategories')
            .deepPopulate('ticketCategories.tickets ticketCategories.tickets.attendee')
            .sort('name')
            .then(
                function(docs) {
                    res.render('pages/tickets', {
                        event: docs[0],
                        moment: moment
                    });
                },
                function(error) {
                    if (error) {
                        handleError(err, 'warn');
                        res.send(500);
                    }
                }
            );
    } else {
        res.redirect('/admin');
    }
});

app.get('/tickets-list', function(req, res) {
    if (isAuthed(req)) {
        mongoose.model('Event').find()
            .populate('ticketCategories')
            .deepPopulate('ticketCategories.tickets ticketCategories.tickets.attendee')
            .sort('name')
            .then(
                function(docs) {
                    res.render('pages/tickets-list', {
                        events: docs,
                        moment: moment
                    });
                },
                function(error) {
                    if (error) {
                        handleError(err, 'warn');
                        res.send(500);
                    }
                }
            );
    } else {
        res.redirect('/admin');
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
    Event.findById(req, res, function(error, result) {
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
                stripePublicKey: process.env.STRIPE_API_PUBLIC_KEY,
                curDate: moment().format('llll')
            });
        }
    });
});

/* HANDLING PAYMENTS */
app.post('/charge', function(req, res) {
    var stripeToken = req.body.token;
    var tcData = req.body.tcData;
    var attendeeData = req.body.attData;
    console.log('TCDATA: ' + JSON.stringify(tcData, null, '\t'));

    mongoose.model('Event').findOne({ _id: tcData.event }, function(err, event) {
        if (err) {
            console.log("EVENT FIND: " + err);
            return res.send(500, { error: err });
        }
        console.log('TOKEN: ' + JSON.stringify(stripeToken, null, '\t'));

        stripe.charges.create({
                source: stripeToken.id,
                currency: 'usd',
                amount: (tcData.price * 100), //converting to cents
                description: "Ticket for " + tcData.name  + " section in event " + event.name,
                receipt_email: attendeeData.email,
                statement_descriptor: 'TEDxGT Event Ticket'
            },
            function(err, charge) {
                if (err) {
                    console.log("CHARGE CREATE: " + err);
                    res.send(500, err);
                } else {
                    handleChargeResult(res, attendeeData, tcData);
                }
            }
        );
    });
});

function handleChargeResult(res, attendeeData, tcData) {
    //create attendee
    Attendee.create(attendeeData, function (err, attendee) {
        if (err) {
            console.log("ATTENDEE CREATE: " + err);
            return res.send(500);
        }

        //create ticket --> attach attendee, event, and TC to ticket
        Ticket.create(
            {
                event: tcData.event,
                ticketCategory: tcData._id,
                attendee: attendee._id
            }, function(err, ticket) {
                if (err) {
                    console.log(err);
                    res.send({
                        ticket: null,
                        status: 'bad',
                        message: err
                    });
                }

                res.send({
                    ticket: ticket,
                    status: 'ok',
                    message: 'success'
                });
            });
    });
}

app.get('/confirmation/:tId', function(req, res) {
   var ticketId = req.params.tId;
   Ticket.find({ _id: ticketId})
         .populate('attendee')
         .populate('ticketCategory')
         .populate('event')
         .limit(1)
         .then(function(results) {
             //console.log("CONF TICKET RES: " + JSON.stringify(results, null, '\t'));
             res.render('pages/confirmation', {
                 ticket: results[0],
                 moment: moment
             });
         }, function(err) {
             res.send(err);
         });
});

//port listening
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