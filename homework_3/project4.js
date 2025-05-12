function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY)
{
    var cosX = Math.cos(rotationX);
    var sinX = Math.sin(rotationX);
    var cosY = Math.cos(rotationY);
    var sinY = Math.sin(rotationY);

    var rotXMatrix = [
        1,    0,     0,     0,
        0,  cosX,  sinX,    0,
        0, -sinX,  cosX,    0,
        0,    0,     0,     1
    ];

    var rotYMatrix = [
        cosY,  0, -sinY,  0,
        0,     1,     0,  0,
        sinY,  0,  cosY,  0,
        0,     0,     0,  1
    ];

    var transMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    var rotXY   = MatrixMult(rotYMatrix, rotXMatrix);
    var modelMatrix = MatrixMult(transMatrix, rotXY);
    var mvp     = MatrixMult(projectionMatrix, modelMatrix);

    return mvp;
}

var meshVS = `
    uniform mat4 mvp;
    uniform int Axis_Swap;
    attribute vec2 text_coord;
    attribute vec3 vertex;
    varying vec2 texCoord_varying;
    void main()
    {
        vec4 new_vert = vec4(vertex, 1.0);
        if (Axis_Swap == 1) {
            float temp = new_vert.y;
            new_vert.y = new_vert.z;
            new_vert.z = temp;
        }
        gl_Position = mvp * new_vert;
        texCoord_varying = text_coord;
    }
`;

var meshFS = `
    precision mediump float;
    uniform sampler2D tex_sampler;
    uniform int show_tex;
    varying vec2 texCoord_varying;
    void main()
    {
        if (show_tex == 1) {
            gl_FragColor = texture2D(tex_sampler, texCoord_varying);
        } else {
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        }
    }
`;

class MeshDrawer
{
    constructor()
    {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvpUniform = gl.getUniformLocation(this.prog, 'mvp');
        this.axisSwapUniform = gl.getUniformLocation(this.prog, 'Axis_Swap');
        this.samplerUniform = gl.getUniformLocation(this.prog, 'tex_sampler');
        this.showTexUniform = gl.getUniformLocation(this.prog, 'show_tex');
        this.vertexAttrib = gl.getAttribLocation(this.prog, 'vertex');
        this.texCoordAttrib = gl.getAttribLocation(this.prog, 'text_coord');
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.glTexture = null;
        this.numVertices = 0;
        gl.useProgram(this.prog);
        gl.uniform1i(this.axisSwapUniform, 0);
        gl.uniform1i(this.showTexUniform, 1);
    }

    setMesh(vertPos, texCoords)
    {
        this.numVertices = vertPos.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    }

    swapYZ(swap)
    {
        gl.useProgram(this.prog);
        gl.uniform1i(this.axisSwapUniform, swap ? 1 : 0);
    }

    draw(trans)
    {
        if (this.numVertices === 0) return;
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvpUniform, false, trans);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoordAttrib);
        if (this.glTexture && this.showTexUniform) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
            gl.uniform1i(this.samplerUniform, 0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
        gl.disableVertexAttribArray(this.vertexAttrib);
        gl.disableVertexAttribArray(this.texCoordAttrib);
    }

    setTexture(img)
    {
        gl.useProgram(this.prog);
        if (!this.glTexture) {
            this.glTexture = gl.createTexture();
        }
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.uniform1i(this.samplerUniform, 0);
        gl.uniform1i(this.showTexUniform, 1);
    }

    showTexture(show)
    {
        gl.useProgram(this.prog);
        gl.uniform1i(this.showTexUniform, show ? 1 : 0);
    }
}
