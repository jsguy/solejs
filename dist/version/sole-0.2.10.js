/* 	sole.js uses ulib micro library functions, hence the header 
	and footer to encapsulate namespaced ulib 
*/
var sole = this.sole || {};
sole.ulib = this.ulib || {};
(function(){;/*global window*/
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
}).call(this);;}).call(this.sole);;/*global window, ulib, sole, document, QUnit */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
 * @fileOverview This file contains the main sole functionality.
 * @author <a href="mailto:mikkel@jsguy.com">Mikkel Bergmann</a>
 * @version 0.2.7
 */
/*
	sole.js - the soul of the console

	sole.js is an extension of the console paradigm that includes tagging,
	filtering, globbing, plugins and event subscription.

	Licence (MIT)
	-------------

	Copyright (C) 2013 Mikkel Bergmann

	Permission is hereby granted, free of charge, to any person obtaining a copy of
	this software and associated documentation files (the "Software"), to deal in
	the Software without restriction, including without limitation the rights to
	use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
	of the Software, and to permit persons to whom the Software is furnished to do
	so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	Notices, thanks and credits
	---------------------------

	The following URL's have been useful in creating sole.js:

	http://getfirebug.com/wiki/index.php/Console_API
	http://simonwillison.net/2006/Jan/20/escape/#p-6

*/
(function(){
	//	Keep track of sole instances so that we can add filters and plugins to each, from the constructor 
	var soleInstances = [],
		outsideSelf = this,
		//	Inject ulib
		ulib = (typeof sole !== 'undefined' && sole.ulib)? sole.ulib: this.ulib,
		isArray = function(arg) {
			return (typeof arg === 'object' && (arg instanceof Array));
		},
		isObject = function(arg) {
			return typeof arg === "object" && arg !== null;
		};

	/** sole - soul of the console
	 *
	 * sole creates a "console like" function that includes "tagging", and easy filtering in console operations.
	 * This is useful for large JS applications where you want to easily limit the output of the console,
	 * and create unit tests from the output.
	 * sole does not override the console, it is a separate function which you can use to log, warn, error,
	 * etc, and then use the glob and filter functions to reduce the number of results based on s
	 * or types, or a combination of both.
	 * sole allws you to create private instances and features chainability for ease of use
	 *
	 * @constructor
	 * @param {array} args.matches The list of items that sole contains
	 * @param {object} args.maxLogSize The maximum amount of items that sole keeps, old entries will be removed, default is 3000
	 * @param {object} args.capture If we capture events, default is true
	 * @param {object} args.disable If we actually run the events, useful for production, default is true
	 * @param {object} args.tag Set of tags to associate with sole events, default is []
	 * @param {object} args.passthrough Do we send the events through to the browsers console, default is false
	 * @param {object} args.useDate Do we add a date object to each log, this is computationally expensive, so default is false
	 * @param {object} args.permanent Do we set a cookie to enable sole permanantly, default is false, which will also remove the cookie
	 * @param {string} args.cookieName Name of cookie to use for the optional permanent config, default is "solecfg"
	 */
	var soleDef = function (args) {
		args = args || {};
		var self = this,
			matches,
			i,
			tagList = [],
			cfg = {
				//	Ensure we don't use inifnite memory
				maxLogSize: 3000,
				//	Do we capture loggable events
				capture: true,
				//	Do we run the shim
				disable: false,
				permtag: [],
				tag: [],
				passthrough: false,
				useDate: false,
				permanent: false,
				cookieName: "solecfg"
			},
			hasConsole = !! (window.console),

			//	Custom event core to expose the sole
			events = new ulib.Pubsub({
				core: function() {
					return {
						sole: self
					};
				}
			}),

			//	Extends an object with any number of other objects
			extend = function() {
				var target = arguments[0], i, k;
				for(i = 1; i < arguments.length; i += 1) {
					for(k in arguments[i]) { if(arguments[i].hasOwnProperty(k)) {
						target[k] = arguments[i][k];
					}}
				}
			},

			//	Remove rubbish chars, ensures we have a valid tag
			cleanseTag = function (tag) {
				var i, test;
				//	Remove all non-alpha-numeric and spaces
				for(i = 0; i < tag.length; i += 1) {
					test = '' + tag[i];
					tag[i] = test.replace(/[^a-zA-Z0-9]+/g, '');
				}
				return tag;
			},

			//	Escape all regex chars, ref: http://simonwillison.net/2006/Jan/20/escape/#p-6
			escRegex = function (str) {
				var reg = new RegExp("[-[\\]{}()*+?.,\\\\^$|#\\s]", "g");
				return (str) ? str.replace(reg, "\\$&") : "";
			},

			//	Add a tag to the list of used tags
			addTag = function (tag, out) {
				var i, addedTag = false;

				if (!isArray(tag)) {
					tag = [tag];
				}

				for(i = 0; i < tag.length; i += 1) {
					if(! self.hasTag(tag[i])) {
						addedTag = true;
						tagList[tag[i]] = 0;
					}
					tagList[tag[i]] += 1;
				}

				if(addedTag) {
					//	Trigger listeners
					events.trigger(self.enums.events.tag, tag, out);
				}

				return addedTag;
			},

			//	From: http://dbj.org/dbj/?p=286
			isFuncTest = new RegExp("^\\s*\\bfunction\\b");

		//expose ulib
		self.ulib = ulib;

		self.isFunc = function(f) {
			try {
				return isFuncTest.test(f);
			} catch (x) {
				return false;
			}
		};

		self.plugin = new ulib.PluginManager({
			pubsub: events,
			//	Expose self to plugins
			pluginConfig: {
				"*": {
					sole: self
				}
			}
		});

		self.setArg = function(key, value) {
			args[key] = value;
		};

		self.getArg = function(key) {
			return args[key];
		};

		self.enums = {
			events: {
				'tag': 'tag',		// Event for when a tag is added
				'output': 'output'	// Event for when output for the console is generated
			}
		};

		/** Clears matches and tags
		 * @returns {object} Configuration object
		 */
		self.clear = function() {
			tagList = [];
			self.setMatches([]);
			return self.tag(cfg.permtag);
		};

		/** Get the configuration
		 * @returns {object} Configuration object
		 */
		self.getCfg = function() {
			return cfg;
		};

		/** Returns boolean, true if a tag has been in the sole
		 *
		 * @returns {boolean} True if a tag has been used
		 */
		self.hasTag = function (tag) {
			var found = false,
				i;
			for (i in tagList) { if(tagList.hasOwnProperty(i)) {
				if (i === tag) {
					found = true;
					break;
				}
			}}
			return found;
		};

		/** Returns list of tage
		 *
		 * @returns {boolean} True if a tag has been used
		 */
		self.getTags = function (tag) {
			var found = false,
				i;
			for (i in tagList) { if(tagList.hasOwnProperty(i)) {
				if (i === tag) {
					found = true;
					break;
				}
			}}
			return found;
		};

		/** Add an event listener for a given type
		 *
		 * @param {string} type The name of the event type
		 * @param {function} func The function to execute for the given event type
		 *
		 * @returns {boolean} True if the event was successfully added
		 */
		self.on = function () {
			events.on.apply(events, arguments);
		};

		/** Removes an event listener
		 *
		 * @param {string} type The name of the event type
		 * @param {function} [func] The function to remove - if not specified we remove all listeners for the given event type
		 *
		 * @returns {boolean} True if one or more event(s) were successfully removed
		 */
		self.off = function () {
			events.off.apply(events, arguments);
		};

		/** Returns true if we should pass output to the console (if available), can be used to set the passthrough cfg value
		 *
		 * @returns {boolean} True if we should pass output to the console (if available)
		 */
		self.passthrough = function (value) {
			if (value !== undefined) {
				cfg.passthrough = !! (value);
			}
			return !!(hasConsole && cfg.passthrough);
			//return cfg.passthrough;
		};

		/** Set the tag that sole will use
		 *
		 * @param {string} [Value] The value of the tag - you can pass either a string, (which can be dot seperated), array, or multiple strings
		 * @returns {Sole} The sole instance
		 * @note This method is chainable
		*/
		self.tag = function() {
			var i, j, tmpList = [], hasTag, list = [], value;
			for(i = 0; i < arguments.length; i += 1) {
				value = arguments[i];
				if (value !== undefined) {
					if(typeof value === 'string') {
						value = value.split('.');
					}
					if (isArray(value)) {
						for(j = 0; j < value.length; j += 1) {
							tmpList.push(value[j]);
						}
					} else {
						tmpList.push(value);
					}
				}
			}

			//	Add perm tags first
			for(i = 0; i < cfg.permtag.length; i += 1) {
				list.push(cfg.permtag[i]);
			}

			//	Add tmp tags, as long as they are not in perm tags
			for(i = 0; i < tmpList.length; i += 1) {
				hasTag = false;
				for(j = 0; j < list.length; j += 1) {
					if(list[j] == tmpList[i]) {
						hasTag = true;
						break;
					}
				}
				if(!hasTag) {
					list.push(tmpList[i]);
				}
			}

			cfg.tag = list;

			//	Fire any add tag events, etc...
			addTag(cfg.tag);

			return self;
		};

		self.capture = function(value){
			if (value !== undefined) {
				cfg.capture = !! (value);
			}
			return cfg.capture;
		};

		self.disable = function(value) {
			if (value !== undefined) {
				cfg.disable = !! (value);
			}
			return cfg.disable;
		};

		self.enable = function() {
			self.disable(false);
		};

		/** Shims console functions from sole
		 *
		 * @param {string} type The type of command we're calling, valid options are "log", "debug", "info", "warn", "error", "group", "groupCollapsed"
		 * @param {array|string} tags An array of tags to regsiter with the command
		 * @param {object} args An array of arguments
		 */
		self.shim = function (type, tag, args) {
			var i, out;

			matches = matches || [];

			if(matches.length >= cfg.maxLogSize) {
				//	Remove the first entry
				matches.splice(0,1);
			}

			//	cleanse the tag
			tag = cleanseTag(tag);

			out = {
				type: type,
				tags: tag,
				args: args
			};

			if(cfg.useDate) {
				out.time = (new Date());
			}

			//	Add the tag
			addTag(tag, out);

			if(cfg.capture) {
				matches.push(out);
			}

			//	Set matches here
			self.setMatches(matches);

			//	Trigger output listeners
			events.trigger(self.enums.events.output, out);

			//  Run the shim'd console function
			//	This is done in the context of console (and rightfully so: http://code.google.com/p/chromium/issues/detail?id=48662)
			if (this.passthrough()) {
				window.console[type].apply(window.console, args);
			}

			//	Chainable
			return self;
		};

		/** Provides a simple iterator 
		 * @param {function} A function with [index] and [item] as parameters
		 * @returns {Sole} The sole instance
		 * @note This method is chainable
		 */
		self.each = function(func) {
			for(i = 0; i < self.length; i += 1) {
				if(func.apply( self, [i, self[i]]) === false) {
					break;
				}
			}
			return self;
		};

		//	Object for filters
		self.filters = {};

		//	Apply a filter to this instance of sole
		self.applyFilter = function(name, options) {
			return self.filter(name, options);
		};

		//	Add filter on an instance
		self.addFilter = function(name, func) {
			self.filters[name] = func;
		};


		/** Provides a simple filter function that uses a function to determine if each item is included
		 * @param {function} A function with [index] and [item] as parameters that returns false if an item should be filtered out.
		 * @returns {Sole} The sole instance
		 * @note This method is chainable
		 */
		self.filterEach = function(func, options) {
			var i, newMatches = [];
			for(i = 0; i < self.length; i += 1) {
				if(func.apply(self, [i, self[i]]) !== false) {
					newMatches.push(self[i]);
				}
			}
			return self.copy(cfg, newMatches);
		};

		//	Match and history functionality on types or tags
		//  Returns the history for a given  and optional type or group
		//	TODO: document + examples
		/*
		 * @param {string||array} [args.tag] A list of tags (also accepts a single string)
		 * @param {string||array} [args.type] A list of types (also accepts a single string)
		 */
		self.filter = function (args, options) {
			args = args || {};
			var i, j, l, log, result = [], notResult = [],
				include, okTags, okTypes, tags = args.tag || [],
				types = args.type || [],
				not = args.not || false;

			if(self.isFunc(args)) {
				return self.filterEach(args, options);
			}

			//  We allow a string, and assume it to be either
			//	the name of a filter, or a tag
			if (typeof args === 'string') {
				if(self.filters[args]) {
					return self.filterEach(self.filters[args](options));
				} else {
					tags = [args];
				}
			}

			//  We allow a list
			if (isArray(args)) {
				tags = args;
			}

			if (!isArray(tags)) {
				tags = (tags !== undefined) ? [tags] : tags;
			}

			//  We allow either one type, or a list
			if (!isArray(types)) {
				types = (types !== undefined) ? [types] : types;
			}

			//	If we have something to filter on
			if ((tags && tags.length > 0) || (types && types.length > 0)) {
				//	Iterate on matches
				for (l = 0; l < matches.length; l += 1) {
					log = matches[l];
					include = true;
					okTags = true;
					okTypes = true;

					//	Look at tags
					if (tags && tags.length > 0) {
						okTags = false;
						for (i = 0; i < tags.length; i += 1) {
							if (log && log.tags && log.tags.length > 0) {
								for (j = 0; j < log.tags.length; j += 1) {
									if (tags[i] === log.tags[j]) {
										okTags = true;
										break;
									}
								}
							}
						}
						if (!okTags) {
							include = false;
						}
					}
					//	Look at types
					if (types && types.length > 0) {
						okTypes = false;
						include = true;
						for (i = 0; i < types.length; i += 1) {
							if (types[i] === log.type) {
								okTypes = true;
								break;
							}
						}
						if (!okTypes) {
							include = false;
						}
					}

					if (include && (okTags || okTypes)) {
						result.push(log);
					} else {
						notResult.push(log);
					}
				}
			} else {
				result = matches;
			}

			//	Use copy so we can chain calls
			return not? self.copy(cfg, notResult): self.copy(cfg, result);
		};

		//	Match on parts of the query - you can add multiples, eg:
		//	{tags: ["one", "theother"]},
		//	To match strictly, use:
		//	{tags: {$all: ["one", "theother"]}}
		self.query = function(args){
			var result = [],
				i, j, k, l, m,
				log, tag,
				matchStrict = false,
				include,
				exTags,
				expandTags = function(value){
					if(typeof value === 'string') {
						return value.split('.');
					}
				},
				compareTags = function(tag1, tag2, matchStrict){
					var j, k, 
						matched = false,
						count = 0;
					for(j = 0; j < tag1.length; j+= 1) {
						//	Check for list in log[i] as well, 
						//	if any matches, we return it all.
						if(isArray(tag2)) {
							for(k = 0; k < tag2.length; k+= 1) {
								if(tag2[k] == tag1[j]) {
									matched = true;
									break;
								}
							}
							if(matched) {
								count += 1;
							}
						} else {
							if(tag2 == tag1[j]) {
								matched = true;
								count += 1;
								break;
							}
						}
					}
					if(matchStrict) {
						return matches && (count == tag1.length && tag1.length == tag2.length);
					} else {
						return matched;
					}
				};

			for (l = 0; l < matches.length; l += 1) {
				log = matches[l];
				include = false;
				for(i in args) {
					matchStrict = false;
					tag = args[i];
					if(isObject(tag)){
						if(tag.$all) {
							tag = tag.$all;
							matchStrict = true;
						} else {
							for(m in tag) {
								tag = tag[m];
								break;
							}
						}
					}

					//	Check if we have a list
					if (isArray(tag)) {
						include = compareTags(tag, log[i], matchStrict);
					} else {
						//	Else just compare
						if(log[i] == tag) {
							include = true;
							break;
						}
						exTags = expandTags(tag);
						//	use expanded tags as well if needed
						//	An expanded tag assumes we want the exact match
						if(i == "tags" && exTags[0] !== tag) {
							include = compareTags(exTags, log[i], matchStrict);
						}
					}
				}
				if(include) {
					result.push(log);
				}
			}

			//	Use copy so we can chain calls
			return self.copy(cfg, result);
		};

		//	glob function, ie: "*pax*" matches tags of ["something.pax.whatever", "pax", "pax.widget"]
		//	TODO: document + examples
		/** Matches tags by "globbing"
		 *
		 * @param {string} globstr The string to match on, eg: "*pax*" will match tags ["something.pax.whatever", "pax", "pax.widget"]
		 */
		self.glob = function (globstr) {
			var str, sepstar = "__STARSEPARATOR__",
				sepquest = "__QUESTIONSEPARATOR__",
				reg, i, j, hist, log, newMatches = [], tagStr;
			//	Default to matching everything
			globstr = globstr || "*";
			//	Save the questions and stars using separators
			str = globstr.split("*").join(sepstar);
			str = str.split("?").join(sepquest);
			str = escRegex(str);
			//	Put back in the stars and questions, with regex equivelents, plus start and end chars
			str = "^" + str.split(sepstar).join(".*").split(sepquest).join(".") + "$";
			reg = new RegExp(str);

			//	Grab the matches
			hist = self.get();

			for (i = 0; i < hist.length; i += 1) {
				log = hist[i];
				//	globbing depends on the tags being one string
				tagStr = log.tags.join(".");

				if (reg.test(tagStr)) {
					newMatches.push(log);
				}
			}

			//	Use copy so we can chain calls
			return self.copy(cfg, newMatches);
		};

		//	Return matches
		self.get = function (index) {
			var entries = (matches) ? matches : [];
			return (index) ? entries[index] : entries;
		};

		//	Set the matched entries
		self.setMatches = function (newMatches) {
			var i;

			//	Remove old matches
			if(matches) {
				for (i = 0; i < matches.length; i += 1) {
					delete self[i];
				}
			}

			//	Add new matches
			for (i = 0; i < newMatches.length; i += 1) {
				self[i] = newMatches[i];
			}
			matches = newMatches;
			self.length = newMatches.length;
		};

		//	We create a new object to return, for chaining
		self.copy = function (args, entries) {
			var ns = new this.constructor(args);
			ns.setMatches(entries || matches);
			//	TODO: This is expensive - see if we can overwrite the object?

			return ns;
		};

		//	Initialises the sole functionality, with an optional config
		self.init = function(config) {
			//	Extend cfg
			if(config) {
				extend(cfg, config);
			}

			//	Capture tag passed in as permanent, even after clear
			if(config.tag) {
				cfg.permtag = config.tag;
				//  Always a list
				if (!isArray(cfg.permtag)) {
					cfg.permtag = [cfg.permtag];
				}
			}

			//	Set cookie to enable sole
			if(cfg.permanent) {
				ulib.cookie.set(cfg.cookieName, true, {
					days: 365
				});
			} else {
				//	Remove the cookie
				ulib.cookie.remove(cfg.cookieName);
			}

			//	See if we have a cookie
			if(!!(ulib.cookie.get(cfg.cookieName))) {
				self.enable();
			}

			//	Setup matches if passed in
			if(cfg.matches) {
				self.setMatches(cfg.matches);
			}
		};

		//	Add a plugin
		self.addPlugin = function(type, func) {
			self.plugin.add(type, func);
		};

		//	Allow old version of Sole to be used instead
		self.noConflict = function(deep) {
			//	Instance
			if( _globalSole && outsideSelf.sole !== _globalSole ) {
				outsideSelf.sole = _globalSole;
			}

			//	Constructor
			if( deep && _Sole && outsideSelf.Sole !== _Sole ) {
				outsideSelf.Sole = _Sole;
			}

			return Sole;
		};


		self.init(args);

		/** Available events
		 *
		 * @name output
		 * @event
		 * @param {function} func Function to execute when the event is triggered
		 *
		 * @name tag
		 * @event
		 * @param {function} func Function to execute when the event is triggered
		 *
		 */
		self.plugin.registerEvent({ type: self.enums.events.output});
		self.plugin.registerEvent({ type: self.enums.events.tag });

		//	Set a pointer to the object 
		soleInstances.push(self);
		self.soleInstance = soleInstances[soleInstances.length -1];


		//	Add any registered plugins
		if(soleDef.pluginList && soleDef.pluginList.length > 0) {
			for(i = 0; i < soleDef.pluginList.length; i += 1) {
				self.plugin.add(soleDef.pluginList[i].type, soleDef.pluginList[i].func);
			}
		}

		//	Add any registered filters
		if(soleDef.filterList && soleDef.filterList.length > 0) {
			for(i = 0; i < soleDef.filterList.length; i += 1) {
				self.addFilter(soleDef.filterList[i].name, soleDef.filterList[i].func);
			}
		}				
	},
	globalSole,
	_globalSole,
	_Sole,
	//	Log functions supported.
	logtagList = ["log", "debug", "info", "warn", "error", "group", "groupCollapsed"],
	//	Passthrough functions - these don't yet interact with sole, but you can pass them through to console (tested with fireBug 1.7)
	pttagList = ["clear", "dir", "dirxml", "trace", "groupEnd", "time", "timeEnd", "profile", "profileEnd", "count", "table"],

	//	Shims the console functions
	shimFunc = function (consoleFunctionType) {
		return function () {
			if(this.disable()) {
				return false;
			}
			var tags = [], caller, funcRE, defaultFuncName = 'anonymous', funcName = defaultFuncName, addTags = this.getCfg().tag || [], i;

			//  We assume a list
			if (!isArray(tags)) {
				tags = [tags];
			}

			if (!isArray(addTags)) {
				addTags = [addTags];
			}

			for(i = 0; i < addTags.length; i += 1) {
				tags.push(addTags[i]);
			}

			if(this.getArg('useFuncTags')) {
				// Identify function name here and append to tags - if anonymous, add defaultFuncName.
				//	Caller is what function called the function
				caller = (arguments && arguments.callee && arguments.callee.caller)? arguments.callee.caller.toString(): null;

				//	The below will pull out the name of the function, '' if empty
				funcRE = /function\s*([\w\-$]+)?\s*\(/i;

				if(caller) {
					funcName = funcRE.test(caller) ? RegExp.$1: '';
					if(funcName === '') {
						funcName = defaultFuncName;
					}
				}

				tags.push(funcName);
			}

			return this.shim(consoleFunctionType, tags, arguments);
		};
	},

	//	Shims pass through functions (these cannot be disabled)
	ptFunc = function (consoleFunctionType) {
		return function () {
			if (this.passthrough()) {
				//  Run the console function (must be in the context of console: http://code.google.com/p/chromium/issues/detail?id=48662)
				window.console[consoleFunctionType].apply(window.console, arguments);
			}
		};
	},
	i;

	//	Add plugins
	soleDef.pluginList = [];
	soleDef.plugin = function(type, func){
		var i;
		//	Add to list
		soleDef.pluginList.push({
			type: type,
			func: func
		});
		//	Add to instances
		for(i = 0; i < soleInstances.length; i += 1) {
			if(soleInstances[i] && soleInstances[i].addPlugin) {
				soleInstances[i].addPlugin(type, func);
			}
		}
	};

	//	Ability to add filters
	soleDef.filterList = [];
	soleDef.addFilter = function(name, func){
		var i;
		//	Add to list
		soleDef.filterList.push({
			name: name,
			func: func
		});
		//	Add to instances
		for(i = 0; i < soleInstances.length; i += 1) {
			if(soleInstances[i] && soleInstances[i].addFilter) {
				soleInstances[i].addFilter(name, func);
			}
		}
	};

	//  Apply each loggable function
	for (i = 0; i < logtagList.length; i += 1) {
		soleDef.prototype[logtagList[i]] = shimFunc(logtagList[i]);
	}

	//  Apply each passthrough function; note: This won't work 
	//	for assert or exception, as they use line numbers
	for (i = 0; i < pttagList.length; i += 1) {
		soleDef.prototype[pttagList[i]] = ptFunc(pttagList[i]);
	}

	//	Allow for noConflict
	_Sole = outsideSelf.Sole;
	_globalSole = outsideSelf.sole;

	//	Create instance
	globalSole = new soleDef();

	//	Expose our constructor and sole instance
	outsideSelf.Sole = soleDef;
	outsideSelf.sole = globalSole;
}).call(this);