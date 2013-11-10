/*
	traperrors: traps any "forgotten" JS errors, ie: uncaught exceptions, and use sole.error to re-transmit.
*/
Sole.plugin("traperrors", function(args) {
	args =  args || {};
	var win = args.window || window,
		self = this,
		//	Default to sole.error
		send = args.sole.error,
		//	Grab old on error
		_onerror = win.onerror,
		//	false = passthrough, true = stop
		stop = !!((typeof args.stop !== 'undefined')? args.stop: true);

	//	Attach event listener for on error
	win.onerror = function(message, file, line){
		var errorArgs = {
				message: message,
				file: file,
				line: line
			}, 
			//	Grab options from set args
			options = args.sole.getArg('traperrors') || {};

		//	Possibly apply different config via passed in options
		send = options.send || send;
		stop = (typeof options.stop !== 'undefined')? options.stop: stop;

		//	Send the message
		send.apply(args.sole, [errorArgs]);

		//	Allow other plugins to capture by triggering event
		self.trigger('traperrors', errorArgs);

		//	Run old onerror if we want to passthrough
		if(!stop && args.sole.isFunc(_onerror)) {
			_onerror(message, file, line);
		}

		return stop;
	};
});