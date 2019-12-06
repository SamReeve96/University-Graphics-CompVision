# Graphics Coursework README

## Controls

* **Arrow Keys:**
  * Left/Right: Satellite Orbit radius decrease/increase
  * Up/Down:    Satellite Orbit speed increase/decrease
* **Mouse Click & Drag:**
  * Drag upwards/downwards: rotate the Y-Axis
    * Holding Alt-key: move the objects along the Y-Axis
  * Drag sideways: rotate the X-Axis
    * Holding Shift-key: move the objects along the X-Axis
* **Scroll wheel**
  * Scrolling will move the objects along the Z-Axis

## Miscellaneous

* **Getting around the Content Security Policy for textures**
  * As textures are images that are loaded from the device locally, most web browsers content security polices will block the texture being loaded. The work around for this I used during the development of the coursework was to use a python web server.

  * On macOS, this process is straight forward as python2 is built into the terminal command set, run the command "python -m SimpleHTTPServer" and the address and port will be shown (commonly 0.0.0.0:8000/) navigate to the folder with the project, the index page will load.
  * On windows, you will need to install python first.

* **To see the solar panels on the satellite, rotate the model in the Y-axis**
  * Due to the panels being 0 in the Y-axis as per the spec, they cannot be seen initially as the view is inline with the horizon, by dragging you'll be able to see them.
