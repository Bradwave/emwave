/**
 * Plot of electromagnetic wave.
 * @param {Number} id Id of the signal plot.
 * @param {*} options Options for the simulation.
 * @returns Public APIs.
 */
let lightPlot = function (id, options = {
    speedOfLight: 600,
}) {

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

    /**
     * Half the height of the plot.
     */
    let halfHeight;

    /**
     * Vertical offset.
     */
    let yOffset;

    /*_______________________________________
    |   General variables
    */

    /**
     * True if the simulation is running, false otherwise.
     */
    let running = true;

    /*_______________________________________
    |   Simulation variables
    */

    let photon = { x: 0, y: 0 };

    /**
     * Speed of light.
     */
    let c = options.speedOfLight;

    /**
     * Updates the plot.
     * @param {*} options Options for the simulation.
     */
    publicAPIs.update = function (options = {
        speedOfLight: c,
        width: width,
        yOffset: yOffset,
    }) {
        // Resizes the canvas
        publicAPIs.resizeCanvas();

        // Pauses the simulation
        publicAPIs.pauseAnimation();

        // Updates the simulation parameters
        c = options.speedOfLight;

        photon = { x: photon.x % width, y: halfHeight };

        // Restarts the simulation
        publicAPIs.playAnimation();
    }

    /*_______________________________________
    |   Canvas
    */

    const plot = new plotStructure(id, { alpha: true });
    const ctx = plot.getCtx();

    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        plot.resizeCanvas();

        // Gets width and height form the plot structure
        width = plot.getWidth();
        height = plot.getHeight();

        halfHeight = Math.round(height / 2);
    }

    /**
     * Toggles the simulation on and off.
     */
    publicAPIs.toggleAnimation = () => {
        running = !running;
        if (running) {
            // Starts the animation
            animate();
        }
    }

    /**
     * Pauses the simulation.
     */
    publicAPIs.pauseAnimation = () => {
        running = false;
    }

    /**
     * Starts the simulation.
     */
    publicAPIs.playAnimation = () => {
        running = true;
        // Starts the animation
        animate();
    }

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @returns Early return if not playing.
     */
    function animate() {
        if (!running) {
            return;
        }

        // Updates the physics simulation
        updatePhysics();

        // Draws what has to be drawn
        publicAPIs.drawPlot();

        // Keeps executing this function
        requestAnimationFrame(animate);
    }

    /**
     * If the animation isn't running, it renders the next frame.
     */
    publicAPIs.nextFrame = () => {
        if (!running) {
            // Updates the animation
            updatePhysics();

            // Draws what has to be drawn
            publicAPIs.drawPlot();
        }
    }

    /**
     * Updates the animation.
     */
    function updatePhysics() {
        photon.x = (photon.x + c / 60) % width;
    }

    /**
     * Draws the plot.
     */
    publicAPIs.drawPlot = () => {
        // Clears the canvas
        publicAPIs.clearPlot();

        // Sets the color
        ctx.strokeStyle = "#B01A00";
        ctx.fillStyle = "#B01A00";

        // Draws the base line
        ctx.beginPath();
        ctx.moveTo(0, halfHeight);
        ctx.lineTo(width, halfHeight);
        ctx.stroke();
        ctx.closePath();

        // Draws the stylized photon wave function
        ctx.beginPath();
        ctx.moveTo(0, halfHeight);
        for (let i = 0; i < width; i = i + 4) {
            const naiveDistance = Math.abs(photon.x - i);
            const lightIntensity = (4 * Math.min(naiveDistance, width - naiveDistance) / width) ** 3;
            ctx.lineTo(i, halfHeight - lightIntensity)
        }
        ctx.lineTo(width, halfHeight);
        ctx.fill();
        ctx.closePath();
    }

    /**
     * Clears the plot.
     */
    publicAPIs.clearPlot = () => {
        ctx.beginPath();
        ctx.clearRect(0, 0, width, height);
        ctx.fill();
        ctx.closePath();
    }

    /*_______________________________________
    |   Getters and setters
    */

    /**
     * Get the simulations status.
     * @returns Ture if if the simulation is running, false otherwise.
     */
    publicAPIs.isRunning = () => {
        return running;
    }

    // Runs the animation
    publicAPIs.update(options);
    animate();

    // Returns public methods
    return publicAPIs;
}