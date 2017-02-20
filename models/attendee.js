var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AttendeeSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    guest: Boolean
});

mongoose.model('Attendee', AttendeeSchema);
