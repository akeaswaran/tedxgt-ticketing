var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Ticket = require('./ticket');

var TicketCategorySchema = new Schema({
    name: String,
    description: String,
    price: Number,
    numTickets: Number,
    numTicketsSold: Number,
    tickets: [Ticket]
});

mongoose.model('TicketCategory', TicketCategorySchema);
