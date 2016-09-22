/*
	reporterrors: reports any errors caught with the traperrors plugin
*/
Sole.plugin("reporterrors", function(args) {
	args =  args || {};
	var win = args.window || window,
		self = this,
		//	Default to example.com
		/*
			TODO: Example URL request
		*/
		baseURL = "example.com/report?",
		url = args.sole.error;

	//	Attach event listener for on error event in sole
	self.on('traperrors', function(errorArgs){


		//	Grab options from set args
		var options = args.sole.getArg('reporterrors') || {},
			//	Returns the full url for the tag
			buildURL = function( args ) {
				var date = new Date(), timeStamp = date.getTime(),
					proto = 'http' + ( ( window.location.protocol.indexOf('https:') == 0 )? 's': '' ) + '://',
					//	Turns an object into a postable string
					urlString = function( param ) {
						var	str = "", count = 0, p;
						
						for( p in param ) { if( param.hasOwnProperty( p ) ) {
							str += ( ( count == 0 )? '': '&' ) + p + '=' + encodeURIComponent( param[p] );	//.replace( /%20/g, '+' );
							count += 1;
						} }

						return str;
					};

				args = args || {};
				
				//	Add standard parameters
				var sendArgs = {
					//	TODO: calling document.location may cause issues in an iFrame
					'u': document.location,
					//	TODO: do we need a unique ID?
					//	'i': browserCookie(),
					'r': document.referrer,
					't': timeStamp,
					'z': ( date.getTimezoneOffset() / 60 ) * ( -1 ),
					's': screen.width + "x" + screen.height + "x" + screen.colorDepth,
					'l': ( document.userLanguage  || document.language || window.navigator.language || window.navigator.browserLanguage ).substring( 0, 2 )
				};
				
				//	Allow override of parameters
				for( var i in args ) { if( args.hasOwnProperty(i) ) {
					//	Run function, or use property
					//	TODO: decide what to pass into the function, args perhaps?
					//sendArgs[i] = isFunc(args[i])? args[i](): args[i];
					sendArgs[i] = args[i];
				}}


				return proto + baseURL + urlString( sendArgs );
			},
			//	Send a tag
			sendError = function( args ) {
				var sendSrc;
				args = args || {};


				sendSrc = buildURL(args);


				//	TESTING


				//	Create and load the image
				// var img = document.createElement( 'IMG' );
				// img.src = sendSrc;
			};


		//	Optionally grab an alternate url method via setArg
		url = options.url || url;

		sendError(errorArgs);

		//	Send the message
		//send.apply(args.sole, [errorArgs]);

		//	Allow other plugins to capture 
		//self.trigger('onerror', errorArgs);

		//	Run old onerror if we want to passthrough
		// if(!stop && args.sole.isFunc(_onerror)) {
		// 	_onerror(message, file, line);
		// }

		//return stop;





		











	});
});