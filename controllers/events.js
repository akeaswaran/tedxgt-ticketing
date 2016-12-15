var mongoose = require('mongoose'),
    Event = mongoose.model('Event');
    //sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

//var senderName = process.env.SENDER_NAME;
//var senderEmail = process.env.SENDER_EMAIL;

exports.findAll = function(req, res){
    Event.find({},function(err, results) {
        return res.send(results);
    });
};

exports.findById = function(req, res) {
    var id = req.params.id;
    Event.findOne({'_id' : id}, function(error, result) {
        if (error) return console.log(error);
        return res.send(result);
    })
};

exports.add = function(req, res) {
    Event.create(req.body, function (err, event) {
        if (err) return console.log(err);
        return res.send(event);
    });
}

exports.update = function(req, res) {
    var id = req.params.id;
    console.log('Received event id: ' + id);
    var updates = req.body;
    Event.where({ _id : id}).update({ $set: updates }, function (err, numberAffected) {
        if (err) return console.log('ERROR: ' + err);
        console.log('Updated ' + numberAffected.nModified + ' events');
        return res.send(202);
    });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    Event.remove({'_id':id},function(result) {
        return res.send(result);
    });
};
