load(new MetaBlock({name: 'demo'}, function() {
	var timer = this.addBlock(new TimerBlock( {name: 'timer', viewPosition:{x:200,y:10}} ));
	var lissajous = this.addBlock(new LissajousBlock( {name: 'curve', amplitude: 100, viewPosition:{x:400,y:40} } ));
	var box = this.addBlock(new BoxBlock( {name: 'box', viewPosition:{x:600,y:20}} ));
	var canvas = this.addBlock(new CanvasBlock( {name: 'canvas', viewPosition:{x:800,y:30}} ));
	
	this.connect(timer.outputs.time, lissajous.inputs.time);
	this.connect(lissajous.outputs.position, box.inputs.position);
	this.connect(box.outputs.drawing, canvas.inputs.drawing);
	
	this.exposeInput('timeControl', timer.inputs.timeControl);
}));
