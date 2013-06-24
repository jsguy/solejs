/* sole.js uses ulib micro library functions, hence the header and footer to encapsulate namespaced ulib */
var sole = window.sole || {};
	sole.ulib = {};
	(function(ulib){
;/*global window*/
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
ulib = ulib || {};
(function (ulib) {
	var Pubsub = function (args) {

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
}(ulib));;/*global window, events*/
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
ulib = ulib || {};
(function (ulib) {

	/*
	 * ulib.plugin - args are:
	 *
	 *	config - configuration object, accessible by each plugin via getter and setter methods
	 * 	pluginConfig - configurations that can be passed to named plugins
	 *
	 */
	var PluginManager = function (args) {
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
							console.error('ulib ' + name + ' - ' + pluginErrors['TriggerError'] + ((info)? info: ''));
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
				var ci, pc = pluginConfig["*"];
				config = (config !== undefined)? config: pluginConfig[plugin.name];

				//	Add properties from generic config if available
				if(pc) {
					config = config || {};
					for(c in pc) {if(pc.hasOwnProperty(c)) {
						if(!config.hasOwnProperty(c)) {
							config[c] = pc[c];
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
}(ulib));;/*global window */
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
ulib = ulib || {};
(function (ulib) {
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

			return (window.document.cookie = cookie.join('; '));
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
}(ulib));;}(sole.ulib));;/*global window, ulib, sole, document, QUnit */
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

	. Development
	. Unit testing
	. Plugins
		- Automatic unit test generation
	. Production issues resolution and testing

	Licence
	-------

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

	http://getfirebug.com/wiki/index.php/Console_API
	http://simonwillison.net/2006/Jan/20/escape/#p-6
	http://jsguy.com

*/
(function (window, ulib, undefined) {
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
	 * @param {object} args.permanent Do we set a cookie to enable sole permanantly, default is false, which will also remove the cookie
	 * @param {string} args.cookieName Name of cookie to use for the optional permanent config, default is "solecfg"
	 */
	var sole = function (args) {
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
				tag: [],
				passthrough: false,
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
			addTag = function (tag) {
				var i, addedTag = false;

				if (!(typeof tag === 'object' && (tag instanceof Array))) {
					tag = [tag];
				}

				for(i = 0; i < tag.length; i += 1) {
					if(! self.hasTag(tag[i])) {
						addedTag = true;
						tagList[tag[i]] = 0;
					}
					tagList[tag[i]] += 1;
				}
				return addedTag;
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

		/** Reset internal state of all matches
		 */
		self.reset = function () {
			tagList = [];
			matches = null;
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
		 * @returns {array} The value of the tag
		 * @note This method is chainable
		*/
		self.tag = function() {
			var i, j, list = [], value;
			for(i = 0; i < arguments.length; i += 1) {
				value = arguments[i];
				if (value !== undefined) {
					if(typeof value === 'string') {
						value = value.split('.');
					}
					if (value instanceof Array) {
						for(j = 0; j < value.length; j += 1) {
							list.push(value[j]);
						}
					} else {
						list.push(value);
					}
				}
			}

			cfg.tag = list;

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

			//	Add the tag - we get true if it was added, false if existing
			if (addTag(tag)) {
				//	Trigger new  listeners
				events.trigger(self.enums.events.tag, tag, out);
			}

			if(cfg.capture) {
				matches.push(out);
			}

			//	Trigger output listeners
			events.trigger(self.enums.events.output, out);

			//  Run the shim'd console function
			//	This is done in the context of console (and rightfully so: http://code.google.com/p/chromium/issues/detail?id=48662)
			if (this.passthrough()) {
				window.console[type].apply(window.console, args);
			}
		};

		//	Match and history functionality on types or tags
		//  Returns the history for a given  and optional type or group
		//	TODO: document + examples
		/*
		 * @param {string||array} [args.tag] A list of tags (also accepts a single string)
		 * @param {string||array} [args.type] A list of types (also accepts a single string)
		 */
		self.filter = function (args) {
			args = args || {};
			var i, j, l, log, result = [], notResult = [],
				include, okTags, okTypes, tags = args.tag || [],
				types = args.type || [],
				not = args.not || false;

			//  We allow a string, and assume it to be a tag
			if (typeof args === 'string') {
				tags = [args];
			}

			//  We allow a list
			if ((typeof tags === 'object' && (tags instanceof Array))) {
				tags = args;
			}

			//  We allow either one tag, or a list
			if (!(typeof tags === 'object' && (tags instanceof Array))) {
				tags = (tags !== undefined) ? [tags] : tags;
			}

			//  We allow either one type, or a list
			if (!(typeof types === 'object' && (types instanceof Array))) {
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
							for (j = 0; j < log.tags.length; j += 1) {
								if (tags[i] === log.tags[j]) {
									okTags = true;
									break;
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
			return ns;
		};

		//	Initialises the sole functionality, with an optional config
		self.init = function(config) {
			if(config) {
				//	Extend cfg
				extend(cfg, config);
			}

			if(cfg.permanent) {
				//	Set cookie to enable sole
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
		};

		//	Add in a plugin manually
		self.addPluginManually = function(type, func) {
			//	Add any plugins
			// if(sole.pluginList && sole.pluginList.length > 0) {
			// 	for(i = 0; i < sole.pluginList.length; i += 1) {
			// 		self.plugin.add(sole.pluginList[i].type, sole.pluginList[i].func);
			// 	}
			// }
			self.plugin.add(type, func);
		};

		//	Allow old version of Sole to be used instead
		self.noConflict = function(deep) {
			//	Instance
			if( _globalSole && window.sole !== _globalSole ) {
				window.sole = _globalSole;
			}

			//	Constructor
			if( deep && _Sole && window.Sole !== _Sole ) {
				window.Sole = _Sole;
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

		//	Add any registered plugins
		if(sole.pluginList && sole.pluginList.length > 0) {
			for(i = 0; i < sole.pluginList.length; i += 1) {
				self.plugin.add(sole.pluginList[i].type, sole.pluginList[i].func);
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
			if (!(typeof tags === 'object' && (tags instanceof Array))) {
				tags = [tags];
			}

			if (!(typeof addTags === 'object' && (addTags instanceof Array))) {
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

			this.shim(consoleFunctionType, tags, arguments);
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

	//	Ability to add plugins 
	sole.pluginList = [];
	sole.plugin = function(type, func){
		sole.pluginList.push({
			type: type,
			func: func
		});
		globalSole.addPluginManually(type, func);;
	};

	//  Apply each loggable function
	for (i = 0; i < logtagList.length; i += 1) {
		sole.prototype[logtagList[i]] = shimFunc(logtagList[i]);
	}

	//  Apply each passthrough function; note: This won't work for assert or exception, 
	//	as they use line numbers
	for (i = 0; i < pttagList.length; i += 1) {
		sole.prototype[pttagList[i]] = ptFunc(pttagList[i]);
	}

	//	Allow for noConflict
	_Sole = window.Sole;
	_globalSole = window.sole;

	//	Create instance
	globalSole = new sole();

	//	Expose a default sole instance and constructor
	window.Sole = sole;
	window.sole = globalSole;

	return globalSole;
//	Allow passing in of ulib to sole on the object
}(this, (this.sole)? this.sole.ulib: this.ulib || {}));