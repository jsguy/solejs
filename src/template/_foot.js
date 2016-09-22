}).call(this.sole);

//	Packages
if (typeof module === "object" && module != null && module.exports) {
	module.exports = sole;
} else if (typeof define === "function" && define.amd) {
	define(function () { return sole })
} else {
	(typeof window !== "undefined" ? window : this).sole = sole;
}