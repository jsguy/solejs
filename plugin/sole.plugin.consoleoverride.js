/*
	consoleoverride: plugin for overriding the console by using the default sole object
*/
Sole.plugin("consoleoverride", function(args) {
	args =  args || {};
	var win = args.window || window;

	//	Cannot passthrough to itself
	args.sole.passthrough(false);

	//	Override the console
	win.console = args.sole;
});