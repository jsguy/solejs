/*global window, $, jQuery */
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
}).call(this);