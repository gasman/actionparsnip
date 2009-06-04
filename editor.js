var globalEvents = new EventQueue();
var loadEvent = new Event();
var loaded = false;

var globalTimeControl = {source: {
	startEvent: new Event(),
	pauseEvent: new Event(),
	stopEvent: new Event()
}};

var projectBlock;
function load(block) {
	var startEvent = new Event();
	projectBlock = block;
	block.inputs.timeControl.connect(globalTimeControl);
	onBrowserLoad(function() {
		new BlockViewer('block_viewer', block);
	});
}
window.onload = function() {
	loaded = true;
	loadEvent.send();
}
function onBrowserLoad(callback) {
	if (loaded) {
		callback();
	} else {
		loadEvent.attach(callback);
	}
}

var focusedBlock = null;
function focusBlock(block) {
	if (block == focusedBlock) return;
	if (focusedBlock != null) defocusFocusedBlock();

	focusedBlock = block;
	block.focus();
	/* deselect this block when it's destroyed */
	focusedBlock.attachOnDestroy(defocusFocusedBlock);
}

function defocusFocusedBlock() {
	if (focusedBlock == null) return;
	focusedBlock.defocus();
	/* no need to call deselect on destroy */
	focusedBlock.detachOnDestroy(defocusFocusedBlock);
	focusedBlock = null;
}

var selectedConnection = null;
function selectConnection(connection) {
	if (connection == selectedConnection) return;
	if (selectedConnection != null) selectedConnection.deselectEvent.send();
	selectedConnection = connection;
	if (connection != null) connection.selectEvent.send();
}

/* connect up toolbar */
onBrowserLoad(function() {
	$('ul.toolbar > li.play').click(globalTimeControl.source.startEvent.relay);
	$('ul.toolbar > li.pause').click(globalTimeControl.source.pauseEvent.relay);
	$('ul.toolbar > li.stop').click(globalTimeControl.source.stopEvent.relay);

	$('ul.toolbar > li.export').click(function() {
		if (projectBlock) console.log("load(" + projectBlock.export() + ")");
	});
})

$(window).keypress(function(e) {
	if (e.metaKey && e.which == 8) { // cmd + delete
		if (selectedConnection) {
			selectedConnection.destroy();
			selectedConnection = null;
			return false;
		} else if (selectedBlock) {
			selectedBlock.destroy();
			selectedBlock = null;
			return false;
		}
	}
})
