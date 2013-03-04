chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
console.log("got request");
    if(request.eventName == "getLogin") {
       sendResponse({user: localStorage["username"], pass: localStorage["password"]});
    }

    if(request.cmd == "load") {

    }
});
console.log(localStorage["username"]);
if(!localStorage.getItem('username'))
{
	chrome.tabs.create({url: "options.html"});
}

