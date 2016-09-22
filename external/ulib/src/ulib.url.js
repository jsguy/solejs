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
	ulib.url - url parsing functionality
	part of the u collection - simple utilities

	Usage:

		ulib.url(url)
	
	url - the URL to use

	Returns: object with params and hash

*/
this.ulib = this.ulib || {};
(function(){
	var urlParts = function (url) {
			var vars = {
				hash: "",
				params: {}
			},
				parts, reg;
			url = (url) ? url : window.location.href;

			//	Get and remove hash part (if any)
			if ((url.indexOf("#") !== -1)) {
				vars.hash = url.substr(url.lastIndexOf("#"));
				if(vars.hash !== '') {
					vars.hash = vars.hash.substr(1);
				}
				url = url.substr(0, url.indexOf("#"));
			}

			//  Find the parameter values in the URL
			reg = new RegExp("[?&]+([^=&]+)=([^&]*)", "gi");

			parts = url.replace(reg, function (m, key, value) {
				//	TODO: This can potentially be a list!
				if(typeof vars.params[key] !== 'undefined') {
					if( Object.prototype.toString.call(vars.params[key]) !== '[object Array]' ) {
						vars.params[key] = [vars.params[key]];
					}
					vars.params[key].push(value);
				} else {
					vars.params[key] = value; //decodeURIComponent(value);
				}
			});
			return vars;
		},

		//	Turns an object into a post string
		urlString = function( param ) {
			var	str = "", count = 0, p;
			
			for( p in param ) { if( param.hasOwnProperty( p ) ) {
				str += ( ( count === 0 )? '': '&' ) + p + '=' + encodeURIComponent( param[p] );	//.replace( /%20/g, '+' );
				count += 1;
			} }

			return str;
		};

	//	Expose url functions
	ulib.url = urlParts;
	ulib.urlString = urlString;
}).call(this);