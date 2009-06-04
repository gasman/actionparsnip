var globalEvents = new EventQueue();
var loadEvent = new Event();
var loaded = false;

function load(block) {
	var startEvent = new Event();
	block.inputs.timeControl.connect({
		source: {
			startEvent: startEvent,
			pauseEvent: flyingPigEvent,
			stopEvent: flyingPigEvent
		}
	});
	onBrowserLoad(function() {startEvent.send()});
}
window.onload = function() {
	loadEvent.send();
}
function onBrowserLoad(callback) {
	if (loaded) {
		callback();
	} else {
		loadEvent.attach(callback);
	}
}

