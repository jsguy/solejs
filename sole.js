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

	Licence
	-------

	Copyright (C) 2012 Mikkel Bergmann

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




/*

	WIP: 	Operations are currently destructive, ie: filter, glob, etc... 
			Need to make these non-destructive, without using too much memory!!!

	TODO:

		. Add ability to add post-tag functions, for example to get a stacktrace, etc...

*/






var sole = (function (win, ulib) {
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
	 */
	var sole = function (args) {
		args = args || {};
		args.cfg = args.cfg || {};
		args.matches = args.matches || null;
		var that = this,
			matches,
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
				soleOutput: false
			}
			hasConsole = !! (win.console),
			events = new ulib.Pubsub(),

			//	Extends an object with any number of other objects
			extend = function() {
				var target = arguments[0], i, k;
				for(i = 1; i < arguments.length; i += 1) {
					for(k in arguments[i]) { if(arguments[i].hasOwnProperty(k)) {
						target[k] = arguments[i][k];
					}}
				}
			},


			//	Ensures we have a valid tag
			validate = function (tag) {
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

			//	Add a  to the list of used tags
			addTag = function (tag) {
				var i, addedTag = false;

				if (!(typeof(tag) === 'object' && (tag instanceof Array))) {
					tag = [tag];
				}

				for(i = 0; i < tag.length; i += 1) {
					if(! that.hasTag(tag[i])) {
						addedTag = true;
						tagList[tag[i]] = 0;
					}
					tagList[tag[i]] += 1;
				}
				return addedTag;
			};

		//	Extend cfg
		extend(cfg, args);

		/** Reset internal state of all matches
		 */
		this.reset = function () {
			tagList = [];
			matches = null;
		};

		/** Get the configuration
		 * @returns {object} Configuration object
		 */
		this.getCfg = function() {
			return cfg;
		};

		/** Returns boolean, true if a tag has been in the sole
		 *
		 * @returns {boolean} True if a tag has been used
		 */
		this.hasTag = function (tag) {
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

		/** Available events
		 *
		 * @name output
		 * @event
		 * @param {function} func Function to execute when the event is triggered
		 *
		 * @name add
		 * @event
		 * @param {function} func Function to execute when the event is triggered
		 *
		 */
		events.addEventType('output');
		events.addEventType('add');

		/** Add an event listener for a given type
		 *
		 * @param {string} type The name of the event type
		 * @param {function} func The function to execute for the given event type
		 *
		 * @returns {boolean} True if the event was successfully added
		 */
		this.on = function () {
			events.on.apply(events, arguments);
		};

		/** Removes an event listener
		 *
		 * @param {string} type The name of the event type
		 * @param {function} [func] The function to remove - if not specified we remove all listeners for the given event type
		 *
		 * @returns {boolean} True if one or more event(s) were successfully removed
		 */
		this.off = function () {
			events.off.apply(events, arguments);
		};

		/** Returns true if we should pass output to the console (if available), can be used to set the passthrough cfg value
		 *
		 * @returns {boolean} True if we should pass output to the console (if available)
		 */
		this.passthrough = function (value) {
			if (value !== undefined) {
				cfg.passthrough = !! (value);
			}
			return !!(hasConsole && cfg.passthrough);
			//return cfg.passthrough;
		};

		/** Returns true if we should pass "sole" output to the console (if available), can be used to set the soleOutput cfg value
		 *
		 * @returns {boolean} True if we should pass "sole" output to the console (if available)
		 */
		this.soleOutput = function(value) {
			if (value !== undefined) {
				cfg.soleOutput = !! (value);
			}
			return !!(hasConsole && cfg.soleOutput);
		};

		/** Set the tag that sole will use
		 *
		 * @param {string} [Value] The value of the tag - you can pass either a string, (which can be dot seperated), array, or multiple strings
		 * @returns {array} The value of the tag
		*/
		this.tag = function() {
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

		this.capture = function(value){
			if (value !== undefined) {
				cfg.capture = !! (value);
			}
			return cfg.capture;
		};

		this.disable = function(value) {
			if (value !== undefined) {
				cfg.disable = !! (value);
			}
			return cfg.disable;
		};

		/** Shims console functions from sole
		 *
		 * @param {string} type The type of command we're calling, valid options are "log", "debug", "info", "warn", "error", "group", "groupCollapsed"
		 * @param {array|string} tags An array of tags to regsiter with the command
		 * @param {object} args An array of arguments
		 */
		this.shim = function (type, tag, args) {
			var i, text, out;

			matches = matches || [];

			if(matches.length >= cfg.maxLogSize) {
				//	Remove the first entry
				matches.splice(0,1);
			}

			//	Validate the tag
			tag = validate(tag);

			out = {
				type: type,
				tags: tag,
				args: args
			};

			//	Add the tag - we get true if it was added, false if existing
			if (addTag(tag)) {
				//	Trigger new  listeners
				events.trigger("add", tag, out);
			}

			if(cfg.capture) {
				matches.push(out);
			}

			//	Trigger output listeners
			events.trigger("output", out);

			//  Run the shim'd console function
			//	This is done in the context of console (and rightfully so: http://code.google.com/p/chromium/issues/detail?id=48662)
			if (this.passthrough()) {
				win.console[type].apply(win.console, args);
			}

			//  Run the shim'd console function, output the sole log item
			if(this.soleOutput()) {
				text = tag.join('.');

				win.console[type].apply(win.console, [text, args]);

				//win.console[type].apply(win.console, [out]);
			}

		};

		//	Match and history functionality
		//  Returns the history for a given  and optional type or group
		//	TODO: document + examples
		//	TODO: Bug - this IS destructive! Should return a copy...
		/*
		 * @param {string||array} [args.tag] A list of tags (also accepts a single string)
		 * @param {string||array} [args.type] A list of types (also accepts a single string)
		 */
		this.filter = function (args) {
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

			console.log(types, tags);

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

			//matches = result;

			//return result;
			return that.copy(cfg);
		};

		//	glob function, ie: "*pax*" matches s of ["something.pax.whatever", "pax", "pax.widget"]
		//	TODO: document + examples
		this.glob = function (globstr) {
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
			hist = matches || that.filter();

			for (i = 0; i < hist.length; i += 1) {
				log = hist[i];
				for (j = 0; j < log.tags.length; j += 1) {
					if (reg.test(log.tags[j])) {
						newMatches.push(log);
						break;
					}
				}
			}

			matches = newMatches;

			//	Use copy so we can chain calls
			return that.copy(cfg);
		};

		//	Return matches
		this.get = function (index) {
			var entries = (matches) ? matches : [];
			return (index) ? entries[index] : entries;
		};

		//	Set the matched entries
		this.setMatches = function (newMatches) {
			var i;
			for (i = 0; i < newMatches.length; i += 1) {
				that[i] = newMatches[i];
			}
			matches = newMatches;
			that.length = newMatches.length;
		};

		//	We create a new object to return, for chaining
		this.copy = function (args, entries) {
			var ns = new this.constructor(args);
			ns.setMatches(entries || matches);
			return ns;
		};

	},
	//	Log functions supported. TODO: Some sort of support for groups
	logtagList = ["log", "debug", "info", "warn", "error", "group", "groupCollapsed"],
	//	Passthrough functions - these don't yet interact with sole, but you can pass them through to console (tested with fireBug 1.7)
	pttagList = ["clear", "dir", "dirxml", "trace", "groupEnd", "time", "timeEnd", "profile", "profileEnd", "count", "table"],

	//	Shims the console functions
	shimFunc = function (consoleFunctionType) {
		return function () {
			if(this.disable()) {
				return false;
			}
			var tags = [], caller, funcRE, defaultFuncName = 'anon', funcName = defaultFuncName, addTags = this.getCfg().tag || [], i;

			//  We assume a list
			if (!(typeof(tags) === 'object' && (tags instanceof Array))) {
				tags = [tags];
			}

			if (!(typeof(addTags) === 'object' && (addTags instanceof Array))) {
				addTags = [addTags];
			}

			// Identify function name here, append to s - if anonumous, add as "anon".
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

			for(i = 0; i < addTags.length; i += 1) {
				tags.push(addTags[i]);
			}

			tags.push(funcName);

			//this.shim(consoleFunctionType, tags, Array.prototype.slice.call(arguments, 1));
			this.shim(consoleFunctionType, tags, arguments);
		};
	},

	//	Shims pass through functions (these cannot be disabled)
	ptFunc = function (consoleFunctionType) {
		return function () {
			//	TODO: Move this?
			if (this.passthrough()) {
				//  Run the console function (in the context of console, and rightfully so: http://code.google.com/p/chromium/issues/detail?id=48662)
				win.console[consoleFunctionType].apply(win.console, arguments);
			}
		};
	},
	i;

	//  Apply each loggable function
	for (i = 0; i < logtagList.length; i += 1) {
		sole.prototype[logtagList[i]] = shimFunc(logtagList[i]);
	}

	//  Apply each passthrough function; note: This won't work for assert or exception, as they use line numbers
	for (i = 0; i < pttagList.length; i += 1) {
		sole.prototype[pttagList[i]] = ptFunc(pttagList[i]);
	}

	//  Assert and exception need the line number, so we cannot generically passthrough those functions
	//	SOoo.... we shouldn't expose them like this? (Maybe make our own???)
/*
	if (outputToConsole()) {
		sole.assert = window.console.assert;
		sole.exception = window.console.exception;
	}
*/

	//	Expose a default global sole object (don't overwrite!)
	win.Sole = sole;

	//	And return an instance for private use
	return new sole();
//	Allow passing in of ulib to sole on the object
}(this, this.ulib || ((sole)? sole.ulib: {}) || {}));