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
     * Plots.
     */
    let plots = new Map();

    // Creates the plots.
    publicAPIs.createPlots = function () {
        // Field plot
        plots.set(
            'wave',
            new wavePlot("wave")
        );
        plots.get('wave').update();
    }

    /**
     * Updates the plots.
     */
    publicAPIs.update = function () {
        // Updates here
    }

    // On window resize
    window.onresize = () => {
        plots.forEach(plot => {
            // Clear the canvas
            plot.clearPlot();
        });

        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setLoadingStyle(false);

            plots.forEach(plot => {
                // Resize the after waiting (for better performances)
                plot.resizeCanvas();
                // Draws the plot
                plot.drawPlot();
            });
        }, waitTime);
    }

    // Sets the loading mode
    function setLoadingStyle(isLoading, opacity = 0) {
        if (isLoading) {
            canvases.forEach((canvas, i) => {
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
    
    // On key down
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case "KeyP":
                // Turns play button into pause and viceversa
                // playPause.innerHTML = isPlaying ? "play_arrow" : "pause";
                plots.get('wave').toggleAnimation();
        }
    });

    /**
     * Ids of input boxes for the plots.
     */
    let inputIds = [
        
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
            if (e.code === "Enter" && !autoRefresh && !e.ctrlKey) {
                // Update here
            }
        }

        input.onchange = () => {
            if (autoRefresh) ; // Update here
        }
    });

    /**
     * Updates the input boxes and the respective variables.
     */
    function updateInputBoxes() {
        
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