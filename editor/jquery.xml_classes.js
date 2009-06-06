/* patched version of addClass / removeClass to work with XML documents
(where elem.className is invalid, in favour of getAttribute('class') */
jQuery.fn.xAddClass = function(classNames) {
	this.each(function() {
		jQuery.xClassName.add(this, classNames);
	});
}
jQuery.fn.xRemoveClass = function(classNames) {
	this.each(function() {
		jQuery.xClassName.remove(this, classNames);
	});
}

jQuery.xClassName = {
	// internal only, use xAddClass("class")
	add: function(elem, classNames) {
		var classNameArray = (elem.getAttribute('class') || '').split(/\s+/);
		var newClassNames = (classNames || "").split(/\s+/);
		for (var i = 0; i < newClassNames.length; i++) {
			if (jQuery.inArray(newClassNames[i], classNameArray) == -1)
				classNameArray.push(newClassNames[i]);
		}
		elem.setAttribute('class', classNameArray.join(' '));
	},

	// internal only, use xRemoveClass("class")
	remove: function(elem, classNames) {
		var oldClassNames = (elem.getAttribute('class') || '').split(/\s+/);
		var classNamesToRemove = (classNames || "").split(/\s+/);
		var newClassNames = [];
		for (var i = 0 ; i < oldClassNames.length; i++) {
			if (jQuery.inArray(oldClassNames[i], classNamesToRemove) == -1)
				newClassNames.push(oldClassNames[i]);
		};
		elem.setAttribute('class', newClassNames.join(' '));
	},
}