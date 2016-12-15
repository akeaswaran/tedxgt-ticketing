/*
 * <!--<div id="event-id-1" class="col-md-8 col-md-offset-2 subtext to-animate">-->
 <!--<h2 style="padding-top:30px;">POWER OF MIND</h2>-->
 <!--<h3><span style="color:#444">5 PM - 7 PM | Tuesday, November 29, 2016 | The Garage</span><br/></h3>-->
 <!--<p>The “Power of Mind” TEDx Salon Event is a great way for you to learn and hear others speak about mental health, a matter that is not discussed often. You will also get the chance to engage in intellectual conversations with others around you in order to gain multiple perspectives of this topic. Feel free to share your own views and opinions as well!</p>-->
 <!--<p><a class="btn" style="background:#e62b1e; color:rgba(255,255,255,1.0);" target="_blank" href="/event/1">Reserve Seats!</a></p>-->
 <!--</div>-->
 * */

var eventList = $("#event-list");

$.get("/events", function(data) {
    if (data != null && Object.prototype.toString.call(data) === '[object Array]' && data.length > 0) {
        data.forEach(function(item) {
            console.log(item);
            var htmlStub = buildHTML(item);
            eventList.append(htmlStub);
        });
    } else {
        eventList.append("<h3><span style=\"color:#444\">No events coming up. Check out our previous events below!</span></h3>");
    }
});


function buildHTML(item) {
    var html = "<div id=\"event-id-" + item.id + "\" class=\"col-md-8 col-md-offset-2 subtext to-animate\">";
    html += "<h2 style=\"padding-top:30px;\">"  + item.name + "</h2>";
    html += "<h3 class='subtext'><span style=\"color:#444\">" + moment(item.startDate).format('LT') + " | " + moment(item.startDate).format('LL') + "</span></h3>";
    html += "<h3> " + item.location + "</h3>";
    html += "<h3> " + item.description + "</h3>";

    if (moment().isAfter(item.startDate) || item.closed) {
        html += "<p><a class=\"btn\" style=\"background:#e62b1e; color:rgba(255,255,255,0.5);\" target=\"_blank\" href=\"#\">Registration Closed</a></p>";
    } else {
        html += "<p><a class=\"btn\" style=\"background:#e62b1e; color:rgba(255,255,255,1.0);\" target=\"_blank\" href=\"/event/" + item._id + "\">Reserve Seats!</a></p>";
    }
    html += "</div>";

    return html;
}