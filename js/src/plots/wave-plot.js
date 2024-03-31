/**
 * Plot of electromagnetic wave.
 * @param {Number} id Id of the signal plot.
 * @returns Public APIs.
 */
let wavePlot = function (id) {

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
    let cellSize = 30;

    /**
     * Horizontal size of the cells grid.
     */
    let gridSize = { x: 0, y: 0 };

    let cellCenters = [];

    /**
     * Mouse position.
     */
    let mouse = { x: 0, y: 0 };

    /**
     * Position of the charged particle.
     */
    let charge = { x: 0, y: 0 };

    let positions = [];

    /**
     * Velocity of the charged particle.
     */
    let velocity = { x: 0, y: 0 };

    let velocities = [];

    let acceleration = { x: 0, y: 0 };

    let accelerations = [];

    let eventsSize;

    let avgTime = 10;

    /*_______________________________________
    |   General variables
    */

    /**
     * True if running, false otherwise.
     */
    let running = false;

    /**
     * True if left mouse button is down, false otherwise.
     */
    let mouseDown = false;

    /**
     * Speed of light.
     */
    const c = 300;

    let isTrulyRelativistic = true;

    /**
     * Updates the plot.
     * @param {*} inputSignal Signal function f(x), 
     * @param {*} options 
     */
    publicAPIs.update = function (inputSignal, options) {
        // Resizes canvas
        publicAPIs.resizeCanvas();

        // Updates here
        charge.x = Math.round(width / 2);
        charge.y = Math.round(height / 2);

        eventsSize = Math.ceil(Math.max(width, height) / c * 60) + 10;

        positions = Array(eventsSize).fill({ x: charge.x, y: charge.y });
        velocities = Array(avgTime).fill({ x: 0, y: 0 });
        accelerations = Array(eventsSize).fill({ x: 0, y: 0 });

        // Draws the plot
        publicAPIs.toggleAnimation();
        publicAPIs.drawPlot();
    }

    // On mouse down
    window.onmousedown = (e) => {
        if (e.button == 0) {
            mouseDown = true;
        }
    }

    // On mouse up
    window.onmouseup = (e) => {
        if (e.button == 0) {
            mouseDown = false;
        }
    }

    // On mouse move
    window.onmousemove = (e) => {
        mouse.x = e.pageX * dpi;
        mouse.y = e.pageY * dpi;
    }

    window.ontouchstart = (e) => {
        mouseDown = true;

        storeTouchPosition(e);
    }

    window.ontouchend = () => {
        mouseDown = false;
    }

    window.ontouchmove = (e) => {
        storeTouchPosition(e);
    }

    const storeTouchPosition = (e) => {
        e.preventDefault();
        let touches = e.changedTouches;

        mouse.x = touches[0].pageX * dpi;
        mouse.y = touches[0].pageY * dpi;
    }

    window.onkeyup = (e) => {
        if (e.code === "Enter") {
            isTrulyRelativistic = !isTrulyRelativistic;
        }
    }

    /*_______________________________________
    |   Canvas
    */

    const plot = new plotStructure(id, { alpha: false });
    const ctx = plot.getCtx();

    /**
     * Resize the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        plot.resizeCanvas();

        width = plot.getWidth();
        height = plot.getHeight();

        gridSize.x = Math.ceil(width / cellSize);
        gridSize.y = Math.ceil(height / cellSize);

        cellCenters = [];
        for (let i = 0; i < gridSize.x; i++) {
            cellCenters[i] = [];
            for (let j = 0; j < gridSize.y; j++) {
                cellCenters[i][j] = {
                    x: i * cellSize + .5 * cellSize,
                    y: j * cellSize + .5 * cellSize
                }
            }
        }
    }

    /**
     * Toggles the animation on and off.
     */
    publicAPIs.toggleAnimation = () => {
        running = !running;
        if (running) {
            // Starts the animation
            requestAnimationFrame(animate);
        }
    }

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @returns Early return if not playing.
     */
    function animate() {
        if (!running) {
            return;
        }

        if (mouseDown) {
            velocity.x = mouse.x - charge.x;
            velocity.y = mouse.y - charge.y;
        } else {
            velocity.x = Math.abs(velocity.x) > .5 ? .95 * velocity.x : 0;
            velocity.y = Math.abs(velocity.y) > .5 ? .95 * velocity.y : 0;
        }

        limitVelocity(.99 * c);

        velocities.unshift({ x: velocity.x, y: velocity.y });
        if (velocities.length > avgTime - 1) velocities.pop();

        acceleration.x = (velocities[0].x - velocities[avgTime - 1].x) / (avgTime - 1);
        acceleration.y = (velocities[0].y - velocities[avgTime - 1].y) / (avgTime - 1);

        accelerations.unshift({ x: acceleration.x, y: acceleration.y });
        if (accelerations.length > eventsSize) accelerations.pop();

        charge.x += .05 * velocity.x;
        charge.y += .05 * velocity.y;

        positions.unshift({ x: charge.x, y: charge.y });

        // Draws the epicycles
        publicAPIs.drawPlot();

        // Increase Time
        // time = (time + dt) % (2 * Math.PI);

        // Keeps executing this function
        requestAnimationFrame(animate);
    }

    const limitVelocity = (maxVelocity) => {
        const velocityMagnitude = velocity.x * velocity.x + velocity.y * velocity.y;
        if (velocityMagnitude > maxVelocity * maxVelocity) {
            velocity.x = velocity.x / Math.sqrt(velocityMagnitude) * maxVelocity;
            velocity.y = velocity.y / Math.sqrt(velocityMagnitude) * maxVelocity;
        }
    }

    /**
     * Draws the plot.
     */
    publicAPIs.drawPlot = () => {

        // Clears the canvas
        ctx.clearRect(0, 0, width, height);

        publicAPIs.clearPlot();

        ctx.fillStyle = "rgb(150, 150, 150)";

        for (let i = 0; i < gridSize.x; i++) {
            for (let j = 0; j < gridSize.y; j++) {
                const cellCenter = cellCenters[i][j];

                let fieldIntensity = 0;

                if (isTrulyRelativistic) {
                    for (let k = 0; k < eventsSize; k++) {
                        const distanceToEvent = { x: cellCenter.x - positions[k].x, y: cellCenter.y - positions[k].y };
                        const distanceToEventAbs = Math.sqrt(distanceToEvent.x ** 2 + distanceToEvent.y ** 2);
                        const distanceDelta = Math.abs(distanceToEventAbs - c * k / 60);

                        if (distanceDelta < cellSize) {
                            const retardedAcceleration = accelerations[k];

                            const distanceAngle = Math.atan2(distanceToEvent.x, distanceToEvent.y);
                            const accelerationAngle = Math.atan2(retardedAcceleration.x, retardedAcceleration.y);

                            const angleFactor = Math.sin(distanceAngle - accelerationAngle);

                            fieldIntensity = Math.abs(angleFactor)
                                * Math.sqrt(retardedAcceleration.x ** 2 + retardedAcceleration.y ** 2) / distanceToEventAbs;

                            k = eventsSize;
                        }
                    }
                } else {
                    const distanceToCharge = { x: cellCenter.x - charge.x, y: cellCenter.y - charge.y };
                    const distanceToChargeAbs = Math.sqrt(distanceToCharge.x ** 2 + distanceToCharge.y ** 2);
                    const retardedAcceleration = accelerations[Math.round(60 * distanceToChargeAbs / c)];

                    const distanceAngle = Math.atan2(distanceToCharge.x, distanceToCharge.y);
                    const accelerationAngle = Math.atan2(retardedAcceleration.x, retardedAcceleration.y);

                    const angleFactor = Math.sin(distanceAngle - accelerationAngle);

                    fieldIntensity = Math.abs(angleFactor)
                        * Math.sqrt(retardedAcceleration.x ** 2 + retardedAcceleration.y ** 2) / distanceToChargeAbs;
                }

                // let color = 200 * fieldIntensity;
                // color = color > 200 ? 200 : color;

                let radius = 0 + 40 * fieldIntensity;
                radius = radius > 40 ? 40 : (radius > 3 ? Math.round(radius) : radius);

                ctx.beginPath();
                // ctx.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
                ctx.arc(cellCenter.x, cellCenter.y, radius, 0, 360);
                ctx.fill();
                ctx.closePath();
            }
        }

        ctx.beginPath();
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 1;
        ctx.moveTo(charge.x, charge.y);
        ctx.lineTo(charge.x + velocity.x, charge.y + velocity.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "rgb(176, 26, 0)";
        ctx.lineWidth = 5;
        ctx.moveTo(charge.x, charge.y);
        ctx.lineTo(charge.x + 2 * acceleration.x, charge.y + 2 * acceleration.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.arc(charge.x, charge.y, 10, 0, 360);
        ctx.fill();
        ctx.closePath();

        // for (let i = 0; i < gridSizeX; i++) {
        //     for (let j = 0; j < gridSizeY; j++) {
        //         const cellCenterX = i * cellSize + .5 * cellSize;
        //         const cellCenterY = j * cellSize + .5 * cellSize;

        //         ctx.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
        //         ctx.fillRect(
        //             xPos, yPos,
        //             Math.round((i + 1) * cellSize) - xPos,
        //             Math.round((j + 1) * cellSize) - yPos
        //         );
        //     }
        // }
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

    // Returns public methods
    return publicAPIs;
}