var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Attendee = require('./attendee');
var Event = require('./event');

var TicketSchema = new Schema({
    attendee: Attendee,
    event: Event,
    price: Number
});

mongoose.model('Ticket', TicketSchema);
