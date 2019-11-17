var gl;
var pwgl = {};
var canvas;
var shaderProgram;
pwgl.ongoingImageLoads = [];

//Vars for translations and rotations
var transY = transZ = 0;
var xRot = yRot = xOffs = yOffs = drag = 0;
pwgl.listOfPressedKeys = [];

function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i = 0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch (e) { }
        if (context) {
            break;
        }
    }

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

function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }

    var shader;

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function setupShaders() {
    var vertexShader = loadShaderFromDOM("shader-vs");
    var fragmentShader = loadShaderFromDOM("shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);

    pwgl.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    pwgl.vertexTextureAttributeLoc = gl.getAttribLocation(shaderProgram, "aTextureCoordinates");
    pwgl.uniformSamplerLoc = gl.getUniformLocation(shaderProgram, "uSampler");
    //pwgl.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");

    pwgl.uniformMVMatrix = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    pwgl.uniformProjMatrix = gl.getUniformLocation(shaderProgram, "uPMatrix");

    gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
    //new Texture stuff
    gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);

    //Initalise the matricies
    pwgl.modelViewMatrix = mat4.create();
    pwgl.projectionMatrix = mat4.create();
    pwgl.modelViewMatrixStack = [];

}

function pushModelViewMatrix() {
    var copyToPush = mat4.create(pwgl.modelViewMatrix);
    pwgl.modelViewMatrixStack.push(copyToPush);
}

function popModelViewMatrix() {
    if (pwgl.modelViewMatrixStack.length == 0) {
        throw "Error popModelViewMatrix() - Stack was empty ";
    }
    pwgl.modelViewMatrix = pwgl.modelViewMatrixStack.pop();
}

function setupCubeBuffers() {
    pwgl.cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexPositionBuffer);

    //draw an illustration to understand the coordinates, if necessary
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

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexPosition), gl.STATIC_DRAW);

    pwgl.CUBE_VERTEX_POS_BUF_ITEM_SIZE = 3;
    pwgl.CUBE_VERTEX_POS_BUF_NUM_ITEMS = 24;

    pwgl.cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);

    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3,    // Front face
        4, 6, 5, 4, 7, 6,    // Back face
        8, 9, 10, 8, 10, 11,  // Left face
        12, 13, 14, 12, 14, 15, // Right face
        16, 17, 18, 16, 18, 19, // Top face
        20, 22, 21, 20, 23, 22  // Bottom face
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    pwgl.CUBE_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
    pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS = 36;

    // Setup buffer with texture coordinates
    pwgl.cubeVertexTextureCoordinateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexTextureCoordinateBuffer);

    // //Think about how the coordinates are assigned. Ref. vertex coords.
    var cubeTextureCoordinates = [
        //Front face
        0.0, 0.0, //v0
        1.0, 0.0, //v1
        1.0, 1.0, //v2
        0.0, 1.0, //v3

        // Back face
        0.0, 1.0, //v4
        1.0, 1.0, //v5
        1.0, 0.0, //v6
        0.0, 0.0, //v7

        // Left face
        0.0, 1.0, //v1
        1.0, 1.0, //v5
        1.0, 0.0, //v6
        0.0, 0.0, //v2

        // Right face
        0.0, 1.0, //v0
        1.0, 1.0, //v3
        1.0, 0.0, //v7
        0.0, 0.0, //v4

        // Top face
        0.0, 1.0, //v0
        1.0, 1.0, //v4
        1.0, 0.0, //v5
        0.0, 0.0, //v1

        // Bottom face
        0.0, 1.0, //v3
        1.0, 1.0, //v7
        1.0, 0.0, //v6
        0.0, 0.0, //v2
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeTextureCoordinates), gl.STATIC_DRAW);
    pwgl.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
    pwgl.CUBE_VERTEX_TEX_COORD_BUF_NUM_ITEMS = 24;
}

function setupSphereBuffers() {
    let totalLatRings = 50;
    let totalLongRings = 50;
    let radius = 1;
    let sphereVertexPosition = [];
    let sphereTextureCoordinates = [];
    let sphereIndices = [];

    //Create sphere position buffer
    pwgl.sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.sphereVertexPositionBuffer);

    pwgl.sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.sphereVertexIndexBuffer);

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
        }
    }

    // Calculate sphere indices.
    for (let latRing = 0; latRing < totalLatRings; ++latRing) {
        for (let longRing = 0; longRing < totalLongRings; ++longRing) {
            let v1 = (latRing * (totalLongRings + 1)) + longRing;  //index of vi,j  
            let v2 = v1 + totalLongRings + 1;                      //index of vi+1,j
            let v3 = v1 + 1;                                  //index of vi,j+1 
            let v4 = v2 + 1;                                  //index of vi+1,j+1

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

    //Create sphere position buffer
    pwgl.sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertexPosition), gl.STATIC_DRAW);
    pwgl.sphereVertexPositionBuffer.SPHERE_VERTEX_POS_BUF_ITEM_SIZE = 3;
    pwgl.sphereVertexPositionBuffer.SPHERE_VERTEX_POS_BUF_NUM_ITEMS = sphereVertexPosition.length / 3; //A check this, be see if a better way to be done

    //Create earth index buffer
    pwgl.sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereIndices), gl.STATIC_DRAW);
    pwgl.sphereVertexIndexBuffer.SPHERE_VERTEX_INDEX_BUF_ITEM_SIZE = 1;
    pwgl.sphereVertexIndexBuffer.SPHERE_VERTEX_INDEX_BUF_NUM_ITEMS = sphereIndices.length;


    ///For the texture make sure the last longitude virtal line meets it's self again
    // texture coordinates are pushed when the positions are created
    pwgl.sphereVertexTextureCoordinateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.sphereVertexTextureCoordinateBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereTextureCoordinates), gl.STATIC_DRAW);
    pwgl.SPHERE_VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
    pwgl.SPHERE_VERTEX_TEX_COORD_BUF_NUM_ITEMS = sphereTextureCoordinates.length/pwgl.SPHERE_VERTEX_TEX_COORD_BUF_ITEM_SIZE;

    //Add normals here

}

function setupBuffers() {
    setupCubeBuffers();
    setupSphereBuffers();
}

function setupTextures() {
    //Texture for the earth
    pwgl.earthTexture = gl.createTexture();
    loadImageForTexture('earth.jpg', pwgl.earthTexture);
}

function loadImageForTexture(url, texture) {
    var image = new Image();
    image.onload = function() {
        pwgl.ongoingImageLoads.splice(pwgl.ongoingImageLoads.indexOf(image), 1);
        //Splice adds/removes items to and from an array
        textureFinishedLoading(image, texture);
    }
    pwgl.ongoingImageLoads.push(image);
    image.src = url;
}

function textureFinishedLoading(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(pwgl.uniformMVMatrix, false, pwgl.modelViewMatrix);
}

function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(pwgl.uniformProjMatrix, false, pwgl.projectionMatrix);
}

//Draw a cube with a fixed color on one side (black)
function drawCube(r, g, b, a) {
    // Disable vertex attrib array and use constant color for the cube.
    //gl.disableVertexAttribArray(pwgl.vertexColorAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexPositionBuffer);
    gl.vertexAttribPointer(pwgl.vertexPositionAttribute, pwgl.CUBE_VERTEX_POS_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.cubeVertexTextureCoordinateBuffer);
    gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc, pwgl.CUBE_VERTEX_TEX_COORD_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    var colourTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colourTex);
    var colourPixel = new Uint8Array([r, g, b, a]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colourPixel);

    //gl.activeTexture(gl.TEXTURE0);
    //gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.cubeVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, pwgl.CUBE_VERTEX_INDEX_BUF_NUM_ITEMS, gl.UNSIGNED_SHORT, 0);
}

function drawSphere(texture, r, g, b, a) {
    //gl.disableVertexAttribArray(pwgl.vertexColorAttribute);
    //gl.vertexAttrib4f(pwgl.vertexColorAttribute, r, g, b, a);

    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.sphereVertexPositionBuffer);
    gl.vertexAttribPointer(pwgl.sphereVertexIndexBuffer, pwgl.sphereVertexPositionBuffer.SPHERE_VERTEX_POS_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.sphereVertexTextureCoordinateBuffer);
    gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc, pwgl.SPHERE_VERTEX_TEX_COORD_BUF_ITEM_SIZE, gl.FLOAT, false, 0, 0);

    if (texture !== undefined){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    } else {
        var colourTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colourTex);
        var colourPixel = new Uint8Array([r, g, b, a]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colourPixel);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.sphereVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, pwgl.sphereVertexIndexBuffer.SPHERE_VERTEX_INDEX_BUF_NUM_ITEMS, gl.UNSIGNED_SHORT, 0);
}

function drawSatillite(r, g, b, a) {
    //Now draw the scaled cube (satillite body)
    pushModelViewMatrix();
    mat4.translate(pwgl.modelViewMatrix, [0.0, 0.0, 0.0], pwgl.modelViewMatrix);
    mat4.scale(pwgl.modelViewMatrix, [2.0, 2.0, 2.0], pwgl.modelViewMatrix);
    uploadModelViewMatrixToShader();
    drawCube(255, 215, 0, 1);
    popModelViewMatrix();

    // Draw solar panels
    for (var i = -1; i <= 1; i += 2) {
        pushModelViewMatrix();
        mat4.translate(pwgl.modelViewMatrix, [0, 0, i * 5], pwgl.modelViewMatrix);
        mat4.scale(pwgl.modelViewMatrix, [1, 0.0, 2], pwgl.modelViewMatrix);
        uploadModelViewMatrixToShader();
        drawCube(129, 212, 250 ,1);
        popModelViewMatrix();
    }

    // Draw panel bars
    for (var i = -1; i <= 1; i += 2) {
        pushModelViewMatrix();
        mat4.translate(pwgl.modelViewMatrix, [0, 0, i * 2.5], pwgl.modelViewMatrix);
        mat4.scale(pwgl.modelViewMatrix, [0.2, 0.2, 0.5], pwgl.modelViewMatrix);
        uploadModelViewMatrixToShader();
        drawCube(255, 215, 0, 1);
        popModelViewMatrix();
    }

    //Draw dish
    pushModelViewMatrix();
    mat4.translate(pwgl.modelViewMatrix, [-6.5, 0.0, 0.0], pwgl.modelViewMatrix);
    mat4.scale(pwgl.modelViewMatrix, [4.0, 4.0, 4.0], pwgl.modelViewMatrix);
    uploadModelViewMatrixToShader();
    drawSphere(undefined, 255, 0, 0, 1);
    popModelViewMatrix();

    //draw rod that attaches to dish
    pushModelViewMatrix(); //-17.6
    mat4.translate(pwgl.modelViewMatrix, [-2.5, 0, 0], pwgl.modelViewMatrix);
    mat4.scale(pwgl.modelViewMatrix, [0.4, 0.2, 0.2], pwgl.modelViewMatrix);
    uploadModelViewMatrixToShader();
    drawCube(255, 215, 0, 1);
    popModelViewMatrix();
}

function startup() {
    canvas = document.getElementById("myGLCanvas");
    canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    //Add eventlisteners
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyup, false);
    canvas.addEventListener('mousemove', myMouseMove, false);
    canvas.addEventListener('mousedown', myMouseDown, false);
    canvas.addEventListener('mouseup', myMouseUp, false);
    canvas.addEventListener('mousewheel', wheelHandler, false);
    canvas.addEventListener('DOMmouseScroll', wheelHandler, false);

    gl = createGLContext(canvas);
    init();

    window.addEventListener("resize", resizeCanvas, false);

    pwgl.fpsCounter = document.getElementById("fps");

    draw();
}

function resizeCanvas() {
    gl = createGLContext(canvas);

    mat4.perspective(60, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pwgl.projectionMatrix);
    mat4.identity(pwgl.modelViewMatrix);
    // Camera position(xyz), ???, ???, ???
    mat4.lookAt([50, 0, 0], [0, 0, 0], [0, 1, 0], pwgl.modelViewMatrix);
}

function init() {
    //the initialisation that is performed during the first startup and when the envent webGLcontextRestored is received is included in this
    setupShaders();
    setupBuffers();
    setupTextures();
    gl.enable(gl.DEPTH_TEST);

    // Initalise some variables for the moving box
    pwgl.x = 0.0;
    pwgl.y = 0.0;
    pwgl.z = 0.0;
    
    pwgl.orbitRadius = 20.0;
    pwgl.minimumOrbitRadius = 17.0;
    pwgl.orbitSpeed = 2.0;
    pwgl.minimumOrbitSpeed = 0.1;
    pwgl.satAngle = 0.0;

    pwgl.earthRotationSpeed = 0.5;
    pwgl.earthAngle = 0.0;

    //Init animation variables
    pwgl.animationStartTime = undefined;
    pwgl.nbrOfFramesForFPS = 0;
    pwgl.previousFrameTimeStamp = Date.now();

    // mat4.perspective(60, gl.viewportWidth/gl.viewportHeight, 1, 100.0, pwgl.projectionMatrix);
    // mat4.identity(pwgl.modelViewMatrix);
    // mat4.lookAt([8, 12, 8],[0,0,0],[0,1,0], pwgl.modelViewMatrix);
    mat4.perspective(60, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pwgl.projectionMatrix);
    mat4.identity(pwgl.modelViewMatrix);
    // Camera position(xyz), ???, ???, ???
    mat4.lookAt([50, 0, 0], [0, 0, 0], [0, 1, 0], pwgl.modelViewMatrix);
}

function draw() {
    pwgl.requestId = requestAnimFrame(draw);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var currentTime = Date.now();

    handlePressedDownKeys();

    //Update FPS if a second or more has passed since the last frame update
    if (currentTime - pwgl.previousFrameTimeStamp >= 1000) {
        pwgl.fpsCounter.innerHTML = pwgl.nbrOfFramesForFPS;
        pwgl.nbrOfFramesForFPS = 0;
        pwgl.previousFrameTimeStamp = currentTime;
    }

    if (pwgl.animationStartTime === undefined) {
        pwgl.animationStartTime = currentTime;
    }

    //console.log("1 xRot = " + xRot + "yRot = " + yRot + "t = " + trans1);
    mat4.translate(pwgl.modelViewMatrix, [0.0, transY, transZ, pwgl.modelViewMatrix]);

    mat4.rotateX(pwgl.modelViewMatrix, xRot / 50, pwgl.modelViewMatrix);
    mat4.rotateY(pwgl.modelViewMatrix, yRot / 50, pwgl.modelViewMatrix);
    //mat4.rotateZ(pwgl.modelViewMatrix, zRot/50, pwgl.modelViewMatrix);
    yRot = xRot = zRot = transY = transZ = 0;

    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();


    pushModelViewMatrix();
        pwgl.earthAngle = (currentTime - pwgl.animationStartTime) / 2000 * pwgl.earthRotationSpeed * Math.PI % (2 * Math.PI);
        mat4.scale(pwgl.modelViewMatrix, [10.0, 10.0, 10.0], pwgl.modelViewMatrix)
        mat4.rotateY(pwgl.modelViewMatrix, -pwgl.earthAngle, pwgl.modelViewMatrix);

        uploadModelViewMatrixToShader();
        //Draw blue sphere
        drawSphere(pwgl.earthTexture);
    popModelViewMatrix();


    pushModelViewMatrix();
        //animate the satillite to orbit the earth
        pwgl.satAngle = (currentTime - pwgl.animationStartTime) / 2000 * pwgl.orbitSpeed * Math.PI % (2 * Math.PI);
        pwgl.x = Math.cos(pwgl.satAngle) * pwgl.orbitRadius;
        pwgl.z = Math.sin(pwgl.satAngle) * pwgl.orbitRadius;

        mat4.translate(pwgl.modelViewMatrix, [pwgl.x, pwgl.y, pwgl.z], pwgl.modelViewMatrix);
        mat4.rotateY(pwgl.modelViewMatrix, -pwgl.satAngle, pwgl.modelViewMatrix);

        uploadModelViewMatrixToShader();
        // Draw satillite on top of the earth
        drawSatillite(0.81, 0.7, 0.23, 1.0);
    popModelViewMatrix();





    //update the number of frames rendered for that second
    pwgl.nbrOfFramesForFPS++;
}

function handleKeyDown(event) {
    pwgl.listOfPressedKeys[event.keyCode] = true;
}

function handleKeyup(event) {
    pwgl.listOfPressedKeys[event.keyCode] = false;
}

function handlePressedDownKeys() {
    if (pwgl.listOfPressedKeys[38]) {
        //Arrow up - increase orbit speed
        pwgl.orbitSpeed += 0.1;
    }

    if (pwgl.listOfPressedKeys[40]) {
        //Arrow down - decrease orbit speed
        if (pwgl.orbitSpeed > pwgl.minimumOrbitSpeed) {
            pwgl.orbitSpeed -= 0.1;
        }
    }

    if (pwgl.listOfPressedKeys[39]) {
        //Arrow right - increase orbit radius
        pwgl.orbitRadius += 0.1;
    }

    if (pwgl.listOfPressedKeys[37]) {
        //Arrow left - decrease orbit radius //minimum orbit to prevent clipping with earth
        if (pwgl.orbitRadius > pwgl.minimumOrbitRadius) {
            pwgl.orbitRadius -= 0.1;
        }
    }
}

function handleContextLost(event) {
    event.preventDefault();
    cancelRequestAnimFrame(pwgl.requestId);

    // Ignore all ongoing image loads by removing
    // their onload handler
    for (var i = 0; i < pwgl.ongoingImageLoads.length; i++) {
        pwgl.ongoingImageLoads[i].onload = undefined;
    }
    pwgl.ongoingImageLoads = [];
}

function handleContextRestored(event) {
    init();
    pwgl.requestId = requestAnimFrame(draw, canvas);
}

function myMouseDown(ev) {
    drag = 1;
    xOffs = ev.clientX;
    yOffs = ev.clientY;
}

function myMouseUp(ev) {
    drag = 0;
}

function myMouseMove(ev) {
    if (drag == 0) return;

    if (ev.shiftKey) {
        transZ = (ev.clientY - yOffs) / 10;
        //zRot = (xOffs - ev.ClientX) * .3;
    } else if (ev.altKey) {
        transY = -(ev.clientY - yOffs) / 10;
    } else {
        yRot = - xOffs + ev.clientX;
        xRot = - yOffs + ev.clientY;
    }

    xOffs = ev.clientX;
    yOffs = ev.clientY;
    //console.log("xOff=" + xOffs + "yOff" + yOffs);
}

function wheelHandler(ev) {
    if (ev.altKey) {
        transZ = -ev.detail / 10;
    } else {
        transZ = ev.detail / 10;
    }
    //console.log("delta = " + ev.detail);
    ev.preventDefault();
}