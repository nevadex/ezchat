"use strict";

// ezchat v2.7 / admin script
// made by nevadex (c) 2021

// admin panel controls
document.getElementById("admin-refreshBanlistButton").addEventListener("click", function (event) {
    refreshConnectionState();
    connection.invoke("AdminMsg", "banlist", "", uid);
});

document.getElementById("admin-banButton").addEventListener("click", function (event) {
    refreshConnectionState();
    var banInput = document.getElementById("admin-banInput").value;
    if (document.getElementById("admin-banInput").value = "") {
        alert("Admin: missing UID");
        return;
    }

    connection.invoke("AdminMsg", "ban", banInput, uid);
    document.getElementById("admin-banInput").value = "";
    connection.invoke("AdminMsg", "banlist", "", uid);
});

document.getElementById("admin-unbanButton").addEventListener("click", function (event) {
    refreshConnectionState();
    var unbanInput = document.getElementById("admin-unbanInput").value;
    if (document.getElementById("admin-unbanInput").value = "") {
        alert("Admin: missing UID");
        return;
    }

    connection.invoke("AdminMsg", "unban", unbanInput, uid);
    document.getElementById("admin-unbanInput").value = "";
    connection.invoke("AdminMsg", "banlist", "", uid);
});

document.getElementById("admin-reconButton").addEventListener("click", function (event) {
    /*
    connection.stop().then(function () {
        connection.start().then(function () {
            // login to hub
            //connection.invoke("Login", document.getElementById("userInput").value, uidCookie).catch(function (err) {
            //    connection.stop();
            //    return console.error(err.toString());
            //});

            //console.log("Admin: Logged in as [" + userCookie + "] with UID [" + uidCookie + "]");
            console.warn("Admin: Reconnected without login, connection unstable.", connection);
        }).catch(function (err) {
            return console.error(err.toString());
        });
    });*/
    // disabled in html

    alert("The reconnect button is currently disabled.");
});

// chat controls
document.getElementById("admin-clearCache").addEventListener("click", function (event) {
    refreshConnectionState();
    // auto
    connection.invoke("AdminMsg", "clearCache", "", uid);
});
document.getElementById("admin-reloadConfig").addEventListener("click", function (event) {
    refreshConnectionState();
    // auto
    connection.invoke("AdminMsg", "reloadConfig", "", uid);
});
document.getElementById("admin-refreshAllClients").addEventListener("click", function (event) {
    refreshConnectionState();
    // auto
    connection.invoke("AdminMsg", "refreshAllClients", "", uid);
});
document.getElementById("admin-changeMotd").addEventListener("click", function (event) {
    refreshConnectionState();
    // input
    let newMotd = prompt("New MOTD:");
    connection.invoke("AdminMsg", "changeMotd", newMotd, uid);
});
document.getElementById("admin-pauseChat").addEventListener("click", function (event) {
    refreshConnectionState();
    // auto
    connection.invoke("AdminMsg", "pauseChat", "", uid);
});
document.getElementById("admin-stopChat").addEventListener("click", function (event) {
    refreshConnectionState();
    // confirm
    if (confirm("Confirm stopping chat?\nThis is irreversible, and EZchat will have to be restarted from the host.")) {
        connection.invoke("AdminMsg", "stopChat", "", uid);
    }
});

// server methods
connection.on("AdminMsg", function (type, message, uid) {
    if (type == "banlist") {
        document.getElementById("admin-banList").textContent = "Banned UIDs: " + message;
    }
    else if (type == "clientAdmin") {
        isAdmin = true;
        // load admin setting
        if (isAdmin == true) {
            if (localStorage.getItem("showAdminMode") == "true") {
                //document.getElementById("showAdminMode").checked = true;
                document.getElementById("showAdminMode").click();
            } else {
                document.getElementById("showAdminMode").checked = false;
            }
        }
    }
});

// etc things

// show admin mode toggle thing
document.getElementById("showAdminMode").addEventListener("click", function (event) {
    if (document.getElementById("showAdminMode").checked == true) {
        document.getElementById("adminPanel").hidden = false;
        connection.invoke("AdminMsg", "banlist", "", uid);
    }
    else {
        document.getElementById("adminPanel").hidden = true;
    }
});

// use admin attribute
// security vuln lmao
if (document.getElementById("adminPanel").dataset.use_attribute == "True") {
    // currently checking for URLquery '?admin=true'
    var adminQuery = new URLSearchParams(window.location.search).get("admin");
    if (adminQuery == "true") {
        isAdmin = true;
        console.log("User has permission 'Admin'");
    }
}