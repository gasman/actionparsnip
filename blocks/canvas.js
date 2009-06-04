function CanvasBlock(opts) {
	Block.call(this, {}, opts);
	this.drawingSources = new Set();
	
	var self = this;
	
	var scheduleRedraw = function() {
		globalEvents.add(drawAll);
	}

	onBrowserLoad(function() {
		var canvas = document.getElementById('canvas');
		self.canvas2d = {
			context: canvas.getContext('2d'),
			width: canvas.width,
			height: canvas.height
		}
		scheduleRedraw();
	})
	
	var drawAll = function() {
		if (!self.canvas2d) return;
		self.canvas2d.context.fillStyle = 'black';
		self.canvas2d.context.fillRect(0, 0, self.canvas2d.width, self.canvas2d.height);
		self.inputs.drawing.sources.each(function(drawingSource) {
			drawingSource.draw(self.canvas2d);
		})
	}
	
	this.defineInput(new MultipleInputSocket({
		name: 'drawing',
		type: SourceTypes.CanvasDrawing,
		events: {changeEvent: scheduleRedraw},
		onChangeState: function() {if (self.canvas2d) scheduleRedraw();}
	}));

}
extend(CanvasBlock.prototype, Block.prototype);
registerBlockType('canvas', CanvasBlock);
