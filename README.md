# sole.js

sole.js - the soul of the console
	
An expansion of JavaScript console(s), to include tagging in console operations, this can be useful for large JS applications, where you want to easily limit the output of the console, create unit tests, perfomance tuning, code execution path visulisation, troubleshooting, etc...
This utility does not override the console, rather it is a separately namespaced function which you can use to log, warn, error, and any of the most common console operations, plus filter and globbing functionality, to allow you to extract a report on specificly logged items.
Sole.js will automatically add the function name as a tag, so if you 

# How does it work?

* You include sole.min.js in your page
* You can then make call such as ```function myFunction() { sole.log('stuff'); }``` this will register the string 'stuff' against the tag 'myFunction'

See the examples in the test directory for more details

# Getting started

Simply include sole.js, and 

```javascript
function myFunction() { sole.log('stuff'); }
```

```javascript
obj1 = {
	plugins: ['a', 'b'],
	config: {
		show: {
			immediately: true
		}
	}
};
obj2 = {
	plugins: ['c'],
	config: {
		show: {
			order: 'reverse'
		}
	}
};

augment(obj1, obj2);
```

After that, obj1 contains:

```javascript
{
	plugins: ['a', 'b', 'c'],
	config: {
	show: {
		immediately: true,
			order: 'reverse'
		}
	}
}
```