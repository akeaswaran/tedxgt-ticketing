var express = require('express'),
mongoose = require('mongoose'),
bodyParser = require('body-parser'),
fs = require('fs'),
sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var moment = require('moment');

var mongoUri =
    process.env.MONGOLAB_URI ||
    'mongodb://localhost/ticketing-ake';
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

app.get('/', function(request, response) {
    response.render('pages/index');
});

// app.get('/event/:id', function(req, res) {
//     var Event = mongoose.model('Event');
//     Event.findOne({'_id' : req.params.id}, function(error, result) {
//         if (error) {
//             console.log("Could not find event with id " + req.params.id);
//             res.redirect('/');
//         } else {
//             res.render('pages/event', {
//                 event: result
//             });
//         }
//     });
//
//     // res.render('pages/event', {
//     //     event: {
//     //         name: "TEST",
//     //         description: "TEST",
//     //         location: "123 test ln",
//     //         startDate: moment(),
//     //         endDate:moment().startOf('day'),
//     //         url: "https://google.com",
//     //         attendees: [],
//     //         tickets: [],
//     //         numTickets: 100,
//     //         miscData: [],
//     //         closed: false
//     //     }
//     // });
//
// });

//post listening
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
