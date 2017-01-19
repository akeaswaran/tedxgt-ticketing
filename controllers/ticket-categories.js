var mongoose = require('mongoose'),
    TicketCategory = mongoose.model('TicketCategory'),
    Event = mongoose.model('Event');

exports.findAll = function(req, res, callback){
    TicketCategory.find({},function(err, results) {
        callback(results);
    });
};

exports.findById = function(req, res, callback) {
    var id = req.params.id;
    TicketCategory.findOne({'_id' : id}, function(error, result) {
        if (error) return console.log(error);
        callback(error, result);
    })
};

exports.add = function(req, res) {
    TicketCategory.create(req.body, function (err, category) {
        if (err) return console.log(err);
        return res.send(category);
    });
};

exports.addMany = function(req, res) {
    var tcData = req.body.tcArr;

    TicketCategory.insertMany(tcData)
        .then(function(results) {
            var idArr = [];
            results.forEach(function (tc) {
                idArr.push(tc._id);
            });

            Event.findOneAndUpdate({ _id : req.body.eventId }, { ticketCategories: idArr }, function(err, doc) {
                if (err) {
                    return console.log(err);
                }

                return res.send(results);
            });
        })
        .catch(function(err) {
            if (err) return console.log(err);
        });
};

exports.updateMany = function(req, res) {
    //console.log('TC BODY REQ: ' + JSON.stringify(req.body,null,'\t'));
    var dirtyUpdates = req.body.tcUpdates;
    var tcIds = [];
    var tcUpdates = [];
    dirtyUpdates.forEach(function (update) {
       tcIds.push(update._id);
       delete update._id;
        tcUpdates.push(update);
    });

    if ((tcIds instanceof Array) && (tcUpdates instanceof Array)) {
        tcIds.forEach(function(id, idx, array) {
            if (id === 'NEW ITEM') {
                TicketCategory.create(tcUpdates[idx], function (err, category) {
                    if (err) return console.log(err);
                    //console.log('Created TC ' + category);
                });
            } else {
                TicketCategory.update({ "_id": id }, { "$set": tcUpdates[idx] }, { upsert: true }, function (err, raw) {
                    if (err) return console.log('TC UPDATE ERROR: ' + err);
                    console.log('Updated ' + raw.nModified + ' tc');
                });
            }
        });

        return res.send(202);
    } else {
        console.log('INVALID REQ DATA');
        return res.send(422);
    }
};

exports.update = function(req, res) {
    var id = req.params.id;
    var updates = req.body;

    TicketCategory.update({ _id: id }, updates, function (err, raw) {
        if (err) return console.log('ERROR: ' + err);
        console.log('Updated ' + raw.nModified + ' tcs');
        return res.send(202);
    });
};

exports.delete = function(req, res) {
    var id = req.params.id;
    TicketCategory.remove({'_id':id}, function(result) {
        return res.send(result);
    });
};
