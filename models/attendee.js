var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AttendeeSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    miscData: Array
});

mongoose.model('Attendee', AttendeeSchema);
