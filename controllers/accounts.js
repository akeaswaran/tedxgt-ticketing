var mongoose = require('mongoose'),
    Account = mongoose.model('Account');

exports.findAll = function(req, res, callback) {
    Account.find({},function(err, results) {
        callback(results);
    });
};

exports.findById = function(req, res, callback) {
    var id = req.params.id;
    Account.findOne({'_id' : id}, function(error, result) {
        if (error) return console.log(error);
        callback(error, result);
    })
};

exports.add = function(req, res) {
    Account.create(req.body, function (err, event) {
        if (err) return console.log(err);
        return res.send(event);
    });
}

exports.update = function(req, res) {
    var id = req.params.id;
    console.log('Received event id: ' + id);
    var updates = req.body;
    Account.where({ _id : id}).update({ $set: updates }, function (err, numberAffected) {
        if (err) return console.log('ERROR: ' + err);
        console.log('Updated ' + numberAffected.nModified + ' events');
        return res.send(202);
    });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    Account.remove({'_id':id},function(result) {
        return res.send(result);
    });
};
