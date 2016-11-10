var mongoose = require('mongoose'),
    Ticket = mongoose.model('Ticket');

exports.findAll = function(req, res){
    Ticket.find({},function(err, results) {
        return res.send(results);
    });
};

exports.findById = function(req, res) {
    var id = req.params.id;
    Ticket.findOne({'_id' : id}, function(error, result) {
        if (error) return console.log(error);
        return res.send(result);
    })
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
