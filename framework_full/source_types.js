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
