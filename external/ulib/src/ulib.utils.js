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
	ulib.utils - basic utility functionality
	part of the ulib collection - simple utilities

*/
var ulib = this.ulib || {};
(function(){
	var Utils = function () {
		var that = this;

		//	Nipped from jquery
		this.isFunction = function (obj) {
			return Object.prototype.toString.call(obj) === "[object Function]";
		};

		this.getType = function (obj) {
			var class2type = {},
				i, types = "Boolean Number String Function Array Date RegExp Object".split(" ");
			// Populate the class2type map
			for (i = 0; i < types.length; i += 1) {
				class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
			}

			return obj === null ? String(obj) : class2type[{}.toString.call(obj)] || "object";
		};

		this.isArray = function (obj) {
			return that.getType(obj) === "array";
		};

		// A crude way of determining if an object is a window
		this.isWindow = function (obj) {
			return obj && typeof obj === "object" && "setInterval" in obj;
		};

		this.isPlainObject = function (obj) {
			// Must be an Object.
			// Because of IE, we also have to check the presence of the constructor property.
			// Make sure that DOM nodes and window objects don't pass through, as well
			if (!obj || that.getType(obj) !== "object" || obj.nodeType || that.isWindow(obj)) {
				return false;
			}

			// Not own constructor property must be Object
			if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj, "constructor") && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
				return false;
			}

			// Own properties are enumerated firstly, so to speed up,
			// if last one is own, then all properties are own.
			var key, i;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					i += 1;
				}
			}

			return key === undefined || {}.hasOwnProperty.call(obj, key);
		};

		this.extend = function () {
			// copy reference to target object
			var target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false,
				options, name, src, copy, clone;

			// Handle a deep copy situation
			if (typeof target === "boolean") {
				deep = target;
				target = arguments[1] || {};
				// skip the boolean and the target
				i = 2;
			}

			// Handle case when target is a string or something (possible in deep copy)
			if (typeof target !== "object" && !that.isFunction(target)) {
				target = {};
			}

			// extend jQuery itself if only one argument is passed
			if (length === i) {
				target = this;
				i -= 1;
			}

			for (; i < length; i += 1) {
				// Only deal with non-null/undefined values
				if ((options = arguments[i]) !== null) {
					// Extend the base object
					for (name in options) {
						if (options.hasOwnProperty(name)) {
							src = target[name];
							copy = options[name];

							// Prevent never-ending loop
							if (target === copy) {
								continue;
							}

							// Recurse if we're merging object literal values or arrays
							//	TODO: Implement the jQuery functions below...
							if (deep && copy && (that.isPlainObject(copy) || that.isArray(copy))) {
								clone = src && (that.isPlainObject(src) || that.isArray(src)) ? src : that.isArray(copy) ? [] : {};

								// Never move original objects, clone them
								target[name] = that.extend(deep, clone, copy);

								// Don't bring in undefined values
							} else if (copy !== undefined) {
								target[name] = copy;
							}
						}
					}
				}
			}

			// Return the modified object
			return target;
		};

		/*
			This function will add (deeply) any standard objects and arrays.
			It augments (modifies) o1 with o2.
			This is meant for configuration only, and will likely have undesirable
			results with more complex objects, or if you try to mash an object with an array.
		*/
		this.augment = function(o1, o2) {
			var i, oldArrays = {};
			// We use only the objects own properties
			for (i in o2) {if(o2.hasOwnProperty(i)) {
				if (o2[i] && o2[i].constructor && o2[i].constructor === Object) {
					// Deal with objects (recurse)
					o1[i] = o1[i] || {};
					arguments.callee(o1[i], o2[i]);
				} else if( Object.prototype.toString.call( o1[i] ) === '[object Array]' ) {
					// Deal with Array
					if(o2[i] && Object.prototype.toString.call(o2[i]) === '[object Array]') {
						o1[i] = o1[i].concat(o2[i]);
					}
				} else {
					o1[i] = o2[i];
				}
			}}

			return o1;
		};		
		
		this.each = function(obj, fn) {
			if (!obj) { return; }
			
			var name, i = 0, length = obj.length;
		
			// object
			if (length === undefined) {
				for (name in obj) {
					if (fn.call(obj[name], name, obj[name]) === false) { break; }
				}
				
			// array
			} else {
				for (var value = obj[0];
					i < length && fn.call( value, i, value ) !== false; value = obj[++i]) {				
				}
			}
		
			return obj;
		};
		
	};

	//	Expose global event object
	ulib.utils = new Utils();
}).call(this);