var base_url = 'https://api.trakt.tv';

var Trakt = function (options) {
	this._config = {api_key: ''};
	if (options && options.api_key) {
		this._config.api_key = options.api_key;
	}
	if (!this._config.api_key) {
		throw new Error('No API key specified');
	}

	this.setUser = function (username, password, pass_hash) {
		this._config.username = username;
		this._config.password = pass_hash ? $.sha1(password) : password
	};

	if (options) {
		this.setUser(options.username, options.password, options.pass_hash);
	}
	
	// TODO: Split this beast up and implement some nifty events
	this.request = function (action, method, options, callback) {
		if (!api[action]) {
			return callback(new Error('Invalid action: ' + action));
		}
		var opts = Helper.apiMethod(action, method);
		if (!opts) {
			return callback(new Error('Invalid method ' + method + ' for action ' + action));
		}
	
		if (opts.type === 'GET') {
			this.getRequest.call(this, action, opts, options, callback);
		} else if (opts.type === 'POST') {
			this.postRequest.call(this, action, opts, options, callback);
		}
	};
	
	this.getRequest = function (action, opts, options, callback) {
		var url = this.getGetUrl(action, opts, 'json', options);
		if (!url) {
			return callback(new Error('Missing parameters'));
		}
	
		$.ajax({
		   type: opts.type,
			url: url,
			async: false,
			contentType: "application/json",
			dataType: 'json',
			success: function(json) {
				return callback(null, json);
			},
			error: function(e) {
				if (e.status !== 200) {
					var err = 'Trakt responded with ' + e.responseText;
					return callback(err);
				} else {
					return callback(e);
				}
			}
		});
	};
	
	this.postRequest = function (action, opts, options, callback) {
		if (!this._config.username || !this._config.password) {
			return callback(new Error('POST messages require username and password'));
		}

		var params = this.getPostParams(action, opts, options);

		if (!params) {
			return callback(new Error('Missing parameters'));
		}
		params.username = this._config.username;
		params.password = this._config.password;
	
		var data = JSON.stringify(params);
		var url = this.getPostUrl(action, opts)
		
		var request = $.ajax({
		   type: opts.type,
			url: url,
			data: data,
			dataType: 'json',
			contentType: "application/json; charset=utf-8",
			success: function(json) {
				return callback(null, json);
			},
			error: function(e) {
				//console.log(e);
				if (e.status !== 200) {
					var err = 'Trakt responded with ' + e.responseText;
					return callback(err);
				} else {
					return callback(e);
				}
			}
		});
	};
	
	/*
	 * Url generating functions
	 */
	this.getGetUrl = function (action, opts, format, options) {
		var url = base_url + '/' + action + '/' + opts.method + '.' + format + '/' + this._config.api_key;
		
		var length = opts.parameters.length;
	
		for (var i = 0; i < length; i++) {
			var param = opts.parameters[i];
			if (options[param.name]) {
				url += '/' + options[param.name].replace(/ /g, '+');
			} else {
				if (!param.optional) {
					return undefined;
				} else {
					break;
				}
			}
		}
		return url.replace(' ', '+');
	};
	
	this.getPostUrl = function (action, opts) {
		return base_url + '/' + action + '/' + opts.method + '/' + this._config.api_key;
	};
	
	this.getPostParams = function (action, opts, options) {
		var result = {};
		var length = opts.parameters.length;
		for (var i = 0; i < length; i++) {
			var param = opts.parameters[i];
			//console.log('options['+param.name+']',options[param.name]);
			if (options[param.name]) {
				result[param.name] = options[param.name];
			} else if (!param.optional) {
				return undefined;
			}
		}
		return result;
	};
};