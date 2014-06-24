var container;
var camera, scene, renderer;
var mesh;

init();
animate();

function init() {
	container = document.getElementById( 'container' );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1.0, 3500.0 );
	camera.position.z = 2750 / 2;

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x50505, 2000, 3500 );
	scene.add( new THREE.AmbientLight( 0x444444 ) );

	var light_1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
	light_1.position.set( 1, 1, 1 );
	scene.add( light_1 );

	var light_2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light_2.position.set( 0, -1, 0 );
	scene.add( light_2 );

	var triangles = 160000;

	var geometry = new THREE.BufferGeometry();
	geometry.addAttribute( 'index', 	new Uint16Array ( triangles * 3 ), 1 );
	geometry.addAttribute( 'position', 	new Float32Array( triangles * 3 * 3 ), 3 );
	geometry.addAttribute( 'normal', 	new Float32Array( triangles * 3 * 3 ), 3 );
	geometry.addAttribute( 'color', 	new Float32Array( triangles * 3 * 3 ), 3 );

	var chunk_size = 21845;
	
	var indices 	= geometry.getAttribute( 'index'    ).array,
		positions 	= geometry.getAttribute( 'position' ).array,
		normals 	= geometry.getAttribute( 'normal'   ).array,
		colors 		= geometry.getAttribute( 'color'    ).array;

	for( var i = 0; i < indices.length; i++ ) 
		indices[i] = i % ( 3 * chunk_size );

	var color = new THREE.Color();

	var n  = 800, 
		n2 = n/2;

	var d  = 12, 
		d2 = d/2;

	var pA = new THREE.Vector3(),
		pB = new THREE.Vector3(),
		pC = new THREE.Vector3();

	var cb = new THREE.Vector3(),
		ab = new THREE.Vector3();

	for( var i = 0; i < positions.length; i+= 9 ) {
		var x = Math.random() * n - n2,
			y = Math.random() * n - n2,
			z = Math.random() * n - n2;

		var ax = x + Math.random() * d - d2,
			ay = y + Math.random() * d - d2,
			az = z + Math.random() * d - d2;

		var bx = x + Math.random() * d - d2,
			by = y + Math.random() * d - d2,
			bz = z + Math.random() * d - d2;

		var cx = x + Math.random() * d - d2,
			cy = y + Math.random() * d - d2,
			cz = z + Math.random() * d - d2;

		positions[i  ] = ax;
		positions[i+1] = ay;
		positions[i+2] = az;

		positions[i+3] = bx;
		positions[i+4] = by;
		positions[i+5] = bz;

		positions[i+6] = cx;
		positions[i+7] = cy;
		positions[i+8] = cz;

		/* Find the surface normal */
		pA.set( ax, ay, az );
		pB.set( bx, by, bz );
		pC.set( cx, cy, cz );

		cb.subVectors( pC, pB );
		ab.subVectors( pA, pB );
		cb.cross( ab );
		cb.normalize();

		var nx = cb.x,
			ny = cb.y,
			nz = cb.z;

		normals[i  ] = nx;
		normals[i+1] = ny;
		normals[i+2] = nz;

		normals[i+3] = nx;
		normals[i+4] = ny;
		normals[i+5] = nz;
		
		normals[i+6] = nx;
		normals[i+7] = ny;
		normals[i+8] = nz;

		var vx = ( x / n ) + 0.5;
		var vy = ( y / n ) + 0.5;
		var vz = ( z / n ) + 0.5;

		color.setRGB( vx, vy, vz );

		colors[i  ] = color.r;
		colors[i+1] = color.g;
		colors[i+2] = color.b;

		colors[i+3] = color.r;
		colors[i+4] = color.g;
		colors[i+5] = color.b;

		colors[i+6] = color.r;
		colors[i+7] = color.g;
		colors[i+8] = color.b;
	}

	var offsets = triangles / chunk_size;
	for( var i = 0; i < offsets; i++ ) {
		var offset = {
			start: i * chunk_size * 3,
			index: i * chunk_size * 3,
			count: Math.min( triangles - (i * chunk_size), chunk_size ) * 3
		};

		geometry.offsets.push( offset );
	}

	geometry.computeBoundingSphere();

	var material = new THREE.MeshPhongMaterial( {
		color 		: 0xAAAAAA,
		ambient 	: 0xAAAAAA,
		specular 	: 0xFFFFFF,
		shininess 	: 250,
		side 		: THREE.DoubleSide,
		vertexColors: THREE.VertexColors
	} );

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setClearColor( scene.fog.color, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );

	renderer.gammaInput  = true;
	renderer.gammaOutput = true;

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame( animate );
	render();
	
}

function render() {
	var time = Date.now() * 0.001;

	mesh.rotation.x = time * 0.25;
	mesh.rotation.y = time * 0.50;

	renderer.render( scene, camera );
}





