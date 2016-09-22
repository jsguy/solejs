/*global window*/
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
}).call(this);