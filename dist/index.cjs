"use strict";
var createLayout = require("layout-bmfont-text");
require("inherits");
require("quad-indices");
var vertices = require("./lib/vertices");
var utils = require("./lib/utils");
const { BufferGeometry, Uniform, BufferAttribute, Sphere, Box3, Vector4 } = require("three");
module.exports = function createTextGeometry(opt) {
  return new TextGeometry2(opt);
};
class TextGeometry2 extends BufferGeometry {
  constructor(opt) {
    super();
    if (typeof opt === "string") {
      opt = { text: opt };
    }
    this._opt = Object.assign({ widthSegments: 1, heightSegments: 1 }, opt);
    if (opt)
      this.update(opt);
  }
  update(opt) {
    if (typeof opt === "string") {
      opt = { text: opt };
    }
    opt = Object.assign({}, this._opt, opt);
    if (!opt.font) {
      throw new TypeError("must specify a { font } in options");
    }
    this.layout = createLayout(opt);
    var flipY = opt.flipY !== false;
    var font = opt.font;
    var texWidth = font.common.scaleW;
    var texHeight = font.common.scaleH;
    var glyphs = this.layout.glyphs.filter(function(glyph2) {
      var bitmap2 = glyph2.data;
      return bitmap2.width * bitmap2.height > 0;
    });
    let lastIndex = 0;
    let wordCount = -1;
    glyphs.forEach((glyph2, i) => {
      if (lastIndex != glyph2.index - 1) {
        wordCount++;
      }
      lastIndex = glyph2.index;
      glyph2.wordIndex = wordCount;
      glyph2.index = i;
    });
    this.layout.glyphs = glyphs;
    this.layout._wordsTotal = wordCount;
    this.visibleGlyphs = glyphs;
    var attributes = vertices.getAttributes(this.layout, {
      texWidth,
      texHeight,
      flipY,
      ...opt
    });
    let glyph = glyphs[0];
    let bitmap = glyph.data;
    this.extendUniforms = new Uniform(
      new Vector4(
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
    var uvs = attributes.uvs;
    var positions = attributes.positions;
    var layoutUVs = attributes.layoutUVs;
    var indices = vertices.indices({
      clockwise: true,
      widthSegments: opt.widthSegments,
      heightSegments: opt.heightSegments,
      type: "uint16",
      count: glyphs.length,
      ...opt
    });
    this.setIndex(indices);
    this.setAttribute("position", new BufferAttribute(positions, 2));
    this.setAttribute("layoutUV", new BufferAttribute(layoutUVs, 3));
    this.setAttribute("uv", new BufferAttribute(uvs, 2));
    if (!opt.multipage && "page" in this.attributes) {
      this.removeAttribute("page");
    } else if (opt.multipage) {
      var pages = vertices.pages(glyphs);
      this.setAttribute("page", new BufferAttribute(pages, 1));
    }
  }
  computeBoundingSphere() {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
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
        'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.'
      );
    }
  }
  computeBoundingBox() {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }
    var bbox = this.boundingBox;
    var positions = this.attributes.position.array;
    var itemSize = this.attributes.position.itemSize;
    if (!positions || !itemSize || positions.length < 2) {
      bbox.makeEmpty();
      return;
    }
    utils.computeBox(positions, bbox);
  }
}
