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
	ulib.dom - simple DOM related methods
	part of the ulib collection - simple utilities
*/
var ulib = this.ulib || {};
(function(){
	var bind = function bindEvent(el, eventName, eventHandler) {
			if (el.addEventListener){
				el.addEventListener(eventName, eventHandler, false); 
			} else if (el.attachEvent){
				el.attachEvent('on'+eventName, eventHandler);
			}
		},

		forEach = function(obj, callback) {
			// http://stackoverflow.com/questions/8157700/object-has-no-hasownproperty-method-i-e-its-undefined-ie8
			for (var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)) {
				callback(key, obj[key]);
			}}
		}, 

		//	TODO: Use this ONLY when necessary
		isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

	ulib.bind = bind;
	ulib.forEach = forEach;
	ulib.isFirefox = isFirefox;
}).call(this);