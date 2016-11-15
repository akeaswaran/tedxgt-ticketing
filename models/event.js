var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Attendee = require('./attendee');
var TicketCategory = require('./ticket-category');

var EventSchema = new Schema({
    name: String,
    description: String,
    location: String,
    startDate: Date,
    endDate: Date,
    url: String,
    attendees: [Attendee],
    ticketCategories: [TicketCategory],
    totalTickets: Number,
    miscData: Array,
    closed: Boolean
});

mongoose.model('Event', EventSchema);
