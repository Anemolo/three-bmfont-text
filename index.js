var createLayout = require("layout-bmfont-text");
var inherits = require("inherits");
var createIndices = require("quad-indices");

var vertices = require("./lib/vertices");
var utils = require("./lib/utils");
const { BufferGeometry } = require("three");


module.exports = function createTextGeometry(opt) {
	return new TextGeometry2(opt);
};

class TextGeometry2 extends BufferGeometry {
	constructor(opt){
		super();
		if (typeof opt === "string") {
			opt = { text: opt };
		}
	
		// use these as default values for any subsequent
		// calls to update()
		this._opt = Object.assign({ widthSegments: 1, heightSegments: 1}, opt);
	
		// also do an initial setup...
		if (opt) this.update(opt);

	}
	update(opt){
		if (typeof opt === "string") {
			opt = { text: opt };
		}
	
		// use constructor defaults
		opt = Object.assign({}, this._opt, opt);
	
		if (!opt.font) {
			throw new TypeError("must specify a { font } in options");
		}
		this.layout = createLayout(opt);
	
		// get vec2 texcoords
		var flipY = opt.flipY !== false;
	
		// the desired BMFont data
		var font = opt.font;
	
		// determine texture size from font file
		var texWidth = font.common.scaleW;
		var texHeight = font.common.scaleH;
	
		// get visible glyphs
		var glyphs = this.layout.glyphs.filter(function (glyph) {
			var bitmap = glyph.data;
			return bitmap.width * bitmap.height > 0;
		});
	
		let lastIndex = 0;
		let wordCount = -1;
		glyphs.forEach((glyph, i) =>{
			if(lastIndex != glyph.index -1){
				// new word
				wordCount++;
			}
			
			lastIndex = glyph.index;
	
			glyph.wordIndex = wordCount;
	
			glyph.index = i;
		})
		
		this.layout.glyphs = glyphs;
		this.layout._wordsTotal = wordCount;
		// Mark words
		// glyphs
	
		// provide visible glyphs for convenience
		this.visibleGlyphs = glyphs;
	
		// get common vertex data
		var attributes = vertices.getAttributes(this.layout, {
			texWidth,
			texHeight,
			flipY,
			...opt,
		});
	
		let glyph = glyphs[0];
		let bitmap = glyph.data;
		this.extendUniforms = new THREE.Uniform(
			new THREE.Vector4(
				bitmap.x / texWidth,
				1 - (bitmap.y + bitmap.height) / texHeight,
				(bitmap.x + bitmap.width) / texWidth,
				1 - bitmap.y / texHeight
			)
	
			//minx,
			// minY,
			// maxX,
			//maxY
		);
	
	
		// var positions = vertices.positions(glyphs, opt);
		// var uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY, opt);
		var uvs = attributes.uvs;
		var positions = attributes.positions;
		var layoutUVs = attributes.layoutUVs;
		var indices = vertices.indices({
			clockwise: true,
			widthSegments: opt.widthSegments,
			heightSegments: opt.heightSegments,
			type: "uint16",
			count: glyphs.length,
			...opt,
		});
	
		// update vertex data
		this.setIndex(indices);
		this.setAttribute("position", new THREE.BufferAttribute(positions, 2));
		this.setAttribute("layoutUV", new THREE.BufferAttribute(layoutUVs, 3));
		this.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
		// update multipage data
		if (!opt.multipage && "page" in this.attributes) {
			// disable multipage rendering
			this.removeAttribute("page");
		} else if (opt.multipage) {
			// enable multipage rendering
			var pages = vertices.pages(glyphs);
			this.setAttribute("page", new THREE.BufferAttribute(pages, 1));
		}
	}

	computeBoundingSphere() {
		if (this.boundingSphere === null) {
			this.boundingSphere = new THREE.Sphere();
		}
	
		var positions = this.attributes.position.array;
		var itemSize = this.attributes.position.itemSize;
		if (!positions || !itemSize || positions.length < 2) {
			this.boundingSphere.radius = 0;
			this.boundingSphere.center.set(0, 0, 0);
			return;
		}
		utils.computeSphere(positions, this.boundingSphere);
		if (isNaN(this.boundingSphere.radius)) {
			console.error(
				"THREE.BufferGeometry.computeBoundingSphere(): " +
					"Computed radius is NaN. The " +
					'"position" attribute is likely to have NaN values.'
			);
		}
	};
	
	computeBoundingBox() {
		if (this.boundingBox === null) {
			this.boundingBox = new THREE.Box3();
		}
	
		var bbox = this.boundingBox;
		var positions = this.attributes.position.array;
		var itemSize = this.attributes.position.itemSize;
		if (!positions || !itemSize || positions.length < 2) {
			bbox.makeEmpty();
			return;
		}
		utils.computeBox(positions, bbox);
	};

}
