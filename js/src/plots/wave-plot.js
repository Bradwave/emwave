/**
 * Plot of electromagnetic wave.
 * @param {Number} id Id of the signal plot.
 * @param {*} options Options for the simulation.
 * @returns Public APIs.
 */
let wavePlot = function (id, options = {
    speedOfLight: 600,
    cellSize: 30,
    fieldMagnitude: 1,
    plotContainer: document.getElementById("plot-container")
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
     * Size of a field cell.
     */
    let cellSize = options.cellSize;

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
    |   HTML elements
    */

    /**
     * Parent div.
     */
    let plotContainer = options.plotContainer;

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
    let relativistic = true;

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
     * Previous acceleration and position data of the charged particle.
     */
    let accelerationEvents = [];

    /**
     * Max number of stored accelerations and positions of the charged particle.
     */
    let eventsSize;

    /**
     * Number of frames over which acceleration is averaged.
     */
    let avgTime = 10;

    /**
     * Field intensity multiplier.
     */
    let fieldMagnitude = options.fieldMagnitude;

    /*_______________________________________
    |   Plot update
    */

    /**
     * Updates the plot.
     * @param {*} options Options for the simulation.
     */
    publicAPIs.update = function (options = { speedOfLight: c, cellSize: cellSize, fieldMagnitude: fieldMagnitude }) {
        // Updates the simulation parameters
        c = options.speedOfLight;
        cellSize = parseInt(options.cellSize);
        fieldMagnitude = parseFloat(options.fieldMagnitude);

        // Resizes the canvas
        publicAPIs.resizeCanvas();

        // Pauses the simulation
        publicAPIs.pauseAnimation();

        // Updates the charge initial position
        charge.x = Math.round(width / 2);
        charge.y = Math.round(height / 2);

        // Sets the maximum number of stored events
        eventsSize = Math.ceil(Math.sqrt(width ** 2 + height ** 2) / c * 60) + 10;

        maxCellTimeTravel = 60// Math.ceil(10 * 1.4142 * cellSize * 60 / c);

        // Calculates the cell center coordinates
        resetCells();

        // Clear the velocities and events array (I avoided using fill)
        velocities.length = 0;
        velocities = [...Array(avgTime)].map(() => { return { x: 0, y: 0 }; });
        acceleration.length = 0;
        accelerationEvents = [...Array(eventsSize)].map(() => {
            return {
                x: charge.x,
                y: charge.y,
                magnitude: 0,
                angle: 0
            };
        });

        // Restarts the simulation
        publicAPIs.playAnimation();
    }

    /**
     * Resets cells positions and data, calculates cell centers
     */
    function resetCells() {
        cellData = [];
        for (let i = 0; i < gridSize.x; i++) {
            cellData[i] = [];
            for (let j = 0; j < gridSize.y; j++) {
                cellData[i][j] = {
                    x: i * cellSize + .5 * cellSize,
                    y: j * cellSize + .5 * cellSize,
                    intensity: Array(avgTime).fill(0),
                    previousEventIndex: null
                }
            }
        }
    }

    /*_______________________________________
    |   Canvas and listeners
    */

    const plot = new plotStructure(id, { alpha: false });
    const ctx = plot.getCtx();

    // Canvas listeners

    // On mouse down
    plotContainer.onmousedown = (e) => {
        if (e.button == 0) {
            mouseDown = true;
        }
    }

    // On mouse up
    plotContainer.onmouseup = (e) => {
        if (e.button == 0) {
            mouseDown = false;
        }
    }

    // On mouse move
    plotContainer.onmousemove = (e) => {
        mouse.x = e.clientX * dpi;
        mouse.y = e.clientY * dpi;
    }

    // On touch start
    plotContainer.ontouchstart = (e) => {
        mouseDown = true;
        storeTouchPosition(e);
    }

    // On touch end
    plotContainer.ontouchend = () => {
        mouseDown = false;
    }

    // On touch move
    plotContainer.ontouchmove = (e) => {
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
    }

    /**
     * Toggles between the relativistic model and the non relativistic one.
     */
    publicAPIs.toggleRelativistic = () => {
        if (relativistic) {
            relativistic = false;
            // Resets the cell data
            resetCells();
        } else {
            relativistic = true;
            // Resets the cell data
            resetCells();
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

        try {
            // Draws what has to be drawn
            publicAPIs.drawPlot();
        } catch (error) {
            enableRefresh();
            console.log(error);
            publicAPIs.pauseAnimation();
        }
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

            try {
                // Draws what has to be drawn
                publicAPIs.drawPlot();
            } catch (error) {
                enableRefresh();
                console.log(error);
                publicAPIs.pauseAnimation();
            }
        }
    }

    /**
     * Enables the page refresh and displays the refresh button.
     */
    function enableRefresh() {
        const refreshContainer = document.getElementById("refresh-page-container");
        refreshContainer.style.visibility = "visible";
        refreshContainer.style.opacity = 1;

        refreshContainer.onclick = () => {
            window.location.reload();
        }
    }

    /*_______________________________________
    |   Simulation
    */

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

        // Changes particle position
        charge.x += .05 * velocity.x;
        charge.y += .05 * velocity.y;

        // Stores current acceleration
        accelerationEvents.unshift({
            x: charge.x,
            y: charge.y,
            magnitude: Math.sqrt(acceleration.x * acceleration.x + acceleration.y * acceleration.y),
            angle: Math.atan2(acceleration.x, acceleration.y)
        });
        // Limits the size of the stored accelerations array
        if (accelerationEvents.length > eventsSize) accelerationEvents.pop();
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

    /*_______________________________________
    |   Rendering
    */

    /**
     * Intensity of the field in a given cell.
     */
    let fieldIntensity;

    /**
     * Distance vector of a given cell to the charge (may be a retarded distance).
     */
    let distanceToCharge;

    /**
     * Distance of a given cell to the charge (may be a retarded distance).
     */
    let distanceToChargeAbs;

    /**
     * Acceleration of the charge (may be a retarded acceleration).
     */
    let chargeAcceleration;

    /**
     * Current field cell.
     */
    let fieldCell;

    /**
     * Draws the field.
     */
    function drawField() {
        // Computes the sine of the angle between the charged and the retarded acceleration
        const distanceAngle = Math.atan2(distanceToCharge.x, distanceToCharge.y);
        const angleSine = Math.sin(distanceAngle - chargeAcceleration.angle);

        // Computes the field intensity, approximated by sin(angle) * acceleration / distance
        fieldIntensity = fieldMagnitude * Math.abs(angleSine) * chargeAcceleration.magnitude / distanceToChargeAbs;

        // Stores the intensity of the current field cell
        fieldCell.intensity.unshift(fieldIntensity);
        fieldCell.intensity.pop();

        // Computes the intensityChange = 1 - (intensityChange > 1 ? 1 : intensityChange);
        const intensityChange = Math.abs(fieldIntensity - fieldCell.intensity[avgTime - 1]) / Math.max(...fieldCell.intensity);

        // Sets the color coefficient for the cell field dot
        const colorFactor = fieldIntensity > 1 ? 1 : fieldIntensity;

        // Sets the cell field dot radius
        let radius = 0 + 40 * fieldIntensity;
        radius = radius > 20 ? cellSize : (radius > 3 ? Math.round(radius) : radius);

        ctx.beginPath();
        // Sets the field cell dot color
        ctx.fillStyle = 'hsl('
            + (-20 + (1 - intensityChange) * 300) + ','
            + (20 + 80 * colorFactor) + '%,'
            + (30 + 60 * colorFactor) + '%)';

        // Draws the field cell dot
        ctx.arc(fieldCell.x, fieldCell.y, radius, 0, 360);
        ctx.fill();
    }

    /**
     * Draws the plot.
     */
    publicAPIs.drawPlot = () => {
        // Clears the canvas
        publicAPIs.clearPlot();

        // Checks if the simulation has to be relativistic or not relativistic
        if (relativistic) {
            // Loops every field cell
            for (let i = 0; i < gridSize.x; i++) {
                for (let j = 0; j < gridSize.y; j++) {
                    // Gets the cell center coordinates
                    fieldCell = cellData[i][j];

                    fieldIntensity = 0

                    // Default minimum and maximum indexes
                    let minIndex = 0;
                    let maxIndex = eventsSize;

                    // Previous index for the current cell
                    const lastIndex = cellData[i][j].previousEventIndex;

                    // Sets the minimum and maximum indexes
                    if (lastIndex != null) {
                        minIndex = lastIndex - Math.round(eventsSize / 3);
                        maxIndex = lastIndex + 3;
                    }

                    // Constrain the minimum and maximum index
                    minIndex = minIndex < 0 ? 0 : minIndex;
                    maxIndex = maxIndex > eventsSize ? eventsSize : maxIndex;

                    // If the simulation is truly relativistic, looks event at distance c * t', where t' is the event time

                    for (let k = minIndex; k < maxIndex; k++) {
                        // Computes the distance to charge position at time t'
                        distanceToCharge = { x: fieldCell.x - accelerationEvents[k].x, y: fieldCell.y - accelerationEvents[k].y };
                        distanceToChargeAbs = Math.sqrt(distanceToCharge.x * distanceToCharge.x + distanceToCharge.y * distanceToCharge.y);
                        // Computes difference between the distance to the charge and c * t'
                        const distanceDelta = Math.abs(distanceToChargeAbs - c * k / 60);

                        if (distanceDelta < cellSize) {
                            // Stores the retarded acceleration if the difference is lower the the cell size
                            chargeAcceleration = accelerationEvents[k];
                            cellData[i][j].previousEventIndex = k;
                            break;
                        }

                    }

                    // Draws the field
                    drawField();
                }
            }
        } else {
            for (let i = 0; i < gridSize.x; i++) {
                for (let j = 0; j < gridSize.y; j++) {
                    // Gets the cell center coordinates
                    fieldCell = cellData[i][j];

                    // Computes the distance
                    distanceToCharge = { x: fieldCell.x - charge.x, y: fieldCell.y - charge.y };
                    distanceToChargeAbs = Math.sqrt(distanceToCharge.x * distanceToCharge.x + distanceToCharge.y * distanceToCharge.y);
                    // Computes the acceleration
                    chargeAcceleration = accelerationEvents[0];

                    // Draws the field
                    drawField();
                }
            }
        }

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
    }

    /**
     * Clears the plot.
     */
    publicAPIs.clearPlot = () => {
        ctx.fillStyle = "#000000";

        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.fill();
    }

    /*_______________________________________
    |   Getters and setters
    */

    /**
     * Gets the simulations status.
     * @returns Ture if the simulation is running, false otherwise.
     */
    publicAPIs.isRunning = () => {
        return running;
    }

    /**
     * Gets the simulation model.
     * @returns True if the model used for the simulation is relativistic, false otherwise.
     */
    publicAPIs.isRelativistic = () => {
        return relativistic;
    }

    // Runs the animation
    publicAPIs.update(options);
    animate();

    // Returns public methods
    return publicAPIs;
}