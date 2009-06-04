function ProxyInputConnection(proxyInputSocket, innerConnection) {
	this.destroyEvent = new Event();
	/* for editor */
	this.selectEvent = new Event();
	this.deselectEvent = new Event();
	/* end editor */
	this.input = proxyInputSocket;
	this.output = innerConnection.output;
	this.innerConnection = innerConnection;
	
	/* if inner connection gets destroyed, destroy self too */
	this.onInnerConnectionDestroy = bind(this, this.destroy);
	innerConnection.attachOnDestroy(this.onInnerConnectionDestroy);
}
extend(ProxyInputConnection.prototype, {
	attachOnDestroy: function(callback) {this.destroyEvent.attach(callback);},
	detachOnDestroy: function(callback) {this.destroyEvent.detach(callback);},
	destroy: function() {
		/* stop listening to inner connection's destroy event (avoids an infinite loop...) */
		this.innerConnection.detachOnDestroy(this.onInnerConnectionDestroy);

		this.destroyEvent.send();
		/* then destroy inner connection */
		this.innerConnection.destroy();
		/* and remove from ProxyInputSocket's list */
		this.input.connections.remove(this);
	}
})

function ProxyInputSocket(name, innerSocket) {
	this.name = name;
	this.id = uniqueId();
	this.innerSocket = innerSocket;
	this.connections = new Set();
	this.destroyEvent = new Event();

	/* if inner socket gets destroyed, destroy self too */
	this.onInnerSocketDestroy = bind(this, this.destroy);
	innerSocket.attachOnDestroy(this.onInnerSocketDestroy);
}
extend(ProxyInputSocket.prototype, {
	connect: function(output) {
		var innerConnection = this.innerSocket.connect(output);
		/* note that this will add the inner connection to output.connections, rather than the outer connection
		that we want to pretend is connected. But that's probably OK, as I don't think we're going to use
		output.connections for any sort of introspection; only for disconnecting them on destroying the output */
		var outerConnection = new ProxyInputConnection(this, innerConnection);
		this.connections.add(outerConnection);
		return outerConnection;
	},
	destroy: function() {
		/* destroy all remaining connections */
		this.connections.each(function(connection) {connection.destroy();});
		/* inner connection might live on; if so, don't fire my callback when it dies */
		this.innerSocket.detachOnDestroy(this.onInnerSocketDestroy);
		this.destroyEvent.send();
	},
	attachOnDestroy: function(callback) {this.destroyEvent.attach(callback);},
	detachOnDestroy: function(callback) {this.destroyEvent.detach(callback);},
	canConnect: function(output) {
		return output.type.doesSatisfy(this.innerSocket.type);
	}
});

function MetaBlock(opts, constructor) {
	Block.call(this, {}, opts);
	/* For introspection */
	this.blocks = new Set();
	this.addBlockEvent = new Event();
	this.connections = new Set();
	this.connectEvent = new Event();
	/* End introspection */
	constructor.call(this);
}
/* For introspection */
extend(MetaBlock.prototype, Block.prototype, {
	addBlock: function(block) {
		this.blocks.add(block);
		this.addBlockEvent.send(block);

		var self = this;
		block.attachOnDestroy(function() {
			self.blocks.remove(block);
		});

		return block;
	},
	attachOnAddBlock: function(callback) {
		this.addBlockEvent.attach(callback);
		this.blocks.each(callback);
	},
	connect: function(output, input) {
		var connection = input.connect(output);
		this.connections.add(connection);
		
		var self = this;
		connection.attachOnDestroy(function() {
			self.connections.remove(connection);
		});
		
		this.connectEvent.send(connection);
	},
	attachOnConnect: function(callback) {
		this.connectEvent.attach(callback);
		this.connections.each(callback);
	},
	exposeInput: function(name, input) {
		this.defineInput(new ProxyInputSocket(name, input));
	},
	exposeOutput: function(name, output) {
		/* FIXME: needs some attention to use of output vs block (ideally, should mirror exposeInput) */
		this.defineOutput(name, output.source);
	},
	exportArguments: function() {
		return [this.exportParamsArgument(), this.exportConstructorArgument()];
	},
	exportConstructorArgument: function() {
		var sourceCode = "function() {\n";
		this.blocks.each(function(block) {
			sourceCode += "\tvar block" + block.id + " = this.addBlock(" + block.export() + ");\n";
		});
		this.connections.each(function(connection) {
			var outputName = "block" + connection.output.block.id + ".outputs." + connection.output.name;
			var inputName = "block" + connection.input.block.id + ".inputs." + connection.input.name;
			sourceCode += "\tthis.connect(" + outputName + "," + inputName + ");\n";
		})
		this.inputSet.each(function(inputSocket) {
			innerSocketName = "block" + inputSocket.innerSocket.block.id + ".inputs." + inputSocket.innerSocket.name;
			sourceCode += "\tthis.exposeInput(" + $.json.encode(inputSocket.name) + "," + innerSocketName + ");\n";
		})
		sourceCode += "}";
		return sourceCode;
	}
})
/* End introspection */
