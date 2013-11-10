# sole.js
_the soul of the console_

<!-- TODO: Add CI build -->
<!--
[![Build Status](https://secure.travis-ci.org/visionmedia/jade.png)](http://travis-ci.org/visionmedia/jade)
-->

<!--
	TODO:

	Features
		- Trap errors plugin ("error" plugin)
			. This will essentially do what we wanted okjs to do
			. Ability to log errors via ajax
			. Include jQuery support, see the okjs plugin

	Note: For examples, you could use http://cssdeck.com/codecasts

	Examples
		- Finish Matrix debug
		- Finish Qunit generation 
		- Create example of using a mocked test (jasmine?)
			. Basic test with mocked controller calls - use one of their examples
			. Show how the same thing works with sole.js
			. Explain how easy it is to break the jasmine test, (false positive), and why the same sole.js test doesn't fail as easily

		- Create video of debug in Chrome VS a bunch of sole commands
			. In chrome you can set breakpoints, etc... But that doesn't carry well across dev and production environments, unless you use source maps (which can expose your full source!)
			. You'd still need to set the breakpoints, even when you do have source maps, so it's not a magic bullet
			. It's much easier to just use sole.js - it will log from the same parts of the code in both minified and dev code

			The example
				- Should show a simple ajax request
				- Failure should be instructure of data
				- Use sole.js to capture the input and output of the JSON success function
				- Debug this in Chrome on the live box
					. Point out the minified code doesn't really help
					. Show sole.js tagged input/output from the same function
					. Point out that yes, you need to know exactly where to add sole log commands, and that sole is an addition to debugging, not a replacement
					. Main point is that there is quite low barrier to entry, as you are most likely already using console.log in much of your development.

				- Debug the same thing on the dev box
					- Use Source maps to show where the error is from the debug session
					- Use the captured sole.js input to trigger the same error

	Tests
		- Trap errors test

-->

sole.js is an extension of the console paradigm that includes tagging, filtering, globbing, plugins and event subscription.

**Note:** sole.js does **not** override the console, (however there is a plugin for that, if you wish.)

# Quick start

* [Download the latest release](https://github.com/jsguy/solejs/zipball/master)
* Include dist/sole-latest.min.js in your page
* You can now do things like 
```js
sole.tag('my').log('stuff');
```
and then later 
```js
sole.filter('my')
``` 
to get just your stuff!
* Play around with the qunit tests to see how it all works!

# Wait, why do I need this?

With the ability to use semantic tagging, and filtering output of commands, you can use it for example to create unit tests, catching issues cross-browser, perfomance tuning, troubleshooting, replacing the normal console, etc...
There is a plugin to generate qunit tests automatically by simply logging information at key points, check out the included qunitgenerator test!

**Caveat emptor:** On the surface, having console commands everywhere and tightly coupling your code with a library seems like a bad idea, however sole.js is fully tested, and used in various high-traffic production sites. If you can live with that, read on!

# Using it

```js
sole.log("Some gibberish");
sole.tag("useful").log("Useful info");
sole.filter("useful").get();
// [{ args: ["Useful info"], tags: ["useful"], type: "log" }]
```
ie: avoid the gibberish!

## Simple example

Say we had a function ```Func``` that we wanted to test - we could use sole to capture information from it at key points in the process.

```js
function Func(args) {
    //	Private function - we are naming the function here 
	var multiply = function multiply(num, times) {
			sole.log(num, times);
			return num * times;
		}, value = multiply(args.num, args.times);
	this.getValue = function getValue() {
		sole.log(value);
		return value;
	};
	sole.log("Ran multiply", value);
};

//	Code we want to test, including any data
var myFunc = new Func({ num: 9, times: 6 });
```

sole will now contain the following:

```js
[
    {"type":"log","tags":[],"args":{"0":9,"1":6}},
    {"type":"log","tags":[],"args":{"0":"Ran multiply","1":54}}
]
```
You can use this to test that the output result matches the given input, ie: Func received 9, 6 and returned 54, or in other words: 9 x 6 = 54.

## Tagging

```js
sole.tag(yourTag)
```
Where yourTag is one of

* `string` most basic form of use
* `array` alternatively pass in an array of tags

tag is chainable, so you can do things like:

```js
sole.tag("blah").log("something").get();
// [{ args: ["something], tags: ["blah"], type: "log", time: date }]
```


**Note:** Tags are persistent, so once you set a tag, it will be reused for further messages.


## Globbing

Say you had:

```js
sole.tag("fruit.apple").log("We have an apple");
sole.tag("fruit.apple.green").log("We have a green apple");
```
If you run

```js
sole.glob("fruit.apple").length
```
Returns 1 item

```js
sole.glob("fruit.apple*").length
```
Returns 2 items

## Filtering


# Copyright and license

Copyright 2013 jsguy (Mikkel Bergmann)

Licensed under the MIT License