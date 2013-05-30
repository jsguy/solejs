/*global window, ulib, sole, document, QUnit */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
 * @fileOverview This file contains the main sole functionality.
 * @author <a href="mailto:mikkel@jsguy.com">Mikkel Bergmann</a>
 * @version 0.0.7
 */
/*
	sole.js - the soul of the console

	An expansion of JavaScript console(s), to include tagging in console operations, this can
	be useful for large JS applications, where you want to easily limit the output of the console,
	and create unit tests.

	NOTE: This does not override the console, it is a separate function, which you can use to log, warn,
	etc, and then at the end use the filter function to reduce the number of results based on s
	or types, or a combination of both.

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
	/** sole - the soul of console
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
	 * @param {object} args.passthough Do we send the events through to the browsers console, default is false
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

				if (!(typeof(tag) === 'object' && (tag instanceof Array))) {
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
			pubsub: events
		});

		self.setArg = function(key, value) {
			args[key] = value;
		};

		self.getArg = function(key) {
			return args[key];
		};

		self.enum = {
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

			return cfg.tag;
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
				events.trigger(self.enum.events.tag, tag, out);
			}

			if(cfg.capture) {
				matches.push(out);
			}

			//	Trigger output listeners
			events.trigger(self.enum.events.output, out);

			//  Run the shim'd console function
			//	This is done in the context of console (and rightfully so: http://code.google.com/p/chromium/issues/detail?id=48662)
			if (this.passthrough()) {
				window.console[type].apply(window.console, args);
			}
		};

		//	Match and history functionality
		//  Returns the history for a given  and optional type or group
		//	TODO: document + examples
		/*
		 * @param {string||array} [args.tag] A list of tags (also accepts a single string)
		 * @param {string||array} [args.type] A list of types (also accepts a single string)
		 */
		self.filter = function (args) {
			var i, j, l, log, result = [],
				include, oks, okTypes, tags = (args) ? args.tag : [],
				types = (args) ? args.type : [];

			//  We allow either one tag, or a list
			if (!(typeof(tags) === 'object' && (tags instanceof Array))) {
				tags = (tags !== undefined) ? [tags] : tags;
			}

			//  We allow either one type, or a list
			if (!(typeof(types) === 'object' && (types instanceof Array))) {
				types = (types !== undefined) ? [types] : types;
			}

			//	If we have something to filter on
			if ((tags && tags.length > 0) || (types && types.length > 0)) {
				//	Iterate on matches
				for (l = 0; l < matches.length; l += 1) {
					log = matches[l];
					include = true;
					oks = true;
					okTypes = true;

					//	Look at tags
					if (tags && tags.length > 0) {
						oks = false;
						for (i = 0; i < tags.length; i += 1) {
							for (j = 0; j < log.tags.length; j += 1) {
								if (tags[i] === log.tags[j]) {
									oks = true;
									break;
								}
							}
						}
						if (!oks) {
							include = false;
						}
					}
					//	Look at types
					if (types && types.length > 0) {
						okTypes = false;
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

					if (include && oks && okTypes) {
						result.push(log);
					}
				}
			} else {
				result = matches;
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
				reg, i, j, hist, log, newMatches = [];
			//	Default to matching everything
			globstr = globstr || "*";
			//	Save the questions and stars using separators
			str = globstr.split("*").join(sepstar);
			str = str.split("?").join(sepquest);
			str = escRegex(str);
			//	Put back in the stars and questions, with regex equivelents, plus start and end chars
			str = "^" + str.split(sepstar).join(".*").split(sepquest).join(".") + "$";
			reg = new RegExp(str);

			//	If matches is null, we haven't matched anything yet
			hist = matches || self.filter();

			for (i = 0; i < hist.length; i += 1) {
				log = hist[i];
				for (j = 0; j < log.tags.length; j += 1) {
					if (reg.test(log.tags[j])) {
						newMatches.push(log);
						break;
					}
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
		self.plugin.registerEvent({ type: self.enum.events.output});
		self.plugin.registerEvent({ type: self.enum.events.tag });

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
			if (!(typeof(tags) === 'object' && (tags instanceof Array))) {
				tags = [tags];
			}

			if (!(typeof(addTags) === 'object' && (addTags instanceof Array))) {
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
}(this, this.ulib || (this.sole)? this.sole.ulib: {}));
