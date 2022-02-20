"use strict";

// ezchat v2.8 / site
// made by nevadex (c) 2022

document.getElementById("darkMode").addEventListener("click", function (event) {
    if (document.getElementById("darkMode").checked == true) {
        document.getElementById("mainBody").classList.remove("bootstrap");
        document.getElementById("mainBody").classList.add("bootstrap-dark");
    }
    else {
        document.getElementById("mainBody").classList.remove("bootstrap-dark");
        document.getElementById("mainBody").classList.add("bootstrap");
    }
});

// save settings in local storage
document.getElementById("settingsModalCloseButton").addEventListener("click", function (event) {
    refreshConnectionState();
    localStorage.setItem("ttsMode", document.getElementById("ttsMode").checked.toString());
    localStorage.setItem("filterMode", document.getElementById("filterMode").checked.toString());
    localStorage.setItem("showUidsMode", document.getElementById("showUidsMode").checked.toString());
    if (isAdmin == true) {
        localStorage.setItem("showAdminMode", document.getElementById("showAdminMode").checked.toString());
    }
    localStorage.setItem("darkMode", document.getElementById("darkMode").checked.toString());
});

// background functions
document.getElementById("uploadFileManualTrigger").addEventListener("click", function (event) {
    document.getElementById("uploadFileManual").click();
});

function monkeymode() {
    var overlay = document.createElement("div");
    overlay.style.opacity = 1;
    overlay.style.filter = "alpha(opacity=20)";
    overlay.style.backgroundColor = "#224848";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.zIndex = 100;
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.position = "fixed";

    overlay.innerHTML = `<p style="position: absolute; bottom: 0; left: 10px; margin: auto;">${c_ver} &copy; Nevadex 2022</p>
    <p style="position: absolute; bottom: 0; right: 10px; margin: auto; color: red;">Error: failed to load resources</p>`;

    document.body.appendChild(overlay);
}