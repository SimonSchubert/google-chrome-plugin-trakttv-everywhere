
function loadOptions() {
	var user = localStorage["username"];
	if(user == undefined)
		user = "";
	document.getElementById("username").value = user;

	$("#ckb_option_share_facebook").attr('checked', localStorage["option_share_facebook"] === "true" ? true : false);
	$("#ckb_option_share_twitter").attr('checked', localStorage["option_share_twitter"] === "true" ? true : false);
	$("#ckb_option_share_tumblr").attr('checked', localStorage["option_share_tumblr"] === "true" ? true : false);
	$("#ckb_option_share_foursquare").attr('checked', localStorage["option_share_foursquare"] === "true" ? true : false);

	if(user !== undefined)
		testConnection(localStorage["username"],localStorage["password"]);
}

function saveOptions() {
	localStorage["username"] = document.getElementById("username").value;
	localStorage["password"] = $.sha1(document.getElementById("password").value);
	localStorage["option_share_facebook"] = $("#ckb_option_share_facebook").prop('checked');
	localStorage["option_share_twitter"] = $("#ckb_option_share_twitter").prop('checked');
	localStorage["option_share_tumblr"] = $("#ckb_option_share_tumblr").prop('checked');
	localStorage["option_share_foursquare"] = $("#ckb_option_share_foursquare").prop('checked');
	testConnection(localStorage["username"],localStorage["password"]);
}

function testConnection(vu,vp)
{
	$("#status").html('<img id="trakt-loading" src="'+chrome.extension.getURL("load.gif")+'">');
	$.getJSON('http://royalkoala.com/trakttv/trakt_login.php?trakt_user='+vu+'&trakt_pass='+vp, function(data) 
  	{
  	 if(data.status=="success")
  	 {
  		$("#status").html("<b style='color:green'>successfully connected</b>");
  	 }
  	 else
  	 {
  		$("#status").html("<b style='color:red'>failure</b>");
  	 }
  	});
}

function eraseOptions() {
	localStorage.removeItem("username");
	localStorage.removeItem("password");
	location.reload();
}

$(document).ready(function() {

$('#server').load(function() {
    this.src=chrome.extension.getURL('online.png')
  }).error(function() {
    this.src=chrome.extension.getURL('offline.png')
  });

$('#server-plugin').load(function() {
    this.src=chrome.extension.getURL('online.png')
  }).error(function() {
    this.src=chrome.extension.getURL('offline.png')
  });

});

document.addEventListener('DOMContentLoaded', loadOptions);
document.querySelector('#button-save').addEventListener('click', saveOptions);
document.querySelector('#button-delete').addEventListener('click', eraseOptions);

    
