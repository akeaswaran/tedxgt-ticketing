var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Attendee = require('./attendee');
var Ticket = require('./ticket');

var EventSchema = new Schema({
    name: String,
    description: String,
    location: String,
    startDate: Date,
    endDate: Date,
    url: String,
    attendees: [Attendee],
    tickets: [Ticket],
    numTickets: Number,
    miscData: Array,
    closed: Boolean
});

mongoose.model('Event', EventSchema);
