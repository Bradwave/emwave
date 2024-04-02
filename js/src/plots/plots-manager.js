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

    /**
     * Button to toggle the controls panel.
     */
    const toggleControlsPanelButton = document.getElementById("toggle-controls-panel");

    /**
     * Controls panel.
     */
    const controlsPanel = document.getElementById("controls-panel");

    /**
     * Button to play and pause the simulation.
     */
    const playPauseButton = document.getElementById("play-pause");

    /**
     * Button to play the next frame of the simulation.
     */
    const nextFrameButton = document.getElementById("next-frame");

    /**
     * True fi the control panel is visible, false otherwise.
     */
    let controlsPanelVisible = true;

    /**
     * Speed of light.
     */
    let speedOfLight = 600;

    /**
     * Size of the field cell.
     */
    let cellSize = 30;

    /**
     * Filed intensity multiplier.
     */
    let fieldMagnitude = 1;

    /**
     * Plots.
     */
    let plots = new Map();

    // Creates the plots.
    publicAPIs.createPlots = function () {
        // Creates the electromagnetic wave plot
        plots.set(
            'wave',
            new wavePlot("wave", {
                speedOfLight: speedOfLight,
                cellSize: cellSize,
                fieldMagnitude: fieldMagnitude,
                plotContainer: document.getElementById("plot-container")
            })
        );

        // Creates the light plot
        plots.set(
            'light',
            new lightPlot("light", {
                speedOfLight: speedOfLight,
                width: controlsPanel.offsetWidth - 20,
                yOffset: controlsPanel.offsetHeight + 40
            })
        );
    }

    /**
     * Updates the plots.
     */
    publicAPIs.update = function () {
        updateInputBoxes();

        // Updates the electromagnetic wave plot
        plots.get('wave').update({
            speedOfLight: speedOfLight,
            cellSize: cellSize,
            fieldMagnitude: fieldMagnitude
        });

        plots.get('light').update({
            speedOfLight: speedOfLight
        });
    }

    // On window resize
    window.onresize = () => {
        changePlots();
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
            canvases.forEach((canvas, i) => {
                // Displays the canvases
                canvas.style.opacity = i == 1 ? (controlsPanelVisible ? 1 : 0) : 1;
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
        plots.forEach(plot => {
            // Pauses the animation
            plot.pauseAnimation();
            // Clears the canvas
            plot.clearPlot();
        });

        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setLoadingStyle(false);

            publicAPIs.update();
        }, waitTime);
    }

    /*_______________________________________
    |   Buttons and key listeners
    */

    // On key down
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case "KeyP":
                // Turns play button into pause and viceversa
                plots.forEach(plot => {
                    plot.toggleAnimation();
                })
                playPauseButton.innerHTML = plots.get('wave').isRunning() ? "pause" : "play_arrow";
                break;
            case "KeyN":
                // Plays the next frame
                plots.forEach(plot => {
                    plot.nextFrame();
                })
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
            // Pauses the light animation
            plots.get('light').pauseAnimation();
            // Hides the light plot
            canvases[1].style.opacity = 0;
        } else {
            controlsPanelVisible = true;
            // Translates the controls panel
            controlsPanel.style.transform = "translate(0px, 0px)";
            // Rotates the collapse symbol
            toggleControlsPanelButton.style.transform = "rotate(0)";
            // Plays the light animation
            plots.get('light').playAnimation();
            // Makes the light plot visible
            canvases[1].style.opacity = 1;
        }
    }

    // Plays and pauses the simulation
    playPauseButton.onclick = () => {
        plots.forEach(plot => {
            plot.toggleAnimation();
        })
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