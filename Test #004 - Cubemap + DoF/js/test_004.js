	Physijs.scripts.worker = 'js/physijs/physijs_worker.js';
	Physijs.scripts.ammo = 'ammo.js'

	var container;
	var camera, scene, control, renderer, material_depth;
	var light_1, light_2, light_rotation_1 = 0, light_rotation_2 = 0;

	var postprocessing = {};
	var bokeh_params = {
			shaderFocus	: false,
			fstop 		: 2.6 * 3,
			maxblur 	: 2.0,
			showFocus 	: false,
			focalDepth 	: 4.2,
			manualdof 	: false,
			vignetting 	: false,
			depthblur 	: false,

			threshold 	: 0.5,
			gain 		: 0.1,
			bias 		: 0.5,
			fringe		: 0.7,

			focalLength	: 35,
			noise		: false,
			pentagon	: false,

			dithering	: 0.00001
		};
	


	function init() {
		container = document.getElementById('container');

		/* Camera */
		camera = new THREE.PerspectiveCamera( 90.0, window.innerWidth / window.innerHeight, 0.05, 250 );
		camera.position.set( 0.0, 6, 25 );

		/* Track ball controls */
		controls = new THREE.TrackballControls( camera );
		controls.target 		= new THREE.Vector3( 0.0, camera.position.y, 0.0 );
		controls.rotateSpeed 	= 1.5;
		controls.zoomSpeed 		= 1.5;
		controls.panSpeed 		= 1.5;
		controls.staticMoving 	= true;
		controls.dynamicDampingFactor = 0.1;
		controls.addEventListener( 'change', render );

		/* Create the scene, tied to gravity */
		scene = new Physijs.Scene();
		scene.setGravity( new THREE.Vector3( 0, -10.0, 0 ));
		scene.addEventListener( 'update', function() {
			scene.simulate( undefined, 1 );
		} );
		
		material_depth = new THREE.MeshDepthMaterial();

		scene.add( createGroundPlane() );

		/* Load the buddha statue */
		var loader = new THREE.PLYLoader();
		loader.load( './models/ply/ascii/happy_vrip_res3.ply', function ( geometry ){
			var material = new THREE.MeshPhongMaterial( {
				ambient  : 0xffffff,
				color    : 0xffffff,
				specular : 0xffffff,
				shininess: 100
			} );
			var mesh = new Physijs.BoxMesh( geometry, Physijs.createMaterial( material, 10.0, 0.0), 0.0 );
			mesh.position.set( 0.5, -2.8, 0.5 );
			mesh.scale.multiplyScalar( 50.0 );
			mesh.castShadow 	= true;
			mesh.receiveShadow 	= true;
			scene.add( mesh );
		} );

		/* Load the dragon statue */
		loader.load( './models/ply/ascii/dragon_vrip_res3.ply', function ( geometry ){
			var material = new THREE.MeshPhongMaterial( {
				ambient  : 0xffffff,
				color    : 0xffffff,
				specular : 0xffffff,
				shininess: 100
			} );

			var mesh = new Physijs.BoxMesh( geometry, Physijs.createMaterial( material, 10.0, 0.0), 0.0 );
			mesh.position.set( -5, -4.5, -10.5 );
			mesh.scale.multiplyScalar( 70.0 );
			mesh.castShadow 	= true;
			mesh.receiveShadow 	= true;
			scene.add( mesh );
		} );


		/* Create drops */
		for ( var i = 0; i < 300; i++ )  
			scene.add( createDrop() );

		scene.add( createSkybox() );
		scene.add( new THREE.AmbientLight( 0xCCCCCC ) );
		scene.add( light_1 = createShadowedLight( 100, 100, 200, 0xffffff, 1.35 ) );
		scene.add( light_2 = createShadowedLight( 50, 100, 80, 0xffaa00, 1 ) );

		initPostProcessing();

		/* Setting up the DoF parameters to bokeh shader */
		for( var e in bokeh_params ) {
			if( e in postprocessing.bokeh_uniforms )
				postprocessing.bokeh_uniforms[e].value = bokeh_params[e];
		}
		postprocessing.enabled = true;
		postprocessing.bokeh_uniforms["znear"].value 	= camera.near;
		postprocessing.bokeh_uniforms["zfar"].value 	= camera.far;
		camera.setLens( bokeh_params.focalLength );

		/* Create our renderer */
		renderer = new THREE.WebGLRenderer( {antialias: false} );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.gammaInput  = true;
		renderer.gammaOutput = true;
		renderer.shadowMapEnabled  = true;
		renderer.shadowMapCullFace = THREE.CullFaceBack;


		container.appendChild( renderer.domElement );
		window.addEventListener( 'resize', onWindowResize, false );

		scene.simulate();
	}

	/**
	* Init the depth of field post processing scene
	*/
	function initPostProcessing() {
		postprocessing.scene  = new THREE.Scene();
		postprocessing.camera = new THREE.OrthographicCamera( -window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, -60, 60 );
		
		postprocessing.scene.add( postprocessing.camera );

		/* Rendering to color and depth textures */
		var params = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format   : THREE.RGBFormat
		};

		/* Preparing the frame buffers to be rendered to */
		postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, params );
		postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, params );

		var bokeh_shader = THREE.BokehShader;
		postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );
		postprocessing.bokeh_uniforms["tColor"].value = postprocessing.rtTextureColor;
		postprocessing.bokeh_uniforms["tDepth"].value = postprocessing.rtTextureDepth;

		postprocessing.bokeh_uniforms["textureWidth" ].value = window.innerWidth;
		postprocessing.bokeh_uniforms["textureHeight"].value = window.innerHeight;

		postprocessing.materialBokeh = new THREE.ShaderMaterial( {
			uniforms 		: postprocessing.bokeh_uniforms,
			vertexShader 	: bokeh_shader.vertexShader,
			fragmentShader 	: bokeh_shader.fragmentShader,
			defines: {
				RINGS	: 3,
				SAMPLES	: 2
			}
		} );

		postprocessing.quad = new THREE.Mesh( new THREE.PlaneGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
		postprocessing.scene.add( postprocessing.quad );
	}

	/**
	* Create the skybox
	*/
	function createSkybox() {
		var cube_map = new THREE.Texture( [] );
		cube_map.format = THREE.RGBFormat;
		cube_map.flipY = false;

		var loader = new THREE.ImageLoader();
		loader.load( './textures/skyboxsun25degtest.png', function ( image ) {

			/* Draw image on a canvas of the page */
			var getSide = function ( x, y ) {
				var size 		= 1024;
				var canvas 		= document.createElement( 'canvas' );
				canvas.width 	= size;
				canvas.height 	= size;
				var context 	= canvas.getContext( '2d' );
				context.drawImage( image, - x * size, - y * size );
				return canvas;

			};

			cube_map.image[ 0 ] = getSide( 2, 1 );
			cube_map.image[ 1 ] = getSide( 0, 1 );
			cube_map.image[ 2 ] = getSide( 1, 0 );
			cube_map.image[ 3 ] = getSide( 1, 2 );
			cube_map.image[ 4 ] = getSide( 1, 1 );
			cube_map.image[ 5 ] = getSide( 3, 1 );
			cube_map.needsUpdate = true;
		} );


		var cube_shader = THREE.ShaderLib['cube'];
		cube_shader.uniforms['tCube'].value = cube_map;

		var material = new THREE.ShaderMaterial( {
			fragmentShader 	: cube_shader.fragmentShader,
			vertexShader 	: cube_shader.vertexShader,
			uniforms 		: cube_shader.uniforms,
			depthWrite 		: false,
			side 			: THREE.BackSide
		});

		return new THREE.Mesh( new THREE.BoxGeometry( camera.far, camera.far, camera.far ), material );
	}

	/**
	*  Create object that drops from the heaven! 
	*/
	function createDrop() {
		var color = new THREE.Color( Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0 );
		var material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial( {
				ambient  : color,
				color    : color,
				specular : 0xAAAAAA,
				shininess: 100
			} ),
			0.6, 1.0
		);

		/* Create spheres */
		var drop = new Physijs.SphereMesh(
			new THREE.SphereGeometry( 0.5, 10, 10 ),
			material, 1.2
		);

		/* Randomly position drops in the sky */
		drop.position.set(
			Math.random() * 30 - 15.0,
			Math.random() * 20 + 30.0,
			Math.random() * 30 - 15.0
		);

		drop.receiveShadow 	= true;
		drop.castShadow 	= true;
		return drop
	}


	/**
	* Create the ground plane
	*/
	function createGroundPlane() {
		var ground_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial( {
				ambient : 0x999999,
				color   : 0x999999,
				specular: 0x101010
			} ),
			1.0, 1.0
		);

		var ground = new Physijs.BoxMesh( new THREE.BoxGeometry( 40, 0.1, 40 ), ground_material, 0 );
		ground.position.set( 0, -0.5, 0 );
		ground.receiveShadow = true;

		return ground;
	}

	/**
	* Creates directional light that casts shadows
	*/
	function createShadowedLight( x, y, z, color, intensity ) {
		var directional_light = new THREE.DirectionalLight( color, intensity );
		directional_light.position.set( x, y, z );
		directional_light.castShadow = true;

		/* Parameters for shadow casting */
		var d = 15.0;
		directional_light.shadowCameraLeft   = -d;
		directional_light.shadowCameraRight  =  d;
		directional_light.shadowCameraTop    =  d;
		directional_light.shadowCameraBottom = -d;

		directional_light.shadowCameraNear 	= 0.1;
		directional_light.shadowCameraFar 	= 300;

		directional_light.shadowMapWidth 	= 1024 * 0.7;
		directional_light.shadowMapHeight 	= 1024 * 0.7;

		directional_light.shadowBias 	 	= -0.0001;
		directional_light.shadowDarkness 	= 0.65;

		return directional_light;
	}

	/**
	* Handles window resize
	*/
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );

		controls.handleResize();
	}

	function animate() {
		requestAnimationFrame( animate );
		render();
		controls.update();

	}

	function render() {
		light_1.position.x = 100.0 * Math.cos( light_rotation_1 );
		light_1.position.z = 200.0 * Math.sin( light_rotation_1 );

		light_2.position.x = 50 * Math.cos( light_rotation_2 );
		light_2.position.z = 80 * Math.sin( light_rotation_2 );
		
		light_rotation_1 += 0.001;
		light_rotation_2 += 0.01;

		/* Render the scene to both color and depth textures first */
		renderer.clear();
		scene.overrideMaterial = null;
		renderer.render( scene, camera, postprocessing.rtTextureColor, true );

		scene.overrideMaterial = material_depth;
		renderer.render( scene, camera, postprocessing.rtTextureDepth, true );

		/* Then render them using the depth of field postprocessing scene */
		renderer.render( postprocessing.scene, postprocessing.camera );
	}


	init();
	animate();