Vectors = {
	normalise: function(v) {
		var mod = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
		return [v[0] / mod, v[1] / mod, v[2] / mod];
	},
	dotProduct: function(a, b) {
		return (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
	},
	crossProduct: function(a, b) {
		return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
	},
	isFrontFacing: function(sv0, sv1, sv2) {
		/* takes three sets of screen coordinates. Must be in anticlockwise order to return true */
		return ((sv1[0] - sv0[0]) * (sv2[1] - sv0[1]) - (sv2[0] - sv0[0]) * (sv1[1] - sv0[1]) < 0);
	},
	transformVector: function(v, m) {
		return [
			v[0]*m[0] + v[1]*m[1] + v[2]*m[2] + m[3],
			v[0]*m[4] + v[1]*m[5] + v[2]*m[6] + m[7],
			v[0]*m[8] + v[1]*m[9] + v[2]*m[10] + m[11]
		];
	},
	transformNormal: function(v, m) {
		return [
			v[0]*m[0] + v[1]*m[1] + v[2]*m[2],
			v[0]*m[4] + v[1]*m[5] + v[2]*m[6],
			v[0]*m[8] + v[1]*m[9] + v[2]*m[10]
		];
	},
	matrixMultiply: function(m, n) {
		return [
			m[0]*n[0]+m[1]*n[4]+m[2]*n[8], m[0]*n[1]+m[1]*n[5]+m[2]*n[9], m[0]*n[2]+m[1]*n[6]+m[2]*n[10], m[0]*n[3]+m[1]*n[7]+m[2]*n[11]+m[3],
			 m[4]*n[0]+m[5]*n[4]+m[6]*n[8], m[4]*n[1]+m[5]*n[5]+m[6]*n[9], m[4]*n[2]+m[5]*n[6]+m[6]*n[10], m[4]*n[3]+m[5]*n[7]+m[6]*n[11]+m[7],
			 m[8]*n[0]+m[9]*n[4]+m[10]*n[8], m[8]*n[1]+m[9]*n[5]+m[10]*n[9], m[8]*n[1]+m[9]*n[6]+m[10]*n[10], m[8]*n[3]+m[9]*n[7]+m[10]*n[11]+m[11]
		];
	}
};

function CameraBlock(opts) {
	Block.call(this, {}, opts);
	this.changeEvent = new Event();

	var self = this;
	
	this.position = [0,0,-2];
	this.target = [0,0,0];
	this.up = [0,1,0];
	
	this.hasProjected = false;

	this.defineInput(new MultipleInputSocket({
		name: 'model',
		type: SourceTypes.Model,
		events: {
			changeEvent: function() {self.hasProjected = false; self.changeEvent.send();}
		},
		onChangeState: this.changeEvent.relay
	}));

	this.defineOutput(new OutputSocket({
		name: 'drawing',
		type: SourceTypes.CanvasDrawing,
		source: {
			draw: function(canvas2d) {
				/* takes a struct of context, width and height */

				if (!self.hasProjected) self.project();
				
				/* calculate viewport params */
				var centreX = canvas2d.width / 2;
				var centreY = canvas2d.height / 2;
				var viewAngle = 1.5;
				var verticalViewAngle = viewAngle * (canvas2d.height / canvas2d.width);
				var projectionMultiplierX = (canvas2d.width / 2) / viewAngle;
				var projectionMultiplierY = (canvas2d.height / 2) / verticalViewAngle;
				
				for (var i = 0; i < self.polygons.length; i++) {
					self.polygons[i].render(canvas2d, centreX, centreY, projectionMultiplierX, projectionMultiplierY)
				}
			},
			changeEvent: self.changeEvent
		}
	}));
}
extend(CameraBlock.prototype, Block.prototype, {
	project: function() {
		/* Build camera matrix */
		var up = (this.up || [0, 1, 0]);
		var pos = this.position;
		var target = this.target;

		var z = Vectors.normalise([target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]]);
		var x = Vectors.normalise(Vectors.crossProduct(up, z));
		var y = Vectors.crossProduct(z, x);

		var cameraMatrix = [
			x[0], x[1], x[2], -Vectors.dotProduct(x, pos),
			y[0], y[1], y[2], -Vectors.dotProduct(y, pos),
			z[0], z[1], z[2], -Vectors.dotProduct(z, pos)
		];
		
		var polygons = [];
		
		this.inputs.model.sources.each(function(model) {
			var modelRendering = new ModelRendering(cameraMatrix, model);
			var modelPolygons = modelRendering.getPolygons();
			for (var i = 0; i < modelPolygons.length; i++) {
				polygons.push(modelPolygons[i]);
			}
		})

		this.polygons = polygons.sort(function(a,b) {return (b.maxZ() - a.maxZ())});
	}
});
registerBlockType('camera', CameraBlock);

function ModelRendering(cameraMatrix, model) {
	this.model = model;
	var modelTransform = model.getTransform();
	this.matrix = Vectors.matrixMultiply(cameraMatrix, model.getTransform());
	this.originalVertices = null;
	this.originalNormals = null;
	this.transformedVertices = [];
	this.transformedNormals = [];
	this.polygons = null;
}
extend(ModelRendering.prototype, {
	getVertex: function(index) {
		var v;
		if (v = this.transformedVertices[index]) {
			return v;
		} else {
			if (!this.originalVertices) this.originalVertices = this.model.getVertices();
			v = Vectors.transformVector(this.originalVertices[index], this.matrix);
			this.transformedVertices[index] = v;
			return v;
		}
	},
	getNormal: function(index) {
		var v;
		if (v = this.transformedNormals[index]) {
			return v;
		} else {
			if (!this.originalNormals) this.originalNormals = this.model.getNormals();
			v = Vectors.transformNormal(this.originalNormals[index], this.matrix);
			this.transformedNormals[index] = v;
			return v;
		}
	},
	getPolygons: function() {
		if (!this.polygons) {
			this.polygons = [];
			var faces = this.model.getFaces();
			for (var i = 0; i < faces.length; i++) {
				this.polygons[i] = new FlatShadedPolygon(this, faces[i]);
			}
		}
		return this.polygons;
	}
});

function Polygon(modelRendering, polygonInfo) {
	this.modelRendering = modelRendering;
	this.polygonInfo = polygonInfo;
	this.maxZResult = null;
}
extend(Polygon.prototype, {
	maxZ: function() {
		if (this.maxZResult == null) {
			var maxZ = -1; /* if everything is negative we'll crop the polygon anyway */
			for (var i = 0; i < this.polygonInfo.vertices.length; i++) {
				var z = this.modelRendering.getVertex(this.polygonInfo.vertices[i])[2];
				if (z > maxZ) maxZ = z;
			}
			this.maxZResult = maxZ;
		}
		return this.maxZResult;
	},
	getProjectedVertices: function(centreX, centreY, projectionMultiplierX, projectionMultiplierY) {
		var projectedVertices = [];
		for (var i = 0; i < this.polygonInfo.vertices.length; i++) {
			var vertex = this.modelRendering.getVertex(this.polygonInfo.vertices[i]);
			projectedVertices[i] = [
				centreX + vertex[0] * projectionMultiplierX / vertex[2],
				centreY - vertex[1] * projectionMultiplierY / vertex[2]
			];
		}
		return projectedVertices;
	}
});

function FlatShadedPolygon(modelRendering, polygonInfo) {
	Polygon.call(this, modelRendering, polygonInfo);
}
extend(FlatShadedPolygon.prototype, Polygon.prototype, {
	render: function(canvas2d, centreX, centreY, projectionMultiplierX, projectionMultiplierY) {
		var projectedVertices = this.getProjectedVertices(centreX, centreY, projectionMultiplierX, projectionMultiplierY);
		canvas2d.context.beginPath();
		canvas2d.context.moveTo(projectedVertices[0][0], projectedVertices[0][1]);
		for (var i = 1; i < projectedVertices.length; i++) {
			canvas2d.context.lineTo(projectedVertices[i][0], projectedVertices[i][1]);
		}
		canvas2d.context.fillStyle = '#cccccc';
		canvas2d.context.fill();
	}
});
