/*
	repeat: Find entries of repeated values

	@param {number}	min How many repeats before an entry is considered a repeat (default is 1)
	@param {string}	use One of 'args', 'tags', 'type' (default is 'args')
*/
Sole.addFilter('repeat', function(args) {
	args = args || {};
	var min = (args.min !== undefined)? args.min: 1,
		use = (args.use !== undefined)? args.use: 'args',
		counts = {};

	//	Return the filter
	return function(idx, item) {
		var thing = item[use], tmpThings = [], i;
		if(use == 'tags') {
			thing = thing.join(".");
		}
		if(use == 'args') {
			for(i = 0; i < thing.length; i += 1) {
				tmpThings.push(thing[i]);
			}
			thing = tmpThings.join("");
		}
		counts[thing] = counts[thing] || 0;
		counts[thing] += 1;
		return counts[thing] > min;
	};
});