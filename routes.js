module.exports = function(app) {
    var attendees = require('./controllers/attendees');
    app.get('/attendees', attendees.findAll);
    app.get('/attendees/:id', attendees.findById);
    app.post('/attendees', attendees.add);
    app.put('/attendees/:id', attendees.update);
    app.delete('/attendees/:id', attendees.delete);

    var events = require('./controllers/events');
    app.get('/events', events.findAll);
    app.get('/events/:id', events.findById);
    app.post('/events', events.add);
    app.put('/events/:id', events.update);
    app.delete('/events/:id', events.delete);

    var tickets = require('./controllers/tickets');
    app.get('/tickets', tickets.findAll);
    app.get('/tickets/:id', tickets.findById);
    app.post('/tickets', tickets.add);
    app.put('/tickets/:id', tickets.update);
    app.delete('/tickets/:id', tickets.delete);

    var accounts = require('./controllers/accounts');
    app.get('/accounts', accounts.findAll);
    app.get('/accounts/:id', accounts.findById);
    app.post('/accounts', accounts.add);
    app.put('/accounts/:id', accounts.update);
    app.delete('/accounts/:id', accounts.delete);
}
