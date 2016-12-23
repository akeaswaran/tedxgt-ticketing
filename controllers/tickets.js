var mongoose = require('mongoose'),
    Ticket = mongoose.model('Ticket');

exports.findAll = function(req, res, callback){
    Ticket.find({})
        .then(function(results) {
            callback(null, results);
        }, function(err) {
            callback(err, []);
        });
};

exports.findById = function(req, res) {
    var id = req.params.id;
    Ticket.find({ _id: id})
        .populate('attendee')
        .populate('ticketCategory')
        .populate('event')
        .then(function(results) {
            res.send(results);
        }, function(err) {
            res.send(err);
        });
};

exports.add = function(req, res) {
    Ticket.create(req.body, function (err, ticket) {
        if (err) return console.log(err);
        return res.send(ticket);
    });
}

exports.update = function(req, res) {
    var id = req.params.id;
    var updates = req.body;
    Ticket.update({'_id' : id}, updates,
        function (err, numberAffected) {
            if (err) return console.log(err);
            console.log('Updated ' + numberAffected.nModified + ' tickets');
            return res.send(202);
        });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    Ticket.remove({'_id':id},function(result) {
        return res.send(result);
    });
};
