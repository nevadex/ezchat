"use strict";

// ezchat v2.7-dev
// made by nevadex (c) 2021
//console.log("EZchat v2.7 started");
console.warn("Running v2.7-dev! Expect errors or bugs!")

var connection = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.None).withUrl("/chatHub").build();

//Disable send button until connection is established
document.getElementById("sendButton").disabled = true;

// initialize context variables
var isAdmin = false;
var isBanned = false;
var uuid = null;
var uid = null;

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
    userCookie = "user"; // default username
    document.getElementById("userInput").focus();
}

// when enter is hit in the message box, it sends the message
document.getElementById("messageInput")
    .addEventListener("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("sendButton").click();
        }
    });

// tts mode initialization
let speech = new SpeechSynthesisUtterance();
speech.lang = "en";
var voices = window.speechSynthesis.getVoices();
speech.voice = voices[4];
//window.speechSynthesis.speak(speech); // code got deprecated lmao

connection.on("ReceiveMessage", function (user, message, uid) {
    var li = document.createElement("li");
    //li.title = "Sender UID: " + uid;
    li.dataset.uid = uid;
    li.dataset.user = user;
    document.getElementById("messagesList").appendChild(li);
    // dont change, could allow script injection
    //li.textContent = `<${user}> ${message}`;

    var checkedUser = user;
    var checkedMessage = message;
    if (document.getElementById("filterMode").checked == true) {
        //#region BAD WORDS
        checkedUser = checkedUser.replaceAll(/fuck/img, "f***");
        checkedUser = checkedUser.replaceAll(/bitch/img, "b****");
        checkedUser = checkedUser.replaceAll(/ass/img, "a**");
        checkedUser = checkedUser.replaceAll(/shit/img, "s***");
        checkedUser = checkedUser.replaceAll(/nigger/img, "n*****");
        checkedUser = checkedUser.replaceAll(/nigga/img, "n****");
        checkedUser = checkedUser.replaceAll(/cum/img, "c**");
        checkedUser = checkedUser.replaceAll(/dick/img, "d***");

        checkedMessage = checkedMessage.replaceAll(/fuck/img, "f***");
        checkedMessage = checkedMessage.replaceAll(/bitch/img, "b****");
        checkedMessage = checkedMessage.replaceAll(/ass/img, "a**");
        checkedMessage = checkedMessage.replaceAll(/shit/img, "s***");
        checkedMessage = checkedMessage.replaceAll(/nigger/img, "n*****");
        checkedMessage = checkedMessage.replaceAll(/nigga/img, "n****");
        checkedMessage = checkedMessage.replaceAll(/cum/img, "c**");
        checkedMessage = checkedMessage.replaceAll(/dick/img, "d***");
        //#endregion
    }

    // show uids mode
    if (document.getElementById("showUidsMode").checked == true) {
        checkedUser = checkedUser.replace(li.dataset.user, li.dataset.uid + "/" + li.dataset.user);
    }

    // tts mode
    if (document.getElementById("ttsMode").checked == true) {
        speech.text = user + " says " + message;
        window.speechSynthesis.speak(speech);
    }

    li.textContent = `<${checkedUser}> ${checkedMessage}`;
});

// Server Messenger
connection.on("ServerMsg", function (type, message, uid) {
    // usable types: clientList banMsg reload

    if (type == "clientList") {
        // message = clientCount client1uid¶client1user client2uid¶client2user ...
        var array = message.split(" ");
        var clientList = document.getElementById("clientList");
        var clientListStr = array[0] + " Online:";
        var admin_clientListStr = "Online UIDs:";
        array.splice(0, 1);
        array.forEach(function (item, index) {
            var userdata = item.split("¶");
            // mark an online user as you when it is you
            var marker = "";
            if (userdata[0] == uidCookie) {
                marker = "(you!)";
            }
            // uid/user
            //var str = " " + userdata[0] + "/" + userdata[1] + marker;
            // user
            var str = " " + userdata[1] + marker;
            clientListStr = clientListStr + str;

            // admin panel list
            var str2 = " " + userdata[0] + "/" + userdata[1];// + marker;
            admin_clientListStr = admin_clientListStr + str2;

        });
        clientList.textContent = clientListStr;
        document.getElementById("admin-clientList").textContent = admin_clientListStr;
    }
    else if (type == "banMsg") {
        // user is banned
        console.error("User was found on the banlist");
        isBanned = true;
        connection.off();
        document.getElementById("conState").textContent = "[Disconnected!]";
        document.getElementById("conState").style.color = "red";
        document.getElementById("messageInput").value = "You are banned!";
        document.getElementById("messageInput").disabled = true;
        document.getElementById("userInput").disabled = true;
        document.getElementById("sendButton").disabled = true;
    }
    else if (type == "reload") {
        location.reload();
    }
});

connection.start().then(function () {
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

    console.log("Logged in as [" + userCookie + "] with UID [" + uidCookie + "]");

}).catch(function (err) {
        return console.error(err.toString());
});

// set context/uid var
uuid = uidCookie + "/" + userCookie;
uid = uidCookie;

document.getElementById("sendButton").addEventListener("click", function (event) {
    refreshConnectionState(); // refresh

    var user = document.getElementById("userInput").value;
    var message = document.getElementById("messageInput").value;

    // test if the values are empty
    if (user == "") {
        alert("Your username cannot be empty!")
        return;
    }
    if (message == "") {
        alert("Your message cannot be empty!")
        return;
    }
    if (user.length > 20) {
        alert("Your username cannot be more than 20 characters!")
        return;
    }
    if (message.length > 200) {
        alert("Your message cannot be more than 200 characters!")
        return;
    }
    if (user.includes(" ")) {
        alert("Your username cannot contain a space!")
        return;
    }

    // save username in cookie
    document.cookie = "user=" + user + "; expires=Thu, 18 Dec 2050 12:00:00 UTC";

    connection.invoke("SendMessage", user, message).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
    document.getElementById("messageInput").value = "";
    document.getElementById("messageInput").focus();
});

// control options visibility
document.getElementById("toggleOptions").addEventListener("click", function (event) {
    refreshConnectionState(); // refresh
    var toggleOptions = document.getElementById("toggleOptions");
    if (toggleOptions.value == "Show Options") {
        toggleOptions.value = "Hide Options"
        document.getElementById("ttsModeDiv").style.display = "initial";
        document.getElementById("filterModeDiv").style.display = "initial";
        document.getElementById("clearMsgDiv").style.display = "initial";
        document.getElementById("showUidsDiv").style.display = "initial";
        if (isAdmin == true) {
            document.getElementById("showAdminDiv").style.display = "initial";
        }
    }
    else if (toggleOptions.value == "Hide Options") {
        toggleOptions.value = "Show Options"
        document.getElementById("ttsModeDiv").style.display = "none";
        document.getElementById("filterModeDiv").style.display = "none";
        document.getElementById("clearMsgDiv").style.display = "none";
        document.getElementById("showUidsDiv").style.display = "none";
        document.getElementById("showAdminDiv").style.display = "none";
    }
    else { }
});

// filter mode toggle thing
document.getElementById("filterMode").addEventListener("click", function (event) {
    if (document.getElementById("filterMode").checked == true) {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            //#region BAD WORDS
            x[i].textContent = x[i].textContent.replaceAll(/fuck/img, "f***");
            x[i].textContent = x[i].textContent.replaceAll(/bitch/img, "b****");
            x[i].textContent = x[i].textContent.replaceAll(/ass/img, "a**");
            x[i].textContent = x[i].textContent.replaceAll(/shit/img, "s***");
            x[i].textContent = x[i].textContent.replaceAll(/nigger/img, "n*****");
            x[i].textContent = x[i].textContent.replaceAll(/nigga/img, "n****");
            x[i].textContent = x[i].textContent.replaceAll(/faggot/img, "f*****");
            x[i].textContent = x[i].textContent.replaceAll(/cum/img, "c**");
            x[i].textContent = x[i].textContent.replaceAll(/dick/img, "d***");
            //#endregion
        }
    }
    else {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            //#region BAD WORDS
            x[i].textContent = x[i].textContent.replaceAll(/f\*\*\*/img, "fuck");
            x[i].textContent = x[i].textContent.replaceAll(/b\*\*\*\*/img, "bitch");
            x[i].textContent = x[i].textContent.replaceAll(/a\*\*/img, "ass");
            x[i].textContent = x[i].textContent.replaceAll(/s\*\*\*/img, "shit");
            x[i].textContent = x[i].textContent.replaceAll(/n\*\*\*\*\*/img, "nigger");
            x[i].textContent = x[i].textContent.replaceAll(/n\*\*\*\*/img, "nigga");
            x[i].textContent = x[i].textContent.replaceAll(/f\*\*\*\*\*/img, "faggot");
            x[i].textContent = x[i].textContent.replaceAll(/c\*\*/img, "cum");
            x[i].textContent = x[i].textContent.replaceAll(/d\*\*\*/img, "dick");
            //#endregion
        }
    }
});

// show uids mode toggle thing
document.getElementById("showUidsMode").addEventListener("click", function (event) {
    if (document.getElementById("showUidsMode").checked == true) {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            x[i].textContent = x[i].textContent.replace(x[i].dataset.user, x[i].dataset.uid + "/" + x[i].dataset.user);
        }
    }
    else {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            x[i].textContent = x[i].textContent.replace(x[i].dataset.uid + "/" + x[i].dataset.user, x[i].dataset.user);
        }
    }
});

document.getElementById("clearMsgList").addEventListener("click", function (event) {
    var ul = document.getElementById("messagesList");
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild)
    }
});

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

document.getElementById("conState").addEventListener("click", function (event) {
    refreshConnectionState();
});