# sole.js
_the soul of the console_

sole.js is an extension of the console paradigm that includes tagging, filtering, globbing, plugins and event subscription.

**Note:** sole.js does not override the console, (however there is a plugin for that, if you wish.)

# Quick start

* [Download the latest release](https://github.com/jsguy/solejs/zipball/master)
* Include dist/sole-latest.min.js in your page
* You can now do things like 
```javascript
sole.tag('my').log('stuff');
```
and then later 
```javascript
sole.filter('my')
``` 
to get just your stuff!
* Play around with the qunit tests to see how it all works!

# Wait, why do I need this?

With the ability to use semantic tagging, and limiting output of output commands, you can use it for example to create unit tests, catching issues cross-browser, perfomance tuning, troubleshooting, etc...
There is a plugin to generate qunit tests automatically by simply logging information at key points, check out the included test!

# Using it

```javascript
sole.tag("fruit.apple").log("We have an apple");
sole.get();
```
Returns

```javascript
[{
    args: ["We have an apple"],
    tags: ["fruit", "apple"],
    type: "log"
}]
```

## Tagging



## Globbing

Say you had:

```javascript
sole.tag("fruit.apple").log("We have an apple");
sole.tag("fruit.apple.green").log("We have a green apple");
```
If you run

```javascript
sole.glob("fruit.apple").length
```
Returns 1 item

```javascript
sole.glob("fruit.apple*").length
```
Returns 2 items

## Filtering


# Copyright and license

Copyright 2013 jsguy (Mikkel Bergmann)

Licensed under the MIT License