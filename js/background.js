chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	console.log("got request");
    if(request.eventName == "getLogin") {
	    sendResponse({user: localStorage["username"], pass: localStorage["password"], apikey: localStorage["apikey"], option_checkin: 					localStorage["option_checkin"]});	       
    }
});

if(localStorage["username"] == "" || localStorage["username"] == undefined) {
	chrome.tabs.create({url: "options.html"});
}