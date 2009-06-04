/* Return a version of the function 'func' whose 'this' value is bound to 'obj' */
function bind(obj, func) {
	return function() {
		return func.apply(obj, arguments);
	}
}

/* write the first object argument with all the fields of the subsequent objects in turn */
function extend(target) {
	for (var i = 1; i < arguments.length; i++) {
		for (property in arguments[i]) {
			target[property] = arguments[i][property]
		}
	}
	return target;
}

/* a collection which allows adding and removing, and iterating over all members */
function Set() {
	this.members = [];
}
extend(Set.prototype, {
	add: function(obj) {
		this.members.push(obj);
	},
	remove: function(obj) {
		/* return true if obj was found and removed */
		for (var i = 0; i < this.members.length; i++) {
			if (this.members[i] == obj) {
				this.members.splice(i, 1);
				return true;
			}
		}
		return false;
	},
	each: function(callback) {
		/* create temporary list so that things don't get messed up if the callbacks remove elements */
		var tempMembers = [];
		for (var i = 0; i < this.members.length; i++) {
			tempMembers[i] = this.members[i];
		}
		for (var i = 0; i < tempMembers.length; i++) {
			callback(tempMembers[i], i);
		}
	}
})

/* an observable, repeatable event */
function Event() {
	this.listeners = new Set();
	this.relay = bind(this, this.send);
}
extend(Event.prototype, {
	attach: function(callback) {
		this.listeners.add(callback);
	},
	detach: function(callback) {
		/* NB need to make sure callback is exactly the same instance - it's no good
		calling bind when passing a listener, and again when detaching */
		this.listeners.remove(callback);
	},
	send: function() {
		var args = arguments;
		var eventId = Math.random();
		var listenerCount = this.listeners.members.length;
		this.listeners.each(function(listener) {
			listener.apply(null, args);
		})
	}
})
/* an event which never occurs. Listeners are ignored */
var flyingPigEvent = {
	attach: function() {},
	detach: function() {}
}

/* A mechanism for queueing up functions to be called in order that they were queued. A function that's already in the queue will not be added a second time. Adding an event to an empty queue will cause it to be run immediately. */
function EventQueue() {
	this.events = [];
	this.running = false;
}
extend(EventQueue.prototype, {
	add: function(event) {
		/* add to the queue if not on it already */
		for (var i = 0; i < this.events.length; i++) {
			if (this.events[i] == event) return;
		}
		this.events.push(event);
		if (!this.running) {
			this.running = true;
			setTimeout(bind(this, this.run), 0);
		}
	},
	run: function() {
		while(this.events.length) {
			this.events.shift()();
		}
		this.running = false;
	}
})
