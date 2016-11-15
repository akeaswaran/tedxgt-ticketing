var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Ticket = require('./ticket');

var TicketCategorySchema = new Schema({
    name: String,
    description: String,
    numTickets: Number,
    tickets: [Ticket]
});

mongoose.model('TicketCategory', TicketCategorySchema);
