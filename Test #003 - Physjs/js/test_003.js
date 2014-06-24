	Physijs.scripts.worker = 'js/physijs/physijs_worker.js';
	Physijs.scripts.ammo = 'ammo.js'

	var container,
		projector,
		camera, controls, scene, renderer,
		light_1, light_2;

	var light_rotation_1 = 0,
		light_rotation_2 = 0;

	function initScene() {
		console.log( '[START] initScene' );
		projector = new THREE.Projector();

		container = document.getElementById( 'container' );

		/* Init the camera */
		camera = new THREE.PerspectiveCamera( 27.0, window.innerWidth / window.innerHeight, 0.001, 15.0 );
		camera.position.set( 0.0, 1.0, 4.5 );

		/* Trackball controls */
		controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed 	= 1.5;
		controls.zoomSpeed 		= 1.5;
		controls.panSpeed 		= 1.5;
		controls.staticMoving 	= true;
		controls.dynamicDampingFactor = 0.1;
		controls.addEventListener( 'change', render );

		/* Init the scene */
		scene = new Physijs.Scene();
		scene.setGravity( new THREE.Vector3( 0, -10.0, 0 ));
		scene.addEventListener( 'update', function() {
			scene.simulate( undefined, 1 );
		} );
		scene.fog = new THREE.Fog( 0x72654b, 2, 15 );

		/* Create our immovable platform */
		var ground_material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial( {
				ambient : 0x999999,
				color   : 0x999999,
				specular: 0x101010
			} ),
			1.0, 1.0
		);

		var ground = new Physijs.BoxMesh( new THREE.BoxGeometry( 3, 0.1, 3 ), ground_material, 0 );
		ground.position.set( 0, -0.5, 0 );
		ground.receiveShadow = true;
		scene.add( ground );


		/* Create drops */
		for ( var i = 0; i < 200; i++ )  {
			scene.add( createDrop() );
		}
			
		
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
			mesh.position.set( 0.25, -0.75, 0.5 );
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

			var mesh = new Physijs.BoxMesh( geometry, Physijs.createMaterial( material, 10.0, 0.0), 0.0 );
			mesh.position.set( -0.25, -0.70, -0.5 );
			mesh.scale.set   ( 5.0, 5.0, 5.0 );
			mesh.castShadow 	= true;
			mesh.receiveShadow 	= true;
			scene.add( mesh );
		} );

		/* Add the ambient and directional lights */
		scene.add( new THREE.AmbientLight( 0xcccccc ));
		light_1 = createShadowedLight( 1, 1, 2, 0xffffff, 1.35 );
		light_2 = createShadowedLight( 0.5, 1, 0.8, 0xffaa00, 1.0 );
		scene.add( light_1 );
		scene.add( light_2 );


		/* Init the renderer */
		renderer = new THREE.WebGLRenderer( {antialias: true} );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setClearColor( scene.fog.color, 1 );
		renderer.gammaInput  		= true;
		renderer.gammaOutput 		= true;
		renderer.shadowMapEnabled 	= true;
		renderer.shadowMapSoft = true;
		renderer.shadowMapCullFace 	= THREE.CullFaceBack;

		container.appendChild( renderer.domElement );

		scene.simulate();
		console.log( '[END] initScene' );
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );

		controls.handleResize();
	}

	/* Create object that drops from the heaven! */
	function createDrop() {
		var color = new THREE.Color( Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0 );
		var material = Physijs.createMaterial(
			new THREE.MeshPhongMaterial( {
				ambient  : color,
				color    : color,
				specular : 0xAAAAAA,
				shininess: 100
			} ),
			0.4, 0.5
		);

		/* Create spheres */
		var drop = new Physijs.SphereMesh(
			new THREE.SphereGeometry( 0.05, 10, 10 ),
			material, 1.0
		);

		/* Randomly position drops in the sky */
		drop.position.set(
			Math.random() * 2 - 1.0,
			Math.random() * 4 + 1.5,
			Math.random() * 2 - 1.0
		);

		/* Uncomment this, if you want to use cubes */
		// drop.rotation.set(
		// 	Math.random() * Math.PI * 2,
		// 	Math.random() * Math.PI * 2,
		// 	Math.random() * Math.PI * 2
		// );

		drop.receiveShadow = true;
		drop.castShadow = true;
		return drop
	}

	/* Create the directional light that casts shadows */
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

	function animate() {
		requestAnimationFrame( animate );
		render();
		controls.update();
	}

	function render() {
		/* Rotate the directional lights */
		light_1.position.x = 1.0 * Math.cos( light_rotation_1 );
		light_1.position.z = 2.0 * Math.sin( light_rotation_1 );

		light_2.position.x = 0.5 * Math.cos( light_rotation_2 );
		light_2.position.z = 0.8 * Math.sin( light_rotation_2 );
		
		light_rotation_1 += 0.001;
		light_rotation_2 += 0.01;

		renderer.render( scene, camera );
	}


	initScene();
	animate();