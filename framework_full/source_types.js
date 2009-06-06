function SourceType(parents) {
	this.parents = (parents || []);
}
$.extend(SourceType.prototype, {
	doesSatisfy: function(interface) {
		if (interface == this) return true;
		for (var i = 0; i < this.parents.length; i++) {
			if (this.parents[i].doesSatisfy(interface)) return true;
		}
		return false;
	}
});

var SourceTypes = {};
SourceTypes.Value = new SourceType();
SourceTypes.Scalar = new SourceType([SourceTypes.Value]);
SourceTypes.TimeControl = new SourceType();
SourceTypes.Time = new SourceType([SourceTypes.Scalar]);
SourceTypes.Coordinates = new SourceType([SourceTypes.Value]);
SourceTypes.CanvasDrawing = new SourceType();
SourceTypes.Model = new SourceType();

/* Some handy null sources */
// TEMP - TimeControl will be retired
nullTimeControlSource = {
	startEvent: flyingPigEvent,
	pauseEvent: flyingPigEvent,
	stopEvent: flyingPigEvent
};
nullModelSource = {
	getVertices: function() {return []},
	getNormals: function() {return []},
	getFaces: function() {return []},
	getTransform: function() {return identityMatrix},
	changeEvent: flyingPigEvent
};
