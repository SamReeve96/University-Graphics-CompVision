attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoordinates;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec2 vTextureCoordinates;
varying vec3 vNormalEye;
varying vec3 vPositionEye3;

void main() {
    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    vNormalEye = normalize(uNMatrix * aVertexNormal);

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoordinates = aTextureCoordinates;
}