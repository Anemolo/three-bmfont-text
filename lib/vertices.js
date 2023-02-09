// The use of !! here is key because I don't want either undefined || null || 0
//
module.exports.pages = function pages(glyphs) {
	var pages = new Float32Array(glyphs.length * 4 * 1);
	var i = 0;
	glyphs.forEach(function (glyph) {
		var id = glyph.data.page || 0;
		pages[i++] = id;
		pages[i++] = id;
		pages[i++] = id;
		pages[i++] = id;
	});
	return pages;
};
function generateUV(glyph, uvs, i, gridX, gridY, opt) {
	let gridX1 = gridX + 1;
	let gridY1 = gridY + 1;
	var bitmap = glyph.data;

	let texWidth = opt.texWidth;
	let texHeight = opt.texHeight;
	var bw = bitmap.x + bitmap.width;
	var bh = bitmap.y + bitmap.height;

	// top left position
	// Normalize the values.

	let startX = bitmap.x / texWidth;
	let startY = bitmap.y / texHeight;


	let w = bitmap.width / texWidth;
	let h = bitmap.height / texHeight;

	const segment_width = w / gridX;
	const segment_height = h / gridY;
	// UVs for each segment
	for (let iy = 0; iy < gridY1; iy++) {
		let v = iy * segment_height + startY;
		v = 1 - v;

		for (let ix = 0; ix < gridX1; ix++) {
			const u = ix * segment_width + startX;
			if (ix == 0 && iy == 0) {
				// console.log(u, v);
			}
			uvs[i++] = u;
			uvs[i++] = v;
		}
	}
}
function generateExtendedUV(glyph, uvs, i, gridX, gridY, opt) {
	let gridX1 = gridX + 1;
	let gridY1 = gridY + 1;

	let extend = opt.extend;
	var bitmap = glyph.data;

	let texWidth = opt.texWidth;
	let texHeight = opt.texHeight;

	let right = bitmap.x + bitmap.width;
	let left = bitmap.x;
	let top = bitmap.y;
	let bottom = bitmap.y + bitmap.height;

	let extendTop = extend.top;
	let extendBottom = extend.bottom;
	if (opt.flipY) {
		top = texHeight - top;
		if (!!extend.top) {
			extendTop = -extend.top;
		}
		bottom = texHeight - bottom;
		if (!!extend.bottom) {
			extendBottom = -extend.bottom;
		}
	}

	if (!!extendTop) {
		uvs[i++] = left / texWidth;
		uvs[i++] = (top - extendTop) / texHeight;

		uvs[i++] = right / texWidth;
		uvs[i++] = (top - extendTop) / texHeight;
	}

	if (!!extend.right) {
		// make the top-left corner if the top exists
		if (!!extendTop) {
			uvs[i++] = (right + extend.right) / texWidth;
			uvs[i++] = (top - extendTop) / texHeight;
		}

		uvs[i++] = (right + extend.right) / texWidth;
		uvs[i++] = top / texHeight;

		uvs[i++] = (right + extend.right) / texWidth;
		uvs[i++] = bottom / texHeight;
	}

	if (!!extendBottom) {
		// top botom if both of them exist
		if (!!extend.right) {
			uvs[i++] = (right + extend.right) / texWidth;
			uvs[i++] = (bottom + extendBottom) / texHeight;
		}

		uvs[i++] = right / texWidth;
		uvs[i++] = (bottom + extendBottom) / texHeight;
		uvs[i++] = left / texWidth;
		uvs[i++] = (bottom + extendBottom) / texHeight;
	}

	if (!!extend.left) {
		// top botom if both of them exist
		if (!!extendBottom) {
			uvs[i++] = (left - extend.left) / texWidth;
			uvs[i++] = (bottom + extendBottom) / texHeight;
		}

		uvs[i++] = (left - extend.left) / texWidth;
		uvs[i++] = bottom / texHeight;

		uvs[i++] = (left - extend.left) / texWidth;
		uvs[i++] = top / texHeight;
		if (!!extendTop) {
			uvs[i++] = (left - extend.left) / texWidth;
			uvs[i++] = (top - extendTop) / texWidth;
		}
	}

	return i;
}
function generatePositions(glyph, positions, i, gridX, gridY) {
	let gridX1 = gridX + 1;
	let gridY1 = gridY + 1;
	var bitmap = glyph.data;

	// bottom left position
	var x = glyph.position[0] + bitmap.xoffset;
	var y = glyph.position[1] + bitmap.yoffset;

	// quad size
	var w = bitmap.width;
	var h = bitmap.height;

	const segment_width = w / gridX;
	const segment_height = h / gridY;

	for (let iy = 0; iy < gridY1; iy++) {
		const vy = iy * segment_height + y;

		for (let ix = 0; ix < gridX1; ix++) {
			const vx = ix * segment_width + x;
			positions[i++] = vx;
			positions[i++] = vy;
		}
	}
	// generate extensions
}

function generateLayoutUVs(glyph, layoutUVs, i, gridX, gridY, opt, layout){
	let gridX1 = gridX + 1;
	let gridY1 = gridY + 1;
	// console.log(glyph, opt, layout)
	let lineUV = glyph.line / (layout._linesTotal -1);
	let letterUV = glyph.index / (layout.glyphs.length -1);
	let wordUV = glyph.wordIndex / (layout._wordsTotal);
	console.log(letterUV, lineUV, wordUV)
	
	for (let iy = 0; iy < gridY1; iy++) {
		for (let ix = 0; ix < gridX1; ix++) {
			layoutUVs[i++] = letterUV;
			layoutUVs[i++] = wordUV;
			layoutUVs[i++] = lineUV;
		}
	}
}

function generateExtension(glyph, positions, i, gridX, gridY, opt) {
	//

	var bitmap = glyph.data;
	let extend = opt.extend;

	// bottom left position
	var x = glyph.position[0] + bitmap.xoffset;
	var y = glyph.position[1] + bitmap.yoffset;

	// quad size
	var w = bitmap.width;
	var h = bitmap.height;

	if (!!extend.top) {
		positions[i++] = x;
		positions[i++] = y - extend.top;

		positions[i++] = x + w;
		positions[i++] = y - extend.top;
	}

	if (!!extend.right) {
		// make the top-left corner if the top exists
		if (!!extend.top) {
			positions[i++] = x + w + extend.right;
			positions[i++] = y - extend.top;
		}

		positions[i++] = x + w + extend.right;
		positions[i++] = y;

		positions[i++] = x + w + extend.right;
		positions[i++] = y + h;
	}

	if (!!extend.bottom) {
		// top botom if both of them exist
		if (!!extend.right) {
			positions[i++] = x + w + extend.right;
			positions[i++] = y + h + extend.bottom;
		}

		positions[i++] = x + w;
		positions[i++] = y + h + extend.bottom;
		positions[i++] = x;
		positions[i++] = y + h + extend.bottom;
	}

	if (!!extend.left) {
		// top botom if both of them exist
		if (!!extend.bottom) {
			positions[i++] = x - extend.left;
			positions[i++] = y + h + extend.bottom;
		}

		positions[i++] = x - extend.left;
		positions[i++] = y + h;
		positions[i++] = x - extend.left;
		positions[i++] = y;

		if (!!extend.top) {
			positions[i++] = x - extend.left;
			positions[i++] = y - extend.top;
		}
	}

	return i;
}

function getExtendedVerticesCount(top = 0, right = 0, bottom = 0, left = 0) {
	top = !!top;
	right = !!right;
	bottom = !!bottom;
	left = !!left;
	return (
		(top + right + bottom + left) * 2 +
		top * right +
		right * bottom +
		bottom * left +
		left * top
	);
}
module.exports.getAttributes = function getAttributes(layout, opt) {
	const glyphs = layout.glyphs;
	const gridX = Math.floor(opt.widthSegments);
	const gridY = Math.floor(opt.heightSegments);

	const gridX1 = gridX + 1;
	const gridY1 = gridY + 1;
	// top + left = 5
	// top + bottom = 4
	// (top + left + right + bottom) * 2

	let nExtendedVertices = 0;

	if (opt.extend) {
		nExtendedVertices = getExtendedVerticesCount(
			opt.extend.top,
			opt.extend.right,
			opt.extend.bottom,
			opt.extend.left
		);
	}

	var uvs = new Float32Array(
		glyphs.length * 2 * (gridX1 * gridY1 + nExtendedVertices)
	);
	var positions = new Float32Array(
		glyphs.length * 2 * (gridX1 * gridY1 + nExtendedVertices)
	);

	let layoutUVs = null;
	// let 
	opt.createLayoutUVs = true;
	if(opt.createLayoutUVs){
		// vec3(letterUV, wordUV, lineUV)
		layoutUVs = new Float32Array(
			glyphs.length * 3 * (gridX1 * gridY1 + nExtendedVertices)
		);
	}
	// var positions = new Float32Array(
	// 	glyphs.length * 2 * (gridX1 * gridY1 + nExtendedVertices)
	// );

	let uvOpt = { gridX, gridY };
	let uvI = 0;
	let posI = 0;
	let layoutUVI = 0;

	for (let i = 0; i < glyphs.length; i++) {
		let glyph = glyphs[i];
		generateUV(glyph, uvs, uvI, gridX, gridY, opt);
		generatePositions(glyph, positions, posI, gridX, gridY);

		
		if(opt.createLayoutUVs){
			generateLayoutUVs(glyph, layoutUVs, layoutUVI, gridX, gridY, opt, layout);

			layoutUVI += 3 * gridX1 * gridY1;
		}

		uvI += 2 * gridX1 * gridY1;
		posI += 2 * gridX1 * gridY1;
		if (opt.extend != null) {
			posI = generateExtension(glyph, positions, posI, gridX, gridY, opt);
			uvI = generateExtendedUV(glyph, uvs, uvI, gridX, gridY, opt);
		}
	}

	return { uvs, positions, layoutUVs };
};

// tried to adapt the code from PlaneBufferGeometry
// However, tha tuses counterclockwise paosition/indices.
// Not sure hwat are the implications of that.

module.exports.indices = function createIndices(opt) {
	const gridX = Math.floor(opt.widthSegments);
	const gridY = Math.floor(opt.heightSegments);

	const gridX1 = gridX + 1;
	const gridY1 = gridY + 1;
	let indices = [];
	let verticesPerGlyph = (gridX + 1) * (gridY + 1);
	let extendedVertices = 0;
	let glyphVertexStart = 0;
	for (let ig = 0; ig < opt.count; ig++) {
		for (let iy = 0; iy < gridY; iy++) {
			for (let ix = 0; ix < gridX; ix++) {
				const a = glyphVertexStart + ix + gridX1 * iy;
				const b = glyphVertexStart + ix + gridX1 * (iy + 1);
				const c = glyphVertexStart + ix + 1 + gridX1 * (iy + 1);
				const d = glyphVertexStart + ix + 1 + gridX1 * iy;

				indices.push(a, b, d);
				indices.push(b, c, d);
			}
		}
		// If there is not extension, the next glyph starts at after all the segmented vertices
		if (opt.extend == null) {
			glyphVertexStart += verticesPerGlyph;
			continue;
		}
		let tl = glyphVertexStart;
		let tr = glyphVertexStart + gridX;
		let br = glyphVertexStart + verticesPerGlyph - 1;
		let bl = glyphVertexStart + verticesPerGlyph - gridX - 1;
		let extendStart = glyphVertexStart + verticesPerGlyph;
		let currentExtendIndex = extendStart;
		let extend = opt.extend;
		if (!!extend.top) {
			// two triangles

			// ex-ttl ex-ttr glyphFirst
			// ex-ttr glyphLastOfLine glyphFirst
			indices.push(currentExtendIndex, currentExtendIndex + 1, tl);
			indices.push(currentExtendIndex + 1, tr, tl);

			currentExtendIndex += 2;
		}

		if (!!extend.right) {
			if (!!extend.top) {
				// push top corner

				// currentExtendIndex - 1 > corner > tr
				// corner > currentExtendIndex > tr

				indices.push(currentExtendIndex - 1, currentExtendIndex, tr);
				indices.push(currentExtendIndex, currentExtendIndex + 1, tr);
				currentExtendIndex++;
			}
			// two triangles

			// glyphLastOfLine ex-rtr glyphLast
			// ex-rtr ex-rbr  glyphLast
			indices.push(
				tr,
				currentExtendIndex,
				br // last of glyphs vertices
			);
			indices.push(
				currentExtendIndex,
				currentExtendIndex + 1,
				br // this - 1 is fine here because it starts at 0
			);
			currentExtendIndex += 2;
		}

		if (!!extend.bottom) {
			if (!!extend.right) {
				// push top corner

				// currentExtendIndex - 1 > corner > tr
				// corner > currentExtendIndex > tr
				indices.push(br, currentExtendIndex - 1, currentExtendIndex + 1);
				indices.push(
					currentExtendIndex - 1,
					currentExtendIndex,
					currentExtendIndex + 1
				);
				currentExtendIndex++;
			}
			// two triangles

			// glyphLastOfLine ex-rtr glyphLast
			// ex-rtr ex-rbr  glyphLast
			indices.push(
				bl, // bl corner of square
				br, // br corner of square
				currentExtendIndex + 1 // bl of bottom extension
			);
			indices.push(br, currentExtendIndex, currentExtendIndex + 1);

			currentExtendIndex += 2;
		}

		if (!!extend.left) {
			if (!!extend.bottom) {
				// push top corner

				// currentExtendIndex - 1 > corner > tr
				// corner > currentExtendIndex > tr

				indices.push(currentExtendIndex + 1, bl, currentExtendIndex);
				indices.push(bl, currentExtendIndex - 1, currentExtendIndex);
				currentExtendIndex++;
			}
			// two triangles

			// glyphLastOfLine ex-rtr glyphLast
			// ex-rtr ex-rbr  glyphLast
			indices.push(
				currentExtendIndex + 1, // bl corner of square
				tl, // br corner of square
				currentExtendIndex // bl of bottom extension
			);
			indices.push(tl, bl, currentExtendIndex);

			currentExtendIndex += 2;

			if (!!extend.top) {
				// push top corner

				// currentExtendIndex - 1 > corner > tr
				// corner > currentExtendIndex > tr

				indices.push(currentExtendIndex, extendStart, currentExtendIndex - 1);
				indices.push(extendStart, tl, currentExtendIndex - 1);
				currentExtendIndex++;
			}
		}
		// create indices for extension
		// top

		// ex0-tr exC

		glyphVertexStart = currentExtendIndex;
	}

	return indices;
};
