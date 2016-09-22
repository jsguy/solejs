/*
	traperrors: traps any "forgotten" JS errors, ie: uncaught exceptions, and use sole.error to re-transmit.
*/
Sole.plugin("trapjqueryerrors", function(args) {
	args =  args || {};
	var win = args.window || window,
		self = this,
		//	Default to sole.error
		send = args.sole.error,
		//	false = passthrough, true = stop
		stop = !!((typeof args.stop !== 'undefined')? args.stop: true);

	//	Attach event listener for on error
	var onerror = function(message, file, line){
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


//	Note: all this does it get richer/better errors with known libraries, eg; jquery

/*global jQuery, window*/
/*jslint nomen: false*/
(function ($) {

    //	Backup setTimeout, without override
    window._setTimeout = window.setTimeout;

    function notify(data) {
    	console.log(data);
		self.trigger('traperrors', data);
    };

    // TODO: handle (typeof f === 'string')
    function wrapped(f) {
        var _backtrace;

        try {
            throw new Error("stack trace generator");
        } catch (e) {
            _backtrace = e.stack || e.backtrace;
        }

        return function trapjquery(event) {
            try {
                if (!$.isFunction(f)) {
                    return f;
                }
                return f.apply(this, arguments);
            } catch (e) {
            	//	Better error info for jQuery based events
                window._setTimeout(function () {
                    data = $.extend({
                        name: e.name,
                        message: e.message,
                        backtrace: e.stack || e.backtrace,
                        _backtrace: _backtrace,
                        arguments: e.arguments,
                        type: e.type,
                        url: window.location.toString(),
                        user_agent: navigator.userAgent,
                        wrapped: f.toString().substr(0, 2048),

                        // Firefox only
                        source: e.source,
                        // Firefox || Safari
                        file_name: e.fileName || e.sourceURL,
                        // Firefox || Safari
                        line_number: e.lineNumber || e.line,
                    }, window.rescuejs);

                    if (event && event.currentTarget && event.currentTarget.nodeName) {
                        var target = event.currentTarget;

                        //	TODO: Uh, what is this?

                        data.target = "<" + target.nodeName.toLowerCase();
                        if (target.className) {
                            data.target += ' class="' + target.className + '"';
                        }
                        if (target.id) {
                            data.target += ' id="' + target.id + '"';
                        }
                        if (target.href) {
                            data.target += ' href="' + target.getAttribute('href') + '"';
                        }
                        data.target += ">";

                        data.event = event.type;
                    }

                    notify(data);
                });

				//console.log('yo!');

                window.$e = e;
                throw e;
            }
        };
    };

    function wrapTimeFunc(_super) {
        return function(f, t) {
            return _super.call(this, wrapped(f), t);
        }
    };

    window.setTimeout  = wrapTimeFunc(window.setTimeout);
    window.setInterval = wrapTimeFunc(window.setInterval);
    $.fn.ready    = wrapTimeFunc($.fn.ready);

    $.event.add = (function (_super) {
        return function (elem, types, handler, data, selector) {

            if (handler && !handler.handler) {
                var f, ret;

                // Copy the GUID between the wrapped handler and the real
                // handler so that $.fn.unbind etc. can continue to work.
                f = wrapped(handler);
                f.guid = handler.guid;
                ret = _super(elem, types, f, data, selector);
                handler.guid = f.guid;

                return ret;

            } else if (handler && handler.handler) {
                handler.handler = wrapped(handler.handler);
                return _super.apply(this, arguments);

            } else {
                return _super.apply(this, arguments);
            }
        };

    }($.event.add));

}(window.jQuery || window.$));








});