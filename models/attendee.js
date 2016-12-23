var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AttendeeSchema = new Schema({
    name: String,
    email: String
});

mongoose.model('Attendee', AttendeeSchema);
