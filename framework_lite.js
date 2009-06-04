/* block_types.js */
function registerBlockType(name, blockConstructor) {}

/* socket_types.js */
var SourceTypes = {};

/* for introspection */
var nextId = 0;
function uniqueId() {
	return nextId++;
}
/* end introspection */

function Block(defaults, opts) {
	this.initialValues = extend({}, defaults, opts);
	this.inputs = {};
	this.outputs = {};
	this.parameters = {};
}
extend(Block.prototype, {
	defineInput: function(inputSocket) {
		this.inputs[inputSocket.name] = inputSocket;
	},
	defineOutput: function(outputSocket) {
		this.outputs[outputSocket.name] = outputSocket;
	},
	defineParameter: function(opts) {
		this.parameters[opts.name] = new Parameter(opts, this.initialValues[opts.name]);
	}
});

function SingleInputSocket(opts) {
	var self = this;
	this.name = opts.name;
	this.source = opts.defaultSource;
	this.connect = function(output) {
		self.source = output.source;
		for (var eventName in opts.events) {
			output.source[eventName].attach(opts.events[eventName]);
		}
		if (opts.onChangeState) opts.onChangeState();
	};
}

function MultipleInputSocket(opts) {
	var self = this;
	this.name = opts.name;
	this.sources = new Set();
	this.connect = function(output) {
		self.sources.add(output.source);
		for (var eventName in opts.events) {
			output.source[eventName].attach(opts.events[eventName]);
		}
		if (opts.onChangeState) opts.onChangeState();
	};
}

function ProxyInputSocket(name, innerSocket) {
	this.name = name;
	this.connect = function(output) {innerSocket.connect(output)};
}

function OutputSocket(opts) {
	this.name = opts.name;
	this.source = opts.source;
}

function Parameter(opts, value) {
	this.name = opts.name;
	this.value = value;
}
extend(Parameter.prototype, {
	attachOnChange: function(callback) {},
	detachOnChange: function(callback) {}
})

function MetaBlock(opts, constructor) {
	Block.call(this, {}, opts);
	constructor.call(this);
}
extend(MetaBlock.prototype, Block.prototype, {
	addBlock: function(block) {
		return block;
	},
	exposeInput: function(name, input) {
		this.defineInput(new ProxyInputSocket(name, input));
	},
	exposeOutput: function(name, source) {
		this.defineOutput(name, source);
	},
	/* make an internal connection between blocks */
	connect: function(output, input) {
		input.connect(output);
	}
});
