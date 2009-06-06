function TimerBlock(opts) {
	Block.call(this, {}, opts);
	this.changeEvent = new Event();
	this.refreshRate = 10;
	this.playing = false;
	this.currentTime = 0;
	
	var self = this;
	
	var start = function() {
		var startTimeOffset = self.currentTime;
		var startTimestamp = (new Date).getTime();
		self.playing = true;
		var tick = function() {
			if (!self.playing) return;
			self.currentTime = (new Date).getTime() - startTimestamp + startTimeOffset;
			self.changeEvent.send();
			setTimeout(tick, self.refreshRate);
		}
		tick();
	}
	var pause = function() {
		self.playing = false;
	}
	var stop = function() {
		self.playing = false;
		self.currentTime = 0;
		self.changeEvent.send();
	}
	
	this.defineInput(new SingleInputSocket({
		name: 'timeControl',
		type: SourceTypes.TimeControl,
		fallbackSource: nullTimeControlSource,
		events: {startEvent: start, pauseEvent: pause, stopEvent: stop}
	}));
	
	this.defineOutput(new OutputSocket({
		name: 'time',
		type: SourceTypes.Time,
		source: {
			get: function() { return self.currentTime },
			changeEvent: this.changeEvent
		}
	}));
}
extend(TimerBlock.prototype, Block.prototype);
registerBlockType('timer', TimerBlock);
