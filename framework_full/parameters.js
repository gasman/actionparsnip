/* a convenient base to extend. Does nothing. */
AbstractParameter = function() {}
extend(AbstractParameter.prototype, {
	show: function() {},
	hide: function() {},
	enable: function() {},
	disable: function() {},
	export: function() {return null;}
});

/* A parameter which always returns a constant value; this is exposed as a Value source and also as this.value */
ConstantParameter = function(opts) {
	this.value = opts.value;
	this.source = {
		get: function() {return opts.value},
		changeEvent: flyingPigEvent
	}
}
extend(ConstantParameter.prototype, AbstractParameter.prototype);

/* A parameter which just wraps a Source and does nothing else with it */
SourceParameter = function(opts) {
	this.source = opts.source;
}
extend(SourceParameter.prototype, AbstractParameter.prototype);

/* A parameter which holds a value, accessible as this.value and as a ValueSource, which can be changed by the 'set' method */
VariableParameter = function(opts, value) {
	this.value = value;
	this.changeEvent = new Event();
	var self = this;
	this.source = {
		get: function() {return self.value},
		changeEvent: self.changeEvent
	}
}
extend(VariableParameter.prototype, AbstractParameter.prototype, {
	set: function(value) {
		this.value = value;
		this.changeEvent.send();
	},
	export: function() {return this.value;}
})

InputBoxParameter = function(opts, value) {
	this.name = opts.name;
	VariableParameter.call(this, opts, value)
}
extend(InputBoxParameter.prototype, VariableParameter.prototype, {
	show: function() {
		var inputId = 'param_editor_param_' + this.name;

		this.inputElement = e('input', {'id': inputId, 'value': this.value});
		this.li = e('li', {'class': 'param'},
			e('label', {'for': inputId}, this.name),
			this.inputElement
		)
		$('#param_editor ul.params').append(this.li);
		var param = this;
		$(this.inputElement).keyup(function() {
			param.set(this.value);
		})
	},
	hide: function() {
		$('#param_editor ul.params').get(0).removeChild(this.li);
	}
})

SliderParameter = function(opts, value) {
	this.opts = extend({width: 200, min: 0, max: 500, value: 0}, opts);
	this.isShown = false;
	VariableParameter.call(this, opts, value)
}
extend(SliderParameter.prototype, VariableParameter.prototype, {
	show: function() {
		this.pointer = e('div', {'class': 'slider_pointer'});
		this.bar = e('div', {'class': 'slider_bar'}, this.pointer);
		this.bar.style.width = this.opts.width + 'px';

		this.li = e('li', {'class': 'param'},
			e('label', {}, this.name),
			e('div', {'class': 'param_value'}, this.bar)
		);

		$('#param_editor ul.params').append(this.li);
		this.isShown = true;
		this.updatePointer();

		var slider = this;
		var moveForEvent = function(e) {
			// FIXME: offsetLeft is relative to offsetParent, not page
			var position = e.pageX - slider.bar.offsetLeft;
			slider.setPosition(position);
		}
		$(this.bar).drag(moveForEvent, moveForEvent);
	},
	updatePointer: function() {
		if (!this.isShown) return;
		var position = (this.value - this.opts.min) * this.opts.width / (this.opts.max - this.opts.min);
		this.pointer.style.left = (position-5) + 'px';
	},
	hide: function() {
		$('#param_editor ul.params').get(0).removeChild(this.li);
		this.isShown = false;
	},
	setPosition: function(p) {
		this.set(this.opts.min + (p * (this.opts.max - this.opts.min) / this.opts.width));
	},
	set: function(value) {
		value = Math.max(this.opts.min, value);
		value = Math.min(this.opts.max, value);
		this.value = value;
		this.updatePointer();
		this.changeEvent.send();
	},
})
