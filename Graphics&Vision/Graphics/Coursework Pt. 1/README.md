# Graphics Coursework README

## Controls

* Arrow Keys:
  * Left/Right: Satellite Orbit radius decrease/increase
  * Up/Down:    Satellite Orbit speed increase/decrease
* Mouse Click & Drag:
  * Drag upwards/downwards: rotate in the Y-Axis
    * Holding Alt-key: move the objects along the Y-Axis
  * Draw sideways: rotate in the X-Axis
    * Holding Shift-key: move the objects along the X-Axis
* Scroll wheel
  * Scrolling will move the objects along the Z-Axis

## Extra Features

Some extra functionality I added to help with the development of this project.

* Window resizing
  * When the browser window is resized, the viewport will automatically adapt to the new size.
  * See _**canvasResize()**_ to see how it works
* Automatically texture un-textured objects
  * If a basic draw shape method is called without a texture file or any values for RGBA then default values for RGBA are used to draw the object as red
  * This was done so that if a new object was being drawn and the texture or colour values were missing or wrong, the object would still be drawn informing that it's was a texture issue, allowing the problem to be diagnosed sooner
  * Similar to some graphics engines that render objects without texture with a "missing texture" texture
    * See _**drawCube()**_, _**drawSphere()**_ and _**drawDish()**_
* Added a testing texture for the satellite body faces
  * To correctly map faces to the specific faces of the texture I created a texture with 8 differently coloured.

## Known Issues

In testing the following issues where found:

* Visual glitch when changing satellite orbit speed
  * My assumption is this due to the satellite still moving when the speed change event occurs.

## Miscellaneous

* Getting around the Content Security Policy for textures
  * Add text here
* Using a point light as opposed to directional light
  * Add text here
