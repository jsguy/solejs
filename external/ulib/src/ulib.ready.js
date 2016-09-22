/*global window, document */
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
}).call(this);