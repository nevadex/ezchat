"use strict";

// ezchat v2.8
// made by nevadex (c) 2022

// disable send button until connection is established
document.getElementById("sendButton").disabled = true;

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
    li.dataset.raw = message
    document.getElementById("messagesList").appendChild(li);
    // dont change, could allow script injection
    //li.textContent = `<${user}> ${message}`;

    var checkedUser = user;
    var checkedMessage = message;
    if (document.getElementById("filterMode").checked == true) {
        checkedUser = pf_filter(checkedUser);
        checkedMessage = pf_filter(checkedMessage);
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

document.getElementById("sendButton").addEventListener("click", function (event) {
    refreshConnectionState(); // refresh

    var user = document.getElementById("userInput").value;
    var message = document.getElementById("messageInput").value;
    var userDom = document.getElementById("userInput");
    var messageDom = document.getElementById("messageInput");
    var userFbDom = document.getElementById("userInputFeedback");
    var messageFbDom = document.getElementById("messageInputFeedback");

    // test if the values are empty
    if (user == "") {
        userDom.classList.add("is-invalid");
        userFbDom.classList.add("invalid-feedback");
        userFbDom.innerHTML = "Your username cannot be empty!";
        return;
    } else {
        // clear feedbacks
        userDom.classList.remove("is-invalid", "is-valid");
        userFbDom.classList.remove("invalid-feedback", "valid-feedback");
        userFbDom.innerHTML = "";
        messageDom.classList.remove("is-invalid", "is-valid");
        messageFbDom.classList.remove("invalid-feedback", "valid-feedback");
        messageFbDom.innerHTML = "";
    }
    if (message == "") {
        messageDom.classList.add("is-invalid");
        messageFbDom.classList.add("invalid-feedback");
        messageFbDom.innerHTML = "Your message cannot be empty!";
        return;
    } else {
        // clear feedbacks
        userDom.classList.remove("is-invalid", "is-valid");
        userFbDom.classList.remove("invalid-feedback", "valid-feedback");
        userFbDom.innerHTML = "";
        messageDom.classList.remove("is-invalid", "is-valid");
        messageFbDom.classList.remove("invalid-feedback", "valid-feedback");
        messageFbDom.innerHTML = "";
    }
    if (user.length > 20) {
        userDom.classList.add("is-invalid");
        userFbDom.classList.add("invalid-feedback");
        userFbDom.innerHTML = "Your username cannot be more than 20 characters!";
        return;
    } else {
        // clear feedbacks
        userDom.classList.remove("is-invalid", "is-valid");
        userFbDom.classList.remove("invalid-feedback", "valid-feedback");
        userFbDom.innerHTML = "";
        messageDom.classList.remove("is-invalid", "is-valid");
        messageFbDom.classList.remove("invalid-feedback", "valid-feedback");
        messageFbDom.innerHTML = "";
    }
    if (message.length > 200) {
        messageDom.classList.add("is-invalid");
        messageFbDom.classList.add("invalid-feedback");
        messageFbDom.innerHTML = "Your message cannot be more than 200 characters!";
        return;
    } else {
        // clear feedbacks
        userDom.classList.remove("is-invalid", "is-valid");
        userFbDom.classList.remove("invalid-feedback", "valid-feedback");
        userFbDom.innerHTML = "";
        messageDom.classList.remove("is-invalid", "is-valid");
        messageFbDom.classList.remove("invalid-feedback", "valid-feedback");
        messageFbDom.innerHTML = "";
    }
    if (user.includes(" ")) {
        userDom.classList.add("is-invalid");
        userFbDom.classList.add("invalid-feedback");
        userFbDom.innerHTML = "Your username cannot contain a space!";
        return;
    } else {
        // clear feedbacks
        userDom.classList.remove("is-invalid", "is-valid");
        userFbDom.classList.remove("invalid-feedback", "valid-feedback");
        userFbDom.innerHTML = "";
        messageDom.classList.remove("is-invalid", "is-valid");
        messageFbDom.classList.remove("invalid-feedback", "valid-feedback");
        messageFbDom.innerHTML = "";
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

// filter mode toggle thing
document.getElementById("filterMode").addEventListener("click", function (event) {
    if (document.getElementById("filterMode").checked == true) {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            x[i].textContent = pf_filter(x[i].textContent);
        }
    }
    else {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            if (document.getElementById("showUidsMode").checked == true) {
                x[i].textContent = "<" + x[i].dataset.uid + "/" + x[i].dataset.user + "> " + x[i].dataset.raw;
            }
            else {
                x[i].textContent = "<" + x[i].dataset.user + "> " + x[i].dataset.raw;
            }
        }
    }
});

// show uids mode toggle thing
// little bit buggy with pf
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

document.getElementById("conState").addEventListener("click", function (event) {
    refreshConnectionState();
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
});