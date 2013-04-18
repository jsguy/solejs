# sole.js

sole.js - the soul of the console
	
An expansion of JavaScript console(s), to include tagging in console operations, this can be useful for large JS applications, where you want to easily limit the output of the console, create unit tests, perfomance tuning, code execution path visulisation, troubleshooting, etc...
This utility does not override the console, rather it is a separately namespaced function which you can use to log, warn, error, and any of the most common console operations, plus filter and globbing functionality, to allow you to extract a report on specificly logged items.
Sole.js will automatically add the function name as a tag, so if you 

# How does it work?

* You include sole.min.js in your page
* You can then make call such as ```function myFunction() { sole.log('stuff'); }``` this will register the string 'stuff' against the tag 'myFunction'