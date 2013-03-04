/**************************************************
*		trakttv Everywhere		  *
*	 Author: Simon Schubert			  *
*	 Email: sschubert89@gmail.com		  *
*   github: https://github.com/SimonSchubert/     *
*	 google-chrome-plugin-trakttv-everywhere  *
*						  *
**************************************************/

vuser = '';
vpass = "";
pMode = 0;
pIMDB=0;pHULU=1;pSOUTHPARK=2;pKINOXTO=3;
key = "9a7d89858635e8ac7cdf1ae2f652d0cde4c30932";


function getPage()
{
	if(window.location.toString().search("kinox")!=-1)
	{
		pMode = pKINOXTO;
	}
	else
	if(window.location.toString().search("hulu")!=-1)
	{
		pMode = pHULU;
	}
	else
	if(window.location.toString().search("imdb.com")!=-1)
	{
		pMode = pIMDB;
	}
	else
	if(window.location.toString().search("southpark.de/alle-episoden")!=-1||window.location.toString().search("southparkstudios.com/full-episodes")!=-1)
	{
		pMode = pSOUTHPARK;
	}
}	

function loadUser()
{
chrome.extension.sendRequest( { eventName: "getLogin" },
    function(response) {
        vuser = response.user;
        vpass = response.pass;
        getPage();
        main();
    	}
	);
}

function main()
{
$(document).ready(function() {
  var datashows; // JSON Object
  var datamovies;
  
  // Check if the JSON Object is stored in the local storage
  var ts = Math.round((new Date()).getTime() / 1000);
  var lastupdate = ts-$.Storage.get("seen-shows-date");
  	if( $.Storage.get("seen-shows-date") != null && lastupdate<300 ) 
  	{
  		console.log("loading seen-shows json object from local storage - last update :"+(lastupdate)); 
		datashows = JSON.parse($.Storage.get("seen-shows")); // Load
		datamovies = JSON.parse($.Storage.get("seen-movies")); // Load
		
		if(pMode == pKINOXTO)
			loadSeenKinox();
		if(pMode == pIMDB)
			loadSeenImdb();
		if(pMode == pSOUTHPARK)
			initSouthpark();
	}
	else
	{
	console.log("save and load seen-shows json object to local storage"); 
  		$.getJSON('http://royalkoala.com/trakttv/trakt_getshows.php?trakt_user='+vuser, function(data2) 
  		{
			datashows = data2;
			$.Storage.set("seen-shows-date", ts.toString());
			$.Storage.set("seen-shows", JSON.stringify(data2));	//save
			
			$.getJSON('http://royalkoala.com/trakttv/trakt_getmovies.php?trakt_user='+vuser, function(data3) 
  			{
  				datamovies = data3;
				$.Storage.set("seen-movies", JSON.stringify(data3));
				
				if(pMode == pKINOXTO)
					loadSeenKinox();
				if(pMode == pIMDB)
					loadSeenImdb();
				if(pMode == pSOUTHPARK)
					initSouthpark();
			});
		});
	}
  
  
  
  

addSeenButton();

function initSouthpark()
{
	$('a[href*="guide/episoden/staffel"]').each(function() {
		$(this).click(function(event){
			setTimeout(loadSeenSouthpark, 2000);
		});
	});		
	loadSeenSouthpark();
}

function getSouthparkShowIDs(_href)
{
		var tmpref = _href.split("/");
		var tmpes = tmpref[tmpref.length-1];
		console.log(tmpref[tmpref.length-2]+" -"+tmpes);
		
		if(tmpref[tmpref.length-2] == "full-episodes") // SOUTHPARKSTUDIOS.COM
		{
			var season = tmpes.substr(1,2).replace(/^0+/, '');	
			var episode = tmpes.substr(4,2).replace(/^0+/, '');	
			console.log(season+" -"+episode);
		}
		else // SOUTHPARK.DE
		{
			var tmpes = tmpref[tmpref.length-2];
			if(tmpes.length==3)
			{
			var season = tmpes.substr(0,1).replace(/^0+/, '');	
			var episode = tmpes.substr(1,3).replace(/^0+/, '');	
			}
			else
			{
			var season = tmpes.substr(0,2).replace(/^0+/, '');	
			var episode = tmpes.substr(2,4).replace(/^0+/, '');	
			}
		}
		
		IDS = {
		EPISODE :episode,
		SEASON : season};
	return IDS;
}

function loadSeenSouthpark()
{
	console.log("loadSeenSouthpark()");
	var orgimgwidth = 55;
	$('a.content_eppreview').each(function() {
		var that = $(this);
		
		var ids = getSouthparkShowIDs($(this).attr("href"));
		season = ids.SEASON;
		episode = ids.EPISODE;

		$.each(datashows, function(key, show) {
			
  			if(show.imdb_id == "tt0121955")
			{				
				for(var i=0;i<show.seasons.length;i++)
				{
					if(show.seasons[i].season.toString()==season)
					{
						if ( $.inArray(episode, show.seasons[i].episodes.toString().split(",")) > -1 ) {
							that.parent().append("<div class='overlay-watched-small' style='left:"+(orgimgwidth-28)+"px;'></div>");
						}
					}

				}
				
				
			}
		});

				
		
	});
	
}

function loadSeenImdb()
{

	if($(".infobar").text().search("TV Series")!=-1)
	{
   	var tmp = $('meta[property="og:url"]').attr("content").split("/");
	var imdbid = tmp[tmp.length-2];
	
	$.getJSON('http://api.trakt.tv/user/progress/watched.json/3fb2e1f1c380194f9599f218c6d1ccd6/'+vuser+'/'+imdbid, function(data) 
  	{	
	console.log(data);
 	$.each(data, function(key, show) {
		console.log(show);
		if(show.show.imdb_id==imdbid)
		{
			$('.infobar').append('<div style="color:#136cb2">'+show.progress.percentage+' % ('+show.progress.completed+'/'+show.progress.aired+')</div>');
			if(show.progress.percentage==100)
			{
				$('#img_primary').find("a").prepend("<div class='overlay-watched-big' style='left:"+cssleft+"px;bottom: 10px;'></div>");
			}	
		}
		});

	});

	}
	
	if(window.location.toString().search("/search/")!=-1)	
	{
	var imdb_ids;
		if(window.location.toString().search("title_type=tv_serie")!=-1)	
		{
		$('#main').find('.detailed').each(function() {
			
			var that = $(this);
			var tmphref = $(this).find('.image').find('a').attr("href");
			
			if(tmphref)
			{
			tmphref = tmphref.split("/");
			var imgimdb;
			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}
			}
			imdb_ids += imgimdb+',';
			console.log(that.find('.number').text());
		});
		
		
			$.getJSON('http://api.trakt.tv/user/progress/watched.json/3fb2e1f1c380194f9599f218c6d1ccd6/'+vuser+'/'+imdb_ids, function(data) 
			{	
			//console.log(data);
			$.each(data, function(key, show) {
				console.log(show);
				$('a[href*="'+show.show.imdb_id+'"]').parent().find('.year_type').append('<span style="color:#136cb2"> '+show.progress.percentage+' % ('+show.progress.completed+'/'+show.progress.aired+')</span>');
					if(show.progress.percentage==100)
					{
					$('a[href*="'+show.show.imdb_id+'"]').find('img').parent().prepend("<div class='overlay-watched' style='left:"+-1+"px;bottom: 0px;'></div>");
					}	
				});
			});
		
		}
	}

	if(window.location.toString().search("/chart/")!=-1)	
	{
		/*** IMDB charts highlighting **/
		$('#main').find("tbody").find("tr").each(function() {
			var that = $(this);

			var tmphref = $(this).find("td").eq(2).find("a").attr("href");
			
			if(tmphref)
			{
			tmphref = tmphref.split("/");
			var imgimdb;
			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}

    		 $.each(datamovies, function(key, show) {
				 if(show.imdb_id == imgimdb)
				 {
					that.css("background-color","#4DBCE9");
					that.find("td").css("color","white");
					that.find("a").css("color","white");
				 }	
    		 });
			 
    		}
    		
		});
	}
	else
	if(window.location.toString().search("episodes")!=-1)	
	{
	console.log("episodes");
	loadSeenImdbEpisodes();
	
	var loaded = 0;
		
	
	$("#episodes_content").bind("DOMSubtreeModified", function() {	
		if(loaded==0)
		{
		console.log("#episodes_content - modified");
		loaded = 1;
		$(document).ready(function() {
			setTimeout(
				function() 
				{
				loadSeenImdbEpisodes();
				loaded = 0;
				}, 2000);
			});
		}

	});
	
	function loadSeenImdbEpisodes()
	{
		var imdbid = $("#bySeason").attr("tconst");
		var season = $("#bySeason option:selected").text();
		season = season.replace(/\s/g, '');

		$('#episodes_content').find(".list_item").each(function() {
			var that = $(this);
			var episode = $(this).find("meta").attr( "content" );


			episode = episode.replace(/\s/g, '');
			console.log(imdbid + "," + season + "," +  episode);

  			$.each(datashows, function(key, show) {
  	
			if(show.imdb_id == imdbid)
			{
			
			var selectids;
			for(var i=0;i<show.seasons.length;i++)
			{
				if(show.seasons[i].season.toString() == season)
				{
				selectids = show.seasons[i].episodes.toString().split(",");
				}
			}
			
			var width = that.find("img").width()-55;
			var height = that.find("img").height()+3;
			if(jQuery.inArray(episode, selectids)!=-1)
				that.find("a").find("div.hover-over-image").append("<div class='overlay-watched' style='left:"+width+"px;bottom:"+height+"px'></div>");

			//console.log(jQuery.inArray(episode, selectids));
    			}

    			});
		});
	}
	}
	else
	{
		
		if($('#img_primary').find("a").find("img").length>0)
		{
			var orgimgwidth = parseInt($('#img_primary').find("a").find("img").css("width"));
    		//var shadowwidth = parseInt($('#img_primary').find("a").find("img").css("-webkit-box-shadow").split("px")[2],0);
			var cssleft = (orgimgwidth - 75);
			
			var tmphref = window.location.toString().split("/");

			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}
			
			$.each(datamovies, function(key, show) {
				if(show.imdb_id == imgimdb)
				{
    				$('#img_primary').find("a").prepend("<div class='overlay-watched-big' style='left:"+cssleft+"px;bottom: 10px;'></div>");
    				}
    			});
			
			
		}
		
	addImdbASeen();

	}
	
	var loadedRecently = 0;

	$("#rvi-div").bind("DOMSubtreeModified", function() {
		if(loadedRecently==0)
		{
		console.log(".recently-viewed modified");
			loadedRecently = 1;
			$(document).ready(function() {
			setTimeout(
				function() 
				{
				addImdbASeen();
				loadedRecently = 0;
				}, 200);
			});
		}
	});
	
	function addImdbASeen()
	{	
	$('a[href*="/title/"]').each(function() {
	/*** IMDB add seen image to imdb image links **/

    	if($(this).has("img").length>0 && !$(this).parent().hasClass('imdbRatingPlugin'))
    	{
			var that = $(this);
			var imgimdb;
			var tmphref = $(this).attr("href").split("/");

			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}
			
			var orgimgwidth = parseInt($(this).find("img").css("width"));
			var overlaywidth = orgimgwidth / 2;
    		//var shadowwidth = parseInt($(this).find("img").css("-webkit-box-shadow").split("px")[2],0);
			var cssleft = (orgimgwidth - 55 );//+ shadowwidth);

    		$.each(datamovies, function(key, show) {
				if(show.imdb_id == imgimdb)
				{
				console.log(imgimdb);
    				that.has("img").prepend("<div class='overlay-watched' style='left:"+cssleft+"px'></div>");
    				}
    		});

    	}
	});
	}
}


function loadSeenKinox()
{
var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');


  $.each(datashows, function(key, show) {
  	

	if(show.imdb_id == vimdb)
	{

		var selectedSeason = $("#SeasonSelection option:selected").attr("value");
	

			for(var i=0;i<show.seasons.length;i++)
			{
				greySeenSeasons(i);
				if(show.seasons[i].season.toString()==selectedSeason)
					greySeenEpisodes(i);
			}
	
		function greySeenSeasons(id)
		{
		var seenlenght = show.seasons[id].episodes.toString().split(",").length;
		var seasonlenght = $("#SeasonSelection  option[value="+(id+1)+"]").attr("rel").toString().split(",").length;
		
		var sid = show.seasons[id].season;
			if(seenlenght-seasonlenght>=0)
			{
				$("#SeasonSelection  option[value="+(sid)+"]").css("background", "grey");
			}		
			else
			{
				$("#SeasonSelection  option[value="+(sid)+"]").css("background-color","#bbbbbb");
			}
		}

		function greySeenEpisodes(id)
		{
		var selectids = show.seasons[id].episodes.toString().split(",");
		
			for(var y=0;y<selectids.length;y++)
			{
				$("#EpisodeSelection  option[value="+selectids[y]+"]").css("background", "grey");
			}
		}
		
	}
			
	});
}



$('#SeasonSelection').change(function() {
	resetSelector();
  	loadSeenKinox();
});



function resetSelector()
{
	$("#EpisodeSelection").children().css("background", "white");
}

function addSeenButton()
{
	
	function appendButtons()
	{
		if ($('.button-checkin').length > 0) 
		{
        	$('<div class="trakt-button button-success" id="trakt-success">Success</div>').insertAfter(".trakt-button.button-checkin");
		}
		else
		{
		$('<div class="trakt-button button-success" id="trakt-success">Success</div>').insertAfter(".trakt-button.button-watchlist");
		}
	
	$('<div class="trakt-button button-failure" id="trakt-failure">Failure</div>').insertAfter("#trakt-success");
	$('<div class="trakt-button button-exist" id="trakt-exist">Already Seen</div>').insertAfter("#trakt-failure");
	$('<img id="trakt-loading" src="'+chrome.extension.getURL("load.gif")+'">').insertAfter("#trakt-exist");
	}
	
	if(pMode==pKINOXTO)
	{
	if($('#backward-episode').length == 0)
		$('<a class="trakt-button button-seen" id="add-seen-movie-kinoxto">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-movie-kinoxto">Check In</a><br><br>').insertBefore("#MirrorArea");	
	else
		$('<div id="trakt-result"></div><a class="trakt-button button-seen" id="add-seen-show-kinoxto">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-show-kinoxto">Check In</a>').insertAfter("#backward-episode");
	
		appendButtons();
	}
	else
	if(pMode==pHULU)
	{
		if($("meta[property='og:type']").attr("content")=="video.episode")
			$('<a class="trakt-button button-seen" id="add-seen-show-hulu">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-show-hulu">Check In</a><br><br>').prependTo("#video-description");	
		else
		if($("meta[property='og:type']").attr("content")=="video.movie")	
			$('<a class="trakt-button button-seen" id="add-seen-movie-hulu">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-movie-hulu">Check In</a><br><br>').prependTo("#video-description");	
		appendButtons();
	}
	else
	if(pMode==pIMDB)
	{
		if($(".infobar").text().search("TV Series")!=-1)
			$('<div id="traktv"><a class="trakt-button button-watchlist" id="add-watchlist-show-imdb">Watchlist</a><div id="trakt-show-progress"></div></div><br><br>').prependTo($('#overview-bottom'));
		else
		if($(".tv_header").length>0) // episode
			$('<div id="traktv"><a class="trakt-button button-seen" id="add-seen-show-imdb">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-show-imdb">Check In</a></div><br><br>').prependTo($('#overview-bottom'));
		else	// movie
			$('<div id="traktv"><a class="trakt-button button-watchlist" id="add-watchlist-movie-imdb">Watchlist</a> <a class="trakt-button button-seen" id="add-seen-movie-imdb">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-movie-imdb">Check In</a>  </div><br><br>').prependTo($('#overview-bottom'));
		appendButtons();	
	}
	else
	if(pMode==pSOUTHPARK)
	{
		$('#rightbtn_lang').after('<a class="trakt-button" id="add-seen-show-southpark" style="font-size: 13px;height: 10px;padding-top: 0px;">Seen</a><a class="trakt-button button-checkin" id="add-checkin-show-southpark" style="font-size: 13px;height: 10px;padding-top: 0px;">Check In</a>');

		appendButtons();	
	}
	
	
	/* BUTTON ANIMATIONS - SUCCESS, FAILURE, EXIST */
	function animate_button_failure()
 	{
		$('#trakt-failure').css("display","block");
		$('#trakt-failure').css("opacity","1");
				
		$("#trakt-failure").animate({
    		opacity: 0,
  			}, 3000, function() {
   		$('#trakt-failure').css("display","none");
  		});	 		
 	}
 	
 	function animate_button_exist(text)
 	{
		$('#trakt-exist').text(text);
		$('#trakt-exist').css("display","block");
		$('#trakt-exist').css("opacity","1");
				
		$("#trakt-exist").animate({
    		opacity: 0,
  			}, 3000, function() {
   		$('#trakt-exist').css("display","none");
  		});	 		
 	}

 	function animate_button_success()
 	{
		$('#trakt-success').css("display","block");
		$('#trakt-success').css("opacity","1");
				
		$("#trakt-success").animate({
    		opacity: 0,
  			}, 3000, function() {
   		$('#trakt-success').css("display","none");
  		});	 		
 	}
 	
 	 	
 	function add_watchlist_movie(vuser,vpass,vimdb,vtitle,vyear)
 	{
		var request = $.ajax({
			type: "POST",
			url: "http://api.trakt.tv/movie/watchlist/"+key,
			dataType: "json",
			crossDomain: true,
			
 		 	data: {
   			username: vuser,
   			password: vpass,
    			movies: [{
	    			imdb_id: vimdb,
	   			title: vtitle,
	   			year: vyear
			}]
				},
			success: function(data5,data2,data3) {
				console.log(data5);
				$("#trakt-loading").css("display","none");
				if(data5.inserted>0)
					animate_button_success();
				else
				if(data5.already_exist>0)
					animate_button_exist("Already in Watchlist");
				else
					animate_button_failure();

					
    		},	
			beforeSend: function(x) {
				$("#trakt-loading").css("display","block");
          }
		});
 	}

 	function add_watchlist_show(vuser,vpass,vimdb,vtitle,vyear)
 	{
		var request = $.ajax({
			type: "POST",
			url: "http://api.trakt.tv/show/watchlist/"+key,	
			dataType: "json",
			crossDomain: true,
			
 		 	data: {
   			username: vuser,
   			password: vpass,
    			shows: [{
	    			imdb_id: vimdb,
	   			title: vtitle,
	   			year: vyear
			}]
				},
			success: function(data5,data2,data3) {
				console.log(data5);
				$("#trakt-loading").css("display","none");
				if(data5.inserted>0)
					animate_button_success();
				else
				if(data5.already_exist>0)
					animate_button_exist("Already in Watchlist");
				else
					animate_button_failure();

					
    		},	
			beforeSend: function(x) {
				$("#trakt-loading").css("display","block");
          }
		});
 	}

 	function add_checkin_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode)
 	{
		var request = $.ajax({
			type: "POST",
			url: "http://api.trakt.tv/show/checkin/"+key,	
			dataType: "json",
			crossDomain: true,
			
 		 	data: {
   			username: vuser,
   			password: vpass,
    			imdb_id: vimdb,
    			tvdb_id: "",
   			title: vtitle,
   			year: vyear,
    			season: vseason,
     			episode: vepisode,
			app_version: "2.0",
  			shared: {
				facebook: localStorage["option_share_facebook"] === "true" ? true : false,
				twitter: localStorage["option_share_twitter"] === "true" ? true : false,
	    			tumblr: localStorage["option_share_tumblr"] === "true" ? true : false,
	    			foursquare: localStorage["option_share_foursquare"] === "true" ? true : false
    			}
				},

			success: function(data5,data2,data3) {
				console.log(data5);
				$("#trakt-loading").css("display","none");
				if(data5.status=="success")
					animate_button_success();
				else
				if(data5.error.toString().search("in progress") !=-1)
					animate_button_exist("Already Check In in progress");
				else
					animate_button_failure();
	
    			},	
			error: function (xhr, ajaxOptions, thrownError) {
				$("#trakt-loading").css("display","none");
				console.log(xhr.statusText+","+ajaxOptions+","+thrownError);
    			},
			beforeSend: function(x) {
				$("#trakt-loading").css("display","block");
         		}
		});
 	}

 	function add_seen_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode)
 	{
		var request = $.ajax({
			type: "POST",
			url: "http://api.trakt.tv/show/episode/seen/"+key,	
			dataType: "json",
			crossDomain: true,
			
 		 	data: {
   			username: vuser,
   			password: vpass,
    			imdb_id: vimdb,
    			tvdb_id: "",
   			title: vtitle,
   			year: vyear,
   			episodes: [{
    			       season: vseason,
     			       episode: vepisode
     			   	}]
				},
			success: function(data5,data2,data3) {
					console.log(data5);
					$("#trakt-loading").css("display","none");
					if(data5.message=="1 episodes marked as seen")
						animate_button_success();
					else
						animate_button_failure();

					
    		},	
			beforeSend: function(x) {
				$("#trakt-loading").css("display","block");
          }
		});
 	}
 	

 	function add_checkin_movie(vuser,vpass,vimdb,vtitle,vyear)
	{
	var request = $.ajax({
		type: "POST",
		url: "http://api.trakt.tv/movie/checkin/"+key,	
		dataType: "json",
		crossDomain: true,
 		data: {
   		username: vuser,
   		password: vpass,
	    	imdb_id: vimdb,
   		title: vtitle,
   		year: vyear,
	    	app_version: "0.2",
	    	shared: {
			facebook: localStorage["option_share_facebook"] === "true" ? true : false,
			twitter: localStorage["option_share_twitter"] === "true" ? true : false,
    			tumblr: localStorage["option_share_tumblr"] === "true" ? true : false,
    			foursquare: localStorage["option_share_foursquare"] === "true" ? true : false
		}},
		success: function(data5,data2,data3) {
			console.log(data5);

			$("#trakt-loading").css("display","none");
			if(data5.status=="success")
				animate_button_success();
			else
			if(data5.error.toString().search("in progress") !=-1)
				animate_button_exist("Already Check In in progress");
			else
				animate_button_failure();
					
    		},
    		beforeSend: function(x) 
			{$("#trakt-loading").css("display","block");}
		});

	}
 	
 	function add_seen_movie(vuser,vpass,vimdb,vtitle,vyear)
 	{
	console.log("t: "+ vtitle);
	console.log("id: "+ vimdb);

		var request = $.ajax({
			type: "POST",
			url: "http://api.trakt.tv/movie/seen/"+key,	
			dataType: "json",
			crossDomain: true,
 		 	data: {
   			username: vuser,
   			password: vpass,
   			movies: [{
   			     	imdb_id: vimdb,
   				title: vtitle,
   				year: vyear,
          			plays: 1,
            		 	last_played: Math.round((new Date()).getTime() / 1000)
     			   	}]
				},
			success: function(data5,data2,data3) {
					console.log(data5);

					$("#trakt-loading").css("display","none");
					if(data5.inserted>0)
						animate_button_success();
					else
					if(data5.already_exist>0)
						animate_button_exist("Already Seen");
					else
						animate_button_failure();
					
    		},
    		beforeSend: function(x) 
			{$("#trakt-loading").css("display","block");}
		});
 	}

 	


function getShowDataKinoxto()
{
	var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');
	var vyear = $(".Year:first").text().replace(/[^0-9]+/g, ''); 
	var vtitle = $("div.Opt.leftOpt.Headlne").children("h1").children("span:first-child").text();
	var vseason = $("#SeasonSelection option:selected").text().replace(/[^0-9]+/g, ''); 
	var vepisode = $("#EpisodeSelection option:selected").text().replace(/[^0-9]+/g, ''); 
	
	rdata = {
		imdb 	: vimdb,
		year 	: vyear,
		title	: vtitle,
		season	: vseason,
		episode	: vepisode};

	return rdata;
}

function getMovieDataKinoxto()
{
	var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');
	var vyear = $(".Year:first").text().replace(/[^0-9]+/g, ''); 
	var vtitle = $("div.Opt.leftOpt.Headlne").children("h1").children("span:first-child").text();	

	rdata = {
		imdb : vimdb,
		year : vyear,
		title: vtitle};

	return rdata;
}   

   $("#add-seen-show-kinoxto").click(function(event){
	var data = getShowDataKinoxto();
	add_seen_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);		
   });
   
   $("#add-seen-movie-kinoxto").click(function(event){
	var data = getMovieDataKinoxto();			
	add_seen_movie(vuser,vpass,data.imdb,data.title,data.year);		
   });

   $("#add-checkin-show-kinoxto").click(function(event){  	
	var data = getShowDataKinoxto();		
	add_checkin_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);		
   });

   $("#add-checkin-movie-kinoxto").click(function(event){  	
	var data = getMovieDataKinoxto();			
	add_checkin_movie(vuser,vpass,data.imdb,data.title,data.year);		
   });
   

function getMovieDataImdb()
{
   	var tmp = $('meta[property="og:url"]').attr("content").split("/");
	var vimdb = tmp[tmp.length-2];
	var vyear = ""; 
	var vtitle = "";

	rdata = {
		imdb : vimdb,
		year : vyear,
		title: vtitle};

	return rdata;
}  

function getShowDataImdb()
{
   	var tmp = $('meta[property="og:url"]').attr("content").split("/");
	var vimdb = tmp[tmp.length-2];
	var vyear = ""; 
	var vtitle = $(".tv_header").find("a").text();
	var tmp2 = $(".tv_header").find("span").text().split(",");
	var vseason = tmp2[0].replace(/\D/g,"");
 	var vepisode = tmp2[1].replace(/\D/g,"");

	rdata = {
		imdb : vimdb,
		year : vyear,
		title: vtitle,
		season	: vseason,
		episode	: vepisode};

	return rdata;
}  

   $("#add-watchlist-movie-imdb").click(function(event){
   	var data = getMovieDataImdb();
	add_watchlist_movie(vuser,vpass,data.imdb,data.title,data.year);
   });

   $("#add-watchlist-show-imdb").click(function(event){
   	var data = getMovieDataImdb();
	add_watchlist_show(vuser,vpass,data.imdb,data.title,data.year);
   });

   $("#add-seen-movie-imdb").click(function(event){
	var data = getMovieDataImdb();	
	add_seen_movie(vuser,vpass,data.imdb,data.title,data.year);		
   });
   
   $("#add-seen-show-imdb").click(function(event){
   	var data = getShowDataImdb();
	add_seen_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);
   });

   $("#add-checkin-movie-imdb").click(function(event){
	var data = getMovieDataImdb();	
	add_checkin_movie(vuser,vpass,data.imdb,data.title,data.year);		
   });
   
   $("#add-checkin-show-imdb").click(function(event){
   	var data = getShowDataImdb();
	add_checkin_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);
   });

function getMovieDataHulu()
{
	var vtitle = $.trim($("meta[property='og:title']").attr("content").split(":")[0]);
	var vimdb = '';
	//var vyear = $.trim($(".film-details").find("tbody").find("tr").find("td:eq(1)").eq(0).text().split("(")[1]).replace(/[^0-9]+/g, '');
	var vyear = $(".episode-title").text().split("(")[1].replace(/[^0-9]+/g, '');
	rdata = {
		imdb : vimdb,
		year : vyear,
		title: vtitle};

	return rdata;
}  

function getShowDataHulu()
{
 	var val = $(".info").text();
	var vseason = $.trim(val.split("|")[0].match("Season(.*)Episode")[1]);
	var vepisode = $.trim(val.split("|")[0].split("Episode")[1]);
	var vtitle = $("meta[property='og:title']").attr("content").split(":")[0];
	var vimdb = '';
	var vyear = '';

	rdata = {
		imdb : vimdb,
		year : vyear,
		title: vtitle,
		season	: vseason,
		episode	: vepisode};

	return rdata;
} 

   $("#add-seen-show-hulu").click(function(event){
	var data = getShowDataHulu();
	add_seen_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);
   });
   
   $("#add-seen-movie-hulu").click(function(event){
	var data = getMovieDataHulu();
	add_seen_movie(vuser,vpass,data.imdb,data.title,data.year);
   });

   $("#add-checkin-show-hulu").click(function(event){
	var data = getShowDataHulu();
	add_checkin_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);
   });
   
   $("#add-checkin-movie-hulu").click(function(event){
	var data = getMovieDataHulu();
	add_checkin_movie(vuser,vpass,data.imdb,data.title,data.year);
   });  

function getShowDataSouthpark()
{
	var ids = getSouthparkShowIDs(window.location.toString());
	season = ids.SEASON;
	episode = ids.EPISODE;
	var vseason = $.trim(season);
	var vepisode = $.trim(episode);
	var vtitle = "South Park";
	var vimdb = 'tt0121955';
	var vyear = '';

	rdata = {
		imdb : vimdb,
		year : vyear,
		title: vtitle,
		season	: vseason,
		episode	: vepisode};

	return rdata;
} 
   
  $("#add-seen-show-southpark").click(function(event){
	var data = getShowDataSouthpark();
	add_seen_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);
   });

  $("#add-checkin-show-southpark").click(function(event){
	var data = getShowDataSouthpark();
	add_checkin_show(vuser,vpass,data.imdb,data.title,data.year,data.season,data.episode);
   });
}
	

	/* KINOX.TO - SEEN SEASONS */

	$('#SeasonSelection').change(function() {
		resetSelector();
  		loadSeenKinox();
	});

	function resetSelector()
	{
		$("#EpisodeSelection").children().css("background", "white");
	}
	

});
}


 if (window.addEventListener) {  
     window.addEventListener('load',  loadUser(), false);
 } else {
     window.attachEvent('onload',  loadUser());
 }




