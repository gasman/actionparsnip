/* for introspection */
var nextId = 0;
function uniqueId() {
	return nextId++;
}
/* end introspection */

function Block(defaults, opts) {
	this.defaults = defaults;
	this.initialValues = extend({viewPosition: {x:0,y:0}}, defaults, opts);
	this.inputs = {};
	this.outputs = {};
	/* for introspection */
	this.id = uniqueId();
	this.inputSet = new Set();
	this.outputSet = new Set();
	this.defineInputEvent = new Event();
	this.defineOutputEvent = new Event();
	this.destroyEvent = new Event();
	this.focusEvent = new Event();
	this.defocusEvent = new Event();
	this.selectEvent = new Event();
	this.deselectEvent = new Event();
	/* end introspection */
	
	this.parameterNames = [];
	this.parameters = {};
	this.defineParameter('name', InputBoxParameter, {value: 'unnamed...?'});
	this.defineParameter('viewPosition', VariableParameter, {value: {x:0, y:0}});
}
/* For introspection */

function OutputSocket(opts) {
	this.name = opts.name;
	this.source = opts.source;
	this.type = opts.type;
	this.destroyEvent = new Event();
	this.id = uniqueId();
	this.connections = new Set();
	this.isFocused = false;
	this.isSelected = false;
}
extend(OutputSocket.prototype, {
	destroy: function() {
		this.connections.each(function(connection) {connection.destroy();});
		this.destroyEvent.send();
	},
	attachOnDestroy: function(callback) {
		this.destroyEvent.attach(callback);
	},
	detachOnDestroy: function(callback) {
		this.destroyEvent.detach(callback);
	}
})

extend(Block.prototype, {
	defineInput: function(inputSocket) {
		this.inputs[inputSocket.name] = inputSocket;
		this.inputSet.add(inputSocket);
		this.defineInputEvent.send(inputSocket);
		inputSocket.block = this; /* used for establishing a canonical name when exporting */
	},
	attachOnDefineInput: function(callback) {
		this.defineInputEvent.attach(callback);
		this.inputSet.each(callback);
	},
	defineOutput: function(outputSocket) {
		this.outputs[outputSocket.name] = outputSocket;
		this.outputSet.add(outputSocket);
		this.defineOutputEvent.send(outputSocket);
		outputSocket.block = this; /* used for establishing a canonical name when exporting */
	},
	attachOnDefineOutput: function(callback) {
		this.defineOutputEvent.attach(callback);
		this.outputSet.each(callback);
	},
	destroy: function() {
		if (this.isFocused) defocusFocusedBlock();
		if (this.isSelected) deselectBlock(this);
		this.inputSet.each(function(input) {input.destroy()});
		this.outputSet.each(function(output) {output.destroy()});
		this.destroyEvent.send(this);
	},
	attachOnDestroy: function(callback) {
		this.destroyEvent.attach(callback);
	},
	detachOnDestroy: function(callback) {
		this.destroyEvent.detach(callback);
	},
	defineParameter: function(name, paramConstructor, opts) {
		parameter = new paramConstructor(opts, this.initialValues[name]);
		parameter.name = name;
		this.parameters[name] = parameter;
		this.parameterNames.push(name);
	},
	export: function() {
		return "new " + this.constructor.name + '(' + this.exportArguments().join(',') + ')';
	},
	exportArguments: function() {
		return [this.exportParamsArgument()];
	},
	exportParamsArgument: function() {
		var paramDeclarations = [];
		for (var parameterName in this.parameters) {
			var param = this.parameters[parameterName];
			var exportedValue = param.export();
			if (exportedValue != null && exportedValue != this.defaults[parameterName]) {
				paramDeclarations.push('\'' + parameterName + '\':' + $.json.encode(exportedValue));
			}
		}
		return '{' + paramDeclarations.join(',') + '}';
	},
	/* The focus/defocus/select/deselect mechanisms are handled in editor.js. The functions there
	update global state, and they should be the entry points for when you want to actually focus things, not these. */
	doFocusActions: function() {
		this.isFocused = true;
		for (var parameterName in this.parameters) {
			this.parameters[parameterName].show();
		}
		this.focusEvent.send();
	},
	doDefocusActions: function() {
		this.isFocused = false;
		for (var parameterName in this.parameters) {
			this.parameters[parameterName].hide();
		}
		this.defocusEvent.send();
	},
	doSelectActions: function() {
		this.isSelected = true;
		this.selectEvent.send();
	},
	doDeselectActions: function() {
		this.isSelected = false;
		this.deselectEvent.send();
	}
});
/* end introspection */
