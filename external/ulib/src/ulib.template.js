/*global window, $, jQuery */
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*
	ulib - jsguy's standalone micro utilities library

	Copyright (C) 2012 by Mikkel Bergmann
	
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
	ulib.template - basic templating functionality
	Based on: http://ejohn.org/blog/javascript-micro-templating/

	Usage:

		ulib.template(str, data);
	
	str - the template
	data - any data that the template uses

	returns HTML string

*/
var ulib = this.ulib || {};
(function(){
	var cache = {},
	
	//	Template functionality
	template = function template(str, data) {
 
		//	Use the cache, or create a new function
		var fn = cache[str] ||
			//	Create a cachable template function
			new Function("obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +
			   
			    //	Introduce the data as "local" variables using with
				"with(obj){p.push('" +
				   
				//	Convert the template into JS
				str
					.replace(/[\r\t\n]/g, " ")
					.split("<%").join("\t")
					.replace(/((^|%>)[^\t]*)'/g, "$1\r")
					.replace(/\t=(.*?)%>/g, "',$1,'")
					.split("\t").join("');")
					.split("%>").join("p.push('")
					.split("\r").join("\\'")
					+ "');}return p.join('');");
			
		//	Cache the function
		cache[str] = fn;
   
		// Provide some basic currying to the user
		return data ? fn( data ) : fn;
	};

	ulib.template = template;
}).call(this);