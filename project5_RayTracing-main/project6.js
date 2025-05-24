var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// shades the given point and returns the computed color
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		// TO-DO: If not shadowed, perform shading using the Blinn model
		// If the ray hits something before reaching the light the point is in shadow
		// calculate light direction and check for shadows
		vec3 L = normalize(lights[i].position - position);
		float shadow = 1.0;
		
		Ray shadowRay;
		// offset to avoid self-shadowing
		shadowRay.pos = position + normal * 0.001; 
		shadowRay.dir = L;
		HitInfo shadowHit;
		
		if (IntersectRay(shadowHit, shadowRay)) {
			float distToLight = length(lights[i].position - position);
			if (shadowHit.t < distToLight) {
				shadow = 0.0;
			}
		}
		
		if (shadow > 0.0) {
			// diffuse component
			float NdotL = max(dot(normal, L), 0.0);
			vec3 diffuse = mtl.k_d * NdotL;
			
			// specular component (blinn-phong)
			vec3 H = normalize(L + view);
			float NdotH = max(dot(normal, H), 0.0);
			vec3 specular = mtl.k_s * pow(NdotH, mtl.n);
			
			color += (diffuse + specular) * lights[i].intensity * shadow;
		}
	}
	
	return color;
}

// intersects the given ray with all spheres in the scene
// and updates the given hitinfo using the information of the sphere
// that first intersects with the ray
// returns true if an intersection is found
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	
	for ( int i=0; i<NUM_SPHERES; ++i ) {
	// TO-DO: Test for ray-sphere intersection
	//we analyze each sphere in the scene

		// calculate ray-sphere intersection
		vec3 oc = ray.pos - spheres[i].center;
		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(oc, ray.dir);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
		float discriminant = b * b - 4.0 * a * c;

		// as per the quadratic formula, we calculate the discriminant
		// in order to find the intersection point
		// we also take the smallest positive t value
		// TO-DO: If intersection is found, update the given HitInfo
		if (discriminant > 0.0) {
			float t = (-b - sqrt(discriminant)) / (2.0 * a);
			if (t > 0.0 && t < hit.t) {
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// given a ray, returns the shaded color where the ray intersects a sphere
// if the ray does not hit a sphere, returns the environment color
vec4 RayTracer( Ray ray )
{
	HitInfo hit;

	// we check if the ray intersects a sphere

	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );

		// we shade the hit point if there is an intersection

		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// compute reflections

		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
		// for each bounce, we compute the reflection ray, if k_s>0

			if ( bounce >= bounceLimit ) break;

			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			// if the material is not reflective, we break

			Ray r;  // reflection ray
			HitInfo h;  // reflection hit info

			// TO-DO: Initialize the reflection ray
			// initialize reflection ray
			r.pos = hit.position + hit.normal * 0.001; // offset to avoid self-intersection
			r.dir = reflect(ray.dir, hit.normal);
			
			if ( IntersectRay( h, r ) ) {
				// hit found, shade the hit point
				// we detect a new hit point, and we shade it
				vec3 view = normalize(-r.dir);
				vec3 reflectionColor = Shade(h.mtl, h.position, h.normal, view);
				clr += k_s * reflectionColor;
				
				// update for next bounce
				hit = h;
				ray = r;
				k_s *= h.mtl.k_s;
			} else {
				// no intersection, use environment map
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;
			}
		}
		return vec4( clr, 1 );
	} else {
	 // if the ray does not hit a sphere, we return the environment color, using the environment map
	// in order to get the color of the environment

		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );
	}
}

//cam -> (sphere)
       //  reflection 1 -> (another sphere)
        //     reflection 2 -> (empty)
        //         else     ->  envMap

`;