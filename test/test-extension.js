/*
  This is an example of 2D rendering, simply
  using bitmap fonts in orthographic space.

  var geom = createText({
    multipage: true,
    ... other options
  })
 */

global.THREE = require("three");
var createOrbitViewer = require("three-orbit-viewer")(THREE);
var createText = require("..");

require("./load")(
	{
		font: "fnt/DejaVu-sdf.fnt",
		image: "fnt/DejaVu-sdf.png",
	},
	start
);
function createControls(initialState, sizes, onChange) {
	const controls = {
		state: {
			top: null,
			bottom: null,
			right: null,
			left: null,
			...initialState,
		},
	};
	function createOnToggle(key) {
		return function (e) {
			console.log(e, this);
			e.preventDefault();
			if (controls.state[key] == null) {
				controls.state[key] = sizes[key] || 10;
			} else {
				controls.state[key] = null;
			}
			if (onChange) {
				onChange(controls.state);
			}
		};
	}
	// on change, call controls
	// create the controls
	let wrapper = document.createElement("div");
	wrapper.classList.add("extendControls");
	wrapper.style = "position: absolute; top: 20%; right: 20%;";

	let center = document.createElement("div");
	center.style = "width: 200px; height: 200px; background: grey;";
	center.classList.add("extendControls-center");

	let top = document.createElement("button");
	top.addEventListener("click", createOnToggle("top"));
	top.style =
		"bottom: 100%; right: 0; left: 0; position: absolute; padding: 2em;";
	top.classList.add("extendControls-top");

	let right = document.createElement("button");
	right.addEventListener("click", createOnToggle("right"));
	right.style =
		"left: 100%; top: 0; bottom: 0; position: absolute; padding: 2em;";
	right.classList.add("extendControls-right");

	let bottom = document.createElement("button");
	bottom.addEventListener("click", createOnToggle("bottom"));
	bottom.style =
		"top: 100%; right: 0; left: 0; position: absolute; padding: 2em;";
	bottom.classList.add("extendControls-bottom");

	let left = document.createElement("button");
	left.addEventListener("click", createOnToggle("left"));
	left.style =
		"right: 100%; top: 0; bottom: 0; position: absolute; padding: 2em;";
	left.classList.add("extendControls-left");

	wrapper.append(center, top, right, bottom, left);
	document.body.append(wrapper);
	return controls; // Object with options
}
function start(font, texture) {
	var app = createOrbitViewer({
		clearColor: "rgb(80, 80, 80)",
		clearAlpha: 1.0,
		fov: 65,
		position: new THREE.Vector3(),
	});

	app.camera = new THREE.OrthographicCamera();
	app.camera.left = 0;
	app.camera.top = 0;
	app.camera.near = -100;
	app.camera.far = 100;

	let wiredOptions = {
		text: "N",
		font: font,
		widthSegments: 1,
		heightSegments: 1,
		letterSpacing: 0,
		align: "left",
		width: 700,
		flipY: texture.flipY,
	};

	var wireframeMaterial = new THREE.MeshBasicMaterial({
		// map: texture,
		wireframe: true,
		transparent: true,
		color: "rgb(230, 230, 230)",
	});

	function createWiredMesh(geo, mat) {
		var layout = geo.layout;
		var text = new THREE.Mesh(geo, mat);
		var padding = 40;
		text.position.set(padding, -layout.descender + layout.height + padding, 0);
		// textAnchor.add(text);

		return text;
	}

	var textAnchor = new THREE.Object3D();
	let extend = {
		// left: 20,
		// top: 80,
		bottom: 80,
		// right: 20,
	};
	var top = createText({
		...wiredOptions,
		extend,
	});

	let meshT = createWiredMesh(top, wireframeMaterial);
	textAnchor.add(meshT);

	let meshUVShader = createWiredMesh(
		top,
		new THREE.ShaderMaterial({
			vertexShader: `
			varying vec2 vUv;
			uniform vec4 uUVSpace;
			varying float vAct;
			void main(){
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
				// vec2 anchor = getPointInRectangle( uUVSpace.xy,uUVSpace.zw, vec2(0.,0.0));
				// float height = uUVSpace.y - uUVSpace.w;
				// float act = (vUv.y - uUVSpace.w) / height - 0.7;
				// act = max(0., act);
				// vUv.x += -anchor.x;
				// vUv.x /= (uUVSpace.z - uUVSpace.x);
				// vUv.x += -0.5;
				// vUv.x *= 1. + 0.1 * act;
				// vUv.x += 0.5;
				// vUv.x *= (uUVSpace.z - uUVSpace.x);
				// vUv.x += anchor.x;

				// vUv.y *= 1. + 0.1 * act;
				float height = uUVSpace.y - uUVSpace.w;
				float act = (uv.y - uUVSpace.w) / height - 0.6;

				act = max(0., act);

				// vUv = clamp(vUv, uUVSpace.xy, uUVSpace.zw);
				// vUv = uv;
				vAct = act;
			}`,
			fragmentShader: `
			#ifdef GL_OES_standard_derivatives
			#extension GL_OES_standard_derivatives : enable
			#endif
			varying vec2 vUv;
			uniform sampler2D uMap;
			varying float vAct;
			uniform vec4 uUVSpace;
			vec2 getPointInRectangle(vec2 from, vec2 to, vec2 point ){
				vec2 size = from - to;
				return from + size * point;
			}

			float aastep(float value) {
			  #ifdef GL_OES_standard_derivatives
			    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
			  #else
			    float afwidth = (1.0 / 32.0) * (1.4142135623730951 / (2.0 * gl_FragCoord.w));
			  #endif
			  return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);
			}
			uniform float uTime;
			void main(){

				vec2 uv = vUv;

				vec2 anchor = getPointInRectangle( uUVSpace.xy,uUVSpace.zw, vec2(0.,0.0));
				float height = uUVSpace.y - uUVSpace.w;
				float act = (uv.y - uUVSpace.w) / height - 0.2;
				act = max(0., act);
				act = vAct;
				uv.x += -anchor.x;
				uv.x /= (uUVSpace.z - uUVSpace.x);
				uv.x += -0.5;
				uv.x *= 1. + 0.2 * act * act;
				uv.x += 0.5;
				uv.x *= (uUVSpace.z - uUVSpace.x);
				uv.x += anchor.x;

				uv.y *= 1. + 0.1 * act;
				uv = clamp(uv, uUVSpace.xy, uUVSpace.zw);


				// uv.y += 0.01;
				vec4 col = texture2D(uMap, uv);
				float amp = 0.007;
				// uv.x += cos(act+ uTime) * amp * min(1.,act);
				uv = clamp(uv, uUVSpace.xy, uUVSpace.zw);
				float red = aastep(texture2D(uMap, uv).a);


				uv.x += cos(act + 0.2 + uTime) * amp * min(1.,act);
				// uv = clamp(uv, uUVSpace.xy, uUVSpace.zw);
				float green = aastep(texture2D(uMap, uv).a);
				uv.x += cos(act + 1.+ uTime) * amp * min(1.,act);
				// uv = clamp(uv, uUVSpace.xy, uUVSpace.zw);
				float blue = aastep(texture2D(uMap, uv).a);
				
				// gl_FragColor = vec4(vec3(1.), aastep(col.a));
				gl_FragColor = vec4(vec3(red,green,blue), (red + green + blue)/3.);
			// gl_FragColor = vec4(vec3(vUv.x), 1.);
			}
			`,
			uniforms: {
				uMap: new THREE.Uniform(texture),
				uUVSpace: top.extendUniforms,
				uTime: new THREE.Uniform(0),
			},
			side: THREE.DoubleSide,
			// wireframe: true,
			transparent: true,
			color: "rgb(230, 230, 230)",
		})
	);
	console.log(top.extendUniforms);
	texture.needsUpdate = true;
	textAnchor.add(meshUVShader);
	meshUVShader.position.x += 130;

	createControls(extend, { bottom: 100 }, (extend) => {
		console.log(extend);
		top = createText({
			...wiredOptions,
			extend,
		});
		meshT.geometry = top;
		meshUVShader.geometry = top;
		meshUVShader.material.uniforms.uUVSpace = top.extendUniforms;
		// top.update({ ...wiredOptions, extend });
		// top.needsUpdate = true;
		meshT.needsUpdate = true;
		meshUVShader.needsUpdate = true;
		// top.attributes.position.needsUpdate = true;
		// top.index.needsUpdate = true;
		top.needsUpdate = true;
		top.computeBoundingSphere();
		console.log("geo", top);
	});

	// textAnchor.add(corners);
	textAnchor.scale.multiplyScalar((1 / (window.devicePixelRatio || 1)) * 6);
	app.scene.add(textAnchor);

	let time = 0;
	// update orthographic
	app.on("tick", function (dt) {
		time += dt / 1000;

		meshUVShader.material.uniforms.uTime.value = time;
		// update camera
		var width = app.engine.width;
		var height = app.engine.height;
		app.camera.right = width;
		app.camera.bottom = height;
		app.camera.updateProjectionMatrix();
	});
}
