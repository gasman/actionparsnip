function SingleInputSocket(opts) {
	var socket = this;
	this.id = uniqueId();
	this.name = opts.name;
	if (opts.fallbackParameter) {
		this.fallbackParameter = opts.fallbackParameter;
	} else if (opts.fallbackSource) {
		this.fallbackParameter = new SourceParameter({source: opts.fallbackSource});
	} else {
		this.fallbackParameter = new ConstantParameter({value: opts.default});
	}
	this.type = opts.type;
	this.destroyEvent = new Event();
	
	function connectSource(source) {
		socket.source = source;
		for (var eventName in opts.events) {
			source[eventName].attach(opts.events[eventName]);
		}
	}
	
	function connectFallbackParameter() {
		connectSource(socket.fallbackParameter.source);
		socket.fallbackParameter.enable();
	}
	
	connectFallbackParameter();
	
	function disconnectSource(source) {
		for (var eventName in opts.events) {
			source[eventName].detach(opts.events[eventName]);
		}
	}
	
	this.connect = function(output) {
		connectSource(output.source);
		if (opts.onChangeState) opts.onChangeState();

		this.connection = {
			input: this,
			output: output,
			destroyEvent: new Event(),
			/* for editor */
			selectEvent: new Event(),
			deselectEvent: new Event(),
			/* end editor */
			attachOnDestroy: function(callback) {this.destroyEvent.attach(callback);},
			detachOnDestroy: function(callback) {this.destroyEvent.detach(callback);},
			destroy: function() {
				this.destroyEvent.send();
				disconnectSource(output.source);
				connectFallbackParameter();
				socket.connection = null;
				if (output.connections) output.connections.remove(this); // FIXME: can this be made unconditional?
				if (opts.onChangeState) opts.onChangeState();
			}
		}
		if (output.connections) output.connections.add(this.connection); // FIXME: can this be made unconditional?

		socket.fallbackParameter.disable();

		return this.connection;
	};
	
	this.canConnect = function(output) {
		/* can connect if socket type matches and nothing's already connected */
		return this.connection == null && output.type.doesSatisfy(this.type);
	}
}
extend(SingleInputSocket.prototype, {
	destroy: function() {
		if (this.connection) this.connection.destroy();
		this.destroyEvent.send();
	},
	attachOnDestroy: function(callback) {
		this.destroyEvent.attach(callback);
	},
	detachOnDestroy: function(callback) {
		this.destroyEvent.detach(callback);
	}
});

function MultipleInputSocket(opts) {
	var socket = this;
	this.id = uniqueId();
	this.name = opts.name;
	this.type = opts.type;
	this.sources = new Set();
	this.connections = new Set();

	this.connect = function(output) {
		socket.sources.add(output.source);
		for (var eventName in opts.events) {
			output.source[eventName].attach(opts.events[eventName]);
		}
		if (opts.onChangeState) opts.onChangeState();

		var connection = {
			input: this,
			output: output,
			destroyEvent: new Event(),
			/* for editor */
			selectEvent: new Event(),
			deselectEvent: new Event(),
			/* end editor */
			attachOnDestroy: function(callback) {this.destroyEvent.attach(callback);},
			detachOnDestroy: function(callback) {this.destroyEvent.detach(callback);},
			destroy: function() {
				this.destroyEvent.send();
				for (var eventName in opts.events) {
					output.source[eventName].detach(opts.events[eventName]);
				}
				socket.sources.remove(output.source);
				socket.connections.remove(this);
				if (output.connections) output.connections.remove(this);
				if (opts.onChangeState) opts.onChangeState();
			}
		}
		this.connections.add(connection);
		if (output.connections) output.connections.add(connection);

		return connection;

	};
	this.destroyEvent = new Event();

	this.canConnect = function(output) {
		return output.type.doesSatisfy(this.type);
	}
}
extend(MultipleInputSocket.prototype, {
	destroy: function() {
		this.connections.each(function(connection) {connection.destroy()});
		this.destroyEvent.send();
	},
	attachOnDestroy: function(callback) {
		this.destroyEvent.attach(callback);
	},
	detachOnDestroy: function(callback) {
		this.destroyEvent.detach(callback);
	}
});
