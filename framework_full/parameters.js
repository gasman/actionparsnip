ConstantParameter = function(opts) {
	this.source = {
		get: function() {return opts.value},
		changeEvent: flyingPigEvent
	}
}
extend(ConstantParameter.prototype, {
	show: function() {},
	hide: function() {},
	enable: function() {},
	disable: function() {},
	export: function() {return null;}
})

VariableParameter = function(opts, value) {
	this.value = value;
	this.changeEvent = new Event();
	var self = this;
	this.source = {
		get: function() {return self.value},
		changeEvent: self.changeEvent
	}
}
extend(VariableParameter.prototype, {
	set: function(value) {
		this.value = value;
		this.changeEvent.send();
	},
	show: function() {},
	hide: function() {},
	enable: function() {},
	disable: function() {},
	export: function() {return JSON.serialize(this.value);}
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
	this.name = opts.name;
	VariableParameter.call(this, opts, value)
}
extend(SliderParameter.prototype, VariableParameter.prototype, {
	show: function() {
		var sliderContainer = e('div', {'class': 'param_value'});
		this.li = e('li', {'class': 'param'},
			e('label', {}, param.name),
			sliderContainer
		)

		$('#param_editor ul.params').append(this.li);
		var param = this;
		this.inputElement = new Slider(sliderContainer, {
			value: param.value,
			min: param.opts.min,
			max: param.opts.max,
			onchange: function(v) {
				param.set(v);
				param.source.changeEvent.send(v)
			}
		});
		
		this.param.attachOnChange(this.onChange);
	},
	hide: function() {
		$('#param_editor ul.params').get(0).removeChild(this.li);
	}
})

// TEMP - TimeControl will be retired
TimeControlParameter = function() {
	this.source = {
		startEvent: flyingPigEvent,
		pauseEvent: flyingPigEvent,
		stopEvent: flyingPigEvent
	}
}
extend(TimeControlParameter.prototype, {
	show: function() {},
	hide: function() {},
	enable: function() {},
	disable: function() {},
	export: function() {return null;}
})
NullModelParameter = function() {
	this.source = {
		getVertices: function() {return []},
		getNormals: function() {return []},
		getFaces: function() {return []},
		getTransform: function() {return identityMatrix},
		changeEvent: flyingPigEvent
	};
}
extend(NullModelParameter.prototype, {
	show: function() {},
	hide: function() {},
	enable: function() {},
	disable: function() {},
	export: function() {return null;}
})
