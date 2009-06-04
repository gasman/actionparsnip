function LissajousBlock(opts) {
	Block.call(this, opts);
	this.changeEvent = new Event();
	
	//this.defineParameter({name: 'amplitude', type: 'range', min: 0, max: 200});
	this.defineParameter('amplitude', SliderParameter, {min: 0, max: 200});
	//this.defineParameter('amplitude', ConstantParameter, {value: 100});
	this.parameters.amplitude.source.changeEvent.attach(this.changeEvent.relay);

	this.defineParameter('time', ConstantParameter, {value: 0});

	var self = this;
	this.defineInput(new SingleInputSocket({
		name: 'time',
		type: SourceTypes.Time,
		fallbackParameter: this.parameters.time,
		events: {changeEvent: this.changeEvent.relay},
		onChangeState: this.changeEvent.relay
	}));
	
	this.defineOutput(new OutputSocket({
		name: 'position',
		type: SourceTypes.Coordinates,
		source: {
			get: function() {
				var t = self.inputs.time.source.get();
				return [self.parameters.amplitude.value * Math.sin(t/1000),
					self.parameters.amplitude.value * Math.cos(t/1000)];
			},
			changeEvent: this.changeEvent
			/* TODO: for efficiency, consider exposing the source's changeEvent
			 * rather than relaying from our own.
			 * (Makes disconnecting / reconnecting hairy though) */
		}
	}));
}
extend(LissajousBlock.prototype, Block.prototype);
registerBlockType('lissajous', LissajousBlock);
