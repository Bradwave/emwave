/**
 * Plot of electromagnetic wave.
 * @param {Number} id Id of the signal plot.
 * @param {*} options Options for the simulation.
 * @returns Public APIs.
 */
let wavePlot = function (id, options = { speedOfLight: 600, cellSize: 30, fieldMagnitude: 1 }) {

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
     * Size of a field cell.
     */
    let cellSize = options.cellSize;

    /**
     * Horizontal size of the cells grid.
     */
    let gridSize = { x: 0, y: 0 };

    /**
     * Matrix of cell center coordinates.
     */
    let cellData = [];

    /**
     * Mouse position.
     */
    let mouse = { x: 0, y: 0 };

    /**
     * Position of the charged particle.
     */
    let charge = { x: 0, y: 0 };

    /**
     * Previous positions of the charged particle.
     */
    let positions = [];

    /**
     * Velocity of the charged particle.
     */
    let velocity = { x: 0, y: 0 };

    /**
     * Previous velocities of the charged particle.
     */
    let velocities = [];

    /**
     * Current acceleration of the charged particle.
     */
    let acceleration = { x: 0, y: 0 };

    /**
     * Previous accelerations of the charged particle.
     */
    let accelerations = [];

    /**
     * Max number of stored accelerations and positions of the charged particle.
     */
    let eventsSize;

    /**
     * Number of frames over which acceleration is averaged.
     */
    let avgTime = 10;

    /*_______________________________________
    |   General variables
    */

    /**
     * True if the simulation is running, false otherwise.
     */
    let running = true;

    /**
     * True if left mouse button is down, false otherwise.
     */
    let mouseDown = false;

    /*_______________________________________
    |   Simulation variables
    */

    /**
     * Speed of light.
     */
    let c = options.speedOfLight;

    /**
     * Ture if it is a truly relativistic simulation, false otherwise.
     */
    let trulyRelativistic = true;

    let fieldMagnitude = options.fieldMagnitude;

    /**
     * Updates the plot.
     * @param {*} options Options for the simulation.
     */
    publicAPIs.update = function (options = { speedOfLight: c, cellSize: cellSize, fieldMagnitude: fieldMagnitude }) {
        // Resizes the canvas
        publicAPIs.resizeCanvas();

        publicAPIs.pauseAnimation();

        // Updates the simulation parameters
        c = options.speedOfLight;
        cellSize = parseInt(options.cellSize);
        fieldMagnitude = parseFloat(options.fieldMagnitude);

        // Updates here
        charge.x = Math.round(width / 2);
        charge.y = Math.round(height / 2);

        eventsSize = Math.ceil(Math.sqrt(width ** 2 + height ** 2) / c * 60) + 10;

        positions = [...Array(eventsSize)].map(() => { return { x: charge.x, y: charge.y }; });
        velocities = [...Array(avgTime)].map(() => { return { x: 0, y: 0 }; });
        accelerations = [...Array(eventsSize)].map(() => { return { x: 0, y: 0 }; });

        publicAPIs.playAnimation();
    }

    /*_______________________________________
    |   Canvas
    */

    const plot = new plotStructure(id, { alpha: false });
    const ctx = plot.getCtx();

    // Canvas listeners

    // On mouse down
    plot.getCanvas().onmousedown = (e) => {
        if (e.button == 0) {
            mouseDown = true;
        }
    }

    // On mouse up
    plot.getCanvas().onmouseup = (e) => {
        if (e.button == 0) {
            mouseDown = false;
        }
    }

    // On mouse move
    plot.getCanvas().onmousemove = (e) => {
        mouse.x = e.pageX * dpi;
        mouse.y = e.pageY * dpi;
    }

    // On touch start
    plot.getCanvas().ontouchstart = (e) => {
        mouseDown = true;
        storeTouchPosition(e);
    }

    // On touch end
    plot.getCanvas().ontouchend = () => {
        mouseDown = false;
    }

    // On touch move
    plot.getCanvas().ontouchmove = (e) => {
        storeTouchPosition(e);
    }

    /**
     * Stores the touch events.
     * @param {*} e Event
     */
    const storeTouchPosition = (e) => {
        e.preventDefault();
        let touches = e.changedTouches;

        mouse.x = touches[0].pageX * dpi;
        mouse.y = touches[0].pageY * dpi;
    }

    // On key up
    plot.getCanvas().onkeyup = (e) => {
        if (e.code === "Enter") {
            // Switches between truly relativistic and not
            trulyRelativistic = !trulyRelativistic;
        } else if (e.code === "KeyA") {
            console.log(accelerations);
            console.log(velocities[3]);
        }
    }

    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        plot.resizeCanvas();

        // Gets width and height form the plot structure
        width = plot.getWidth();
        height = plot.getHeight();

        // Calculates the numbers of cells on the x and y axes
        gridSize.x = Math.ceil(width / cellSize);
        gridSize.y = Math.ceil(height / cellSize);

        charge.x = Math.round(width / 2);
        charge.y = Math.round(height / 2);

        // Calculates the cell center coordinates
        cellData = [];
        for (let i = 0; i < gridSize.x; i++) {
            cellData[i] = [];
            for (let j = 0; j < gridSize.y; j++) {
                cellData[i][j] = {
                    x: i * cellSize + .5 * cellSize,
                    y: j * cellSize + .5 * cellSize,
                    intensity: Array(avgTime).fill(0)
                }
            }
        }
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
     * If the simulation isn't running, it renders the next frame.
     */
    publicAPIs.nextFrame = () => {
        if (!running) {
            // Updates the physics simulation
            updatePhysics();

            // Draws what has to be drawn
            publicAPIs.drawPlot();
        }
    }

    /**
     * Updates the physics simulation.
     */
    function updatePhysics() {
        // Updates the velocity based on mouse/touch position
        if (mouseDown) {
            velocity.x = mouse.x - charge.x;
            velocity.y = mouse.y - charge.y;
        } else {
            velocity.x = Math.abs(velocity.x) > .5 ? .95 * velocity.x : 0;
            velocity.y = Math.abs(velocity.y) > .5 ? .95 * velocity.y : 0;
        }

        // Limits the velocity to 99% of the speed of light
        limitSpeed(.99 * c);

        // Stores current velocity
        velocities.unshift({ x: velocity.x, y: velocity.y });
        // Limits the size of the stored velocities array
        if (velocities.length > avgTime - 1) velocities.pop();

        // Calculates acceleration
        acceleration.x = (velocities[0].x - velocities[avgTime - 1].x) / (avgTime - 1);
        acceleration.y = (velocities[0].y - velocities[avgTime - 1].y) / (avgTime - 1);

        // Stores current acceleration
        accelerations.unshift({ x: acceleration.x, y: acceleration.y });
        // Limits the size of the stored accelerations array
        if (accelerations.length > eventsSize) accelerations.pop();

        // Changes particle position
        charge.x += .05 * velocity.x;
        charge.y += .05 * velocity.y;

        // Stores current position
        positions.unshift({ x: charge.x, y: charge.y });
        // Limits the size of the stored positions array
        if (positions.length > eventsSize) positions.pop();
    }

    /**
     * Limits the current speed.
     * @param {*} maxVelocity Maximum speed.
     */
    const limitSpeed = (maxVelocity) => {
        // Calculates the velocity vector magnitude
        const velocityMagnitude = velocity.x * velocity.x + velocity.y * velocity.y;
        if (velocityMagnitude > maxVelocity * maxVelocity) {
            // Normalizes the velocity vector and multiply by maximum value
            velocity.x = velocity.x / Math.sqrt(velocityMagnitude) * maxVelocity;
            velocity.y = velocity.y / Math.sqrt(velocityMagnitude) * maxVelocity;
        }
    }

    /**
     * Draws the plot.
     */
    publicAPIs.drawPlot = () => {

        // Clears the canvas
        publicAPIs.clearPlot();

        // Sets the color of the electric field
        // ctx.fillStyle = "rgb(150, 150, 150)";

        // Loops every field cell
        for (let i = 0; i < gridSize.x; i++) {
            for (let j = 0; j < gridSize.y; j++) {
                // Gets the cell center coordinates
                const fieldCell = cellData[i][j];

                let fieldIntensity = 0;
                let distanceToCharge;
                let distanceToChargeAbs;
                let retardedAcceleration;

                if (trulyRelativistic) {
                    // If the simulation is truly relativistic, looks event at distance c * t', where t' is the event time
                    for (let k = 0; k < eventsSize; k++) {
                        // Computes the distance to charge position at time t'
                        distanceToCharge = { x: fieldCell.x - positions[k].x, y: fieldCell.y - positions[k].y };
                        distanceToChargeAbs = Math.sqrt(distanceToCharge.x ** 2 + distanceToCharge.y ** 2);
                        // Computes difference between the distance to the charge and c * t'
                        const distanceDelta = Math.abs(distanceToChargeAbs - c * k / 60);

                        if (distanceDelta < cellSize) {
                            // Stores the retarded acceleration if the difference is lower the the cell size
                            retardedAcceleration = accelerations[k];
                            k = eventsSize;
                        }
                    }
                } else {
                    // Computes the distance
                    distanceToCharge = { x: fieldCell.x - charge.x, y: fieldCell.y - charge.y };
                    distanceToChargeAbs = Math.sqrt(distanceToCharge.x ** 2 + distanceToCharge.y ** 2);
                    // Computes the retarded acceleration, assuming the particle isn't moving much
                    retardedAcceleration = accelerations[Math.round(60 * distanceToChargeAbs / c)];
                }

                // Computes the sine of the angle between the charged and the retarded acceleration
                const distanceAngle = Math.atan2(distanceToCharge.x, distanceToCharge.y);
                const accelerationAngle = Math.atan2(retardedAcceleration.x, retardedAcceleration.y);
                const angleFactor = Math.sin(distanceAngle - accelerationAngle);

                // Computes the field intensity, approximated by sin(angle) * acceleration / distance
                fieldIntensity = fieldMagnitude * Math.abs(angleFactor)
                    * Math.sqrt(retardedAcceleration.x ** 2 + retardedAcceleration.y ** 2) / distanceToChargeAbs;

                // Stores the intensity of the current field cell
                fieldCell.intensity.unshift(fieldIntensity);
                if (fieldCell.intensity.length > avgTime - 1) fieldCell.intensity.pop();

                // Computes the 
                const intensityChange = Math.abs(fieldIntensity - fieldCell.intensity[avgTime - 1]) / Math.max(...fieldCell.intensity);
                // intensityChange = 1 - (intensityChange > 1 ? 1 : intensityChange);

                // Sets the color coefficient for the cell field dot
                const colorFactor = constrain(fieldIntensity, 0, 1);

                // Sets the cell field dot radius
                let radius = 0 + 40 * fieldIntensity;
                radius = radius > 20 ? cellSize : (radius > 3 ? Math.round(radius) : radius);

                ctx.beginPath();
                // Sets the field cell dot color
                ctx.fillStyle = 'hsl('
                    + (-10 + (1 - intensityChange) * 300) + ','
                    + (20 + 80 * colorFactor) + '%,'
                    + (30 + 60 * colorFactor) + '%)';

                // Draws the field cell dot
                ctx.arc(fieldCell.x, fieldCell.y, radius, 0, 360);
                ctx.fill();
                ctx.closePath();
            }
        }

        // Draws the velocity vector
        ctx.beginPath();
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 2;
        ctx.moveTo(charge.x, charge.y);
        ctx.lineTo(charge.x + velocity.x, charge.y + velocity.y);
        ctx.stroke();

        // Draws the acceleration vector
        ctx.beginPath();
        ctx.strokeStyle = "rgb(176, 26, 0)";
        ctx.lineWidth = 8;
        ctx.moveTo(charge.x, charge.y);
        ctx.lineTo(charge.x + 2 * acceleration.x, charge.y + 2 * acceleration.y);
        ctx.stroke();

        // Draws the charged particle
        ctx.beginPath();
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.arc(charge.x, charge.y, 10, 0, 360);
        ctx.fill();
        ctx.closePath();
    }

    /**
     * Clears the plot.
     */
    publicAPIs.clearPlot = () => {
        ctx.fillStyle = "#000000";

        ctx.beginPath();
        ctx.rect(0, 0, width, height);
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
    publicAPIs.update();
    animate();

    // Returns public methods
    return publicAPIs;
}