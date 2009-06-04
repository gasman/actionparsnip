/* create a DOM element, given name, a hash of attributes, and a list of child nodes */
function e() {
	var name = arguments[0];
	var attrs = arguments[1];
	var elem = document.createElementNS('http://www.w3.org/1999/xhtml', name);
	if (attrs) {
		for (var attr in attrs) {
			elem.setAttribute(attr, attrs[attr]);
		}
	}
	for (var i = 2; i < arguments.length; i++) {
		if (typeof(arguments[i]) == 'object') {
			/* assume it's a DOM element */
			elem.appendChild(arguments[i]);
		} else {
			elem.appendChild(document.createTextNode(arguments[i]));
		}
	}
	return elem;
}

/* create an SVG element / DOM tree in the appropriate namespace */
function svge() {
	var name = arguments[0];
	var attrs = arguments[1];
	var elem = document.createElementNS('http://www.w3.org/2000/svg', name);
	if (attrs) {
		for (var attr in attrs) {
			elem.setAttribute(attr, attrs[attr]);
		}
	}
	for (var i = 2; i < arguments.length; i++) {
		if (typeof(arguments[i]) == 'object') {
			/* assume it's a DOM element */
			elem.appendChild(arguments[i]);
		} else {
			elem.appendChild(document.createTextNode(arguments[i]));
		}
	}
	return elem;
}
