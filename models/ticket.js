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
    }
});

TicketSchema.post('save', function(next) {
    // Update ticket category with new ticket
    mongoose.model('TicketCategory').update(
        { _id: this.ticketCategory },
        { $push: { tickets : { _id : this._id } }, $inc : { numTicketsSold: 1 } },
        next
    );
});

mongoose.model('Ticket', TicketSchema);
