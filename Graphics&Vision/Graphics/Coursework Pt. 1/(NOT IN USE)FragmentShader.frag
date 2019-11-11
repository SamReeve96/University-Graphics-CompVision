precision mediump float;
varying vec2 vTextureCoordinates;
varying vec3 vNormalEye;
varying vec3 vPositionEye3;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform sampler2D uSampler;

const float shininess = 64.0;

void main() {
    //An alterenate way to calc (l)
    vec3 vectorToLightSource = normalize(uLightPosition - vPositionEye3);

    //Calculate the n Dot l for diffuse lighting
    float diffuseLightWeighting = max(dot(vNormalEye, vectorToLightSource), 0.0);

    //calculate the refelection vector (r) that is needed for the specular light.
    //Function() reflect is the GLSL function fot the calculation of the reflective of (r)
    vec3 reflectionVector = normalize(reflect(-vectorToLightSource, vNormalEye));

    //calculate the view vector (v) (origin aka (0.0, 0.0, 0.0, 0.0) - vPositionEye3)
    vec3 viewVectorEye = -normalize(vPositionEye3);
    float rdotv = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightWeighting = pow(rdotv, shininess);

    //Sum up all the refelection components and send to the fragment shader
    vec3 lightWeighting = uAmbientLightColor +
                        uDiffuseLightColor * diffuseLightWeighting +
                        uSpecularLightColor * specularLightWeighting;

    vec4 texelColour = texture2D(uSampler, vTextureCoordinates);
    gl_FragColor = vec4(lightWeighting.rgb * texelColour.rgb, texelColour.a);
} 