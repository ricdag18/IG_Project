// generates a 3x3 transformation matrix in column-major order
// applies: scale → rotation (degrees) → translation
function GetTransform(posX, posY, rotationDeg, scale) {
    var radians = rotationDeg * Math.PI / 180;
    var cosTheta = Math.cos(radians);
    var sinTheta = Math.sin(radians);

    var matrix = [
        scale * cosTheta,  scale * sinTheta, 0,
       -scale * sinTheta, scale * cosTheta, 0,
        posX,              posY,             1
    ];

    return matrix;
}

// multiplies two 3x3 matrices (column-major)
// applies trans1, then trans2
function ApplyTransform(trans1, trans2) {
    var combined = [
        trans1[0] * trans2[0] + trans1[1] * trans2[3] + trans1[2] * trans2[6],
        trans1[0] * trans2[1] + trans1[1] * trans2[4] + trans1[2] * trans2[7],
        0,

        trans1[3] * trans2[0] + trans1[4] * trans2[3] + trans1[5] * trans2[6],
        trans1[3] * trans2[1] + trans1[4] * trans2[4] + trans1[5] * trans2[7],
        0,

        trans1[6] * trans2[0] + trans1[7] * trans2[3] + trans1[8] * trans2[6],
        trans1[6] * trans2[1] + trans1[7] * trans2[4] + trans1[8] * trans2[7],
        1
    ];

    return combined;
}
