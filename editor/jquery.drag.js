var dragStartX, dragStartY;
$.fn.drag = function(startHandler, dragHandler, endHandler) {
	var source = this;
	var mousemoveHandler = function(e) {
		e.offsetX = e.clientX - dragStartX;
		e.offsetY = e.clientY - dragStartY;
		if (dragHandler != null) dragHandler.call(source, e);
	}
	var mouseupHandler = function(e) {
		if (endHandler != null) endHandler.call(source, e);
		$(window).unbind('mousemove', mousemoveHandler);
		$(window).unbind('mouseup', mouseupHandler);
	}
	this.mousedown(function(e) {
		if (startHandler != null) startHandler.call(this, e);
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		$(window).mousemove(mousemoveHandler).mouseup(mouseupHandler);
		return false; /* prevent bubbling of mousedown event to things underneath */
	})
	return this;
}
