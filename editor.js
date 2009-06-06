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
	block.doFocusActions();
}
function defocusFocusedBlock() {
	if (focusedBlock == null) return;
	focusedBlock.doDefocusActions();
	focusedBlock = null;
}

var selectedBlocks = new Set();
function selectBlock(block, deselectOthers) {
	if (deselectOthers) {
		selectedBlocks.each(function(block) {deselectBlock(block);});
	} else {
		if (selectedBlocks.contains(block)) return;
	}
	selectedBlocks.add(block);
	block.doSelectActions();
}
function deselectBlock(block) {
	if (!selectedBlocks.contains(block)) return;
	selectedBlocks.remove(block);
	block.doDeselectActions();
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
		}
		selectedBlocks.each(function(block) {
			block.destroy();
		})
		return false;
	}
})
