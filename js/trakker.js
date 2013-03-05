/****************************************************
*		trakttv Everywhere		  					*
*	 Author: Simon Schubert			  				*
*	 Email: sschubert89@gmail.com		  			*
*   github: https://github.com/SimonSchubert/     	*
*	 google-chrome-plugin-trakttv-everywhere  		*
*						  							*
****************************************************/

var config = '';
var trakt = '';
var allreadyseen = false;
pMode = 0;
pIMDB=0;pHULU=1;pSOUTHPARK=2;pKINOXTO=3;


function getPage() {
	if(window.location.toString().search("kinox")!=-1) {
		pMode = pKINOXTO;
	} else if(window.location.toString().search("hulu")!=-1) {
		pMode = pHULU;
	} else if(window.location.toString().search("imdb.com")!=-1) {
		pMode = pIMDB;
	} else if(window.location.toString().search("southpark.de/alle-episoden")!=-1||window.location.toString().search("southparkstudios.com/full-episodes")!=-1) {
		pMode = pSOUTHPARK;
	}
}	

function loadUser() {
	chrome.extension.sendRequest( { eventName: "getLogin" },
    function(response) {
		config = {
			user: response.user,
			pass: response.pass,
			api_key: response.apikey,
			checkin: response.option_checkin,
			pass_hash: false
		}
		trakt =  new Trakt({api_key: config.api_key, username: config.user, password: config.pass, pass_hash: config.pass_hash});
        getPage();
		main();
    });
}

function main() {
	$(document).ready(function() {
		var datashows; // JSON Object
		var datamovies;

		// Check if the JSON Object is stored in the local storage
		var ts = Math.round((new Date()).getTime() / 1000);
		var lastupdate = ts-$.Storage.get("seen-shows-date");
		if( $.Storage.get("seen-shows-date") != null && lastupdate<300 ) {
			console.log("loading seen-shows json object from local storage - last update :"+(lastupdate));
			datashows = JSON.parse($.Storage.get("seen-shows")); // Load
			datamovies = JSON.parse($.Storage.get("seen-movies")); // Load

			//console.log('datashows',datashows);
			//console.log('datamovies',datamovies);

			if(pMode == pKINOXTO)
				loadSeenKinox();
			if(pMode == pIMDB)
				loadSeenImdb();
			if(pMode == pSOUTHPARK)
				initSouthpark();
		} else {
			console.log("save and load seen-shows and movies json object to local storage"); 

			trakt.request('user', 'library/shows/watched', {username: config.user, extended: false}, function(err, res) {
				if(!err) {
					datashows = res;
					$.Storage.set("seen-shows-date", ts.toString());
					$.Storage.set("seen-shows", JSON.stringify(res));	//save
					trakt.request('user', 'library/movies/watched', {username: config.user, extended: false}, function(err2, res2) {
						if(!err2) {
							datamovies = res2;
							$.Storage.set("seen-movies", JSON.stringify(res2));
			
							if(pMode == pKINOXTO)
								loadSeenKinox();
							if(pMode == pIMDB)
								loadSeenImdb();
							if(pMode == pSOUTHPARK)
								initSouthpark();
						}
					});
				}
			});
		}

		function initSouthpark() {
			$('a[href*="guide/episoden/staffel"]').each(function() {
				$(this).click(function(event){
					setTimeout(loadSeenSouthpark, 2000);
				});
			});		
			loadSeenSouthpark();
		}

		function getSouthparkShowIDs(_href) {
				var tmpref = _href.split("/");
				var tmpes = tmpref[tmpref.length-1];
				console.log(tmpref[tmpref.length-2]+" -"+tmpes);
	
				if(tmpref[tmpref.length-2] == "full-episodes") { // SOUTHPARKSTUDIOS.COM
					var season = tmpes.substr(1,2).replace(/^0+/, '');	
					var episode = tmpes.substr(4,2).replace(/^0+/, '');	
					console.log(season+" -"+episode);
				} else {  // SOUTHPARK.DE
					var tmpes = tmpref[tmpref.length-2];
					if(tmpes.length==3)	{
					var season = tmpes.substr(0,1).replace(/^0+/, '');	
					var episode = tmpes.substr(1,3).replace(/^0+/, '');	
					} else {
					var season = tmpes.substr(0,2).replace(/^0+/, '');	
					var episode = tmpes.substr(2,4).replace(/^0+/, '');	
					}
				}
	
				IDS = {
				EPISODE :episode,
				SEASON : season};
			return IDS;
		}

		function loadSeenSouthpark() {
			console.log("loadSeenSouthpark()");
			var orgimgwidth = 55;
			$('a.content_eppreview').each(function() {
				var that = $(this);
				var ids = getSouthparkShowIDs($(this).attr("href"));
				season = ids.SEASON;
				episode = ids.EPISODE;

				$.each(datashows, function(key, show) {
					if(show.imdb_id == "tt0121955") {				
						for(var i=0;i<show.seasons.length;i++) {
							if(show.seasons[i].season.toString()==season) {
								if ( $.inArray(episode, show.seasons[i].episodes.toString().split(",")) > -1 ) {
									that.parent().append("<div class='overlay-watched-small' style='left:"+(orgimgwidth-28)+"px;'></div>");
								}
							}
						}
					}
				});
			});
			addSeenButton();
		}

		function loadSeenImdb() {
		
			if($(".infobar").text().search("TV Series")!=-1) {
				var tmp = $('meta[property="og:url"]').attr("content").split("/");
				var imdbid = tmp[tmp.length-2];

				trakt.request('user', 'progress/watched', {username: config.user, title: imdbid, extended: false}, function(err, res) {
					console.log(res);
					if(!err) {
						$.each(res, function(key, show) {
							console.log(show);
							if(show.show.imdb_id==imdbid) {
								$('.infobar').append('<div style="color:#136cb2">'+show.progress.percentage+' % ('+show.progress.completed+'/'+show.progress.aired+')</div>');
								if(show.progress.percentage==100) {
									var orgimgwidth = parseInt($('#img_primary').find("a").find("img").css("width"));
									var cssleft = (orgimgwidth - 75);
									$('#img_primary').find("a").prepend("<div class='overlay-watched-big' style='left:"+cssleft+"px;bottom: 10px;'></div>");
								}
							}
						});
					} else {
						console.log(err);
					}
				});
			}

			if(window.location.toString().search("/search/")!=-1) {
				var imdb_ids;
				if(window.location.toString().search("title_type=tv_serie")!=-1) {
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

					trakt.request('user', 'progress/watched', {username: config.user, title: imdb_ids, extended: false}, function(err, res) {
						console.log(res);
						if(!err) {
							$.each(res, function(key, show) {
								console.log(show);
								$('a[href*="'+show.show.imdb_id+'"]').parent().find('.year_type').append('<span style="color:#136cb2"> '+show.progress.percentage+' % ('+show.progress.completed+'/'+show.progress.aired+')</span>');
								if(show.progress.percentage==100) {
									$('a[href*="'+show.show.imdb_id+'"]').find('img').parent().prepend("<div class='overlay-watched' style='left:"+-1+"px;bottom: 0px;'></div>");
								}
							});
						} else {
							console.log(err);
						}
					});
				}
			}

			if(window.location.toString().search("/chart/")!=-1) {
				/*** IMDB charts highlighting **/
				$('#main').find("tbody").find("tr").each(function() {
					var that = $(this);

					var tmphref = $(this).find("td").eq(2).find("a").attr("href");
		
					if(tmphref) {
						tmphref = tmphref.split("/");
						var imgimdb;
						for(var p=0 ; p<tmphref.length ; p++) {
							if(tmphref[p]=="title")
								imgimdb = tmphref[p+1];
						}
						$.each(datamovies, function(key, show) {						
							if(show.imdb_id == imgimdb) {
							that.css("background-color","black");
							that.find("td").css("color","white");
							}
						});
					}
		
				});
			} else {
				if($('#img_primary').find("a").find("img").length>0) {
					var orgimgwidth = parseInt($('#img_primary').find("a").find("img").css("width"));

					var cssleft = (orgimgwidth - 75);

					var tmphref = window.location.toString().split("/");

					for(var p=0 ; p<tmphref.length ; p++) {
						if(tmphref[p]=="title")
							imgimdb = tmphref[p+1];
					}

					$.each(datamovies, function(key, show) {
						if(show.imdb_id == imgimdb) {
							$('#img_primary').find("a").prepend("<div class='overlay-watched-big' style='left:"+cssleft+"px;bottom: 10px;'></div>");
						}
					});
				}

				$('a[href*="/title/"]').each(function() {
				/*** IMDB add seen image to imdb image links **/

					if($(this).has("img").length>0) {
						var that = $(this);
						var imgimdb;
						var tmphref = $(this).attr("href").split("/");

						for(var p=0 ; p<tmphref.length ; p++) {
							if(tmphref[p]=="title")
								imgimdb = tmphref[p+1];
						}

						var orgimgwidth = parseInt($(this).find("img").css("width"));

						var cssleft = (orgimgwidth - 55);

						$.each(datamovies, function(key, show) {
							if(show.imdb_id == imgimdb) {
								that.has("img").prepend("<div class='overlay-watched' style='left:"+cssleft+"px'></div>");
							}
						});
						
						$.each(datashows, function(key, show) {
							if(show.imdb_id == imgimdb) {
								that.has("img").prepend("<div class='overlay-watched' style='left:"+cssleft+"px'></div>");
							}
						});
					}
				});
			}
			if(!allreadyseen)
				addSeenButton();
		}


		function loadSeenKinox() {
			var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');

			$.each(datashows, function(key, show) {		
				if(show.imdb_id == vimdb) {
					var selectedSeason = $("#SeasonSelection option:selected").attr("value");

					for(var i=0;i<show.seasons.length;i++) {
						greySeenSeasons(i);
						if(show.seasons[i].season.toString()==selectedSeason)
							greySeenEpisodes(i);
					}
	
					function greySeenSeasons(id) {
					var seenlenght = show.seasons[id].episodes.toString().split(",").length;
					var seasonlenght = $("#SeasonSelection  option[value="+(id+1)+"]").attr("rel").toString().split(",").length;
		
					var sid = show.seasons[id].season;
						if(seenlenght-seasonlenght>=0) {
							$("#SeasonSelection  option[value="+(sid)+"]").css("background", "grey");
						} else {
							$("#SeasonSelection  option[value="+(sid)+"]").css("background-color","#bbbbbb");
						}
					}

					function greySeenEpisodes(id) {
					var selectids = show.seasons[id].episodes.toString().split(",");
						for(var y=0;y<selectids.length;y++) {
							$("#EpisodeSelection  option[value="+selectids[y]+"]").css("background", "grey");
						}
					}				
				}
			});
			addSeenButton();
		}

		$('#SeasonSelection').change(function() {
			resetSelector();
			loadSeenKinox();
		});

		function resetSelector() {
			$("#EpisodeSelection").children().css("background", "white");
		}

		function addSeenButton() {
			function appendButtons() {
				$('<div class="trakt-button button-success" id="trakt-success">Success</div>').insertAfter(".trakt-button.button-watched");	
				$('<div class="trakt-button button-failure" id="trakt-failure">Failure</div>').insertAfter("#trakt-success");
				$('<div class="trakt-button button-exist" id="trakt-exist">Already Seen</div>').insertAfter("#trakt-failure");
				$('<img id="trakt-loading" src="'+chrome.extension.getURL("images/load.gif")+'">').insertAfter("#trakt-exist");
			}

			if(pMode==pKINOXTO)	{
				if($('#backward-episode').length == 0) {
					var sButtons = '<a class="trakt-button button-seen" id="add-seen-movie-kinoxto">Seen</a>'; //Seen
					if(config.checkin == 'true') sButtons += ' <a class="trakt-button button-checkin" id="add-checkin-movie-kinoxto">Check In</a>';  //Checkin
					sButtons += '<br><br>';
					$(sButtons).insertBefore("#MirrorArea");	
				} else {
					var sButtons = '<div id="trakt-result"></div><a class="trakt-button button-seen" id="add-seen-show-kinoxto">Seen</a>'; //Seen
					if(config.checkin == 'true') sButtons += ' <a class="trakt-button button-checkin" id="add-checkin-show-kinoxto">Check In</a>';  //Checkin
					$(sButtons).insertAfter("#backward-episode");
				}
				appendButtons();
			} else if(pMode==pHULU) {
				if($("meta[property='og:type']").attr("content")=="video.episode") {
					var sButtons = '<a class="trakt-button button-seen" id="add-seen-show-hulu">Seen</a>'; //Seen
					if(config.checkin == 'true') sButtons += ' <a class="trakt-button button-checkin" id="add-checkin-show-hulu">Check In</a>'; //Checkin
					sButtons += '<br><br>';
					$(sButtons).prependTo("#video-description");	
				} else if($("meta[property='og:type']").attr("content")=="video.movie") {
					var sButtons = '<a class="trakt-button button-seen" id="add-seen-movie-hulu">Seen</a>'; //Seen
					if(config.checkin == 'true') sButtons += ' <a class="trakt-button button-checkin" id="add-checkin-movie-hulu">Check In</a>'; //Checkin
					sButtons += '<br><br>';
					$(sButtons).prependTo("#video-description");
				}
				appendButtons();
			} else if(pMode==pIMDB)	{
				if($(".tv_header").length>0) {
					var sButtons = '<div id="traktv">';
					sButtons += '<a class="trakt-button button-seen" id="add-seen-show-episode-imdb">Seen</a>'; //Seen
					if(config.checkin == 'true') sButtons += '<a class="trakt-button button-checkin" id="add-checkin-show-episode-imdb">Check In</a>';  //Checkin
					sButtons += '<a class="trakt-button button-watched" id="add-watchlist-show-episode-imdb">Watchlist</a>'; //Watchlist
					sButtons += '</div><br><br>';
					$(sButtons).prependTo($('#overview-bottom'));
				} else if($('meta[property="og:type"]').attr("content") == 'video.tv_show') {
					var sButtons = '<div id="traktv">';
					sButtons += '<a class="trakt-button button-seen" id="add-seen-show-imdb">Seen</a>'; //Seen
					sButtons += ' <a class="trakt-button button-watched" id="add-watchlist-show-imdb">Watchlist</a><div id="trakt-show-progress"></div>'; //Watchlist
					sButtons += '</div><br><br>';
					$(sButtons).prependTo($('#overview-bottom'));
				} else {
					var sButtons = '<div id="traktv">';
					sButtons += '<a class="trakt-button button-seen" id="add-seen-movie-imdb">Seen</a>'; //Seen
					if(config.checkin == 'true') sButtons += ' <a class="trakt-button button-checkin" id="add-checkin-movie-imdb">Check In</a>'; //Checkin
					sButtons += ' <a class="trakt-button button-watched" id="add-watchlist-movie-imdb">Watchlist</a>'; //Watchlist
					sButtons += '</div><br><br>';
					$(sButtons).prependTo($('#overview-bottom'));
				}
				appendButtons();	
			} else if(pMode==pSOUTHPARK) {
				var sButtons = '<a class="trakt-button" id="add-seen-show-southpark" style="font-size: 13px;height: 10px;padding-top: 0px;">Seen</a>'; //Seen
				if(config.checkin == 'true') sButtons += ' <a class="trakt-button button-checkin" id="add-checkin-show-southpark" style="font-size: 13px;height: 10px;padding-top: 0px;">Check In</a>'; //Checkin
				$('#rightbtn_lang').after(sButtons);
				appendButtons();	
			}


			/* BUTTON ANIMATIONS - SUCCESS, FAILURE, EXIST */
			function animate_button_failure() {
				$('#trakt-failure').css("display","block");
				$('#trakt-failure').css("opacity","1");
			
				$("#trakt-failure").animate({
					opacity: 0,
					}, 3000, function() {
				$('#trakt-failure').css("display","none");
				});	 		
			}

			function animate_button_exist(text)	{
				$('#trakt-exist').text(text);
				$('#trakt-exist').css("display","block");
				$('#trakt-exist').css("opacity","1");
			
				$("#trakt-exist").animate({
					opacity: 0,
					}, 3000, function() {
				$('#trakt-exist').css("display","none");
				});	 		
			}

			function animate_button_success() {
				$('#trakt-success').css("display","block");
				$('#trakt-success').css("opacity","1");
			
				$("#trakt-success").animate({
					opacity: 0,
					}, 3000, function() {
				$('#trakt-success').css("display","none");
				});	 		
			}

			function add_seen_show(vimdb,vtitle,vyear) {
				{$("#trakt-loading").css("display","block");}
				trakt.request('show', 'seen', {
					imdb_id: vimdb, 
					title: vtitle, 
					year: vyear
					}, function(err, res) {
					$("#trakt-loading").css("display","none");
					if(!err) {
						console.log(res);
						if(res.message == "0 episodes marked as seen")
							animate_button_exist("Already Seen");
						else if(res.message.indexOf("episodes marked as seen") != -1)
							animate_button_success();
						else
							animate_button_failure();
					} else {
						animate_button_failure();
						console.log(err);
					}
				});
			}

			function add_seen_show_episode(vimdb,vtitle,vyear,vseason,vepisode) {
				{$("#trakt-loading").css("display","block");}
				trakt.request('show', 'episode/seen', {
					imdb_id: vimdb,
					tvdb_id: "",
					title: vtitle,
					year: vyear,
					episodes: [{
					   season: vseason,
					   episode: vepisode
					}]
					}, function(err, res) {
					$("#trakt-loading").css("display","none");
					if(!err) {
						console.log(res);
						if(res.message == "1 episodes marked as seen")
							animate_button_success();
						else if(res.message == "0 episodes marked as seen")
							animate_button_exist("Already Seen");
						else
							animate_button_failure();
					} else {
						animate_button_failure();
						console.log(err);
					}
				});
			}

			function add_checkin_show_episode(vimdb,vtitle,vyear,vseason,vepisode) {
				var trakt_url = "http://api.trakt.tv/show/checkin/";
				var request = $.ajax({
					type: "POST",
					url: "http://royalkoala.com/trakttv/trakt_transfer.php?trakt_url="+trakt_url,	
					dataType: "json",
					crossDomain: true,
					data: {
						username: config.user,
						password: config.pass,
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
						else if(data5.error.toString().search("in progress") !=-1)
							animate_button_exist("Already Check In in progress");
						else
							animate_button_failure();
					},	
					error: function (xhr, ajaxOptions, thrownError) {
						$("#trakt-loading").css("display","none");
						animate_button_failure();
						console.log(xhr.statusText+","+ajaxOptions+","+thrownError);
					},
					beforeSend: function(x) {
						$("#trakt-loading").css("display","block");
					}
				});
			}

			function add_watchlist_show(vimdb,vtitle,vyear) {
				{$("#trakt-loading").css("display","block");}
				trakt.request('show', 'watchlist', {shows: [{
						imdb_id: vimdb,
						title: vtitle,
						year: vyear
					}]
					}, function(err, res) {
					$("#trakt-loading").css("display","none");
					if(!err) {
						console.log(res);
						if(res.inserted>0)
							animate_button_success();
						else if(res.already_exist>0)
							animate_button_exist("Already in Watchlist");
						else
							animate_button_failure();
					} else {
						animate_button_failure();
						console.log(err);
					}
				});
			}

			function add_watchlist_show_episode(vimdb,vtitle,vyear,vseason,vepisode) {
				{$("#trakt-loading").css("display","block");}
				trakt.request('show', 'episode/watchlist', {
						imdb_id: vimdb,
						tvdb_id: "",
						title: vtitle,
						year: vyear,
						episodes: [{
							season: vseason,
							episode: vepisode
						}]
					}, function(err, res) {
					$("#trakt-loading").css("display","none");
					if(!err) {
						console.log(res);
						if(res.message == "1 episodes added to your watchlist")
							animate_button_success();
						else if(res.message == "0 episodes added to your watchlist")
							animate_button_exist("Already in Watchlist");
						else
							animate_button_failure();
					} else {
						animate_button_failure();
						console.log(err);
					}
				});
			}

			function add_seen_movie(vimdb,vtitle,vyear)	{
				{$("#trakt-loading").css("display","block");}
				trakt.request('movie', 'seen', {movies: [
				{
					imdb_id: vimdb, 
					title: vtitle, 
					year: vyear, 
					plays: 1, 
					last_played: Math.round((new Date()).getTime() / 1000)
				}
				]}, function(err, res) {
					$("#trakt-loading").css("display","none");
					if(!err) {
						console.log(res);
						if(res.inserted>0)
							animate_button_success();
						else if(res.already_exist>0)
							animate_button_exist("Already Seen");
						else
							animate_button_failure();
					} else {
						animate_button_failure();
						console.log(err);
					}
				});
			}

			function add_checkin_movie(vimdb,vtitle,vyear) {
				var trakt_url = "http://api.trakt.tv/movie/checkin/";
				var request = $.ajax({
					type: "POST",
					url: "http://royalkoala.com/trakttv/trakt_transfer.php?trakt_url="+trakt_url,	
					dataType: "json",
					crossDomain: true,
					data: {
						username: config.user,
						password: config.pass,
						imdb_id: vimdb,
						title: vtitle,
						year: vyear,
						app_version: "0.2",
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
						else if(data5.error.toString().search("in progress") !=-1)
							animate_button_exist("Already Check In in progress");
						else
							animate_button_failure();
						},
					error: function (xhr, ajaxOptions, thrownError) {
						$("#trakt-loading").css("display","none");
						animate_button_failure();
						console.log(xhr.statusText+","+ajaxOptions+","+thrownError);
						},
					beforeSend: function(x) 
						{$("#trakt-loading").css("display","block");}
					});
			}

			function add_watchlist_movie(vimdb,vtitle,vyear) {
				{$("#trakt-loading").css("display","block");}
				trakt.request('movie', 'watchlist', {movies: [{
						imdb_id: vimdb,
						title: vtitle,
						year: vyear
					}]
					}, function(err, res) {
					$("#trakt-loading").css("display","none");
					if(!err) {
						console.log(res);
						if(res.inserted>0)
							animate_button_success();
						else if(res.already_exist>0)
							animate_button_exist("Already in Watchlist");
						else
							animate_button_failure();
					} else {
						animate_button_failure();
						console.log(err);
					}
				});
			}

			function getMovieDataImdb() {
				var tmp = $('meta[property="og:url"]').attr("content").split("/");
				var vimdb = tmp[tmp.length-2];

				var tmp = $('meta[property="og:title"]').attr("content").split("(");
				var vyear = tmp[1].replace(/["'\)]/g, ""); 
				var vtitle = tmp[0];
	
				rdata = {
					imdb : vimdb,
					year : vyear,
					title: vtitle};

				return rdata;
			}  

			function getShowEpisodeDataImdb() {
				var tmp = $('meta[property="og:url"]').attr("content").split("/");
				var vimdb = tmp[tmp.length-2];

				var tmp = $('meta[property="og:title"]').attr("content").split(" ");
				var vyear = tmp[tmp.length-1].replace(/["'\)]/g, "");
	
				var vtitle = $(".tv_header").find("a").text().trim();
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
			add_watchlist_movie(data.imdb,data.title,data.year);
			console.log('add_watchlist_movie');
			});

			$("#add-seen-movie-imdb").click(function(event){
			var data = getMovieDataImdb();	
			add_seen_movie(data.imdb,data.title,data.year);
			console.log('add_seen_movie');
			});

			$("#add-seen-show-imdb").click(function(event){
			var data = getMovieDataImdb();
			add_seen_show(data.imdb,data.title,data.year);
			console.log('add_seen_show');
			});

			$("#add-watchlist-show-imdb").click(function(event){
			var data = getMovieDataImdb();
			add_watchlist_show(data.imdb,data.title,data.year);
			console.log('add_watchlist_show');
			});

			$("#add-watchlist-show-episode-imdb").click(function(event){
			var data = getShowEpisodeDataImdb();
			add_watchlist_show_episode(data.imdb,data.title,data.year,data.season,data.episode);
			console.log('add_watchlist_show_episode');
			});

			$("#add-seen-show-episode-imdb").click(function(event){
			var data = getShowEpisodeDataImdb();
			add_seen_show_episode(data.imdb,data.title,data.year,data.season,data.episode);
			console.log('add_seen_show_episode');
			});

			$("#add-checkin-movie-imdb").click(function(event){
			var data = getMovieDataImdb();	
			add_checkin_movie(data.imdb,data.title,data.year);
			console.log('add_checkin_movie');
			});

			$("#add-checkin-show-episode-imdb").click(function(event){
			var data = getShowEpisodeDataImdb();
			add_checkin_show_episode(data.imdb,data.title,data.year,data.season,data.episode);
			console.log('add_checkin_show_episode');
			});


			function getShowDataKinoxto() {
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

			function getMovieDataKinoxto() {
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
			add_seen_show(data.imdb,data.title,data.year,data.season,data.episode);		
			});

			$("#add-seen-movie-kinoxto").click(function(event){
			var data = getMovieDataKinoxto();			
			add_seen_movie(data.imdb,data.title,data.year);		
			});

			$("#add-checkin-show-kinoxto").click(function(event){  	
			var data = getShowDataKinoxto();		
			add_checkin_show(data.imdb,data.title,data.year,data.season,data.episode);		
			});

			$("#add-checkin-movie-kinoxto").click(function(event){  	
			var data = getMovieDataKinoxto();			
			add_checkin_movie(data.imdb,data.title,data.year);		
			});


			function getMovieDataHulu() {
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

			function getShowDataHulu() {
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
			add_seen_show(data.imdb,data.title,data.year,data.season,data.episode);
			});

			$("#add-seen-movie-hulu").click(function(event){
			var data = getMovieDataHulu();
			add_seen_movie(data.imdb,data.title,data.year);
			});

			$("#add-checkin-show-hulu").click(function(event){
			var data = getShowDataHulu();
			add_checkin_show(data.imdb,data.title,data.year,data.season,data.episode);
			});

			$("#add-checkin-movie-hulu").click(function(event){
			var data = getMovieDataHulu();
			add_checkin_movie(data.imdb,data.title,data.year);
			});  

			function getShowDataSouthpark() {
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

		function resetSelector() {
			$("#EpisodeSelection").children().css("background", "white");
		}

	});
}

if (window.addEventListener) {  
	window.addEventListener('load',  loadUser(), false);
} else {
	window.attachEvent('onload',  loadUser());
}
 
function trackButtonClick(e) {
	_gaq.push(['_trackEvent', e.target.id, 'clicked']);
};