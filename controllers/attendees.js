var mongoose = require('mongoose'),
    Attendee = mongoose.model('Attendee');

exports.findAll = function(req, res){
  Attendee.find({},function(err, results) {
    return res.send(results);
  });
};

exports.findById = function(req, res) {
  var id = req.params.id;
  Attendee.findOne({'_id' : id}, function(error, result) {
    if (error) return console.log(error);
    return res.send(result);
  })
};

exports.add = function(req, res) {
  Attendee.create(req.body, function (err, attendee) {
    if (err) return console.log(err);
    return res.send(attendee);
  });
}

exports.update = function(req, res) {
  var id = req.params.id;
  var updates = req.body;
  Attendee.update({'_id' : id}, updates,
      function (err, numberAffected) {
        if (err) return console.log(err);
        console.log('Updated ' + numberAffected.nModified + ' attendees');
        return res.send(202);
      });
}

exports.delete = function(req, res) {
  var id = req.params.id;
  Attendee.remove({'_id':id},function(result) {
    return res.send(result);
  });
};
