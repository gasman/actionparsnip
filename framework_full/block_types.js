/* Without introspection:
function registerBlockType(name, blockConstructor) {}
*/

function BlockTypeRegistry() {
	this.blockTypes = new Set();
	this.registerEvent = new Event();
}
extend(BlockTypeRegistry.prototype, {
	register: function(name, blockConstructor) {
		var blockType = {name: name, blockConstructor: blockConstructor};
		this.blockTypes.add(blockType);
		this.registerEvent.send(blockType);
	},
	attachOnRegister: function(callback) {
		this.registerEvent.attach(callback);
		this.blockTypes.each(callback);
	}
})

blockTypes = new BlockTypeRegistry();

function registerBlockType(name, blockConstructor) {
	blockTypes.register(name, blockConstructor);
}
