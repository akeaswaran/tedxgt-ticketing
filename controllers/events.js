var mongoose = require('mongoose'),
    Event = mongoose.model('Event'),
    sa = require('superagent'),
    moment = require('moment-timezone');

exports.findAll = function(req, res, callback){
    Event.find({})
        .populate('attendees')
        .populate('ticketCategories')
        .then(function(results) {
            callback(null, results);
        }, function(err) {
            callback(err, []);
        });
};

exports.findById = function(req, res, callback) {
    var id = req.params.id;
    Event.find({_id : id})
        .populate('attendees')
        .populate('ticketCategories')
        .limit(1)
        .then(function(results) {
            callback(null, results[0]);
        }, function(err) {
            callback(err, {});
        });
};

exports.add = function(req, res) {
    Event.create(req.body, function (err, event) {
        if (err) return console.log(err);

        if (process.env.ENVIRONMENT === 'prod') {
            var cleanDescrip = event.description
                .replace(/<br>/gi, "\n")
                .replace(/<p.*>/gi, "\n")
                .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1) ")
                .replace(/<(?:.|\s)*?>/g, "");
            sa.post(process.env.SLACK_WEBHOOK_URL)
                .send({
                    "username": "tedxbot",
                    "icon_emoji": ":x:",
                    "channel": "@akeaswaran",
                    "attachments":[
                        {
                            "fallback": "New event created: <https://tedxgeorgiatech.com/event/" + event._id + "|More details>",
                            "pretext": "New event created: <https://tedxgeorgiatech.com/event/" + event._id + "|More details>",
                            "color":"#830F00",
                            "title": event.name + " (" + moment.tz(event.startDate, 'America/New_York').format('LLL') + ")",
                            "title_link" : "https://tedxgeorgiatech.com/event/" + event._id,
                            "fields":[
                                {
                                    "title": event.name + " (" + moment.tz(event.startDate, 'America/New_York').format('LLL') + ")",
                                    "text": cleanDescrip,
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

            /*
            */
        }

        return res.send(event);
    });
}

exports.update = function(req, res) {
    var id = req.params.id;
    console.log('Received event id: ' + id);
    var updates = req.body;
    Event.update({ _id: id }, updates, function (err, raw) {
        if (err) return console.log('ERROR: ' + err);
        console.log('Updated ' + raw.nModified + ' events');
        return res.send(202);
    });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    Event.remove({'_id':id}, function(result) {
        return res.send(result);
    });
};
