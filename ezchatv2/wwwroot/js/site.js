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