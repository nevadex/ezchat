"use strict";

// ezchat v2.8
// made by nevadex (c) 2022

var init_start = performance.now();
console.log("[INIT] start");

// common
var c_hubUrl = "/chatHub";
var c_fsUrl = "/api/fs"
var c_ver = "EZchat v2.8";
var c_dev = true;
var c_defaultUsername = "user";

// initialize context variables
var isAdmin = false;
var isBanned = false;
var uuid = null;
var uid = null;
var fs_status = null;

if (!c_dev) {
    console.log("[INIT] Running " + c_ver);
} else {
    console.warn("[INIT] Running " + c_ver + "-dev! Expect errors or bugs.");
}

var connection = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.None).withUrl(c_hubUrl).build();

async function asyncInit() {
    // connection
    await connection.start().then(function () {
        // create uid if non-existant
        // currently just using first conID,
        // use SHA1 hash if u want
        if (uidCookie == null) {
            var firstConId = connection.connectionId;
            document.cookie = "uid=" + firstConId + "; expires=Thu, 18 Dec 2050 12:00:00 UTC";
            uidCookie = firstConId;
        }

        document.getElementById("sendButton").disabled = false;
        // change conState on page
        document.getElementById("conState").textContent = "[Connected!]";

        // login to hub
        connection.invoke("Login", userCookie, uidCookie).catch(function (err) {
            connection.stop();
            return console.error(err.toString());
        });

        console.log("[INIT] logged in as [" + userCookie + "] with UID [" + uidCookie + "]");

        var init_end = performance.now();
        var init_time = init_end - init_start
        init_time = init_time.toFixed(1);
        console.log(`[INIT] done! took ${init_time} ms`);

        $("#loadingOverlay").fadeOut();
    }).catch(function (err) {
        return console.error(err.toString());
    });

}

// retrieve and process cookies
//document.cookie = "debugCookie=" + "debug" + "; expires=Thu, 18 Dec 2050 12:00:00 UTC";
var cookieString = document.cookie;
var cookies = cookieString.split("; ");
var userCookie;
var uidCookie;
cookies.forEach(function (value) {
    if (value.includes("user=")) {
        userCookie = value.replace("user=", "");
    }
    else {
        //userCookie = null;
    }
    if (value.includes("uid=")) {
        uidCookie = value.replace("uid=", "");
    }
    else {
        uidCookie = null;
        // uid created later
    }
});

// set user if cookie
if (userCookie != null) {
    document.getElementById("userInput").value = userCookie;
    document.getElementById("messageInput").focus();
}
else {
    userCookie = c_defaultUsername; // default username
    document.getElementById("userInput").focus();
}

// set context/uid var
uuid = uidCookie + "/" + userCookie;
uid = uidCookie;

// load local storage for settings
$(document).ready(function () {
    //document.getElementById("messagesListDiv").style.height = document.getElementById("messagesListDiv").offsetHeight + "px";

    if (localStorage.getItem("ttsMode") == "true") {
        //document.getElementById("ttsMode").checked = true;
        document.getElementById("ttsMode").click();
    } else {
        document.getElementById("ttsMode").checked = false;
    }
    if (localStorage.getItem("filterMode") == "true") {
        //document.getElementById("filterMode").checked = true;
        document.getElementById("filterMode").click();
    } else {
        document.getElementById("filterMode").checked = false;
    }
    if (localStorage.getItem("showUidsMode") == "true") {
        //document.getElementById("showUidsMode").checked = true;
        document.getElementById("showUidsMode").click();
    } else {
        document.getElementById("showUidsMode").checked = false;
    }
    if (localStorage.getItem("darkMode") == "true") {
        //document.getElementById("darkMode").checked = true;
        document.getElementById("darkMode").click();
    } else {
        document.getElementById("darkMode").checked = false;
    }
});

console.log("[INIT] loaded local");

fetch(c_fsUrl)
    .then(response => response.json())
    .then(data => {
        fs_status = JSON.parse(data); 
    }).then(a => {
        if (fs_status["enabled"] == false) {
            document.getElementById("uploadFileManualTrigger").disabled = true;
            document.getElementById("uploadFileManual").disabled = true;
            document.getElementById("uploadFileManualTrigger").hidden = true;
            document.getElementById("uploadFileManual").hidden = true;
        } 

        console.log("[INIT] loaded FS_Status");
    });

asyncInit();

function refreshConnectionState() {
    if (isBanned == false) {
        var state = connection.state;
        var label = document.getElementById("conState");
        label.textContent = "[?]"

        if (state == "Connected") {
            label.textContent = "[Connected!]";
            label.style.color = "gray";
        }
        else if (state == "Disconnected") {
            console.warn("disconnected! trying to reconnect");
            label.textContent = "[Disconnected!]";
            label.style.color = "red";
            setTimeout(function () {
                connection.stop(); connection.start().then(function () {
                    connection.invoke("Login", document.getElementById("userInput").value, uidCookie).then(function () { refreshConnectionState(); }).catch(function (err) {
                        return console.error(err.toString());
                    });
                });
                refreshConnectionState();
            }, 1500);
        }
        else {
            label.textContent = "[" + state + "!]";
            label.style.color = "red";
        }
    }
}