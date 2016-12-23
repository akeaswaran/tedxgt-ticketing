var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TicketCategorySchema = new Schema({
    name: String,
    description: String,
    price: Number,
    numTickets: Number,
    numTicketsSold: Number,
    tickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }
});

TicketCategorySchema.pre('remove', function(next) {
    // Remove all the docs that reference the removed event.
    mongoose.model('Ticket').remove({ ticketCategory: this._id }, next);

    mongoose.model('Event').update(
        { ticketCategories: { $in: [this._id] }},
        { $pull: { ticketCategories : { _id : this._id } } },
        { multi: true },
        next
    );
});


mongoose.model('TicketCategory', TicketCategorySchema);
