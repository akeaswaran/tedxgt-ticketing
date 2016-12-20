var mongoose = require('mongoose'),
    Event = mongoose.model('Event');

exports.findAll = function(req, res, callback){
    Event.find({},function(err, results) {
        callback(results);
    });
};

exports.findById = function(req, res, callback) {
    var id = req.params.id;
    Event.findOne({'_id' : id}, function(error, result) {
        if (error) return console.log(error);
        callback(error, result);
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
