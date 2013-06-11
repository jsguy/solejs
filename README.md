# sole.js

sole.js - the soul of the console
	
An expansion of the JavaScript console to include tagging in console operations - this can be useful for large JS applications where you want to easily limit the output of the console, create unit tests, perfomance tuning, code execution path visulisation, troubleshooting, etc...

This utility does not override the console, rather it is a separately namespaced function which you can use to log, warn, error, and many of the most common console operations, plus it implements filter and globbing functionality, to allow you to extract a report on specificly logged items.

# How does it work?

* You include sole.min.js in your page
* You can then make call such as ```sole.tag('my').log('stuff');``` this will register an object with the string 'stuff' against the tag 'my'