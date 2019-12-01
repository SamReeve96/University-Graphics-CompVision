# Graphics Coursework README

## Controls

* **Arrow Keys:**
  * Left/Right: Satellite Orbit radius decrease/increase
  * Up/Down:    Satellite Orbit speed increase/decrease
* **Mouse Click & Drag:**
  * Drag upwards/downwards: rotate the Y-Axis
    * Holding Alt-key: move the objects along the Y-Axis
  * Draw sideways: rotate the X-Axis
    * Holding Shift-key: move the objects along the X-Axis
* **Scroll wheel**
  * Scrolling will move the objects along the Z-Axis

## Extra Features

Some extra functionality I added to help with the development of this project.

* **Window resizing**
  * When the browser window is resized, the viewport will automatically adapt to the new size.
  * See _**canvasResize()**_ to see how it works
* **Automatically colour un-textured objects**
  * If a basic draw shape (Sphere, dish or cube) method is called without a texture file and missing values for RGBA then default values for RGBA are used to draw the object as red
  * This was done so that if a new object was being drawn and the texture and colour values were missing, the object would still be drawn informing that it's was a texture issue, allowing the problem to be diagnosed sooner
  * This is a simpler technique that some graphics engines use, however those implementations usually render objects texture with a bespoke texture
    * See _**drawCube()**_, _**drawSphere()**_ and _**drawDish()**_
* **Added a testing texture for the satellite body faces**
  * To correctly map coordinates to the specific faces of the cube I created a texture with 8 differently coloured faces named "sattest.png" see line 488 and replace the original loadimagefortexture() method call above it to see the satellite body rendered with 6 differently coloured faces
* **Added frame rate counter**
  * The frame counter that was used in some of the lab worksheets proved to have a useful functionality other than simply displaying the frame rate of the animation, should there be an error where the frame count would be changed from its default value ("--") this would inform me there was an error with the program before even opening Developer tools, another small but useful trick to diagnose issues

## Miscellaneous

* **Getting around the Content Security Policy for textures**
  * As textures are images that are loaded from the device locally, most web browsers content security polices will block the texture being loaded. The work around for this I used during the development of the coursework was to use a python web server.

  * On macOS, this process is straight forward as python2 is built into the terminal command set, run the command "python -m SimpleHTTPServer" and the address and port will be shown (commonly 0.0.0.0:8000/) navigate to the folder with the project, the index page will load.
  * On windows, you will need to install python first.

* **Using a point light as opposed to directional light**
  * A point light at infinity (or far enough) could be regarded as a directional light source, e.g., sunlight
  * the point lights position coordinates are (500, 866.66, 0.0) this is 60 degrees to the horizon, where after some testing is far enough that further increasing the distance at a ratio of 5:8.66:0 made little to no difference of the lighting of the objects.

* **To see the solar panels on the satellite, rotate the model in the Y-axis**
  * Due to the panels being 0 in the Y-axis as per the spec, they cannot be seen initially as the view is inline with the horizon, by dragging you'll be able to see them.
