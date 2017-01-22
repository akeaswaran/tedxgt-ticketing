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
    stripe = require('stripe')(process.env.STRIPE_API_SECRET_KEY),
    csv = require('express-csv'),
    momenttz = require('moment-timezone'),
    sa = require('superagent');

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

app.get('/forms', function(req, res) {
    res.render('pages/forms');
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

app.get('/adminPortal', function (request, response) {
    if (isAuthed(request)) {
        Event.findAll(request, response, function(err, results) {
            if (err) {
                handleError(err, 'warn');
                response.send(500);
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

        if (process.env.ENVIRONMENT === 'prod') {
            sa.post(process.env.SLACK_WEBHOOK_URL)
                .send({
                    "username": "tedxbot",
                    "icon_emoji": ":x:",
                    "channel": "@akeaswaran",
                    "attachments":[
                        {
                            "fallback": "New account request: " + account.name + " (@" + account.username + ") <https://tedxgeorgiatech.com/accountRequests|View all requests>",
                            "pretext": "New account request: " + account.name + " (@" + account.username + ") <https://tedxgeorgiatech.com/accountRequests|View all requests>",
                            "color":"#830F00",
                            "fields":[
                                {
                                    "title": "Name: " + account.name,
                                    "value": "@" + account.username + ", \<mailto:" + account.email + "|" + account.email + ">",
                                    "short": false
                                }
                            ]
                        }
                    ]
                })
                .end(function(err, response) {
                    if (err) {
                        console.log(err);
                    }
                });
        }

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
    mongoose.model('Event').find({ 'live' : true })
        .populate('attendees')
        .populate('ticketCategories')
        .then(function(results) {
            response.render('pages/index', {
                events : results,
                moment: momenttz
            });
        }, function(err) {
            if (err) {
                handleError(err, 'warn');
            }

            response.render('pages/index', {
                events : [],
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
                moment: momenttz,
                event: {
                    _id: result._id,
                    name: result.name,
                    description: result.description,
                    location: result.location,
                    url: result.url,
                    closed: result.closed,
                    ticketCategories: result.ticketCategories,
                    startDate: momenttz.tz(result.startDate, 'America/New_York'),
                    endDate: momenttz.tz(result.endDate, 'America/New_York')
                },
                stripePublicKey: process.env.STRIPE_API_PUBLIC_KEY
            });
        }
    });
});

/* HANDLING PAYMENTS */
app.post('/charge', function(req, res) {
    var stripeToken = req.body.token;
    var tcData = req.body.tcData;
    var attendeeData = req.body.attData;
    //console.log('TCDATA: ' + JSON.stringify(tcData, null, '\t'));

    mongoose.model('Event').findOne({ _id: tcData.event }, function(err, event) {
        if (err) {
            console.log("EVENT FIND: " + err);
            return res.send(500, { error: err });
        }

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
                    //console.log("CHARGE CREATE: " + err);
                    res.send(500, err);
                } else {
                    handleChargeResult(res, attendeeData, tcData, function(ticket) {
                        res.send({
                            ticket: ticket,
                            status: 'ok',
                            message: 'success'
                        });
                    });
                }
            }
        );
    });
});

function handleChargeResult(res, attendeeData, tcData, callback) {
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

                callback(ticket);
            });
    });
}

app.post('/reservation', function(req, res) {
    var tcData = req.body.tcData;
    var attendeeData = req.body.attData;
    handleChargeResult(res, attendeeData, tcData, function(tck) {
        res.send({
            ticket: tck,
            status: 'ok',
            message: 'success'
        });

        Ticket.find({ _id: tck._id })
            .populate('attendee')
            .populate('ticketCategory')
            .populate('event')
            .limit(1)
            .then(function(ticketResults) {
                var regTemplate = new EmailTemplate(path.join(templatesDir, 'reservation-confirmation'));
                var ticket = ticketResults[0];
                regTemplate.render({
                    ticket: ticket,
                    moment: momenttz
                }, function(err, results) {
                    if (err) {
                        return handleError(err, 'warn');
                    }

                    transport.sendMail({
                        from: 'TEDxGeorgiaTech <tedxgeorgiatech@gmail.com>',
                        to: ticket.attendee.email,
                        subject: 'Confirmation for Order ' + ticket._id,
                        html: results.html
                    }, function (err, responseStatus) {
                        if (err) {
                            return handleError(err, 'warn');
                        } else {
                            return handleError(responseStatus.message, 'info');
                        }
                    });
                });
            }, function(err) {
                return handleError(err, 'warn');
            });

    });
});

app.get('/confirmation/:tId', function(req, res) {
   var ticketId = req.params.tId;
   Ticket.find({ _id: ticketId})
         .populate('attendee')
         .populate('ticketCategory')
         .populate('event')
         .limit(1)
         .then(function(results) {
             res.render('pages/confirmation', {
                 ticket: results[0],
                 moment: moment
             });
         }, function(err) {
             res.send(err);
         });
});

app.get('/ticket-category/:id/csv', function(req, res) {
    mongoose.model('TicketCategory').find()
        .where('_id', req.params.id)
        .populate('tickets')
        .deepPopulate('tickets.attendee')
        .sort('name')
        .then(
            function(docs) {
                var tc = docs[0];
                var csv = [];
                tc.tickets.forEach(function(ticket) {
                    csv.push({name: ticket.attendee.name, email:ticket.attendee.email })
                });
                res.csv(csv);
            },
            function(error) {
                if (error) {
                    handleError(err, 'warn');
                    res.send(500);
                }
            }
        );
});


app.get('/event/:id/attendees/csv', function(req, res) {
    mongoose.model('Event').find()
        .where('_id', req.params.id)
        .populate('attendees')
        .sort('name')
        .then(
            function(docs) {
                var event = docs[0];
                var csv = [];
                event.attendees.forEach(function(attendee) {
                    csv.push({name: attendee.name, email:attendee.email })
                });
                res.csv(csv);
            },
            function(error) {
                if (error) {
                    handleError(err, 'warn');
                    res.send(500);
                }
            }
        );
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