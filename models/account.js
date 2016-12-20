/**
 * Created by akeaswaran on 12/17/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String,
    name: String,
    email: String,
    approved: Boolean,
    isAdmin: Boolean
});

Account.plugin(passportLocalMongoose, {
    usernameField: 'username',
    usernameUnique: true
});

module.exports = mongoose.model('Account', Account);