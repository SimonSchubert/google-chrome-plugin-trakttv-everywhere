$(document).ready(function() {
	loadOptions();
});

function loadOptions() {
	
	$('#status_trakt').load(function() {
		this.src = chrome.extension.getURL('images/online.png');
	}).error(function() {
		this.src = chrome.extension.getURL('images/offline.png');
	});

	$('#status_royalkoala').load(function() {
		this.src = chrome.extension.getURL('images/online.png')
	}).error(function() {
		this.src = chrome.extension.getURL('images/offline.png')
	});

	$("#saveOptions").click( function() {
		saveOptions();
	});
	$("#eraseOptions").click( function() {
		eraseOptions();
	});	
	
	document.getElementById("username").value = localStorage["username"] === undefined ? "" : localStorage["username"];
	document.getElementById("apikey").value = localStorage["apikey"] = localStorage["apikey"] === undefined ? "9a7d89858635e8ac7cdf1ae2f652d0cde4c30932" : localStorage["apikey"];
	document.getElementById("password").value = localStorage["password"] === undefined ? "" : localStorage["password"];
	if(localStorage["option_checkin"] == undefined) localStorage["option_checkin"] = true;
	$("#ckb_option_checkin").attr('checked', localStorage["option_checkin"] === "true" ? true : false);
	$("#ckb_option_share_facebook").attr('checked', localStorage["option_share_facebook"] === "true" ? true : false);
	$("#ckb_option_share_twitter").attr('checked', localStorage["option_share_twitter"] === "true" ? true : false);
	$("#ckb_option_share_tumblr").attr('checked', localStorage["option_share_tumblr"] === "true" ? true : false);
	$("#ckb_option_share_foursquare").attr('checked', localStorage["option_share_foursquare"] === "true" ? true : false);
	testConnection(localStorage["username"],localStorage["password"]);
}

function isValidSHA1(s) {
    return s.match("[a-fA-F0-9]{40}");
}

function saveOptions() {
	localStorage["apikey"] = document.getElementById("apikey").value;
	localStorage["username"] = document.getElementById("username").value;
	localStorage["password"] = $.sha1(document.getElementById("password").value);
	if(isValidSHA1(localStorage["password"]))
		localStorage["password"] = document.getElementById("password").value;
	else
		localStorage["password"] = $.sha1(document.getElementById("password").value);
	localStorage["option_checkin"] = $("#ckb_option_checkin").prop('checked');
	localStorage["option_share_facebook"] = $("#ckb_option_share_facebook").prop('checked');
	localStorage["option_share_twitter"] = $("#ckb_option_share_twitter").prop('checked');
	localStorage["option_share_tumblr"] = $("#ckb_option_share_tumblr").prop('checked');
	localStorage["option_share_foursquare"] = $("#ckb_option_share_foursquare").prop('checked');
	testConnection(localStorage["username"],localStorage["password"]);
}

function testConnection(vu,vp) {
	if(localStorage["apikey"] == undefined || localStorage["apikey"] == '') {
		$("#status").html("<b style='color:orange'>Please fill in an API-key first</b>");
	} else if(vu == undefined || vp == undefined) {
		$("#status").html("<b style='color:orange'>Please login first to use this extension</b>");
	} else if(vu == '') {
		$("#status").html("<b style='color:red'>Please enter a valid username first</b>");	
	} else {
		$("#status").html('<img id="trakt-loading" src="'+chrome.extension.getURL("images/load.gif")+'">');
				
		var config = {
			user: vu,
			pass: vp,
			api_key: localStorage["apikey"],
			pass_hash: false
		}
		var trakt =  new Trakt({api_key: config.api_key, username: config.user, password: config.pass, pass_hash: config.pass_hash});
		
		trakt.request('account', 'test', {}, function(err, res) {
				if(!err) {
					$("#status").html("<b style='color:green'>Successfully connected</b>");
				} else {
					$("#status").html("<b style='color:red'>Failed to connect</b>");
				}
		})
	}
}

function eraseOptions() {
	$.Storage.remove("apikey");
	$.Storage.remove("option_checkin");
	$.Storage.remove("username");
	$.Storage.remove("password");
	$.Storage.remove("option_share_facebook");
	$.Storage.remove("option_share_twitter");
	$.Storage.remove("option_share_tumblr");
	$.Storage.remove("option_share_foursquare");
	$.Storage.remove("seen-shows");
	$.Storage.remove("seen-movies");
	location.reload();
}