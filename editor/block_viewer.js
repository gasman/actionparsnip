function BlockViewerBlockView(block, blockViewer) {
	this.block = block;
	this.blockViewer = blockViewer;
	this.rect = svge('rect', {width: 100, height: 60});
	this.label = svge('text', {'class': 'block_label'}, block.parameters.name.source.get());
	this.group = svge('g', {'class': 'block'}, this.rect, this.label);
	this.inputViews = new Set();
	this.outputViews = new Set();

	this.onChangePosition = bind(this, this.reposition);
	this.block.parameters.viewPosition.source.changeEvent.attach(this.onChangePosition);
	this.reposition();

	this.blockViewer.svg.appendChild(this.group);
	var dragStartX, dragStartY;
	$(this.group).drag(
		function() {dragStartX = block.parameters.viewPosition.value.x; dragStartY = block.parameters.viewPosition.value.y},
		function(e) {
			block.parameters.viewPosition.set({x:dragStartX + e.offsetX, y: dragStartY + e.offsetY});
		},
		function() {}
	).mousedown(function(e) {
		if (e.metaKey) {
			/* keep other blocks and connections selected */
			if (selectedBlocks.contains(block)) {
				deselectBlock(block);
			} else {
				selectBlock(block, false);
			}
		} else {
			focusBlock(block);
			selectConnection(null);
			selectBlock(block, true);
		}
	});
	
	var self = this;
	this.block.attachOnDefineInput(function(input) {
		var inputView = new BlockViewerInputView(input, self);
		self.reposition();
	})
	this.block.attachOnDefineOutput(function(output) {
		var outputView = new BlockViewerOutputView(output, self);
		self.reposition();
	})

	this.onChangeName = function() {
		var newName = self.block.parameters.name.source.get();
		self.label.replaceChild(document.createTextNode(newName), self.label.firstChild);
	}
	this.block.parameters.name.source.changeEvent.attach(this.onChangeName);

	this.onBlockFocus = bind(this, this.focus);
	this.block.focusEvent.attach(this.onBlockFocus);
	this.onBlockDefocus = bind(this, this.defocus);
	this.block.defocusEvent.attach(this.onBlockDefocus);

	this.onBlockSelect = bind(this, this.select);
	this.block.selectEvent.attach(this.onBlockSelect);
	this.onBlockDeselect = bind(this, this.deselect);
	this.block.deselectEvent.attach(this.onBlockDeselect);

	this.onBlockDestroy = bind(this, this.destroy);
	this.block.attachOnDestroy(this.onBlockDestroy);
}
extend(BlockViewerBlockView.prototype, {
	reposition: function() {
		var viewParams = this.block.parameters.viewPosition.value;
		this.rect.setAttribute('x', viewParams.x);
		this.rect.setAttribute('y', viewParams.y);
		this.label.setAttribute('x', viewParams.x + 50);
		this.label.setAttribute('y', viewParams.y + 30);
		var inputOriginX = viewParams.x + 5;
		var inputOriginY = viewParams.y + 5;
		this.inputViews.each(function(inputView, i) {
			inputView.moveTo(inputOriginX, inputOriginY + 10 * i);
		})
		var outputOriginX = viewParams.x + 95;
		var outputOriginY = viewParams.y + 55;
		this.outputViews.each(function(outputView, i) {
			outputView.moveTo(outputOriginX, outputOriginY - 10 * i);
		})
	},
	focus: function() {
		$(this.group).xAddClass('focused');
	},
	defocus: function() {
		$(this.group).xRemoveClass('focused');
	},
	select: function() {
		$(this.group).xAddClass('selected');
	},
	deselect: function() {
		$(this.group).xRemoveClass('selected');
	},
	destroy: function() {
		this.block.parameters.viewPosition.source.changeEvent.detach(this.onChangePosition);
		this.block.parameters.name.source.changeEvent.detach(this.onChangeName)
		this.block.detachOnDestroy(this.onBlockDestroy);
		this.block.focusEvent.detach(this.onBlockFocus);
		this.block.defocusEvent.detach(this.onBlockFocus);
		this.blockViewer.svg.removeChild(this.group);
	}
})

function BlockViewerInputView(input, blockView) {
	this.x = 0;
	this.y = 0;
	this.blockView = blockView;
	this.input = input;
	this.circle = svge('circle', {r: 5});
	this.label = svge('text', {}, input.name);
	this.group = svge('g', {'class': 'input_socket'}, this.circle, this.label);
	this.connectionViews = new Set();

	blockView.group.appendChild(this.group);
	blockView.inputViews.add(this);
	blockView.blockViewer.inputViewsById[input.id] = this;
	
	var self = this;
	$(this.circle).hover(function() {
		if (
			self.blockView.blockViewer.dragMode == 'connect_from_output' &&
			self.input.canConnect(self.blockView.blockViewer.danglingConnectionView.sourceOutputView.output)
		) {
			self.group.setAttribute('class', 'input_socket captured');
			self.blockView.blockViewer.danglingConnectionView.capturedInputView = self;
			self.blockView.blockViewer.danglingConnectionView.moveInputTo(self.x, self.y);
		}
	}, function() {
		if (
			self.blockView.blockViewer.danglingConnectionView &&
			self.blockView.blockViewer.danglingConnectionView.capturedInputView == self
		) {
			self.blockView.blockViewer.danglingConnectionView.capturedInputView = null;
			self.group.setAttribute('class', 'input_socket');
		}
	})

	var dragStartX, dragStartY;
	$(this.circle).drag(function() {
		blockView.blockViewer.danglingConnectionView = new BlockViewerDanglingConnectionView(blockView.blockViewer);
		blockView.blockViewer.danglingConnectionView.sourceInputView = self;
		dragStartX = self.x; dragStartY = self.y;
		blockView.blockViewer.danglingConnectionView.moveInputTo(self.x, self.y);
		blockView.blockViewer.danglingConnectionView.moveOutputTo(self.x, self.y);
		blockView.blockViewer.dragMode = 'connect_from_input';
	}, function(e) {
		if (!blockView.blockViewer.danglingConnectionView.capturedOutputView) {
			blockView.blockViewer.danglingConnectionView.moveOutputTo(dragStartX + e.offsetX, dragStartY + e.offsetY);
		}
	}, function() {
		blockView.blockViewer.danglingConnectionView.destroy();
		blockView.blockViewer.dragMode = null;
		var capturedOutputView = blockView.blockViewer.danglingConnectionView.capturedOutputView;
		if (capturedOutputView) {
			self.blockView.blockViewer.metablock.connect(capturedOutputView.output, self.input);
		}
	})

	this.onInputDestroy = bind(this, this.destroy);
	this.input.attachOnDestroy(this.onInputDestroy);
}
extend(BlockViewerInputView.prototype, {
	moveTo: function(x, y) {
		this.x = x;
		this.y = y;
		this.circle.setAttribute('cx', x);
		this.circle.setAttribute('cy', y);
		this.label.setAttribute('x', x + 10);
		this.label.setAttribute('y', y);
		this.connectionViews.each(function(connectionView) {
			connectionView.moveInputTo(x, y);
		})
	},
	addConnectionView: function(connectionView) {
		this.connectionViews.add(connectionView);
		connectionView.moveInputTo(this.x, this.y);
		var self = this;
		connectionView.attachOnDestroy(function() {self.connectionViews.remove(connectionView);});
	},
	destroy: function() {
		this.input.detachOnDestroy(this.onInputDestroy);
		this.blockView.group.removeChild(this.group);
		this.blockView.inputViews.remove(this);
		this.blockView.blockViewer.inputViewsById[this.input.id] = null;
	}
})

function BlockViewerOutputView(output, blockView) {
	this.x = 0;
	this.y = 0;
	this.circle = svge('circle', {r: 5});
	this.label = svge('text', {}, output.name);
	this.group = svge('g', {'class': 'output_socket'}, this.circle, this.label);
	this.connectionViews = new Set();
	this.output = output;
	this.blockView = blockView;
	blockView.group.appendChild(this.group);
	blockView.outputViews.add(this);
	blockView.blockViewer.outputViewsById[output.id] = this;
	
	var dragStartX, dragStartY;
	var self = this;
	$(this.circle).drag(function() {
		blockView.blockViewer.danglingConnectionView = new BlockViewerDanglingConnectionView(blockView.blockViewer);
		blockView.blockViewer.danglingConnectionView.sourceOutputView = self;
		dragStartX = self.x; dragStartY = self.y;
		blockView.blockViewer.danglingConnectionView.moveOutputTo(self.x, self.y);
		blockView.blockViewer.danglingConnectionView.moveInputTo(self.x, self.y);
		blockView.blockViewer.dragMode = 'connect_from_output';
	}, function(e) {
		if (!blockView.blockViewer.danglingConnectionView.capturedInputView) {
			blockView.blockViewer.danglingConnectionView.moveInputTo(dragStartX + e.offsetX, dragStartY + e.offsetY);
		}
	}, function() {
		blockView.blockViewer.danglingConnectionView.destroy();
		blockView.blockViewer.dragMode = null;
		var capturedInputView = blockView.blockViewer.danglingConnectionView.capturedInputView;
		if (capturedInputView) {
			self.blockView.blockViewer.metablock.connect(output, capturedInputView.input);
		}
	})

	$(this.circle).hover(function() {
		if (
			self.blockView.blockViewer.dragMode == 'connect_from_input' &&
			self.blockView.blockViewer.danglingConnectionView.sourceInputView.input.canConnect(self.output)
		) {
			self.group.setAttribute('class', 'output_socket captured');
			self.blockView.blockViewer.danglingConnectionView.capturedOutputView = self;
			self.blockView.blockViewer.danglingConnectionView.moveOutputTo(self.x, self.y);
		}
	}, function() {
		if (
			self.blockView.blockViewer.danglingConnectionView
			&& self.blockView.blockViewer.danglingConnectionView.capturedOutputView == self
		) {
			self.blockView.blockViewer.danglingConnectionView.capturedOutputView = null;
			self.group.setAttribute('class', 'output_socket');
		}
	})

	//this.onOutputDestroy = bind(this, this.destroy);
	this.onOutputDestroy = function() {self.destroy()};
	this.output.attachOnDestroy(this.onOutputDestroy);
}
extend(BlockViewerOutputView.prototype, {
	moveTo: function(x, y) {
		this.x = x;
		this.y = y;
		this.circle.setAttribute('cx', x);
		this.circle.setAttribute('cy', y);
		this.label.setAttribute('x', x - 10);
		this.label.setAttribute('y', y);
		this.connectionViews.each(function(connectionView) {
			connectionView.moveOutputTo(x, y);
		});
	},
	addConnectionView: function(connectionView) {
		this.connectionViews.add(connectionView);
		connectionView.moveOutputTo(this.x, this.y);
		var self = this;
		connectionView.attachOnDestroy(function() {self.connectionViews.remove(connectionView);});
	},
	destroy: function() {
		this.output.detachOnDestroy(this.onOutputDestroy);
		this.blockView.group.removeChild(this.group);
		this.blockView.outputViews.remove(this);
		this.blockView.blockViewer.outputViewsById[this.output.id] = null;
	}
})

function BlockViewerConnectionView(connection, blockViewer) {
	this.destroyEvent = new Event();

	this.connection = connection;
	this.blockViewer = blockViewer;
	this.line = svge('line', {'class': 'connection'});

	var outputView = blockViewer.outputViewsById[connection.output.id];
	var inputView = blockViewer.inputViewsById[connection.input.id];

	blockViewer.svg.appendChild(this.line);
	outputView.addConnectionView(this);
	inputView.addConnectionView(this);

	var self = this;
	$(this.line).click(function() {
		selectConnection(self.connection);
		defocusFocusedBlock();
		return false;
	})

	connection.selectEvent.attach(function() {
		self.line.setAttribute('class', 'connection selected');
	})
	connection.deselectEvent.attach(function() {
		self.line.setAttribute('class', 'connection');
	})

	// Destroy view when connection is destroyed
	connection.attachOnDestroy(bind(this, this.destroy))
}
extend(BlockViewerConnectionView.prototype, {
	moveOutputTo: function(x, y) {
		this.line.setAttribute('x1', x);
		this.line.setAttribute('y1', y);
	},
	moveInputTo: function(x, y) {
		this.line.setAttribute('x2', x);
		this.line.setAttribute('y2', y);
	},
	destroy: function() {
		this.destroyEvent.send();
		this.blockViewer.svg.removeChild(this.line);
	},
	attachOnDestroy: function(callback) {
		this.destroyEvent.attach(callback);
	}
})

function BlockViewerDanglingConnectionView(blockViewer) {
	this.line = svge('line', {'class': 'dangling_connection'});
	this.blockViewer = blockViewer;
	blockViewer.svg.appendChild(this.line);
}
extend(BlockViewerDanglingConnectionView.prototype, {
	moveOutputTo: function(x, y) {
		this.line.setAttribute('x1', x);
		this.line.setAttribute('y1', y);
	},
	moveInputTo: function(x, y) {
		this.line.setAttribute('x2', x);
		this.line.setAttribute('y2', y);
	},
	destroy: function() {
		this.blockViewer.svg.removeChild(this.line);
	}
})

function BlockViewer(htmlId, metablock) {
	this.dom = document.getElementById(htmlId);
	this.svg = $('svg', this.dom).get(0); /* can't select by class name :-( */
	this.blockTypesPalette = $('.block_types_palette', this.dom);
	this.blockViewsById = {};
	this.inputViewsById = {};
	this.outputViewsById = {};
	this.metablock = metablock;
	var self = this;
	$(this.svg).mousedown(function(e) {
		defocusFocusedBlock();
		if (!e.metaKey) {
			selectConnection(null);
			selectedBlocks.each(function(block) {deselectBlock(block);})
		}
	});
	metablock.attachOnAddBlock(function(block) {
		self.blockViewsById[block.id] = new BlockViewerBlockView(block, self);
	});
	metablock.attachOnConnect(function(connection) {
		new BlockViewerConnectionView(connection, self);
	});
	blockTypes.attachOnRegister(function(blockType) {
		var option = e('option', {}, blockType.name);
		self.blockTypesPalette.append(option);
		$(option).click(function() {
			var block = new blockType.blockConstructor({name: blockType.name, viewPosition: {x: 0, y: 0}})
			metablock.addBlock(block);
			focusBlock(block);
			self.blockTypesPalette.get(0).selectedIndex = 0;
		});
	});
	
	this.dragMode = null;
	this.danglingConnectionView = null;
}
