 /**
  * General plot structure.
  * @param {Number} id 
  * @returns Public APIs.
  */
 let plotStructure = function (id, options = []) {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /*_______________________________________
    |   Resizing variables
    */

    /**
     * Width of the plot.
     */
    let width;

    /**
     * Height of the plot.
     */
    let height;

    /*_______________________________________
    |   Canvas
    */

    const canvas = document.getElementById("canvas-" + id);
    const ctx = canvas.getContext('2d', options);

    /**
     * Resize the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        // Sets the canvas width and height based on the dpi resolution of the page
        const styleWidth = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
        const styleHeight = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
        canvas.setAttribute('height', Math.round(styleHeight * dpi));
        canvas.setAttribute('width', Math.round(styleWidth * dpi));

        // Saves the width and height of the resized canvas, multiplied by dpi?
        width = Math.round(canvas.offsetWidth * dpi);
        height = Math.round(canvas.offsetHeight * dpi);
    }

    /**
     * Get the HTML canvas element.
     * @returns HTML canvas element.
     */
    publicAPIs.getCanvas = function () {
        return canvas;
    }

    /**
     * Get the canvas 2d context.
     * @returns 2D context.
     */
    publicAPIs.getCtx = function () {
        return ctx;
    }

    /**
     * Get the canvas width.
     * @returns Canvas width.
     */
    publicAPIs.getWidth = function () {
        return width;
    }

    /**
     * Get the canvas height.
     * @returns Canvas height.
     */
    publicAPIs.getHeight = function () {
        return height;
    }

    // Returns public methods
    return publicAPIs;
}