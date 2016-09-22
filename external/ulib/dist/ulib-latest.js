var ulib = this.ulib || {};
(function(){
;/*global window, $, jQuery */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.ajax - ajax functionality
	part of the u collection - simple utilities

	Usage:

		u.ajax(url, callback, options)
	
	url - the URL to use
	callback - a function to run when the call is completed, it will be data typically as an object
	options - optional arguments:

*/
var ulib = this.ulib || {};
(function(){
	var ajax = function(args) {//url, callBack) {
		var url = args.url, callBack = args.callBack, type = args.type || 'ajax',
			async = (typeof args.async !== 'undefined')? args.async: true;
		
		var ajaxRequest = function(url, callBack) {
		
			var bind = function (caller, object) {
				return function() {
					return caller.apply(object, [object]);
				};
			}, stateChange = function (object) {
				if (request.readyState==4) {
					callBack(request.responseText);
				}
			}, getRequest = function() {
				if (window.ActiveXObject) {
					return new ActiveXObject('Microsoft.XMLHTTP');
				} else if (window.XMLHttpRequest) {
					return new XMLHttpRequest();
				}
				return false;
			}, postBody = (arguments[2] || "");
		
			request = getRequest();
			
			if(request) {
				var req = request;
				req.onreadystatechange = bind(stateChange, this);
		
				if (postBody!=="") {
					req.open("POST", url, async);
					req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
					req.setRequestHeader('Connection', 'close');
				} else {
					req.open("GET", url, async);
				}
		
				req.send(postBody);
			}
		}, 
		scriptRequest = function(url, callBack){
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				script = document.createElement("script");
				
			script.src = url;
			/*
			if ( s.scriptCharset ) {
				script.charset = s.scriptCharset;
			}
			*/

			// Handle Script loading
			var done = false;

			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = function() {
				if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
					done = true;
					callBack();

					// Handle memory leak in IE
					script.onload = script.onreadystatechange = null;
					if ( head && script.parentNode ) {
						head.removeChild( script );
					}
				}
			};

			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used (#2709 and #4378).
			head.insertBefore( script, head.firstChild );

			// We handle everything using the script element injection
			return undefined;			
		};
		
		if(type === 'ajax') {
			return ajaxRequest(url, callBack);
		} else if(type==='script') {
			return scriptRequest(url, callBack);
		}
		
	};
	
	
	//	Expose the ajax function
	ulib.ajax = ajax;
}).call(this);;/*global window */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.cookie - cookie functionality
	part of the u collection - simple utilities

	Usage:

		ulib.cookie.set(key, value, options)
	
	key - the key for the cookie to set
	value - what valye to set for the cookie
	options - optional arguments:
		days - how many days the cookie is valid for

*/
var ulib = this.ulib || {};
(function(){
	var cookie = {
		//	Get a cookie
		get: function (key) {
			var tmp = window.document.cookie.match((new RegExp(key + '=[^;]+($|;)', 'gi')));
			if (!tmp || !tmp[0]) {
				return null;
			} else {
				return window.unescape(tmp[0].substring(key.length + 1, tmp[0].length).replace(';', '')) || null;
			}
		},

		//	Set cookie, use options to optionally specify days, (default = 1), path, session only cookie, etc...
		set: function (key, value, options) {
			var cookie = [key + '=' + window.escape(value)],
				seconds, minutes, days, months, years, expiryDate, addDays;

			//	Ensure we have options
			options = options || {};

			if (!options.session) {
				days = (isNaN(parseInt(options.days, 10))) ? 1 : parseInt(options.days, 10);

				expiryDate = new Date();
				addDays = (days * 24 * 60 * 60 * 1000);
				expiryDate.setTime(expiryDate.getTime() + addDays);
				cookie.push('expires=' + expiryDate.toGMTString());
			}

			if (options.path) {
				cookie.push('path=' + options.path);
			}

			if (options.domain) {
				cookie.push('domain=' + options.domain);
			}

			if (options.secure) {
				cookie.push('secure');
			}

			if (options.httponly) {
				cookie.push('httponly');
			}

			window.document.cookie = cookie.join('; ');

			return window.document.cookie;
		},

		//	Removes a cookie by expiring it.
		remove: function (key) {
			if (this.get(key)) {
				this.set(key, '', {
					days: -1
				});
			}
		}
	};

	//	Expose the cookie function
	ulib.cookie = cookie;
}).call(this);;/*global window*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.dom - simple DOM related methods
	part of the ulib collection - simple utilities
*/
var ulib = this.ulib || {};
(function(){
	var bind = function bindEvent(el, eventName, eventHandler) {
			if (el.addEventListener){
				el.addEventListener(eventName, eventHandler, false); 
			} else if (el.attachEvent){
				el.attachEvent('on'+eventName, eventHandler);
			}
		},

		forEach = function(obj, callback) {
			// http://stackoverflow.com/questions/8157700/object-has-no-hasownproperty-method-i-e-its-undefined-ie8
			for (var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)) {
				callback(key, obj[key]);
			}}
		}, 

		//	TODO: Use this ONLY when necessary
		isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

	ulib.bind = bind;
	ulib.forEach = forEach;
	ulib.isFirefox = isFirefox;
}).call(this);;/*global window*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.jsonp - jsonp functionality
	part of the ulib collection - simple utilities

	Usage:

		ulib.jsonp(url, callback, options)
	
	url - the URL to use
	callback - a function to run when the call is completed, it will be data typically as an object
	options - optional arguments:
		context - what content to run the callback in, default is the global (window) context
		callback - name of the callback paremeter, default is 'callback'
		scriptprefix - what to use in the script prefix, defualt is '_jsonp'
		scriptoverride - overrides the name for the script in the call - can be used for caching
		timeout - amount of time, (in ms), to wait for the callback, before firing the error function, default is 10000
		error - function to call when an error occurs

*/
var ulib = this.ulib || {};
(function(){
	var jsonp = function (options) {
		var reg, scriptID = ((options && options.scriptprefix) ? options.scriptprefix : "_jsonp") + (new Date()).getTime() + (Math.round(Math.random()*100000000, 0)),
			url = options.url, cb = options.cb,
			callback = (options && options.callback) ? options.callback : 'callback',
			context = (options && options.context) ? options.context : window,
			head = window.document.getElementsByTagName("head").item(0),
			scriptObj = window.document.createElement("script"),
			errorTimer = null,
			timeout = (options && options.timeout) ? options.timeout : 10000,
			cbError = (options && options.error) ? options.error : function () {},
			bindCB = function (cb, scriptID, options) {
				var script = window.document.getElementById(scriptID),
					removeScript = function (scriptID) {
						var prop;
						script.parentNode.removeChild(script);
                        if(script) {
                            for (prop in script) {
                                //  Safe checks for IE
                                if (script && prop && script.hasOwnProperty) {
                                    if (script.hasOwnProperty(prop)) {
                                        delete script[prop];
                                    }
                                }
                            }
                        }
                        if(window[scriptID] && window[scriptID]) {
                            try {
                                delete window[scriptID];
                            } catch(ex) {
                                //  Can't do much here...
                                return false;
                            }
                        }
					};

				//  Handle error - use timeout as it is x-browser
				//	TODO: Check timeout is defined here, and work out functionality.
				if (timeout) {
					errorTimer = window.setTimeout(function () {
						//  Note: there does not seem to be any useful info that we can get x-browser here...
						//cbError();
						cbError.apply(context, []);
						removeScript(scriptID);
					}, timeout);
				}

				//	Use onerror when available - the timeout will be used on non-compatiable browsers
				script.onerror = function() {
					window.clearTimeout(errorTimer);
					//  Note: there is not any useful info that we can get x-browser here.
					cbError.apply(context, []);
					removeScript(scriptID);
				};

				//  Return callback func
				return function (data) {
					window.clearTimeout(errorTimer);
					//cb(data);
					cb.apply(context, [data]);
					removeScript(scriptID);
				};
			},
			joinChar = function (url) {
				return (/\?/).test(url) ? "&" : "?";
			};

		//	Allow script override
		scriptID = (options && options.scriptoverride) ? options.scriptoverride : scriptID;

		//	Only bind the callback, if cb was specified
		if(cb) {
			//  Optionally override cb param
			if (options && options.callback) {
				url += joinChar(url) + window.escape(options.callback) + "=?";
			} else if (url.indexOf(callback) === -1) {
				//  Use default CB param
				url += joinChar(url) + window.escape(callback) + "=?";
			}
	
			//  Replace last ? by cb param
			reg = new RegExp("=\\?(&|$)");
			url = url.replace(reg, "=" + scriptID + "$1");
		}

		// Create a script element, set the attributes and run it
		scriptObj.setAttribute("type", "text/javascript");
		scriptObj.setAttribute("src", url);
		scriptObj.setAttribute("id", scriptID);
		head.appendChild(scriptObj);

		//	Only bind the callback, if cb was specified
		if(cb) {
			window[scriptID] = bindCB(cb, scriptID);
		}
	};
	//	Expose the jsonp function
	ulib.jsonp = jsonp;
}).call(this);;/*global window*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.pubsub - basic publish-subscribe functionality
	part of the ulib collection - simple utilities

	ulib.pubsub has:

	1. Both loose and concrete event types
	2. Ability to filter events by type
*/

this.ulib = this.ulib || {};
(function(){
	var ulib = this.ulib,
		Pubsub = function (args) {

		var //	List of supported events
			events = [],
			triggerErrorHandler = function(){},
			eventsConfig = {},
			prevEvent = null,
			deferredEvents = {},
			//	Do we enforce the event type to be defined before we can add/listen to it
			eventTypeCheck = false,
			//	Do we throw an exception if we try to trigger or listen to an invalid event
			eventException = false,
			eventExceptionTypes = {
				INVALID_TRIGGER: 'InvalidTrigger'
			},
			//	Object containing the event listeners
			eventListeners = {},
			//	Only return listeners of the specified type
			getListenersByType = function (type) {
				var list = [];
				if (eventListeners.hasOwnProperty(type)) {
					list = eventListeners[type];
				}
				return list;
			},
/*
				The core variable is a function that returns an object with a set of properties (or functions),
				which each event will be triggered in the context of. For example:

					var settings = { values: {}, config: {} },
						events = new ulib.Pubsub({ core: function(args) {
						return {
							getSetting: function (name) {
								return settings.values[name];
							}
						};
					} });

				where args is an object { eventName: type }, and type is the type of event being triggered

				This will expose the getSetting function as this.getSetting(...) inside each plugin - be careful that you don't 
				overwrite any internal functions, when using the plugin manager, for example "get" and "set".
			*/
			core = null;

		/** Reset the events and listeners
		 */
		this.reset = function () {
			events = [];
			eventListeners = {};
		};

		/** Get the core object
		 *
		 * @returns {object} The core object used in this instance of pubsub
		 */
		this.getCore = function() {
			return core;
		};

		/** Check if we have an event type
		 *
		 * @param {string} type The name of the event type
		 *
		 * @returns {boolean} True of we have the given event
		 */
		this.hasEvent = function (type) {
			var i;
			for (i = 0; i < events.length; i += 1) {
				if (events[i] === type) {
					return true;
				}
			}
			return false;
		};

		/** Add an event listener for a given type
		 *
		 * @param {string} type The name of the event type
		 * @param {function} func The function to execute for the given event type
		 *
		 * @returns {boolean} True if the event was successfully added
		 */
		this.on = function (type, func) {
			var hasEvent = this.hasEvent(type);
			if (hasEvent || !eventTypeCheck) {
				eventListeners[type] = eventListeners[type] || [];
				eventListeners[type].push(func);
				if (!hasEvent) {
					this.addEventType({
						type: type
					});
					return true;
				}
			}
			return false;
		};

		/** Removes an event listener
		 *
		 * @param {string} type The name of the event type
		 * @param {function} [func] The function to remove - if not specified we remove all listeners for the given event type
		 *
		 * @returns {boolean} True if one or more event(s) were successfully removed
		 */
		this.off = function (type, func) {
			var i, success = false;
			if (this.hasEvent(type) && eventListeners[type]) {
				for (i = 0; i < eventListeners[type].length; i += 1) {
					if (func) {
						//	Remove specific listener
						if (eventListeners[type][i] === func) {
							eventListeners[type].splice(i, 1);
							success = true;
							break;
						}
					} else {
						//	Remove all
						eventListeners[type] = [];
						success = true;
					}
				}
				return success;
			} else {
				return false;
			}
		};

		/** Trigger a given event, passing an arbitary amount of arguments
		 *
		 * @param {string} type The name of the event type
		 * @param {varies} [arguments] The remainder of the arguments will be passed to the triggered event
		 * @throws {InvalidTrigger: type} The exception string is "InvalidTrigger: [event type]"
		 * @returns {boolean} True if one or more event(s) were successfully triggered
		 */
		this.trigger = function () {
			var i, j, list, args = arguments,
				passArgs = [],
				type = args[0],
				c = eventsConfig[type],
				run = true,
				runEvent = function (func, args, type) {
					try {
						//  Use apply to set the arguments correctly, and content to the core object
						if (core) {
							func.apply(core({
								eventName: type
							}), args);
						} else {
							func.apply(func, args);
						}
					} catch(e) {
						//	Catch undefined errors - you can optionally use triggerErrorHandler to handle the error yourself
						triggerErrorHandler(e);
					}
				},
				makeDeferredEvent = function (func, type, args, core) {
					deferredEvents[c.defer].push({
						func: func,
						type: type,
						args: args
					});
				};

			for (i = 1; i < args.length; i += 1) {
				passArgs.push(args[i]);
			}

			if (this.hasEvent(type)) {
				list = getListenersByType(type);
				for (i = 0; i < list.length; i += 1) {

					if (c.once && c.hasRunOnce) {
						run = false;
					}

					if (c.nonconsec && prevEvent === type) {
						run = false;
					}

					if (c.after && prevEvent !== c.after) {
						run = false;
					}

					if (c.defer && prevEvent !== c.defer) {
						run = false;
						deferredEvents[c.defer] = deferredEvents[c.defer] || [];
						makeDeferredEvent(list[i], type, passArgs, core);
					}

					if (run) {
						runEvent(list[i], passArgs, type, core);
						if (c.once) {
							c.hasRunOnce = true;
						}
					}

					// See if we have any deferred events to run
					if (deferredEvents[type]) {
						for (j = 0; j < deferredEvents[type].length; j += 1) {
							runEvent(deferredEvents[type][j].func, deferredEvents[type][j].args, deferredEvents[type][j].type, core);
						}
					}
				}

				//	We record which event was triggered, regardless if it ran
				prevEvent = type;
			} else {
				if (eventException) {
					throw eventExceptionTypes.INVALID_TRIGGER + ': ' + type;
				}
			}
		};

		//	Add an event type - this makes it available as a listenable event
/*
			args:
				. once - event will only trigger once
				. nonconsec - event will only run non-consecutively, ie: with some other event in between triggers
				. after - event will only trigger following a specific other event
				. defer - event will be deferred till a specific event is fired first
		*/

		/** Add an event type, making it available as a listenable event
		 *
		 * @param {string} type The name of the event type
		 * @param {boolean} [once] Event will only trigger once
		 * @param {boolean} [nonconsec] Event will only run non-consecutively, ie: with some other event in between triggers
		 * @param {string} [after] Name of event type that this event can trigger after
		 * @param {string} [defer] Name of event type that this event will be deferred till after it has fired
		 */
		this.addEventType = function (args) {
			var c = eventsConfig[args.type] || {};
			eventsConfig[args.type] = {
				once: args.once || c.once || false,
				nonconsec: args.nonconsec || c.nonconsec || false,
				after: args.after || c.after || null,
				defer: args.defer || c.defer || null
			};
			events.push(args.type);
		};

		/** Get a list of registered event types
		 *
		 * @returns {array} Array of registered event types
		 */
		this.getEventTypes = function () {
			return events;
		};

		/** Remove a given event type
		 *
		 * @param {string} Event type
		 * @returns {boolean} Returns true of the event type was removed
		 */
		this.removeEventType = function (type) {
			var i;
			for (i = 0; i < events.length; i += 1) {
				if (events[i] === type) {
					events.splice(i, 1);
					eventsConfig[type] = null;
					return true;
				}
			}
			return false;
		};

		if (args) {
			if (args.core !== undefined) {
				core = args.core;
			}
			if (args.events !== undefined) {
				events = args.events;
			}
			if (args.eventTypeCheck !== undefined) {
				eventTypeCheck = !! (args.eventTypeCheck);
			}
			if (args.eventListeners !== undefined) {
				eventListeners = args.eventListeners;
			}
			if (args.eventException !== undefined) {
				eventException = args.eventException;
			}
			if (args.triggerErrorHandler !== undefined) {
				triggerErrorHandler = args.triggerErrorHandler;
			}
		}

	};

	//	Expose global event object
	ulib.pubsub = new Pubsub();
	ulib.Pubsub = Pubsub;
}).call(this);;/*global window*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.plugin - plugin functionality
	part of the ulib collection - simple utilities

*/
var ulib = this.ulib || {};
(function(){
	/*
	 * ulib.plugin - args are:
	 *
	 *	config - configuration object, accessible by each plugin via getter and setter methods
	 * 	pluginConfig - configurations that can be passed to named plugins
	 *
	 */
	var ulib = this.ulib,
		PluginManager = function (args) {
		args = args || {};
		//  "Global" config object - exposed to all plugins via get and set functions in the core
		var i, config = {},
			pluginConfig = {},
			//	Do we allow plugins to override
			pluginOverride = true,

			//	Object of errors that we can trigger
			pluginErrors = {
				'PluginAlreadyExists': 'Plugin already exists, set pluginOverride to true to override, plugin name: ',
				'PluginDoesnotExist': 'Plugin not found',
				'TriggerError': 'Event could not be triggered in: '
			},

			triggerPluginErrors = args.triggerPluginErrors || true,

			//	Returns a function that exposes the a function in the given context
			//	This is handy for namespaced functions - usually you will use the namespace as the context
			expose = function (func, context) {
				return function () {
					func.apply(context, arguments);
				};
			},

			//	Handles errors
			handleError = function(name, info) {
				if(triggerPluginErrors) {
					//	If we can notify the console
					//	TODO: solejs support
					if(window.console && console.error) {
						if(pluginErrors.hasOwnProperty(name)) {
							console.error('ulib ' + name + ' - ' + pluginErrors[name] + ((info)? info: ''));
						} else {
							console.error('ulib ' + name + ' - ' + pluginErrors.TriggerError + ((info)? info: ''));
						}
					}
				}
			},

			that = this,

			//  Privelleged functions and data for the event manager - these are all passed to each plugin, so that
			//	this.FUNCNAME is acessible, ie: core.FUNCNAME is exposed to each plugin
			core = function (coreArgs) {
				var obj = {}, i;

				//	Extending ensures that we don't override the core by using 'this' in plugins
				for (i in coreObj) { if (coreObj.hasOwnProperty(i)) {
					obj[i] = coreObj[i];
				}}

				//	Override / add any properties
				for (i in coreArgs) {if (coreArgs.hasOwnProperty(i)) {
					obj[i] = coreArgs[i];
				}}

				//	TODO: This only happens on setup; core is also called in the event manager
				//	after that, but it is re-evaluated, so we don't have the plugin name anymore ... doh.
				if(typeof coreArgs.name !== undefined) {
					obj.pluginName = coreArgs.name;
				} else {
					handleError('PluginDoesnotExist', ' name not specified');
				}

				return obj;
			},

			pubsub = args.pubsub || new ulib.Pubsub({
				core: core,
				eventException: true,
				triggerErrorHandler: function(e) {
					handleError('TriggerError', currentPluginName + '\n' + e);
				}
			}),

			coreObj = {
				//	Allows you to expose a function that has the correct context
				expose: function (func, context) {
					return expose(func, context);
				},

				//  This allows you to get global config
				get: function (name) {
					return (name) ? config[name] : config;
				},

				//  This allows you to set global value
				set: function (name, value) {
					config[name] = value;
				},

				//	Listen to events in the events manager
				on: function(name, func, pluginName) {
					if(pluginName !== undefined) {
						currentPluginName = pluginName;
					}
					var eventCurrentPluginName = currentPluginName,
						//	Create an event we can bind and register
						myEventFunc = function() {
							var pubsubCore = pubsub.getCore();
							currentPluginName = eventCurrentPluginName;
							func.apply((pubsubCore? pubsubCore(): pubsub), arguments);
						};
					//	Register the plugin events and bind using pubsub
					pluginBindings[this.pluginName] = pluginBindings[this.pluginName] || [];
					pluginBindings[this.pluginName].push({ name: name, func: myEventFunc });
					pubsub.on(name, myEventFunc);
				},

				//	Shortcut for removing event listeners
				off: expose(pubsub.off, pubsub),

				//	Shortcut to triggr an event
				trigger: expose(pubsub.trigger, pubsub)
			},

			//	Registers an event for use in plugins, and exposes onto core object as 'on' + capitalised(event name)
			registerEvent = function(eve) {
				capEve = eve.type.substring(0, 1).toUpperCase() + eve.type.substring(1);
				coreObj['on' + capEve] = makeEvent(eve.type);
				pubsub.addEventType(eve);
			},

			//	Returns an exposed event function
			makeEvent = function (name) {
				var pubsubCore = pubsub.getCore();
				return expose(function (func, pluginName) {
					if(pluginName !== undefined) {
						currentPluginName = pluginName;
					}
					var eventCurrentPluginName = currentPluginName,
						//	Create an event we can bind and register
						myEventFunc = function() {
							var pubsubCore = pubsub.getCore();
							currentPluginName = eventCurrentPluginName;
							func.apply((pubsubCore? pubsubCore(): pubsub), arguments);
						};
					//	Register the plugin events and bind using pubsub
					pluginBindings[currentPluginName] = pluginBindings[currentPluginName] || [];
					pluginBindings[currentPluginName].push({ name: name, func: myEventFunc });
					pubsub.on(name, myEventFunc);
				}, (pubsubCore? pubsubCore(): pubsub));
			},

			currentPluginName,
			plugins = [],
			pluginBindings = {},

			getPlugin = function (name) {
				var i;
				for (i = 0; i < plugins.length; i += 1) {
					if (plugins[i].name === name) {
						return plugins[i];
					}
				}
				return false;
			},

			//	Add a plugin to the list
			addPlugin = function (name, pluginObj) {
				var hasPlugin = !! (getPlugin(name)),
					i, j;

				currentPluginName = name;

				if (!hasPlugin) {
					plugins.push({
						name: name,
						obj: pluginObj
					});
					setupPlugin(plugins[plugins.length - 1]);
				} else {
					if (pluginOverride) {
						for (i = 0; i < plugins.length; i += 1) {
							if (plugins[i].name === name) {
								//	Remove events from the pubsub.
								if(pluginBindings[name]) {
									for(j = 0; j < pluginBindings[name].length; j += 1) {
										pubsub.off(pluginBindings[name][j].name, pluginBindings[name][j].func);
									}
								}

								//	Remove old plugin function, and setup new plugin
								delete plugins[i].obj;
								plugins[i].obj = pluginObj;
								setupPlugin(plugins[i]);

								return plugins[i];
							}
						}
					} else {
						handleError('PluginAlreadyExists', name);
						return false;
					}
				}

				return true;
			},

			setupPlugin = function (plugin, config) {
				var i, pc = pluginConfig["*"];
				config = (config !== undefined)? config: pluginConfig[plugin.name];

				//	Add properties from generic config if available
				if(pc) {
					config = config || {};
					for(i in pc) {if(pc.hasOwnProperty(i)) {
						if(!config.hasOwnProperty(i)) {
							config[i] = pc[i];
						}
					}}
				}

				//  Use apply to expose core
				plugin.obj.apply(core({
						name: plugin.name
					} ), [
						(config !== undefined)? config: {}
					]
				);
			};

		//	Expose the registerEvent, add and trigger methods
		this.registerEvent = registerEvent;
		this.add = addPlugin;
		this.trigger = expose(pubsub.trigger, pubsub);

		//	Add all events
		if (args && args.events) {
			for (i = 0; i < args.events.length; i += 1) {
				registerEvent(args.events[i]);
			}
		}
		if (args.config !== undefined) {
			config = args.config;
		}
		if (args.pluginConfig !== undefined) {
			pluginConfig = args.pluginConfig;
		}
		if (args.pluginOverride !== undefined) {
			pluginOverride = args.pluginOverride;
		}

	};

	//  Expose external functions
	ulib.plugin = new PluginManager();
	ulib.PluginManager = PluginManager;
}).call(this);;/*global window, document */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.ready - fires a function when the DOM is ready, portions borrowed from jQuery 1.6.2 (http"//jquery.com")
	part of the ulib collection - simple utilities

	Usage:

		ulib.ready(func)
	
	func - the function to use

*/
var ulib = this.ulib || {};
(function(){
	var isReady = false,
		readyFuncs = [],
		DOMContentLoaded,
		
		//	Runs the ready funcs
		runFuncs = function() {
			var i;
			for(i = 0; i < readyFuncs.length; i += 1) {
				readyFuncs[i]();
			}
		},
		
		// The DOM ready check for Internet Explorer
		doScrollCheck = function () {
			if (isReady) {
				return;
			}

			try {
				// If IE is used, use the trick by Diego Perini
				// http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left");
			} catch (e) {
				window.setTimeout(doScrollCheck, 1);
				return;
			}

			// Execute the ready func
			runFuncs();
		},

		// Handle when the DOM is ready - this calls the runFuncs, which should handle all on-ready functionality
		ready = function (wait) {
			// Either a released hold or an DOMready/load event and not yet ready
			if (wait !== true && !isReady) {
				// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
				if (!document.body) {
					return window.setTimeout(ready, 1);
				}

				// Remember that the DOM is ready
				isReady = true;

				runFuncs();
			}
		},

		//	Main function to check if the dom is ready
		domReady = function () {
			// Catch cases where $(document).ready() is called after the
			// browser event has already occurred.
			if (document.readyState === "complete") {
				// Handle it asynchronously to allow scripts the opportunity to delay ready
				return window.setTimeout(ready, 1);
			}

			// Mozilla, Opera and webkit nightlies currently support this event
			if (document.addEventListener) {
				// Use the handy event callback
				document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);

				// A fallback to window.onload, that will always work
				window.addEventListener("load", ready, false);

				// If IE event model is used
			} else if (document.attachEvent) {
				// ensure firing before onload,
				// maybe late but safe also for iframes
				document.attachEvent("onreadystatechange", DOMContentLoaded);

				// A fallback to window.onload, that will always work
				window.attachEvent("onload", ready);

				// If IE and not a frame
				// continually check to see if the document is ready
				var toplevel = false;

				try {
					toplevel = window.frameElement === null;
				} catch (e) {}

				if (document.documentElement.doScroll && toplevel) {
					doScrollCheck();
				}
			}
		},
		addReadyFunc = function (func) {
			if (!isReady) {
				readyFuncs.push(func);
			} else {
				//	Run the function
				func();
			}
		};

	// Cleanup functions for the document ready method
	if (document.addEventListener) {
		DOMContentLoaded = function () {
			document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
			ready();
		};

	} else if (document.attachEvent) {
		DOMContentLoaded = function () {
			// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
			if (document.readyState === "complete") {
				document.detachEvent("onreadystatechange", DOMContentLoaded);
				ready();
			}
		};
	}

	domReady();

	//	Expose function
	ulib.ready = addReadyFunc;
}).call(this);;/*global window, $, jQuery */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2012 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.template - basic templating functionality
	Based on: http://ejohn.org/blog/javascript-micro-templating/

	Usage:

		ulib.template(str, data);
	
	str - the template
	data - any data that the template uses

	returns HTML string

*/
var ulib = this.ulib || {};
(function(){
	var cache = {},
	
	//	Template functionality
	template = function template(str, data) {
 
		//	Use the cache, or create a new function
		var fn = cache[str] ||
			//	Create a cachable template function
			new Function("obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +
			   
			    //	Introduce the data as "local" variables using with
				"with(obj){p.push('" +
				   
				//	Convert the template into JS
				str
					.replace(/[\r\t\n]/g, " ")
					.split("<%").join("\t")
					.replace(/((^|%>)[^\t]*)'/g, "$1\r")
					.replace(/\t=(.*?)%>/g, "',$1,'")
					.split("\t").join("');")
					.split("%>").join("p.push('")
					.split("\r").join("\\'")
					+ "');}return p.join('');");
			
		//	Cache the function
		cache[str] = fn;
   
		// Provide some basic currying to the user
		return data ? fn( data ) : fn;
	};

	ulib.template = template;
}).call(this);;/*global window, $, jQuery */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.url - url parsing functionality
	part of the u collection - simple utilities

	Usage:

		ulib.url(url)
	
	url - the URL to use

	Returns: object with params and hash

*/
this.ulib = this.ulib || {};
(function(){
	var urlParts = function (url) {
			var vars = {
				hash: "",
				params: {}
			},
				parts, reg;
			url = (url) ? url : window.location.href;

			//	Get and remove hash part (if any)
			if ((url.indexOf("#") !== -1)) {
				vars.hash = url.substr(url.lastIndexOf("#"));
				if(vars.hash !== '') {
					vars.hash = vars.hash.substr(1);
				}
				url = url.substr(0, url.indexOf("#"));
			}

			//  Find the parameter values in the URL
			reg = new RegExp("[?&]+([^=&]+)=([^&]*)", "gi");

			parts = url.replace(reg, function (m, key, value) {
				//	TODO: This can potentially be a list!
				if(typeof vars.params[key] !== 'undefined') {
					if( Object.prototype.toString.call(vars.params[key]) !== '[object Array]' ) {
						vars.params[key] = [vars.params[key]];
					}
					vars.params[key].push(value);
				} else {
					vars.params[key] = value; //decodeURIComponent(value);
				}
			});
			return vars;
		},

		//	Turns an object into a post string
		urlString = function( param ) {
			var	str = "", count = 0, p;
			
			for( p in param ) { if( param.hasOwnProperty( p ) ) {
				str += ( ( count === 0 )? '': '&' ) + p + '=' + encodeURIComponent( param[p] );	//.replace( /%20/g, '+' );
				count += 1;
			} }

			return str;
		};

	//	Expose url functions
	ulib.url = urlParts;
	ulib.urlString = urlString;
}).call(this);;/*global window*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2011 by Mikkel Bergmann
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

/*
	ulib.utils - basic utility functionality
	part of the ulib collection - simple utilities

*/
var ulib = this.ulib || {};
(function(){
	var Utils = function () {
		var that = this;

		//	Nipped from jquery
		this.isFunction = function (obj) {
			return Object.prototype.toString.call(obj) === "[object Function]";
		};

		this.getType = function (obj) {
			var class2type = {},
				i, types = "Boolean Number String Function Array Date RegExp Object".split(" ");
			// Populate the class2type map
			for (i = 0; i < types.length; i += 1) {
				class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
			}

			return obj === null ? String(obj) : class2type[{}.toString.call(obj)] || "object";
		};

		this.isArray = function (obj) {
			return that.getType(obj) === "array";
		};

		// A crude way of determining if an object is a window
		this.isWindow = function (obj) {
			return obj && typeof obj === "object" && "setInterval" in obj;
		};

		this.isPlainObject = function (obj) {
			// Must be an Object.
			// Because of IE, we also have to check the presence of the constructor property.
			// Make sure that DOM nodes and window objects don't pass through, as well
			if (!obj || that.getType(obj) !== "object" || obj.nodeType || that.isWindow(obj)) {
				return false;
			}

			// Not own constructor property must be Object
			if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj, "constructor") && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
				return false;
			}

			// Own properties are enumerated firstly, so to speed up,
			// if last one is own, then all properties are own.
			var key, i;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					i += 1;
				}
			}

			return key === undefined || {}.hasOwnProperty.call(obj, key);
		};

		this.extend = function () {
			// copy reference to target object
			var target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false,
				options, name, src, copy, clone;

			// Handle a deep copy situation
			if (typeof target === "boolean") {
				deep = target;
				target = arguments[1] || {};
				// skip the boolean and the target
				i = 2;
			}

			// Handle case when target is a string or something (possible in deep copy)
			if (typeof target !== "object" && !that.isFunction(target)) {
				target = {};
			}

			// extend jQuery itself if only one argument is passed
			if (length === i) {
				target = this;
				i -= 1;
			}

			for (; i < length; i += 1) {
				// Only deal with non-null/undefined values
				if ((options = arguments[i]) !== null) {
					// Extend the base object
					for (name in options) {
						if (options.hasOwnProperty(name)) {
							src = target[name];
							copy = options[name];

							// Prevent never-ending loop
							if (target === copy) {
								continue;
							}

							// Recurse if we're merging object literal values or arrays
							//	TODO: Implement the jQuery functions below...
							if (deep && copy && (that.isPlainObject(copy) || that.isArray(copy))) {
								clone = src && (that.isPlainObject(src) || that.isArray(src)) ? src : that.isArray(copy) ? [] : {};

								// Never move original objects, clone them
								target[name] = that.extend(deep, clone, copy);

								// Don't bring in undefined values
							} else if (copy !== undefined) {
								target[name] = copy;
							}
						}
					}
				}
			}

			// Return the modified object
			return target;
		};

		/*
			This function will add (deeply) any standard objects and arrays.
			It augments (modifies) o1 with o2.
			This is meant for configuration only, and will likely have undesirable
			results with more complex objects, or if you try to mash an object with an array.
		*/
		this.augment = function(o1, o2) {
			var i, oldArrays = {};
			// We use only the objects own properties
			for (i in o2) {if(o2.hasOwnProperty(i)) {
				if (o2[i] && o2[i].constructor && o2[i].constructor === Object) {
					// Deal with objects (recurse)
					o1[i] = o1[i] || {};
					arguments.callee(o1[i], o2[i]);
				} else if( Object.prototype.toString.call( o1[i] ) === '[object Array]' ) {
					// Deal with Array
					if(o2[i] && Object.prototype.toString.call(o2[i]) === '[object Array]') {
						o1[i] = o1[i].concat(o2[i]);
					}
				} else {
					o1[i] = o2[i];
				}
			}}

			return o1;
		};		
		
		this.each = function(obj, fn) {
			if (!obj) { return; }
			
			var name, i = 0, length = obj.length;
		
			// object
			if (length === undefined) {
				for (name in obj) {
					if (fn.call(obj[name], name, obj[name]) === false) { break; }
				}
				
			// array
			} else {
				for (var value = obj[0];
					i < length && fn.call( value, i, value ) !== false; value = obj[++i]) {				
				}
			}
		
			return obj;
		};
		
	};

	//	Expose global event object
	ulib.utils = new Utils();
}).call(this);;}).call(this);