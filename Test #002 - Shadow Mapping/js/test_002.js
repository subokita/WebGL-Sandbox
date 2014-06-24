	var container;
	var camera, controls, scene, renderer;
	var light_1, light_2;
	var light_rotation_1 = 0;
	var light_rotation_2 = 0;

	init();
	animate();

	function init() {
		console.log('init');
		container = document.getElementById( 'container' );

		/* Our camera */
		camera = new THREE.PerspectiveCamera( 27.0, window.innerWidth / window.innerHeight, 0.001, 15.0 );
		camera.position.set( 0.0, 1.5, 3.5 );

		/* Trackball controls */
		controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed 	= 1.5;
		controls.zoomSpeed 		= 1.5;
		controls.panSpeed 		= 1.5;
		controls.staticMoving 	= true;
		controls.dynamicDampingFactor = 0.1;
		controls.addEventListener( 'change', render );

		/* Create the scene, and apply fog */
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0x72645b, 2, 15 );

		/* Create ground plane */
		var plane_geometry = new THREE.PlaneGeometry( 40, 40 );
		var plane_material = new THREE.MeshPhongMaterial( {
			ambient : 0x999999,
			color   : 0x999999,
			specular: 0x101010
		} );

		var plane 			= new THREE.Mesh( plane_geometry, plane_material );
		plane.rotation.x 	= -Math.PI / 2;
		plane.receiveShadow = true;
		scene.add( plane );

		/* Load the buddha statue */
		var loader = new THREE.PLYLoader();
		loader.load( './models/ply/ascii/happy_vrip_res3.ply', function ( geometry ){
			var material = new THREE.MeshPhongMaterial( {
				ambient  : 0xffffff,
				color    : 0xffffff,
				specular : 0xffffff,
				shininess: 100
			} );

			var mesh = new THREE.Mesh( geometry, material);
			mesh.position.set( 0.5, -0.25, 0.5 );
			mesh.scale.set   ( 5.0, 5.0, 5.0 );
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

			var mesh = new THREE.Mesh( geometry, material);
			mesh.position.set( 0, -0.30, -0.25 );
			mesh.scale.set   ( 5.0, 5.0, 5.0 );
			mesh.castShadow 	= true;
			mesh.receiveShadow 	= true;
			scene.add( mesh );
		} );

		/* Add ambient light, and two other directional lights that cast shadows */
		scene.add( new THREE.AmbientLight( 0xCCCCCC ) );
		light_1 = createShadowedLight( 1, 1, 2, 0xffffff, 1.35 );
		light_2 = createShadowedLight( 0.5, 1, 0.8, 0xffaa00, 1 );

		scene.add( light_1 );
		scene.add( light_2 );

		/* Create our WebGL renderer */
		renderer = new THREE.WebGLRenderer( {antialias : false} );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setClearColor( scene.fog.color, 1 );
		renderer.gammaInput  = true;
		renderer.gammaOutput = true;

		renderer.shadowMapEnabled  = true;
		renderer.shadowMapCullFace = THREE.CullFaceBack;

		container.appendChild( renderer.domElement );

		window.addEventListener( 'resize', onWindowResize, false );
		console.log('end of init');
	}

	function createShadowedLight( x, y, z, color, intensity ) {
		var directional_light = new THREE.DirectionalLight( color, intensity );
		directional_light.position.set( x, y, z );
		directional_light.castShadow = true;

		/* Parameters for shadow casting */
		var d = 1.5;
		directional_light.shadowCameraLeft   = -d;
		directional_light.shadowCameraRight  =  d;
		directional_light.shadowCameraTop    =  d;
		directional_light.shadowCameraBottom = -d;

		directional_light.shadowCameraNear 	= 0.01;
		directional_light.shadowCameraFar 	= 5;

		directional_light.shadowMapWidth 	= 1024;
		directional_light.shadowMapHeight 	= 1024;

		directional_light.shadowBias 	 	= -0.0001;
		directional_light.shadowDarkness 	= 0.55;

		return directional_light;
	}

	function onWindowResize() {
		/* update aspect ratio if needed */
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
		/* Rotate our two directional lights */
		light_1.position.x = 1.0 * Math.cos( light_rotation_1 );
		light_1.position.z = 2.0 * Math.sin( light_rotation_1 );

		light_2.position.x = 0.5 * Math.cos( light_rotation_2 );
		light_2.position.z = 0.8 * Math.sin( light_rotation_2 );
		
		light_rotation_1 += 0.001;
		light_rotation_2 += 0.01;
		
		renderer.render( scene, camera );
	}