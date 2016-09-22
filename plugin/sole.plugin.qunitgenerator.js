/*
	qunitgenerator: plugin for generating qUnit tests automatically from sole.js
*/
Sole.plugin("qunitgenerator", function(args) {
	args =  args || {};
	var self = this,
		testValuesVar = args.testValuesVar || "soleTestValues",
		//	Use the values to create qUnit tests
		generateTests = function(values, options) {
			//	Default our values
			options = options || {};
			options.testForTags = (typeof options.testForTags !== undefined)? options.testForTags: true;
			options.testDataStructures = (typeof options.testDataStructures !== undefined)? options.testDataStructures: true;

			var count = 0,
				tempTests = [],
				tempTest = "", h, i, isStr, test,
				tests = [],
				obj,
				argi,
				compile = function(tmpl, obj) {
					for(var i in obj) { if(obj.hasOwnProperty(i)){
						tmpl = tmpl.replace('{{' + i + '}}', obj[i]);
					}}
					return tmpl;
				},
				okTmpl = "ok({{obj1}} === {{obj2}}, \"{{text}}\");",
				deepEqualTmpl = "deepEqual({{obj1}}, {{obj2}}, \"{{text}}\");";

			//	Iterate on values and create tests
			for(h = 0; h < values.length; h += 1) {
				obj = values[h];
				for(i = 0; i < obj.args.length; i += 1) {
					isStr = (typeof obj.args[i] === "string");
					argi = (isStr? "\"": "") + obj.args[i] + (isStr? "\"": "");

					tempTests.push(compile(deepEqualTmpl, {
						obj1: testValuesVar + "["+count+"].args[" + i + "]",
						obj2: argi,
						text: "Value in " + obj.tags.join(".") + " is " + argi.split("\"").join("'")
					}));

					tempTests.push(compile(deepEqualTmpl, {
						obj1: testValuesVar + "["+count+"].tags.join(\",\")",
						obj2: "\"" + obj.tags.join(",") + "\"",
						text: "Tag in " + obj.tags.join(".") + " is " + "'" + obj.tags.join(",") + "'"
					}));

					//	User might want to ignore tags in case they need to test against minified code as well.
					if(options.testForTags) {
						tempTests.push(compile(okTmpl, {
							obj1: testValuesVar + "["+count+"].type",
							obj2: "\"" + obj.type + "\"",
							text: "Type in " + obj.tags.join(".") + " is " + "'" + obj.type + "'"
						}));
					}
				}
				count += 1;

				tempTest = "test( \""+obj.tags.join(".")+"\", " + tempTests.length + ", function() {\n";
				for(i = 0; i < tempTests.length; i += 1) {
					tempTest += "\t" + tempTests[i] + "\n";
				}
				tempTest += "});\n";

				tests.push(tempTest);

				tempTests = [];
			}
			return tests;
		};

	//	Trigger to grab the values - you need these for the genrated tests
	/*
		mySole.plugin.trigger('qunitValues', function(valuesCreated){
			values = valuesCreated;
		});
	*/
	this.on('qunitValues', function(callback) {
		callback && callback(this.sole.get());
	});

	//	Trigger to grab the tests - they will contain the values hard coded for the tests
	/*
		mySole.plugin.trigger('qunitTests', function(testsCreated){
			tests = testsCreated;
		});
	*/
	this.on('qunitTests', function(callback, options) {
		options = options || {};
		testValuesVar = options.testValuesVar || testValuesVar;
		callback && callback(generateTests(this.sole.get(), options));
	});

});