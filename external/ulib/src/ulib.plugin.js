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
}).call(this);