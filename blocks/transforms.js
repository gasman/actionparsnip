function XRotationBlock(opts) {
	Block.call(this, {'rotation': 0}, opts);
	this.changeEvent = new Event();
	
	var self = this;

	// this.defineParameter({name: 'rotation', type: 'range', min: 0, max: 2*Math.PI});
	this.defineParameter('rotation', ConstantParameter, {value: 0});
	this.parameters.rotation.source.changeEvent.attach(function() {
		self.cached = false;
		self.changeEvent.send();
	});
	this.defineParameter('model', NullModelParameter);

	this.defineInput(new SingleInputSocket({
		name: 'model',
		type: SourceTypes.Model,
		fallbackParameter: self.parameters.model,
		events: {changeEvent: function() {
			self.cached = false; /* TODO: have model define a changeTransformEvent so that we don't bother recalculating for other types of change */
			self.changeEvent.send();
		}},
		onChangeState: this.changeEvent.relay
	}));
	
	this.cached = false;
	
	this.defineOutput(new OutputSocket({
		name: 'model',
		type: SourceTypes.Model,
		source: {
			getVertices: function() {return self.inputs.model.source.getVertices()},
			getNormals: function() {return self.inputs.model.source.getNormals()},
			getFaces: function() {return self.inputs.model.source.getFaces()},
			getTransform: function() {
				if (!self.cached) self.calculate();
				return self.matrix;
			},
			changeEvent: self.changeEvent
		}
	}));
}
extend(XRotationBlock.prototype, Block.prototype, {
	calculate: function() {
		var m = this.inputs.model.source.getTransform();
		var a = this.parameters.rotation.source.get();
		var cos_a = Math.cos(a);
		var sin_a = Math.sin(a);
		this.matrix = [
			m[0], m[1]*cos_a+m[2]*sin_a, m[2]*cos_a-m[1]*sin_a, m[3],
			m[4], m[5]*cos_a+m[6]*sin_a, m[6]*cos_a-m[5]*sin_a, m[7],
			m[8], m[9]*cos_a+m[10]*sin_a, m[10]*cos_a-m[9]*sin_a, m[11]
		];
		this.cached = true;
	}
});
registerBlockType('x rotation', XRotationBlock);
