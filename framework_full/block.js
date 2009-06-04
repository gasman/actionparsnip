/* for introspection */
var nextId = 0;
function uniqueId() {
	return nextId++;
}
/* end introspection */

function Parameter(opts, value) {
	this.opts = opts;
	this.name = opts.name;
	this.type = opts.type;
	this.value = value;
	this.visible = opts.visible;
	if (this.visible == null) this.visible = true;
	this.changeEvent = new Event();
}
extend(Parameter.prototype, {
	change: function(value) {
		this.value = value;
		this.changeEvent.send(value);
	},
	attachOnChange: function(callback) {
		this.changeEvent.attach(callback);
	},
	detachOnChange: function(callback) {
		this.changeEvent.detach(callback);
	},
	export: function() {
		return $.json.encode(this.value);
	},
	equals: function(otherValue) {
		return this.value == otherValue;
	}
})

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
			if (param.equals(this.defaults[parameterName])) continue;
			var exportedValue = param.export();
			if (exportedValue != null) {
				paramDeclarations.push('\'' + parameterName + '\':' + exportedValue);
			}
		}
		return '{' + paramDeclarations.join(',') + '}';
	},
	focus: function() {
		for (var parameterName in this.parameters) {
			this.parameters[parameterName].show();
		}
		this.focusEvent.send();
	},
	defocus: function() {
		for (var parameterName in this.parameters) {
			this.parameters[parameterName].hide();
		}
		this.defocusEvent.send();
	}
});
/* end introspection */
