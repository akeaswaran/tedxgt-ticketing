var mongoose = require('mongoose'),
    Event = mongoose.model('Event');
    //sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

//var senderName = process.env.SENDER_NAME;
//var senderEmail = process.env.SENDER_EMAIL;

exports.findAll = function(req, res){
    Event.find({},function(err, results) {
        return res.send(results);
    });
};

exports.findById = function(req, res) {
    var id = req.params.id;
    Event.findOne({'_id' : id}, function(error, result) {
        if (error) return console.log(error);
        return res.send(result);
    })
};

exports.add = function(req, res) {
    Event.create(req.body, function (err, event) {
        if (err) return console.log(err);
        return res.send(event);
    });
}

exports.update = function(req, res) {
    var id = req.params.id;
    var updates = req.body;
    Event.update({'_id' : id}, updates,
        function (err, numberAffected) {
            if (err) return console.log(err);
            console.log('Updated ' + numberAffected.nModified + ' events');
            // var event = req.body;
            // if (event.notificationsEnabled) {
            //   var emailAddresses = event.assigneeEmails;
            //   console.log('EVENT UPDATED: ' + JSON.stringify(event) + ' SENDING EMAILS TO: ' + emailAddresses);
            //   var statusString = '';
            //   if (event.status === 'backlog') {
            //     statusString = 'Backlog';
            //   } else if (event.status === 'in-progress') {
            //     statusString = 'In Progress'
            //   } else {
            //     statusString = 'Done';
            //   }
            //
            //   var emailHTML = '<html><head><meta name="viewport" content="width=device-width"/><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><title>SGA IT Event Updated | ' + event.title + '</title></head><body bgcolor="#FFFFFF"><table class="head-wrap" bgcolor="#999999"><tr><td></td><td class="header container" ><div class="content"><table bgcolor="#999999"><tr><td></td><td align="right"><h6 class="collapse">Georgia Tech SGA IT Committee</h6></td></tr></table></div></td><td></td></tr></table><table class="body-wrap"><tr><td></td><td class="container" bgcolor="#FFFFFF"><div class="content"><table><tr><td><p class="lead">A event you are assigned to was updated.</p><h3>' + event.title + '</h3><h5>' + event.description + '</h5><h6><strong>Status:</strong> ' + statusString + '</h6><p class="callout"><a href="http://gtsga-it.herokuapp.com/">View the event &raquo;</a></p></td></tr></table></div></td><td></td></tr></table><table class="footer-wrap"><tr><td></td><td class="container"><div class="content"><table><tr><td align="center"></td></tr></table></div></td><td></td></tr></table><style>/* -------------------------------------GLOBAL------------------------------------- */*{margin:0;padding:0;}*{font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;}img{max-width: 100%;}.collapse{margin:0;padding:0;}body{-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:none;width: 100%!important;height: 100%;}/* -------------------------------------ELEMENTS------------------------------------- */a{color: #2BA6CB;}.btn{text-decoration:none;color: #FFF;background-color: #666;padding:10px 16px;font-weight:bold;margin-right:10px;text-align:center;cursor:pointer;display: inline-block;}p.callout{padding:15px;background-color:#ECF8FF;margin-bottom: 15px;}.callout a{font-weight:bold;color: #2BA6CB;}table.social{/* padding:15px; */background-color: #ebebeb;}.social .soc-btn{padding: 3px 7px;font-size:12px;margin-bottom:10px;text-decoration:none;color: #FFF;font-weight:bold;display:block;text-align:center;}a.fb{background-color: #3B5998!important;}a.tw{background-color: #1daced!important;}a.gp{background-color: #DB4A39!important;}a.ms{background-color: #000!important;}.sidebar .soc-btn{display:block;width:100%;}/* -------------------------------------HEADER------------------------------------- */table.head-wrap{width: 100%;}.header.container table td.logo{padding: 15px;}.header.container table td.label{padding: 15px; padding-left:0px;}/* -------------------------------------BODY------------------------------------- */table.body-wrap{width: 100%;}/* -------------------------------------FOOTER------------------------------------- */table.footer-wrap{width: 100%;clear:both!important;}.footer-wrap .container td.content p{border-top: 1px solid rgb(215,215,215); padding-top:15px;}.footer-wrap .container td.content p{font-size:10px;font-weight: bold;}/* -------------------------------------TYPOGRAPHY------------------------------------- */h1,h2,h3,h4,h5,h6{font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif; line-height: 1.1; margin-bottom:15px; color:#000;}h1 small, h2 small, h3 small, h4 small, h5 small, h6 small{font-size: 60%; color: #6f6f6f; line-height: 0; text-transform: none;}h1{font-weight:200; font-size: 44px;}h2{font-weight:200; font-size: 37px;}h3{font-weight:500; font-size: 27px;}h4{font-weight:500; font-size: 23px;}h5{font-weight:900; font-size: 17px;}h6{font-weight:900; font-size: 14px; text-transform: uppercase; color:#444;}.collapse{margin:0!important;}p, ul{margin-bottom: 10px;font-weight: normal;font-size:14px;line-height:1.6;}p.lead{font-size:17px;}p.last{margin-bottom:0px;}ul li{margin-left:5px;list-style-position: inside;}/* -------------------------------------SIDEBAR------------------------------------- */ul.sidebar{background:#ebebeb;display:block;list-style-type: none;}ul.sidebar li{display: block; margin:0;}ul.sidebar li a{text-decoration:none;color: #666;padding:10px 16px;/* font-weight:bold; */margin-right:10px;/* text-align:center; */cursor:pointer;border-bottom: 1px solid #777777;border-top: 1px solid #FFFFFF;display:block;margin:0;}ul.sidebar li a.last{border-bottom-width:0px;}ul.sidebar li a h1,ul.sidebar li a h2,ul.sidebar li a h3,ul.sidebar li a h4,ul.sidebar li a h5,ul.sidebar li a h6,ul.sidebar li a p{margin-bottom:0!important;}/* ---------------------------------------------------RESPONSIVENESSNuke it from orbit. It\'s the only way to be sure.------------------------------------------------------ *//* Set a max-width, and make it display as block so it will automatically stretch to that width, but will also shrink down on a phone or something */.container{display:block!important;max-width:600px!important;margin:0 auto!important; /* makes it centered */clear:both!important;}/* This should also be a block element, so that it will fill 100% of the .container */.content{padding:15px;max-width:600px;margin:0 auto;display:block;}/* Let\'s make sure tables in the content area are 100% wide */.content table{width: 100%;}/* Odds and ends */.column{width: 300px;float:left;}.column tr td{padding: 15px;}.column-wrap{padding:0!important;margin:0 auto;max-width:600px!important;}.column table{width:100%;}.social .column{width: 280px;min-width: 279px;float:left;}/* Be sure to place a .clear element after each set of columns, just to be safe */.clear{display: block; clear: both;}/* -------------------------------------------PHONEFor clients that support media queries.Nothing fancy.-------------------------------------------- */@media only screen and (max-width: 600px){a[class="btn"]{display:block!important; margin-bottom:10px!important; background-image:none!important; margin-right:0!important;}div[class="column"]{width: auto!important; float:none!important;}table.social div[class="column"]{width:auto!important;}}</style></body></html>';
            //   var emailData = {
            //     to: emailAddresses,
            //     from: "Akshay Easwaran <akeaswaran@gatech.edu>",
            //     subject: 'SGA IT Event Updated | ' + event.title,
            //     html: emailHTML
            //   };
            //
            //   sendgrid.send(emailData, function(err, json) {
            //     if (err) {
            //       console.error(err);
            //       console.log(JSON.stringify(err))
            //     } else {
            //       console.log(json);
            //     }
            //   });
            // } else {
            //   console.log('Notifications not enabled for event ' + event._id);
            // }
            return res.send(202);
        });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    Event.remove({'_id':id},function(result) {
        return res.send(result);
    });
};
