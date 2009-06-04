/* Null model, to serve as the default output for e.g. transforms that don't have an input */
var nullModel = {
	getVertices: function() {return []},
	getNormals: function() {return []},
	getFaces: function() {return []},
	getTransform: function() {return identityMatrix},
	changeEvent: flyingPigEvent
};

var identityMatrix = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0
];

function BoxModelBlock(opts) {
	Block.call(this, {}, opts);
	this.changeEvent = new Event();

	var self = this;
	
	var px0 = -0.5; var py0 = -0.5; var pz0 = -0.5;
	var px1 = 0.5; var py1 = 0.5; var pz1 = 0.5;
	
	var x0 = Math.min(px0, px1); var x1 = Math.max(px0, px1);
	var y0 = Math.min(py0, py1); var y1 = Math.max(py0, py1);
	var z0 = Math.min(pz0, pz1); var z1 = Math.max(pz0, pz1);
	this.vertices = [
		[x0,y0,z0], [x1,y0,z0], [x1,y0,z1], [x0,y0,z1], 
		[x0,y1,z0], [x1,y1,z0], [x1,y1,z1], [x0,y1,z1]
	];
	this.normals = [
		[0,-1,0], [0,0,-1], [1,0,0], [0,0,1], [-1,0,0], [0,1,0]
	];
	this.faces = [
		{vertices: [0,3,2,1], normals: [0,0,0,0]},
		{vertices: [0,1,5,4], normals: [1,1,1,1]},
		{vertices: [1,2,6,5], normals: [2,2,2,2]},
		{vertices: [2,3,7,6], normals: [3,3,3,3]},
		{vertices: [3,0,4,7], normals: [4,4,4,4]},
		{vertices: [4,5,6,7], normals: [5,5,5,5]}
	];
	this.transform = identityMatrix;
	
	this.defineOutput(new OutputSocket({
		name: 'model',
		type: SourceTypes.Model,
		source: {
			getVertices: function() {return self.vertices},
			getNormals: function() {return self.normals},
			getFaces: function() {return self.faces},
			getTransform: function() {return self.transform},
			changeEvent: self.changeEvent
		}
	}));
}
extend(BoxModelBlock.prototype, Block.prototype, {
});
registerBlockType('box model', BoxModelBlock);
