let glContext;
let canvas;

let glProperties = {};
glProperties.ongoingImageLoads = [];
glProperties.listOfPressedKeys = [];

// interaction variables
let transX = transY = transZ = xRot = yRot = xOffs = yOffs = drag = 0;

// Camera constants
const camera = {
    FOV: 70,
    near: 0.1,
    far: 1000
};

// create the context for the webGL program, selecting whichever version
function createGlContext(canvas) {
    let names = ["webgl", "experimental-webgl"];
    let context = null;
    for (let i = 0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch (e) {}
        if (context) {
            break;
        }
    }

    // Set the size of the canvas to almost be the full size of the window
    // Allowing space for the FPS counter 
    // (used to inform the user if an error occurred without opening dev tools)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.95;

    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
        alert("Failed to create WebGL context!");
    }
    return context;
}

// Load the shader scripts from the DOM and compile to shader objects
function loadShaderFromDOM(id) {
    let shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    //Shader script
    let shaderSource = "";
    let currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) {
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }

    //Shader object to return
    let shader;

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = glContext.createShader(glContext.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = glContext.createShader(glContext.VERTEX_SHADER);
    } else {
        return null;
    }

    glContext.shaderSource(shader, shaderSource);
    glContext.compileShader(shader);

    if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        alert(glContext.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

//Setup variables that will be used by the shader programs
function setupShaders() {
    var vertexShader = loadShaderFromDOM("shader-vs");
    var fragmentShader = loadShaderFromDOM("shader-fs");

    var shaderProgram = glContext.createProgram();
    glContext.attachShader(shaderProgram, vertexShader);
    glContext.attachShader(shaderProgram, fragmentShader);
    glContext.linkProgram(shaderProgram);

    if (!glContext.getProgramParameter(shaderProgram, glContext.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    glContext.useProgram(shaderProgram);

    glProperties.vertexPositionAttributeLoc = glContext.getAttribLocation(shaderProgram, "aVertexPosition");
    glProperties.uniformMVMatrixLoc = glContext.getUniformLocation(shaderProgram, "uMVMatrix");
    glProperties.uniformProjMatrixLoc = glContext.getUniformLocation(shaderProgram, "uPMatrix");

    glProperties.vertexTextureAttributeLoc = glContext.getAttribLocation(shaderProgram, "aTextureCoordinates");
    glProperties.uniformSamplerLoc = glContext.getUniformLocation(shaderProgram, "uSampler");

    glProperties.uniformNormalMatrixLoc = glContext.getUniformLocation(shaderProgram, "uNMatrix");
    glProperties.vertexNormalAttributeLoc = glContext.getAttribLocation(shaderProgram, "aVertexNormal");

    glProperties.uniformLightPositionLoc = glContext.getUniformLocation(shaderProgram, "uLightPosition");
    glProperties.uniformAmbientLightColorLoc = glContext.getUniformLocation(shaderProgram, "uAmbientLightColor");
    glProperties.uniformDiffuseLightColorLoc = glContext.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    glProperties.uniformSpecularLightColorLoc = glContext.getUniformLocation(shaderProgram, "uSpecularLightColor");

    glContext.enableVertexAttribArray(glProperties.vertexNormalAttributeLoc);
    glContext.enableVertexAttribArray(glProperties.vertexPositionAttributeLoc);
    glContext.enableVertexAttribArray(glProperties.vertexTextureAttributeLoc);

    //Initialize the matrices
    glProperties.modelViewMatrix = mat4.create();
    glProperties.projectionMatrix = mat4.create();
    glProperties.modelViewMatrixStack = [];
}

//Setup Positions, indices, textures and normals for a cube object
function setupCubeBuffers() {
    //Create position buffer
    glProperties.cubeVertexPositionBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.cubeVertexPositionBuffer);

    //Setup the cube to be a 1x1x1 size, if an instance of a cube needs to be bigger or smaller, it should be transformed
    var cubeVertexPosition = [

        // Front face
        1.0, 1.0, 1.0, //v0
        -1.0, 1.0, 1.0, //v1
        -1.0, -1.0, 1.0, //v2
        1.0, -1.0, 1.0, //v3

        // Back face
        1.0, 1.0, -1.0, //v4
        -1.0, 1.0, -1.0, //v5
        -1.0, -1.0, -1.0, //v6
        1.0, -1.0, -1.0, //v7

        // Left face
        -1.0, 1.0, 1.0, //v8
        -1.0, 1.0, -1.0, //v9
        -1.0, -1.0, -1.0, //v10
        -1.0, -1.0, 1.0, //v11      

        // Right face
        1.0, 1.0, 1.0, //12
        1.0, -1.0, 1.0, //13
        1.0, -1.0, -1.0, //14
        1.0, 1.0, -1.0, //15

        // Top face
        1.0, 1.0, 1.0, //v16
        1.0, 1.0, -1.0, //v17
        -1.0, 1.0, -1.0, //v18
        -1.0, 1.0, 1.0, //v19

        // Bottom face
        1.0, -1.0, 1.0, //v20
        1.0, -1.0, -1.0, //v21
        -1.0, -1.0, -1.0, //v22
        -1.0, -1.0, 1.0, //v23
    ];

    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(cubeVertexPosition), glContext.STATIC_DRAW);

    glProperties.CUBE_VERTEX_POS_BUF_ITEM_SIZE = 3;

    //Create indices buffer
    glProperties.cubeVertexIndexBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, glProperties.cubeVertexIndexBuffer);

    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3, // Front face
        4, 6, 5, 4, 7, 6, // Back face
        8, 9, 10, 8, 10, 11, // Left face
        12, 13, 14, 12, 14, 15, // Right face
        16, 17, 18, 16, 18, 19, // Top face
        20, 22, 21, 20, 23, 22 // Bottom face
    ];

    glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), glContext.STATIC_DRAW);
    glProperties.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS = 36;

    // Create texture coordinates buffer
    glProperties.cubeVertexTextureCoordinateBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.cubeVertexTextureCoordinateBuffer);

    var cubeTextureCoordinates = [
        //Yellow (when using sattest.png)
        0.0, 0.0, //v0
        0.0, 0.5, //v1
        0.25, 0.5, //v2
        0.25, 0.0, //v3

        // Red (when using sattest.png)
        0.25, 0.5, //v4
        0.25, 1, //v5
        0.5, 1, //v6
        0.5, 0.5, //v7

        // Black (when using sattest.png)
        0.0, 0.5, //v1
        0.0, 1, //v5
        0.25, 1, //v6
        0.25, 0.5, //v2

        // Purple (when using sattest.png)
        0.5, 0.5, //v0
        0.5, 1, //v3
        0.75, 1, //v7
        0.75, 0.5, //v4

        // Green (when using sattest.png)
        0.25, 0.0, //v0
        0.25, 0.5, //v4
        0.5, 0.5, //v5
        0.5, 0.0, //v1

        // Teal/Cyan (when using sattest.png)
        0.5, 0.0, //v3
        0.5, 0.5, //v7
        0.75, 0.5, //v6
        0.75, 0.0, //v2
    ];

    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(cubeTextureCoordinates), glContext.STATIC_DRAW);
    glProperties.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;

    // Create normals buffer
    glProperties.cubeVertexNormalBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.cubeVertexNormalBuffer);
    var cubeVertexNormals = [
        // Front face
        0.0, 0.0, 1.0, //v0
        0.0, 0.0, 1.0, //v1
        0.0, 0.0, 1.0, //v2
        0.0, 0.0, 1.0, //v3

        // Back face
        0.0, 0.0, -1.0, //v4
        0.0, 0.0, -1.0, //v5
        0.0, 0.0, -1.0, //v6
        0.0, 0.0, -1.0, //v7

        // Left face
        -1.0, 0.0, 0.0, //v1
        -1.0, 0.0, 0.0, //v5
        -1.0, 0.0, 0.0, //v6
        -1.0, 0.0, 0.0, //v2

        // Right face
        1.0, 0.0, 0.0, //0
        1.0, 0.0, 0.0, //3
        1.0, 0.0, 0.0, //7
        1.0, 0.0, 0.0, //4

        // Top face
        0.0, 1.0, 0.0, //v0
        0.0, 1.0, 0.0, //v4
        0.0, 1.0, 0.0, //v5
        0.0, 1.0, 0.0, //v1

        // Bottom face
        0.0, -1.0, 0.0, //v3
        0.0, -1.0, 0.0, //v7
        0.0, -1.0, 0.0, //v6
        0.0, -1.0, 0.0, //v2
    ];

    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(cubeVertexNormals), glContext.STATIC_DRAW);
    glProperties.CUBE_VERTEX_NORMAL_BUF_ITEM_SIZE = 3;
}

// Setup Positions, indices, textures and normals for a sphere object
function setupSphereBuffers() {
    // Sphere latitude and longitude variables, can be increased for higher res sphere model
    // at cost of performance or potential out of memory crash
    let totalLatRings = 100;
    let totalLongRings = 100;

    // Default sphere size, instances of spheres should be transformed to change size.
    let radius = 1;

    // Calculate Sphere vertex positions, Texture coordinates and normals
    let sphereVertexPosition = [];
    let sphereTextureCoordinates = [];
    let sphereVertexNormals = [];

    for (let latRing = 0; latRing <= totalLatRings; ++latRing) {
        for (let longRing = 0; longRing <= totalLongRings; ++longRing) {
            let theta = (latRing * Math.PI / totalLatRings) // if you want a semi sphere * 0.5;

            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);
            let phi = longRing * 2 * Math.PI / totalLongRings;

            let x = Math.cos(phi) * sinTheta;
            let y = cosTheta;
            let z = Math.sin(phi) * sinTheta;

            sphereVertexPosition.push(radius * x);
            sphereVertexPosition.push(radius * y);
            sphereVertexPosition.push(radius * z);

            sphereTextureCoordinates.push(1 - (longRing / totalLongRings));
            sphereTextureCoordinates.push(1 - (latRing / totalLatRings));

            sphereVertexNormals.push(x);
            sphereVertexNormals.push(y);
            sphereVertexNormals.push(z);
        }
    }

    // Create position buffer
    glProperties.sphereVertexPositionBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.sphereVertexPositionBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(sphereVertexPosition), glContext.STATIC_DRAW);
    glProperties.SPHERE_VERTEX_POS_BUF_ITEM_SIZE = 3;

    // Create texture coordinates buffer
    glProperties.sphereVertexTextureCoordinateBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.sphereVertexTextureCoordinateBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(sphereTextureCoordinates), glContext.STATIC_DRAW);
    glProperties.SPHERE_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;

    // Create normals buffer
    glProperties.sphereVertexNormalBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.sphereVertexNormalBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(sphereVertexNormals), glContext.STATIC_DRAW);
    glProperties.SPHERE_VERTEX_NORMAL_BUF_ITEM_SIZE = 3;

    // Calculate sphere indices
    let sphereIndices = [];

    for (let latRing = 0; latRing < totalLatRings; ++latRing) {
        for (let longRing = 0; longRing < totalLongRings; ++longRing) {
            let v1 = (latRing * (totalLongRings + 1)) + longRing; //index of vi,j  
            let v2 = v1 + totalLongRings + 1; //index of vi+1,j
            let v3 = v1 + 1; //index of vi,j+1 
            let v4 = v2 + 1; //index of vi+1,j+1

            //Triangle 1
            sphereIndices.push(v1);
            sphereIndices.push(v2);
            sphereIndices.push(v3);

            //Triangle 2
            sphereIndices.push(v3);
            sphereIndices.push(v2);
            sphereIndices.push(v4);
        }
    }

    // Create index buffer
    glProperties.sphereVertexIndexBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, glProperties.sphereVertexIndexBuffer);
    glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereIndices), glContext.STATIC_DRAW);
    glProperties.SPHERE_VERTEX_INDEX_BUF_NUM_ITEMS = sphereIndices.length;

}

// Setup Positions, indices, textures and normals for a dish object
function setupDishBuffers() {
    // Dish latitude and longitude variables, can be increased for higher res dish model
    // at cost of performance or potential out of memory crash
    let totalLatRings = 100;
    let totalLongRings = 100;

    // Default dish size, instances of dishes should be transformed to change size.
    let radius = 1;

    // Calculate Dish vertex positions, Texture coordinates and normals
    let dishVertexPosition = [];
    let dishTextureCoordinates = [];
    let dishVertexNormals = [];

    for (let latRing = 0; latRing <= totalLatRings; ++latRing) {
        for (let longRing = 0; longRing <= totalLongRings; ++longRing) {
            let theta = (latRing * Math.PI / totalLatRings) * 0.5

            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);
            let phi = longRing * 2 * Math.PI / totalLongRings;

            let x = Math.cos(phi) * sinTheta;
            let y = cosTheta;
            let z = Math.sin(phi) * sinTheta;

            dishVertexPosition.push(radius * x);
            dishVertexPosition.push(radius * y);
            dishVertexPosition.push(radius * z);

            dishTextureCoordinates.push(1 - (longRing / totalLongRings));
            dishTextureCoordinates.push(1 - (latRing / totalLatRings));

            dishVertexNormals.push(x);
            dishVertexNormals.push(y);
            dishVertexNormals.push(z);
        }
    }

    // Create position buffer
    glProperties.dishVertexPositionBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.dishVertexPositionBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(dishVertexPosition), glContext.STATIC_DRAW);
    glProperties.DISH_VERTEX_POS_BUF_ITEM_SIZE = 3;

    // Create texture coordinate buffer
    glProperties.dishVertexTextureCoordinateBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.dishVertexTextureCoordinateBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(dishTextureCoordinates), glContext.STATIC_DRAW);
    glProperties.DISH_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
    glProperties.DISH_VERTEX_TEX_COORD_BUF_NUM_ITEMS = dishTextureCoordinates.length / glProperties.DISH_VERTEX_TEX_COORD_BUF_ITEM_SIZE;

    // Create normals buffer
    glProperties.dishVertexNormalBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.dishVertexNormalBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(dishVertexNormals), glContext.STATIC_DRAW);
    glProperties.DISH_VERTEX_NORMAL_BUF_ITEM_SIZE = 3;
    glProperties.DISH_VERTEX_NORMAL_BUF_NUM_ITEMS = dishVertexNormals.length / glProperties.DISH_VERTEX_NORMAL_BUF_ITEM_SIZE;

    // Calculate dish indices.
    let dishIndices = [];

    for (let latRing = 0; latRing < totalLatRings; ++latRing) {
        for (let longRing = 0; longRing < totalLongRings; ++longRing) {
            let v1 = (latRing * (totalLongRings + 1)) + longRing; //index of vi,j  
            let v2 = v1 + totalLongRings + 1; //index of vi+1,j
            let v3 = v1 + 1; //index of vi,j+1 
            let v4 = v2 + 1; //index of vi+1,j+1

            //Triangle 1
            dishIndices.push(v1);
            dishIndices.push(v2);
            dishIndices.push(v3);

            //Triangle 2
            dishIndices.push(v3);
            dishIndices.push(v2);
            dishIndices.push(v4);
        }
    }

    // Create dish index buffer
    glProperties.dishVertexIndexBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, glProperties.dishVertexIndexBuffer);
    glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(dishIndices), glContext.STATIC_DRAW);
    glProperties.dishVertexIndexBuffer.DISH_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
    glProperties.dishVertexIndexBuffer.DISH_VERTEX_INDEX_BUF_NUM_ITEMS = dishIndices.length;
}


//Setup all generic object buffers
function setupBuffers() {
    setupCubeBuffers();
    setupSphereBuffers();
    setupDishBuffers();
}


//Setup Lighting properties
function setupLights() {
    glContext.uniform3fv(glProperties.uniformLightPositionLoc, [500, 866.66, 0.0]);
    glContext.uniform3fv(glProperties.uniformAmbientLightColorLoc, [0.2, 0.2, 0.2]);
    glContext.uniform3fv(glProperties.uniformDiffuseLightColorLoc, [0.7, 0.7, 0.7]);
    glContext.uniform3fv(glProperties.uniformSpecularLightColorLoc, [0.8, 0.8, 0.8]);
}

// Create texture property variables
function setupTextures() {
    // Texture for the earth
    glProperties.earthTexture = glContext.createTexture();
    loadImageForTexture('earth.jpg', glProperties.earthTexture);

    // Texture for satellite
    glProperties.satelliteTexture = glContext.createTexture();
    loadImageForTexture('satellite.png', glProperties.satelliteTexture)

    /* Comment out the loadImageForTexture method above and uncomment the one below to see how each face of the cube
       is correctly mapped against a test image where each cube face is a different colour */
    //loadImageForTexture('sattest.png', glProperties.satelliteTexture)
}

// load image file for texture
function loadImageForTexture(url, texture) {
    var image = new Image();

    // Add image to list of ongoing images being loaded, once loaded remove from the list
    image.onload = function () {
        glProperties.ongoingImageLoads.splice(glProperties.ongoingImageLoads.indexOf(image), 1);
        textureFinishedLoading(image, texture);
    }
    glProperties.ongoingImageLoads.push(image);
    image.src = url;
}

// Once the texture is finished loading, setup texture properties
function textureFinishedLoading(image, texture) {
    glContext.bindTexture(glContext.TEXTURE_2D, texture);
    glContext.pixelStorei(glContext.UNPACK_FLIP_Y_WEBGL, true);
    glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, glContext.RGBA, glContext.UNSIGNED_BYTE, image);

    // Check if the image being used as a texture has dimensions that are a power of two and setup the texture accordingly
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Is a power of 2, generate mipmap
        glContext.generateMipmap(glContext.TEXTURE_2D);

        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.LINEAR);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.LINEAR);

        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.MIRRORED_REPEAT);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.MIRRORED_REPEAT);
    } else {
        // Not a power of 2. Turn off mips and set wrapping to clamp to edge
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.LINEAR);
    }

    glContext.bindTexture(glContext.TEXTURE_2D, null);
}

// Check if value given is a power of two
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

// Push a modelView altering matrix to the stack
function pushModelViewMatrix() {
    var copyToPush = mat4.create(glProperties.modelViewMatrix);
    glProperties.modelViewMatrixStack.push(copyToPush);
}

// Pop a modelView altering matrix from the stack
function popModelViewMatrix() {
    if (glProperties.modelViewMatrixStack.length == 0) {
        throw "Error popModelViewMatrix() - Stack was empty ";
    }
    glProperties.modelViewMatrix = glProperties.modelViewMatrixStack.pop();
}

// Upload modelview matrix values to the shader
function uploadModelViewMatrixToShader() {
    glContext.uniformMatrix4fv(glProperties.uniformMVMatrixLoc, false, glProperties.modelViewMatrix);
}

// Upload normal matrix values to the shader
function uploadNormalMatrixToShader() {
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(glProperties.modelViewMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    glContext.uniformMatrix3fv(glProperties.uniformNormalMatrixLoc, false, normalMatrix);
}

// Upload projection matrix values to the shader
function uploadProjectionMatrixToShader() {
    glContext.uniformMatrix4fv(glProperties.uniformProjMatrixLoc, false, glProperties.projectionMatrix);
}

// Draw a cube using the buffers
function drawCube(texture, r = 255, g = 0, b = 0, a = 1) {
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.cubeVertexPositionBuffer);
    glContext.vertexAttribPointer(glProperties.vertexPositionAttributeLoc, glProperties.CUBE_VERTEX_POS_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.cubeVertexNormalBuffer);
    glContext.vertexAttribPointer(glProperties.vertexNormalAttributeLoc, glProperties.CUBE_VERTEX_NORMAL_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.cubeVertexTextureCoordinateBuffer);
    glContext.vertexAttribPointer(glProperties.vertexTextureAttributeLoc, glProperties.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    // If a texture is not defined, use RGBA values.
    // If RGBA values are not provided by method call, use default red RGBA values 
    // A red object then informs the user there is a texture issue, rather than something else where the object isn't drawn
    if (texture !== undefined) {
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, texture);
    } else {
        let colourTex = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, colourTex);
        let colourPixel = new Uint8Array([r, g, b, a]);
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, 1, 1, 0, glContext.RGBA, glContext.UNSIGNED_BYTE, colourPixel);
    }

    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, glProperties.cubeVertexIndexBuffer);
    glContext.drawElements(glContext.TRIANGLES, glProperties.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS, glContext.UNSIGNED_SHORT, 0);
}

// Draw a sphere using the buffers
function drawSphere(texture, r = 255, g = 0, b = 0, a = 1) {
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.sphereVertexPositionBuffer);
    glContext.vertexAttribPointer(glProperties.vertexPositionAttributeLoc, glProperties.SPHERE_VERTEX_POS_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.sphereVertexNormalBuffer);
    glContext.vertexAttribPointer(glProperties.vertexNormalAttributeLoc, glProperties.SPHERE_VERTEX_NORMAL_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.sphereVertexTextureCoordinateBuffer);
    glContext.vertexAttribPointer(glProperties.vertexTextureAttributeLoc, glProperties.SPHERE_VERTEX_TEX_COORD_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    // If a texture is not defined, use RGBA values.
    // If RGBA values are not provided by method call, use default red RGBA values 
    // A red object then informs the user there is a texture issue, rather than something else where the object isn't drawn
    if (texture !== undefined) {
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, texture);
    } else {
        let colourTex = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, colourTex);
        let colourPixel = new Uint8Array([r, g, b, a]);
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, 1, 1, 0, glContext.RGBA, glContext.UNSIGNED_BYTE, colourPixel);
    }

    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, glProperties.sphereVertexIndexBuffer);
    glContext.drawElements(glContext.TRIANGLES, glProperties.SPHERE_VERTEX_INDEX_BUF_NUM_ITEMS, glContext.UNSIGNED_SHORT, 0);
}

// Draw a sphere using the buffers
function drawDish(texture, r = 255, g = 0, b = 0, a = 1) {
    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.dishVertexPositionBuffer);
    glContext.vertexAttribPointer(glProperties.vertexPositionAttributeLoc, glProperties.DISH_VERTEX_POS_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.dishVertexNormalBuffer);
    glContext.vertexAttribPointer(glProperties.vertexNormalAttributeLoc, glProperties.DISH_VERTEX_NORMAL_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, glProperties.dishVertexTextureCoordinateBuffer);
    glContext.vertexAttribPointer(glProperties.vertexTextureAttributeLoc, glProperties.DISH_VERTEX_TEX_COORD_BUF_ITEM_SIZE, glContext.FLOAT, false, 0, 0);

    // If a texture is not defined, use RGBA values.
    // If RGBA values are not provided by method call, use default red RGBA values 
    // A red object then informs the user there is a texture issue, rather than something else where the object isn't drawn
    if (texture !== undefined) {
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, texture);
    } else {
        var colourTex = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, colourTex);
        var colourPixel = new Uint8Array([r, g, b, a]);
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, 1, 1, 0, glContext.RGBA, glContext.UNSIGNED_BYTE, colourPixel);
    }

    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, glProperties.dishVertexIndexBuffer);
    glContext.drawElements(glContext.TRIANGLES, glProperties.dishVertexIndexBuffer.DISH_VERTEX_INDEX_BUF_NUM_ITEMS, glContext.UNSIGNED_SHORT, 0);
}

// Draw a satellite using the basic shape methods already defined
function drawSatellite(texture, r, g, b, a) {
    // Draw the satellite body
    pushModelViewMatrix();
    mat4.translate(glProperties.modelViewMatrix, [0.0, 0.0, 0.0], glProperties.modelViewMatrix);
    mat4.scale(glProperties.modelViewMatrix, [2.0, 2.0, 2.0], glProperties.modelViewMatrix);
    uploadModelViewMatrixToShader();
    drawCube(texture);
    popModelViewMatrix();

    // Draw two blue solar panels and two rods to attach the panels to the satellite body
    for (var i = -1; i <= 1; i += 2) {
        pushModelViewMatrix();
        mat4.translate(glProperties.modelViewMatrix, [0, 0, i * 5], glProperties.modelViewMatrix);
        mat4.scale(glProperties.modelViewMatrix, [1, 0.0, 2], glProperties.modelViewMatrix);
        uploadModelViewMatrixToShader();
        drawCube(undefined, 129, 212, 250, 1);
        popModelViewMatrix();

        pushModelViewMatrix();
        mat4.translate(glProperties.modelViewMatrix, [0, 0, i * 2.5], glProperties.modelViewMatrix);
        mat4.scale(glProperties.modelViewMatrix, [0.2, 0.2, 0.5], glProperties.modelViewMatrix);
        uploadModelViewMatrixToShader();
        drawCube(undefined, r, g, b, a);
        popModelViewMatrix();
    }

    // Draw satellite dish
    pushModelViewMatrix();
    mat4.translate(glProperties.modelViewMatrix, [-6.9, 0.0, 0.0], glProperties.modelViewMatrix);
    mat4.scale(glProperties.modelViewMatrix, [4.0, 4.0, 4.0], glProperties.modelViewMatrix);
    mat4.rotateX(glProperties.modelViewMatrix, 80, glProperties.modelViewMatrix);
    mat4.rotateZ(glProperties.modelViewMatrix, 80, glProperties.modelViewMatrix);
    uploadModelViewMatrixToShader();
    drawDish(undefined, r, g, b, a);
    popModelViewMatrix();

    // Draw rod that attaches the dish to the satellite body
    pushModelViewMatrix();
    mat4.translate(glProperties.modelViewMatrix, [-2.5, 0, 0], glProperties.modelViewMatrix);
    mat4.scale(glProperties.modelViewMatrix, [0.4, 0.2, 0.2], glProperties.modelViewMatrix);
    uploadModelViewMatrixToShader();
    drawCube(undefined, r, g, b, a);
    popModelViewMatrix();
}

// Draw a frame of the scene
function draw() {
    glContext.clearColor(0.0, 0.0, 0.0, 1);
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    glContext.viewport(0, 0, glContext.viewportWidth, glContext.viewportHeight);
    glProperties.requestId = requestAnimFrame(draw);

    // React to any interactions made by the user
    handlePressedDownKeys();

    var currentTime = Date.now();

    if (glProperties.animationStartTime === undefined) {
        glProperties.animationStartTime = currentTime;
    }

    // Update FPS if a second or more has passed since the last frame update
    if (currentTime - glProperties.previousFrameTimeStamp >= 1000) {
        glProperties.fpsCounter.innerHTML = glProperties.nbrOfFramesForFPS;
        glProperties.nbrOfFramesForFPS = 0;
        glProperties.previousFrameTimeStamp = currentTime;
    }

    // Translate the models by the values transX, transY and transZ
    mat4.translate(glProperties.modelViewMatrix, [transX, transY, transZ], glProperties.modelViewMatrix);

    // Rotate model view in X or Y directions by xRot and yRot respectively
    mat4.rotateX(glProperties.modelViewMatrix, xRot / 50, glProperties.modelViewMatrix);
    mat4.rotateY(glProperties.modelViewMatrix, yRot / 50, glProperties.modelViewMatrix);

    // Reset modifiers for next frame
    yRot = xRot = transX = transY = transZ = 0;

    // Draw the earth
    pushModelViewMatrix();
    // Calculate earth rotation position and rotate by however many degrees
    glProperties.earthAngle = -(currentTime - glProperties.animationStartTime) / 2000 * glProperties.earthRotationSpeed * Math.PI % (2 * Math.PI);
    mat4.rotateY(glProperties.modelViewMatrix, -glProperties.earthAngle, glProperties.modelViewMatrix);
    // Scale earth x10 in all dimensions so it is radius 10
    mat4.scale(glProperties.modelViewMatrix, [10.0, 10.0, 10.0], glProperties.modelViewMatrix)
    // Upload various matrices to the shader
    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadNormalMatrixToShader();
    // draw sphere with earth texture
    drawSphere(glProperties.earthTexture);
    popModelViewMatrix();

    // Draw satellite
    pushModelViewMatrix();
    //Calculate earth orbit position and rotate by however many degrees so the dish is still facing earth
    glProperties.satAngle = -(currentTime - glProperties.animationStartTime) / 2000 * glProperties.orbitSpeed * Math.PI % (2 * Math.PI);
    glProperties.satX = Math.cos(glProperties.satAngle) * glProperties.orbitRadius;
    glProperties.satZ = Math.sin(glProperties.satAngle) * glProperties.orbitRadius;
    mat4.translate(glProperties.modelViewMatrix, [glProperties.satX, glProperties.satY, glProperties.satZ], glProperties.modelViewMatrix);
    mat4.rotateY(glProperties.modelViewMatrix, -glProperties.satAngle, glProperties.modelViewMatrix);
    // Upload various matrices to the shader
    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadNormalMatrixToShader();
    // Draw satellite with a textured body, and golden rgba dish & rods (Solar panels are always light blue)
    drawSatellite(glProperties.satelliteTexture, 255, 215, 0, 1);
    popModelViewMatrix();

    //update the number of frames rendered for that second
    glProperties.nbrOfFramesForFPS++;
}

// Start the animation once the body is loaded
function startup() {
    canvas = document.getElementById("myGLCanvas");

    //Add event listeners
    canvas.addEventListener('web glContextlost', handleContextLost, false);
    canvas.addEventListener('web glContextrestored', handleContextRestored, false);
    window.addEventListener("resize", canvasResize, false);
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyup, false);
    canvas.addEventListener('mousemove', myMouseMove, false);
    canvas.addEventListener('mousedown', myMouseDown, false);
    canvas.addEventListener('mouseup', myMouseUp, false);
    canvas.addEventListener('DOMmouseScroll', wheelHandler, false);
    canvas.addEventListener('wheel', wheelHandler, {
        passive: false
    });

    init();
    draw();
}

// Initialize variables for the program
function init() {
    glContext = createGlContext(canvas);

    //Satellite properties
    glProperties.satX = 0.0;
    glProperties.satY = 0.0;
    glProperties.satZ = 0.0;
    glProperties.orbitRadius = 20.0;
    glProperties.minimumOrbitRadius = 17.0;
    glProperties.orbitSpeed = 0.3;
    glProperties.minimumOrbitSpeed = 0.1;
    glProperties.satAngle = 0.0;

    // Earth properties
    glProperties.earthRotationSpeed = 0.3;
    glProperties.earthAngle = 0.0;

    // Animation properties
    glProperties.fpsCounter = document.getElementById("fps");
    glProperties.animationStartTime = undefined;
    glProperties.nbrOfFramesForFPS = 0;
    glProperties.previousFrameTimeStamp = Date.now();

    // Setup model attributes
    setupShaders();
    setupBuffers();
    setupLights();
    setupTextures();
    glContext.enable(glContext.DEPTH_TEST);

    //Setup camera properties
    mat4.perspective(camera.FOV, glContext.viewportWidth / glContext.viewportHeight, camera.near, camera.far, glProperties.projectionMatrix);
    mat4.identity(glProperties.modelViewMatrix);
    mat4.lookAt([0, 0, 50], [0, 0, 0], [0, 1, 0], glProperties.modelViewMatrix);
}

// Triggered when the window is resized, update the size of the canvas and the aspect ratio
function canvasResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.95;
    glContext.viewportWidth = canvas.width;
    glContext.viewportHeight = canvas.height;
    mat4.perspective(camera.FOV, glContext.viewportWidth / glContext.viewportHeight, camera.near, camera.far, glProperties.projectionMatrix);
}

// handle any key being pressed down
function handlePressedDownKeys() {
    //Arrow up - increase orbit speed
    if (glProperties.listOfPressedKeys[38]) {
        glProperties.orbitSpeed += 0.1;
    }

    //Arrow down - decrease orbit speed
    if (glProperties.listOfPressedKeys[40]) {
        // minimum orbit speed to prevent stalling / reversing orbit direction
        if (glProperties.orbitSpeed > glProperties.minimumOrbitSpeed) {
            glProperties.orbitSpeed -= 0.1;
        }
    }

    //Arrow right - increase orbit radius
    if (glProperties.listOfPressedKeys[39]) {
        glProperties.orbitRadius += 0.1;
    }

    //Arrow left - decrease orbit radius 
    if (glProperties.listOfPressedKeys[37]) {
        //minimum orbit to prevent clipping with earth
        if (glProperties.orbitRadius > glProperties.minimumOrbitRadius) {
            glProperties.orbitRadius -= 0.1;
        }
    }
}

// Handle webGL context being lost
function handleContextLost(event) {
    event.preventDefault();
    cancelRequestAnimFrame(glProperties.requestId);

    // Ignore all ongoing image loads by removing their onload handler
    for (var i = 0; i < glProperties.ongoingImageLoads.length; i++) {
        glProperties.ongoingImageLoads[i].onload = undefined;
    }
    glProperties.ongoingImageLoads = [];
}

// Re-initialize variables when context is restored
function handleContextRestored(event) {
    init();
    glProperties.requestId = requestAnimFrame(draw, canvas);
}

// Set the keycode to true on the list of pressed keys (or add with true if not on the list)
function handleKeyDown(event) {
    glProperties.listOfPressedKeys[event.keyCode] = true;
}

// Set keycode to false for list of pressed keys
function handleKeyup(event) {
    glProperties.listOfPressedKeys[event.keyCode] = false;
}

// capture variables used when dragging the mouse
function myMouseDown(ev) {
    drag = true;
    xOffs = ev.clientX;
    yOffs = ev.clientY;
}

// set drag to 0 when no longer dragging the mouse
function myMouseUp(ev) {
    drag = false;
}

// Handle the mouse being moved
function myMouseMove(ev) {
    if (!drag) return;

    if (ev.shiftKey) {
        // if the shift key is pressed, move the object along the X-axis
        transX = +(ev.clientX - xOffs) / 10;
    } else if (ev.altKey) {
        // if the alt key is pressed, move the object along the Y-axis
        transY = -(ev.clientY - yOffs) / 10;
    } else {
        // else, rotate the object in both the X and Y axis
        yRot = -xOffs + ev.clientX;
        xRot = -yOffs + ev.clientY;
    }

    xOffs = ev.clientX;
    yOffs = ev.clientY;
}

// Handle the scrollwheel moving
function wheelHandler(ev) {
    // move the object along the Z-axis
    transZ = ev.deltaY / 10;
    ev.preventDefault();
}