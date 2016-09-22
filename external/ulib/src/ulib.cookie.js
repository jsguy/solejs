/*global window */
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
}).call(this);