var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EventSchema = new Schema({
    name: String,
    description: String,
    location: String,
    startDate: Date,
    endDate: Date,
    url: String,
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee'
    }],
    ticketCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketCategory'
    }],
    closed: Boolean
});

EventSchema.pre('remove', function(next) {
    // Remove all the docs that reference the removed event.
    mongoose.model('TicketCategory').remove({ event: this._id }, next);
    mongoose.model('Ticket').remove({ event: this._id }, next);
});

mongoose.model('Event', EventSchema);
