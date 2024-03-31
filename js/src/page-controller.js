/**
 * Device dpi.
 */
let dpi;

window.onload = () => {
    // Removes the spinning loader
    document.getElementById("loading-container").style.opacity = 0;
    document.getElementById("loading-container").remove();
    // Makes page content visible 
    document.getElementById("page-container").style = "visibility: visible; opacity: 1;";

    // Get the device dpi
    dpi = window.devicePixelRatio;

    plotsManager.createPlots();
    plotsManager.update();
}