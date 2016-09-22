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
}).call(this);