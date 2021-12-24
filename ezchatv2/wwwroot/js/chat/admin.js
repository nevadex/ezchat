"use strict";

// ezchat v2 / admin script
// made by nevadex (c) 2021

// admin panel controls
document.getElementById("admin-refreshBanlistButton").addEventListener("click", function (event) {
    connection.invoke("AdminMsg", "banlist", "", uid);
});

document.getElementById("admin-banButton").addEventListener("click", function (event) {
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
    });
});