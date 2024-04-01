/**
 * Manages plots, sort of...
 * @returns Public APIs.
 */
const plotsManager = new function () {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /**
     * Number of milliseconds to wait after resizing.
     * @type {Number}
     */
    const waitTime = 200;

    let resizeTimeout;

    /**
     * Plot containers.
     */
    const canvases = [...document.getElementsByName("plot")];

    /**
     * Spinning loaders.
     */
    const loaders = [...document.getElementsByName("plot-loader")];

    const toggleControlsPanelButton = document.getElementById("toggle-controls-panel");

    const controlsPanel = document.getElementById("controls-panel");

    const playPauseButton = document.getElementById("play-pause");

    const nextFrameButton = document.getElementById("next-frame");

    let controlsPanelVisible = true;

    let speedOfLight = 600;

    let cellSize = 30;

    let fieldMagnitude = 1;

    /**
     * Plots.
     */
    let plots = new Map();

    // Creates the plots.
    publicAPIs.createPlots = function () {
        // Field plot
        plots.set(
            'wave',
            new wavePlot("wave", {
                speedOfLight: speedOfLight,
                cellSize: cellSize,
                fieldMagnitude: fieldMagnitude
            })
        );
    }

    /**
     * Updates the plots.
     */
    publicAPIs.update = function () {
        updateInputBoxes();

        plots.get('wave').update({
            speedOfLight: speedOfLight,
            cellSize: cellSize,
            fieldMagnitude: fieldMagnitude
        });

        console.log("test", speedOfLight)
    }

    // On window resize
    window.onresize = () => {
        plots.forEach(plot => {
            // Toggles animation off
            plot.pauseAnimation();
            // Clears the canvas
            plot.clearPlot();
        });

        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setLoadingStyle(false);

            plots.forEach(plot => {
                // Resizes the after waiting (for better performances)
                plot.update();
            });
        }, waitTime);
    }

    // Sets the loading mode
    function setLoadingStyle(isLoading) {
        if (isLoading) {
            canvases.forEach((canvas) => {
                // Hides the canvases
                canvas.style.opacity = 0;
                canvas.style.visibility = "hidden";
            });

            loaders.forEach(loader => {
                // Displays the loader while waiting
                loader.style.opacity = 1;
                loader.style.visibility = "visible";
                loader.style.animationPlayState = "running";
            });
        } else {
            canvases.forEach((canvas) => {
                // Displays the canvases
                canvas.style.opacity = 1;
                canvas.style.visibility = "visible";
            });

            loaders.forEach(loader => {
                // Hides the loader
                loader.style.opacity = 0;
                loader.style.visibility = "hidden";
                loader.style.animationPlayState = "paused";
            });
        }
    }

    /*_______________________________________
    |   Inputs for the plots
    */

    /**
     * Ids of input boxes for the plots.
     */
    let inputIds = [
        'speed-of-light', 'cell-size', 'field-magnitude'
    ];

    /**
     * Input boxes for the plots.
     */
    let plotInputs = new Map();

    // Creates the input map
    inputIds.forEach((id) => {
        plotInputs.set(id, document.getElementById(id));
    });

    // Sets listeners for input boxes
    plotInputs.forEach((input) => {
        input.onkeyup = (e) => {
            if (e.code === "Enter" && !e.ctrlKey) {
                changePlots();
            }
        }

        input.onchange = () => {
            changePlots();
        }
    });

    // Updates the parameters when ctrl+Enter is pressed
    document.onkeyup = (e) => {
        if (e.ctrlKey && e.code === "Enter") {
            changePlots();
        }
    }

    /**
     * Updates the input boxes and the respective variables.
     */
    function updateInputBoxes() {
        speedOfLight = constrain(getInputNumber(plotInputs, 'speed-of-light'), 50, Infinity);
        cellSize = constrain(getInputNumber(plotInputs, 'cell-size'), 5, 1000);
        fieldMagnitude = constrain(getInputNumber(plotInputs, 'field-magnitude'), 0, 100);
    }

    /**
     * Update plot when input boxes change.
     */
    function changePlots() {
        setLoadingStyle(true, 0.15);
        setTimeout(function () {
            publicAPIs.update();
            setLoadingStyle(false);
        }, 100);
    }

    /*_______________________________________
    |   Buttons and key listeners
    */

    // On key down
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case "KeyP":
                // Turns play button into pause and viceversa
                plots.get('wave').toggleAnimation();
                playPauseButton.innerHTML = plots.get('wave').isRunning() ? "pause" : "play_arrow";
                break;
            case "KeyN":
                plots.get('wave').nextFrame();
                break;
        }
    });

    // Displays and hide the controls panel
    toggleControlsPanelButton.onclick = () => {
        if (controlsPanelVisible) {
            controlsPanelVisible = false;
            // Translates the controls panel
            controlsPanel.style.transform =
                "translate(" + (-controlsPanel.offsetWidth + toggleControlsPanelButton.offsetWidth) + "px, 0px)";
            // Rotates the collapse symbol
            toggleControlsPanelButton.style.transform = "rotate(180deg)";
        } else {
            controlsPanelVisible = true;
            // Translates the controls panel
            controlsPanel.style.transform = "translate(0px, 0px)";
            // Rotates the collapse symbol
            toggleControlsPanelButton.style.transform = "rotate(0)";
        }
    }

    // Plays and pauses the simulation
    playPauseButton.onclick = () => {
        plots.get('wave').toggleAnimation();
        playPauseButton.innerHTML = plots.get('wave').isRunning() ? "pause" : "play_arrow";
    }

    // Advances the simulation to the next frame
    nextFrameButton.onclick = () => {
        plots.get('wave').nextFrame();
    }

    /**
     * Converts the input value to float and sets the input box value.
     * @param {*} id Id of the input box. 
     * @returns Returns the float value of the input box.
     */
    const getInputNumber = (inputsMap, id) => {
        let newValue = parseFloat(inputsMap.get(id).value);
        inputsMap.get(id).value = newValue;
        return newValue;
    }

    return publicAPIs;
}