function Slider(container, opts) {
	this.opts = extend({width: 200, min: 0, max: 500, value: 0}, opts);
	this.pointer = e('div', {'class': 'slider_pointer'});
	this.bar = e('div', {'class': 'slider_bar'}, this.pointer);
	this.bar.style.width = this.opts.width + 'px';
	container.appendChild(this.bar);
	this.setValue(this.opts.value);
	
	var slider = this;
	var moveForEvent = function(e) {
		// FIXME: offsetLeft is relative to offsetParent, not page
		var position = e.pageX - slider.bar.offsetLeft;
		slider.setPosition(position);
		if (slider.opts.onchange) slider.opts.onchange(slider.value);
	}
	
	$(this.bar).drag(moveForEvent, moveForEvent);
}
extend(Slider.prototype, {
	setPosition: function(p) {
		this.setValue(this.opts.min + (p * (this.opts.max - this.opts.min) / this.opts.width));
	},
	setValue: function(v) {
		if (v < this.opts.min) v = this.opts.min;
		if (v > this.opts.max) v = this.opts.max;
		this.value = v;
		var position = (v - this.opts.min) * this.opts.width / (this.opts.max - this.opts.min);
		this.pointer.style.left = (position-5) + 'px';
	}
})

function ParamEditorTextParamView(param, ul) {
	this.param = param;
	this.ul = ul;
	var inputId = 'param_editor_param_' + param.name;

	this.inputElement = e('input', {'id': inputId});
	this.li = e('li', {'class': 'param'},
		e('label', {'for': inputId}, param.name),
		this.inputElement
	)
	this.ul.appendChild(this.li);
	this.refresh();

	$(this.inputElement).keyup(function() {
		param.change(this.value);
	})
	
	this.onChange = bind(this, this.refresh);
	this.param.attachOnChange(this.onChange);
}
extend(ParamEditorTextParamView.prototype, {
	refresh: function() {
		this.inputElement.value = this.param.value;
	},
	destroy: function() {
		this.param.detachOnChange(this.onChange);
		this.ul.removeChild(this.li);
	}
})

function ParamEditorSliderParamView(param, ul) {
	this.param = param;
	this.ul = ul;

	var sliderContainer = e('div', {'class': 'param_value'});
	this.li = e('li', {'class': 'param'},
		e('label', {}, param.name),
		sliderContainer
	)
	this.ul.appendChild(this.li);

	this.inputElement = new Slider(sliderContainer, {
		value: this.param.value,
		min: this.param.opts.min,
		max: this.param.opts.max,
		onchange: function(v) {param.change(v)}
	});
	
	this.onChange = bind(this, function(v) {
		this.inputElement.setValue(v);
	});
	this.param.attachOnChange(this.onChange);
}
extend(ParamEditorSliderParamView.prototype, {
	destroy: function() {
		this.param.detachOnChange(this.onChange);
		this.ul.removeChild(this.li);
	}
})

function ParamEditor(htmlId) {
	this.dom = document.getElementById(htmlId);
	this.ul = this.dom.appendChild(e('ul', {'class': 'params'}));
	this.paramViews = [];
	selectBlockEvent.attach(bind(this, this.onSelectBlock));
	deselectBlockEvent.attach(bind(this, this.onDeselectBlock));
}
extend(ParamEditor.prototype, {
	onDeselectBlock: function(block) {
		for (var i = 0; i < this.paramViews.length; i++) {
			this.paramViews[i].destroy();
		}
	},
	onSelectBlock: function(block) {
		this.paramViews = [];
		for (var i = 0; i < block.parameterNames.length; i++) {
			var param = block.parameters[block.parameterNames[i]];
			if (!param.visible) continue;
			var paramView;
			switch (param.type) {
				case 'range':
					paramView = new ParamEditorSliderParamView(param, this.ul);
					break;
				default:
					paramView = new ParamEditorTextParamView(param, this.ul);
			}
			this.paramViews.push(paramView);
		}
	}
})
