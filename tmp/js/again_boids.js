let isSimulationRunning = false;  // Initially, the simulation is stopped
let animationFrameId;  // To store the requestAnimationFrame ID

let BoidContainer = document.getElementById('canvas-boids');

let BoidSettings = 
{
	boid_count: 50,
	debug: false,

	sep_distance: 40,
 	coh_distance: 100,
 	ali_distance: 100,
	avd_distance: 150,

	fov: 90,
	rays: 250,

	size: 7,

	max_force: 300,
	min_speed: 0,
 	max_speed: 220,

 	sep_power: 4,
 	coh_power: 1,
 	ali_power: 3,
 	cnt_power: 10,
 	avd_power: 15,

 	camera_distance: 4000,
 	depth: 200,
}


let BoidUtill = 
{
	boid_geometry: new THREE.PlaneGeometry( 2, 1 ),
	boid_material: new THREE.MeshBasicMaterial( {color: 0xe7e7e7, side: THREE.DoubleSide} ),

	debug_material: new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} ),
	debug2_material: new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide} ),

	invs_material: new THREE.MeshBasicMaterial( {color: 0x37946e, side: THREE.DoubleSide, wireframe: true} ), 

	rect_geometry: new THREE.BoxGeometry( 1, 1, 1 ),
	rect_material: new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.BackSide, wireframe: true} ),

	ray_dirs: null,

	fib_shpere: function(samples, fov)
	{
	  let front = new THREE.Vector3(0, 1, 0)
	  let points = []
	  
	  let phi = (1 + Math.sqrt(5.0)) / 2.0
	  let angle_inc = Math.PI * 2 * phi

	  for (let i = 0; i < samples; i++)
	  {
	  	let t = i / samples;
	  	let incline = Math.acos(1 - 2 * t)
	  	let azimuth = angle_inc * i

	    let pnt = new THREE.Vector3(0, 0, 0)
	    pnt.x = Math.sin(incline) * Math.cos(azimuth)
	    pnt.y = Math.sin(incline) * Math.sin(azimuth)
	    pnt.z = Math.cos(incline)
	    points.push(pnt)
	    
	    //if (front.angleTo(pnt) * (180.0 / Math.PI) < fov) { points.push(pnt) }
	  }

	  return points;
	},

	steer: function(s, v, mf, ms) { s.setLength(ms); s.sub(v); s.clampLength(0, mf); return s; },

	rnd_span: function(aa_box) { let range = new THREE.Vector3().subVectors(aa_box.cnr_max, aa_box.cnr_min); return new THREE.Vector3().random().multiply(range).add(aa_box.cnr_min); },

	zero: function(v) { return v.x == 0 && v.y == 0 && v.z == 0 },

	update_camera: function(cam) 
	{
		cam.fov = 2 * Math.atan(BoidContainer.clientHeight / (2 * (BoidSettings.camera_distance - (BoidSettings.depth / 2.0)))) * (180 / Math.PI);
		cam.aspect = BoidContainer.clientWidth / BoidContainer.clientHeight;
	
		cam.position.y = getScrollTop();
		cam.lookAt(0, getScrollTop(), 0)
  		cam.rotateZ(Math.PI)

		cam.updateProjectionMatrix()
	},

	update_renderer: function(renderer) { renderer.setSize(BoidContainer.clientWidth, BoidContainer.clientHeight); },

	init: function() { this.ray_dirs = this.fib_shpere(BoidSettings.rays, BoidSettings.fov) }

}


class AA_Box 
{
	constructor(min_x, min_y, min_z, max_x, max_y, max_z) 
	{
		this.cnr_min = new THREE.Vector3(min_x, min_y, min_z);
		this.cnr_max = new THREE.Vector3(max_x, max_y, max_z);
		this.bounds = [this.cnr_min, this.cnr_max]
	}

	inside(point) { return (this.cnr_min.x < point.x && this.cnr_min.y < point.y && this.cnr_min.z < point.z && this.cnr_max.x > point.x && this.cnr_max.y > point.y && this.cnr_max.z > point.z ); }

	center() { let center = new THREE.Vector3().copy(this.cnr_max).add(this.cnr_min).divideScalar(2); return center; }

	intersect(orig, dir, invdir, sign) 
	{

		let tmin, tmax, tymin, tymax, tzmin, tzmax;
		tmin  = (this.bounds[sign[0]].x - orig.x) * invdir.x;
		tmax  = (this.bounds[1 - sign[0]].x - orig.x) * invdir.x; 
        tymin = (this.bounds[sign[1]].y - orig.y) * invdir.y; 
        tymax = (this.bounds[1 - sign[1]].y - orig.y) * invdir.y;

        if ((tmin > tymax) || (tymin > tmax)) { return [false, 0]; } 
 
        if (tymin > tmin) { tmin = tymin; }
        if (tymax < tmax) { tmax = tymax; }

        tzmin = (this.bounds[sign[2]].z - orig.z) * invdir.z; 
        tzmax = (this.bounds[1 - sign[2]].z - orig.z) * invdir.z;

        if ((tmin > tzmax) || (tzmin > tmax)) { return [false, 0]; } 
 
        if (tzmin > tmin) { tmin = tzmin; }
        if (tzmax < tmax) { tmax = tzmax; }

        let t = tmin; 
 
        if (t < 0) { 
            t = tmax; 
            if (t < 0) { return [false, 0]; }
        } 
 
        return [true, t]; 
	}
}

class Boid 
{
	constructor(bounds, max_speed, min_speed, size, geometry, material) 
	{
		this.pos  = BoidUtill.rnd_span(bounds)
		this.dir  = new THREE.Vector3(0, 1, 0)
		this.vel  = new THREE.Vector3(0, max_speed, 0)//.copy(this.dir).randomDirection().setLength((max_speed + min_speed) / 2.0)
		this.size = size;
		this.mesh = new THREE.Mesh(geometry, material);

		this.update_mesh()
	}

	update_mesh() 
	{
		this.mesh.position.copy(this.pos)
		this.mesh.scale.set(this.size, this.size, this.size)

		let fwd = new THREE.Vector3(1, 0, 0).normalize();
		let axis = new THREE.Vector3().crossVectors(fwd, this.dir)
		let angle = this.dir.angleTo(fwd)

		this.mesh.setRotationFromAxisAngle(axis, angle)
	}

	update_pos(dt, steering_forces) 
	{
		let acc = new THREE.Vector3(0, 0, 0)
		steering_forces.forEach((steer, i) => { acc.add(steer) })
		acc.multiplyScalar(dt);

		this.vel.add(acc);
		let speed = this.vel.length()
		this.dir.copy(this.vel).divideScalar(speed)
		speed = Math.max(BoidSettings.min_speed, Math.min(speed, BoidSettings.max_speed))
		this.vel.copy(this.dir).multiplyScalar(speed)
		//this.vel.z = 0;

		let dp = new THREE.Vector3().copy(this.vel).multiplyScalar(dt)
		this.pos.add(dp)
		//this.pos.z = 0;
	}

	avoidence_rays(aa_boxes, debug=false) 
	{
		let rot_axis = new THREE.Vector3().crossVectors(BoidUtill.ray_dirs[0], this.dir)
		let angle = BoidUtill.ray_dirs[0].angleTo(this.dir)

		for (let i = 0; i < BoidUtill.ray_dirs.length; i++) 
		{
			let dir = new THREE.Vector3().copy(BoidUtill.ray_dirs[i])
			dir.applyAxisAngle(rot_axis, angle)
			dir.normalize();

			let invdir = new THREE.Vector3(1 / dir.x, 1 / dir.y, 1 / dir.z);
			let sign = [ (invdir.x < 0) ? 1 : 0, (invdir.y < 0) ? 1 : 0, (invdir.z < 0) ? 1 : 0 ];
			
			let hit = false;
			let t = -1;

			for (let j = 0; j < aa_boxes.length; j++) 
			{	
				if (j == 0 || !aa_boxes[j].inside(this.pos)) 
				{
					let res = aa_boxes[j].intersect(this.pos, dir, invdir, sign)
					if (res[0]) { hit = true; t = (t == -1) ? res[1] : Math.min(t, res[1]); }
				}
			}

			if (!hit || (hit && t > BoidSettings.avd_distance)) 
			{
				if (i == 0) { return debug ? -1 : null; } 
				return debug ? i : dir; 
			}
		}

		return debug ? -1 : null;
	}

	avoid_steer(aa_boxes) 
	{
		let avd_dir  = this.avoidence_rays(aa_boxes)
		if (avd_dir != null && avd_dir != this.dir) 
		{ 
			BoidUtill.steer(avd_dir, this.vel, BoidSettings.max_force, BoidSettings.max_speed)
			avd_dir.multiplyScalar(BoidSettings.avd_power)
			return avd_dir;
		}
		if (avd_dir == this.dir) { console.log("here"); }
		return new THREE.Vector3(0, 0, 0);
	}

	contain_steer(aa_box) 
	{
		let cnt_steer = new THREE.Vector3(0, 0, 0)
		if (!aa_box.inside(this.pos)) 
		{
			cnt_steer.copy(this.pos).clamp(aa_box.cnr_min, aa_box.cnr_max)
			cnt_steer.multiplyScalar(-1)
		}
		if (!(cnt_steer.x == 0 && cnt_steer.y == 0 && cnt_steer.z == 0)) { BoidUtill.steer(cnt_steer, this.vel, BoidSettings.max_force, BoidSettings.max_speed) }
		cnt_steer.multiplyScalar(BoidSettings.cnt_power)
		return cnt_steer; 
	}

	seperation_steer(sep_heading, count) 
	{
		if (count > 0) { BoidUtill.steer(sep_heading, this.vel, BoidSettings.max_force, BoidSettings.max_speed).multiplyScalar(BoidSettings.sep_power); }
		return sep_heading;
	}

	alighn_steer(flock_heading, count) 
	{
		if (count > 0) { BoidUtill.steer(flock_heading, this.vel, BoidSettings.max_force, BoidSettings.max_speed).multiplyScalar(BoidSettings.ali_power); }
		return flock_heading;
	}

	cohesion_steer(flock_center, count) 
	{
		if (count > 0) 
		{ 
			flock_center.sub(this.pos);
			BoidUtill.steer(flock_center, this.vel, BoidSettings.max_force, BoidSettings.max_speed).multiplyScalar(BoidSettings.coh_power);
		}

		return flock_center;
	}

}


let environment = 
{
	obs: [],
	meshes: [],
	items: [],

	add: function(item, padding) 
	{
		let mesh = new THREE.Mesh(BoidUtill.rect_geometry, BoidUtill.rect_material);
		let aa_box = new AA_Box(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)); 

		item.boids_mesh = mesh;
		item.boids_box = aa_box;
		item.boids_padding = padding;

		this.items.push(item)
		this.obs.push(aa_box)
		this.meshes.push(mesh)
		this.update(item)
	},

	update: function(item) 
	{
		let scroll = item != BoidContainer ? 0 : getScrollTop();

		item.boids_box.cnr_min.set(item.offsetLeft - (BoidContainer.clientWidth / 2.0) - item.boids_padding, item.offsetTop - ((BoidContainer.clientHeight) / 2.0) - item.boids_padding + scroll, -BoidSettings.depth / 2.0)
    	item.boids_box.cnr_max.set(item.offsetLeft - (BoidContainer.clientWidth / 2.0) + item.offsetWidth + item.boids_padding, item.offsetTop - ((BoidContainer.clientHeight) / 2.0) + item.offsetHeight + item.boids_padding + scroll, BoidSettings.depth / 2.0)
	
    	item.boids_mesh.position.copy(item.boids_box.cnr_max).add(item.boids_box.cnr_min).multiplyScalar(0.5)
    	item.boids_mesh.scale.subVectors(item.boids_box.cnr_max, item.boids_box.cnr_min)
	},

	init: function() 
	{
		this.add(BoidContainer, -10)
		let items = document.getElementsByClassName('avoid');
		for (let i = 0; i < items.length; ++i) { this.add(items[i], 10); }
	},
}

let flock = 
{
	boids: [],
	clock: new THREE.Clock(),

	init: function(count) 
	{
		for (let i = 0; i < count; i++) 
		{ 
			this.boids.push( new Boid(document.getElementById('spawn').boids_box, BoidSettings.max_speed, BoidSettings.min_speed, BoidSettings.size, BoidUtill.boid_geometry, BoidUtill.invs_material) ); 
		}
	},

	update: function(dt) 
	{
		if (!isSimulationRunning) return;

		this.boids.forEach((boid, i) => 
		{

			let inside = BoidContainer.boids_box.inside(boid.pos)

			console.log("update")

			if (inside) 
			{

				let sep_heading = new THREE.Vector3(0, 0, 0); let sep_count = 0;
				let flock_heading = new THREE.Vector3(0, 0, 0); let ali_count = 0;
				let flock_center = new THREE.Vector3(0, 0, 0); let coh_count = 0;

				this.boids.forEach((other, j) => 
					{
						// let look_dir = new THREE.Vector3().subVectors(other.pos, boid.pos)
						// if (boid.dir.angleTo(look_dir) < BoidSettings.fov) 
						// {
						if (j != i) 
						{
							let offset = new THREE.Vector3().subVectors(boid.pos, other.pos)
							let distance_sq = (offset.x * offset.x) + (offset.y * offset.y) + (offset.z * offset.z); 
							
							if (distance_sq < BoidSettings.sep_distance * BoidSettings.sep_distance) 
							{
								offset.divideScalar(distance_sq)
								sep_heading.add(offset)
								sep_count++;
							}

							if (distance_sq < BoidSettings.ali_distance * BoidSettings.ali_distance) 
							{
								flock_heading.add(other.vel)
								ali_count++;
							}

							if (distance_sq < BoidSettings.coh_distance * BoidSettings.coh_distance) 
							{
								flock_center.add(other.pos)
								coh_count++;
							}
						}
						//}
					});

				if (sep_count > 0) { sep_heading.divideScalar(sep_count) }
				if (ali_count > 0) { flock_heading.divideScalar(ali_count) }
				if (coh_count > 0) { flock_center.divideScalar(coh_count) }

				let sep_steer = boid.seperation_steer(sep_heading, sep_count)
				let ali_steer = boid.alighn_steer(flock_heading, ali_count)
				let coh_steer = boid.cohesion_steer(flock_center, coh_count)

				let avd_steer = boid.avoid_steer(environment.obs)

				boid.update_pos(dt, [avd_steer, sep_steer, coh_steer, ali_steer])

			}
			else 
			{
				let cnt_steer = boid.contain_steer(BoidContainer.boids_box)
				boid.update_pos(dt, [cnt_steer])
			}
			
			boid.update_mesh()
		})
	}
}


BoidUtill.init()
environment.init();
flock.init(BoidSettings.boid_count);

const scene_boids = new THREE.Scene();
const camera_boids = new THREE.PerspectiveCamera( 0, 1, .001, 100000 );
const renderer_boids = new THREE.WebGLRenderer(); BoidContainer.appendChild( renderer_boids.domElement );

camera_boids.position.z = -BoidSettings.camera_distance
// camera_boids.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3.0);

BoidUtill.update_camera(camera_boids)
BoidUtill.update_renderer(renderer_boids)

if (BoidSettings.debug) { environment.items.forEach((item, i) => { scene_boids.add(item.boids_mesh) }) }
flock.boids.forEach((boid, i) => { scene_boids.add(boid.mesh) } )

let ray_meshes = []

if (BoidSettings.debug) 
{
	BoidUtill.ray_dirs.forEach((point, i) => {
	  pnt_mesh = new THREE.Mesh(BoidUtill.boid_geometry, i<  10 ? BoidUtill.debug_material : BoidUtill.boid_material);
	  pnt_mesh.position.copy(point)
	  pnt_mesh.position.multiplyScalar(BoidSettings.avd_distance)
	  pnt_mesh.scale.set(10, 10, 10)
	  pnt_mesh.lookAt(0, 0, 0)
	  scene_boids.add(pnt_mesh);
	  ray_meshes.push(pnt_mesh);
	});
}

scene_boids.background = new THREE.Color(0xffffff);

console.log(BoidContainer)

function animate_boids() 
{
	let dt = flock.clock.getDelta();
	dt = Math.min(dt, .1);
	
	if (isSimulationRunning) 
	{

		animationFrameId = requestAnimationFrame( animate );
		
		environment.items.forEach((item, i) => environment.update(item))
		
		flock.update(dt)
		
		if (BoidSettings.debug) 
		{
			let debug_boid = flock.boids[0]
			
			let rot_axis = new THREE.Vector3().crossVectors(BoidUtill.ray_dirs[0], debug_boid.dir)
			let angle = BoidUtill.ray_dirs[0].angleTo(debug_boid.dir)
			
			let avd_dir = debug_boid.avoidence_rays(environment.obs, true)
			
			ray_meshes.forEach((mesh, i) => 
			{

				let dir = new THREE.Vector3().copy(BoidUtill.ray_dirs[i])
				dir.applyAxisAngle(rot_axis, angle)
				dir.normalize();
				
				let invdir = new THREE.Vector3(1 / dir.x, 1 / dir.y, 1 / dir.z);
				let sign = [ (invdir.x < 0) ? 1 : 0, (invdir.y < 0) ? 1 : 0, (invdir.z < 0) ? 1 : 0 ];
				
				let res = [false, -1]//BoidContainer.boids_box.intersect(debug_boid.pos, dir, invdir, sign)
				environment.obs.forEach((aa_box, i) => 
				{
					let res_1 = aa_box.intersect(debug_boid.pos, dir, invdir, sign)
					res[0] = res[0] || res_1[0]
					if (res_1[0] && (res_1[1] < res[1] || res[1] == -1)) { res[1] = res_1[1]; }
				});
				
				if (i > avd_dir) { mesh.material = BoidUtill.boid_material; }
				if (i == avd_dir) { mesh.material = BoidUtill.debug2_material; }
				if (i < avd_dir) { mesh.material = BoidUtill.invs_material; }
				
				if (i == 0) { mesh.material = BoidUtill.debug_material; }
				
				mesh.position.copy(BoidUtill.ray_dirs[i])
				mesh.position.applyAxisAngle(rot_axis, angle)
				mesh.position.setLength((avd_dir == i ? 1.3 : 1) * BoidSettings.avd_distance)
				let size = (avd_dir == i ? 2 : 1) * (i - ray_meshes.length) * (10 / ray_meshes.length)
				mesh.scale.set(size, size, size)
				mesh.lookAt(camera_boids.position)
				mesh.position.add(debug_boid.pos)
			});
		}
		
		BoidUtill.update_camera(camera_boids)
		BoidUtill.update_renderer(renderer_boids)
		
		renderer_boids.render( scene_boids, camera_boids );
	}
}

function startSimulation() {
    isSimulationRunning = true;
	renderer_boids.setAnimationLoop( animate_boids );
}

function stopSimulation() {
    isSimulationRunning = false;
	cancelAnimationFrame( animationFrameId );
    renderer_boids.clear()
}

document.getElementById('toggleSimulationButton').addEventListener('click', () => {
    if (isSimulationRunning) {
        stopSimulation();
        document.getElementById('toggleSimulationButton').textContent = 'Start Fishtank';
    } else {
        startSimulation();
        document.getElementById('toggleSimulationButton').textContent = 'Stop Fishtank';
    }
});