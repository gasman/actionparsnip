function BoxBlock(opts) {
	Block.call(this, {}, opts);
	this.changeEvent = new Event();

	var defaultPositionSource = {
		get: function() {return [0,0]},
		changeEvent: flyingPigEvent
	};
	
	var self = this;
	this.defineInput(new SingleInputSocket({
		name: 'position',
		type: SourceTypes.Coordinates,
		defaultSource: defaultPositionSource,
		events: {changeEvent: this.changeEvent.relay},
		onChangeState: this.changeEvent.relay
	}));
	
	this.defineOutput(new OutputSocket({
		name: 'drawing',
		type: SourceTypes.CanvasDrawing,
		source: {
			draw: function(canvas2d) {
				/* takes a struct of context, width and height */
				var coords = self.inputs.position.source.get();
				canvas2d.context.fillStyle = 'white';
				canvas2d.context.fillRect(coords[0], coords[1], 16,16);
			},
			changeEvent: self.changeEvent
		}
	}));
}
extend(BoxBlock.prototype, Block.prototype);
registerBlockType('box', BoxBlock);
