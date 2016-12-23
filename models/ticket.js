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
    var ticket = this;
    mongoose.model('TicketCategory').findByIdAndUpdate(
        ticket.ticketCategory,
        { $push: { tickets: ticket._id }, $inc: { numTicketsSold: 1 } },
        { new : true},
        function(err, model) {
            if (err) {
                console.log("TICKETCATEGORY UPDATE ERR: " + err);
            }

            console.log("UPDATED TC: " + model);

            mongoose.model('Event').findByIdAndUpdate(
                model.event,
                { $push: { attendees: ticket.attendee } },
                { new : true }, function(err, doc) {
                    if (err) {
                        console.log("EVENT UPDATE ERR: " + err);
                    }

                    console.log("UPDATED EVENT: " + doc);
                    return next;
                });
        }
    );
});

mongoose.model('Ticket', TicketSchema);
