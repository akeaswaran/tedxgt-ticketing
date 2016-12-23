var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TicketSchema = new Schema({
    attendee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee'
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    ticketCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketCategory'
    },
    price: Number
});

mongoose.model('Ticket', TicketSchema);
