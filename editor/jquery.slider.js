(function($) {
	$.slider = function(opts) {
		opts = $.extend({
			width: 200,
			min: 0,
			max: 100,
			value: 0
		}, opts);
		var slider = $('<div></div>').css({
			width: opts.width + 'px', height: '21px', position: 'relative',
			backgroundImage: 'url(slider.png)'
		}).get(0);

		slider.pointer = $('<div></div>').css({
			width: '11px', height: '21px', position: 'absolute', left: '-5px',
			backgroundImage: 'url(pointer.png)'
		}).get(0);
		slider.pointer.slider = slider;

		var dragSlider = function(e) {
			var position = e.pageX - $(slider).offset().left;
			slider.setPosition(position);
			if (slider.onchange) slider.onchange(slider.value);
		}
		$(slider).mousedown(function(e) {
			if (this.oncapture) this.oncapture();
			dragSlider(e);
			$(this.pointer).css({backgroundImage: 'url(pointer_active.png)'});
			$('html').mousemove(dragSlider).mouseup(function(){
				$(this).unbind('mousemove', dragSlider);
				$(slider.pointer).css({backgroundImage: 'url(pointer.png)'});
				if (slider.onrelease) slider.onrelease();
			});
		});
		
		slider.min = opts.min; slider.max = opts.max;
		slider.positionToValue = function(p) {
			return this.min + (p * (this.max - this.min) / opts.width);
		}
		slider.valueToPosition = function(v) {
			return (v - this.min) * opts.width / (this.max - this.min);
		}
		
		slider.setPosition = function(p) {
			if (p < 0) p = 0;
			if (p > opts.width) p = opts.width;
			this.position = p;
			$(this.pointer).css({left: (p-5) + 'px'});
			this.value = this.positionToValue(p);
		}
		slider.setValue = function(v) {
			if (v < this.min) v = this.min;
			if (v > this.max) v = this.max;
			this.value = v;
			this.position = this.valueToPosition(v);
			$(this.pointer).css({left: (this.position-5) + 'px'});
		}
		slider.setValue(opts.value);
		slider.onchange = opts.change;
		
		$(slider).append(slider.pointer);
		return slider;
	}
})(jQuery);
