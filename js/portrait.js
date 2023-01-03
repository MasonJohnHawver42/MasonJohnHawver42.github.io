
const scene_portrait = new THREE.Scene();
const camera_portrait = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );

portrait_container = document.getElementById('canvas');

renderer = new THREE.WebGLRenderer();
renderer.setSize( portrait_container.clientWidth, portrait_container.clientHeight );
portrait_container.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
const cube = new THREE.Mesh( geometry, material );

scene_portrait.add( cube );

scene_portrait.background = new THREE.Color( 0xffffff );

camera_portrait.position.z = 2;

function animate_portrait() {
  requestAnimationFrame( animate_portrait );

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  camera_portrait.aspect = portrait_container.clientWidth / portrait_container.clientHeight;
  camera_portrait.fov = 2 * Math.atan(portrait_container.clientHeight / (300)) * (180 / Math.PI);
  camera_portrait.updateProjectionMatrix();

  renderer.setSize( portrait_container.clientWidth, portrait_container.clientHeight );

  renderer.render( scene_portrait, camera_portrait );
};

animate_portrait();
