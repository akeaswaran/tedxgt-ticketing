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

            Event.findOneAndUpdate({ _id : req.body.eventId }, { ticketCategories: idArr }, function(err, person) {
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
    var eventId = req.body.eventId;

    //0: clear TCs from event
    Event.findOneAndUpdate(
        { _id: eventId},
        { ticketCategories: [] },
        { new: true },
        function (err, result) {
            if (err) {
                console.log("EVENT remove TCs: " + err);
                res.send(400);
            }

            //1: delete TC records for event
            TicketCategory.remove({ event: eventId }, function(err) {
                if (err) {
                    console.log("TC delete: " + err);
                    res.send(400);
                }

                //2: create new TCs from post data
                //3: attached new TCs to event
                exports.addMany(req, res);
            });
        }
    );
};

exports.update = function(req, res) {
    var id = req.params.id;
    console.log('Received tc id: ' + id);
    var updates = req.body;
    TicketCategory.update({ _id: id }, updates, function (err, raw) {
        if (err) return console.log('ERROR: ' + err);
        console.log('Updated ' + raw.nModified + ' tcs');
        return res.send(202);
    });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    TicketCategory.remove({'_id':id}, function(result) {
        return res.send(result);
    });
};
