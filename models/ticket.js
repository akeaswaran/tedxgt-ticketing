var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Attendee = require('./attendee');
var Event = require('./event');
var TicketCategory = require('./ticket-category');

var TicketSchema = new Schema({
    attendee: Attendee,
    event: Event,
    ticketCategory: TicketCategory,
    price: Number
});

mongoose.model('Ticket', TicketSchema);
