"use strict";

// ezchat revision 5
// made by nevadex (c) 2021
console.log("EZchat revision 5 started");
//console.warn("Running rev5-dev! Expect errors or bugs!")

var connection = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.None).withUrl("/chatHub").build();

//Disable send button until connection is established
document.getElementById("sendButton").disabled = true;
//document.getElementById("userInput").focus();

// initialize context variables
var isAdmin = false;
var isBanned = false;
var uuid = null;

// retrieve and process cookies
//document.cookie = "debugCookie=" + "debug" + "; expires=Thu, 18 Dec 2050 12:00:00 UTC";
var cookieString = document.cookie;
var cookies = cookieString.split("; ");
var userCookie;
var uidCookie;
cookies.forEach(function (value) {
    if (value.includes("user=")) {
        userCookie = value.replace("user=", "");
        //alert("1: " + userCookie);
    }
    else {
        //userCookie = null;
        //alert("2: ");
    }
    if (value.includes("uid=")) {
        uidCookie = value.replace("uid=", "");
        //alert("3: " + uidCookie);
    }
    else {
        uidCookie = null;
        //alert("4: ");
    }
});

// set user if cookie
if (userCookie != null) {
    document.getElementById("userInput").value = userCookie;
    document.getElementById("messageInput").focus();
}
else {
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
//window.speechSynthesis.speak(speech);

connection.on("ReceiveMessage", function (user, message, uid) {
    var li = document.createElement("li");
    //li.title = "Sender UID: " + uid;
    li.dataset.uid = uid;
    li.dataset.user = user;
    document.getElementById("messagesList").appendChild(li);
    // dont change, could allow script injection
    //li.textContent = `<${user}> ${message}`;

    // profanity filter
    // doesnt work :(
    //#region old filter
    /*
    if (document.getElementById("filterMode").checked == true) {
        var checkedUser = user;
        var checkedMessage = message;

        // initialize regex
        //#region bad words
        const badWords = ["fuck", "shit", "bitch", "ass", "nigger", "nigga"];
        //#endregion
        const reEscape = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const badWordsRE = new RegExp(badWords.map(reEscape).join('|'));

        var bwUser = checkedUser.match(badWordsRE)
        var bwMessage = checkedMessage.match(badWordsRE)

        // character to censor with
        var censorChar = "*";
        alert(bwUser.toString + " | " + bwMessage.toString);

        for (let i in bwUser) {
            var censor = "";
            for (let x = 0; x == i.length; x++) { censor += censorChar; }
            alert("1");
            checkedUser = checkedUser.replace(i, censor);
            alert("2");
        }
        for (let i in bwMessage) {
            var censor = "e";
            //for (let x = 0; x == i.length; x++) { censor += censorChar; }
            alert("3" + censor);
            checkedMessage = message.replace(i, censor);
            alert("4");
        }

        // update the message li
        li.textContent = `<${checkedUser}> ${checkedMessage}`;
    }
    */
    //#endregion

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
    // usable types: clientList banMsg banlist

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
    else if (type == "banlist") {
        document.getElementById("admin-banList").textContent = "Banned UIDs: " + message;
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
    connection.invoke("Login", document.getElementById("userInput").value, uidCookie).catch(function (err) {
        connection.stop();
        return console.error(err.toString());
    });

    console.log("Logged in as [" + userCookie + "] with UID [" + uidCookie + "]");

}).catch(function (err) {
        return console.error(err.toString());
});

// set context/uid var
uuid = uidCookie + "/" + userCookie;

// if user has admin, it is true
if (document.getElementById("adminPanel").dataset.use_attribute == "True") {
    // currently checking for URLquery '?admin=true'
    var adminQuery = new URLSearchParams(window.location.search).get("admin");
    if (adminQuery == "true") {
        isAdmin = true;
        console.log("User has permission 'Admin'");
    }
}

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

// show admin mode toggle thing
document.getElementById("showAdminMode").addEventListener("click", function (event) {
    if (document.getElementById("showAdminMode").checked == true) {
        document.getElementById("adminPanel").hidden = false;
        connection.invoke("ServerMsg", "banlist", "", uuid);
    }
    else {
        document.getElementById("adminPanel").hidden = true;
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

// admin panel controls
document.getElementById("admin-refreshBanlistButton").addEventListener("click", function (event) {
    connection.invoke("ServerMsg", "banlist", "", uuid);
});

document.getElementById("admin-banButton").addEventListener("click", function (event) {
    var banInput = document.getElementById("admin-banInput").value;
    if (document.getElementById("admin-banInput").value = "") {
        alert("Admin: missing UID");
        return;
    }

    connection.invoke("ServerMsg", "ban", banInput, uuid);
    document.getElementById("admin-banInput").value = "";
    connection.invoke("ServerMsg", "banlist", "", uuid);
});

document.getElementById("admin-unbanButton").addEventListener("click", function (event) {
    var unbanInput = document.getElementById("admin-unbanInput").value;
    if (document.getElementById("admin-unbanInput").value = "") {
        alert("Admin: missing UID");
        return;
    }

    connection.invoke("ServerMsg", "unban", unbanInput, uuid);
    document.getElementById("admin-unbanInput").value = "";
    connection.invoke("ServerMsg", "banlist", "", uuid);
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