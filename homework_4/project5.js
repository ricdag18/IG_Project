// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	const cx = Math.cos(rotationX), sx = Math.sin(rotationX);
	const cy = Math.cos(rotationY), sy = Math.sin(rotationY);

	const rotXMat = [
		1, 0, 0, 0,
		0, cx, sx, 0,
		0, -sx, cx, 0,
		0, 0, 0, 1
	];

	const rotYMat = [
		cy, 0, -sy, 0,
		0, 1, 0, 0,
		sy, 0, cy, 0,
		0, 0, 0, 1
	];

	const transMat = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	let mv = MatrixMult(transMat, rotYMat);
	mv = MatrixMult(mv, rotXMat);
	return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	constructor()
	{
		// Shader setup
		this.prog = InitShaderProgram(meshVS, meshFS);
		gl.useProgram(this.prog);

		// Uniforms
		this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
		this.mvLoc = gl.getUniformLocation(this.prog, "mv");
		this.texLoc = gl.getUniformLocation(this.prog, "sampler");
		this.normLoc = gl.getUniformLocation(this.prog, "normalMatrix");

		this.lightDir = gl.getUniformLocation(this.prog, "lightDir");
		this.shin = gl.getUniformLocation(this.prog, "shininess");

		// Attributes
		this.vertexPos = gl.getAttribLocation(this.prog, "vertPos");
		this.texCoord = gl.getAttribLocation(this.prog, "vertTexCoord");
		this.norm = gl.getAttribLocation(this.prog, "vertNormal");

		// Buffers
		this.vertexBuffer = gl.createBuffer();
		this.texBuffer = gl.createBuffer();
		this.normBuffer = gl.createBuffer();

		// UI state uniforms
		this.swapLoc = gl.getUniformLocation(this.prog, "useSwap");
		this.showText = gl.getUniformLocation(this.prog, "showText");
	}

	setMesh(vertPos, texCoords, normals)
	{
		this.numTriangles = vertPos.length / 3;

		// Position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Texture coordinate buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		// Normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}

	swapYZ(swap)
	{
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapLoc, swap ? 1 : 0);
	}

	draw(matrixMVP, matrixMV, matrixNormal)
	{
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);
		gl.uniformMatrix3fv(this.normLoc, false, matrixNormal);

		// Vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(this.vertexPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertexPos);

		// Texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoord);

		// Normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.vertexAttribPointer(this.norm, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.norm);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	setTexture(img)
	{
		gl.useProgram(this.prog);

		const mytex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, mytex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, mytex);
		gl.uniform1i(this.texLoc, 0);
		gl.uniform1i(this.showText, 1); // Ensure texture is visible after loading
	}

	showTexture(show)
	{
		gl.useProgram(this.prog);
		gl.uniform1i(this.showText, show ? 1 : 0);
	}

	setLightDir(x, y, z)
	{
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDir, x, y, z);
	}

	setShininess(shininess)
	{
		gl.useProgram(this.prog);
		gl.uniform1f(this.shin, shininess);
	}
}


var meshVS = `
attribute vec3 vertPos;
attribute vec3 vertNormal;
attribute vec2 vertTexCoord;

uniform mat4 mvp;
uniform mat4 mv;
uniform mat3 normalMatrix;
varying vec2 fragTexCoord;
varying vec3 viewNormal;
varying vec3 fragPos;
uniform bool useSwap;
const mat4 SWAP = mat4(
    1, 0,  0, 0,
    0, 0, 1, 0,
    0, 1,  0, 0,
    0, 0,  0, 1 );
void main()
{
    vec4 pos = vec4(vertPos, 1.0);

    mat4 M  = useSwap ? mv  * SWAP : mv;   
    mat4 MVP= useSwap ? mvp * SWAP : mvp;  

    fragPos    = vec3(M * pos);
    viewNormal = normalize(normalMatrix * (useSwap ? mat3(SWAP) * vertNormal
                                                   : vertNormal));

    gl_Position = MVP * pos;
    fragTexCoord = vertTexCoord;
}
`;


var meshFS =  `
precision mediump float;

varying vec2 fragTexCoord;
varying vec3 viewNormal;
varying vec3 fragPos;

uniform sampler2D sampler;
uniform vec3  lightDir;
uniform float shininess;
uniform bool  showText;

void main()
{
    vec3 N = normalize(viewNormal);
    vec3 L = normalize(lightDir);
    vec3 V = normalize(-fragPos);
    vec3 H = normalize(L + V);

    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), shininess);

    vec3 Kd = showText ? texture2D(sampler, fragTexCoord).rgb : vec3(1.0);
    vec3 Ks = vec3(1.0);
    vec3 ambient = 0.1 * Kd;

    gl_FragColor = vec4(ambient + diff * Kd + spec * Ks, 1.0);
}
`;
