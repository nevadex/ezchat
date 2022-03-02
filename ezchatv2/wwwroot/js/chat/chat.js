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
            document.getElementById("sendButton").click(event);
        }
    });

// tts mode initialization
let speech = new SpeechSynthesisUtterance();
speech.lang = "en";
var voices = window.speechSynthesis.getVoices();
speech.voice = voices[4];
//window.speechSynthesis.speak(speech); // code got deprecated lmao

class MsgTextSel {
    constructor(text, isLink) {
        this.text = text;
        this.isLink = isLink;
    }
}

connection.on("ReceiveMessage", function (user, message, uid) {
    var li = document.createElement("li");
    //li.title = "Sender UID: " + uid;
    li.dataset.uid = uid;
    li.dataset.user = user;
    // dont change, could allow script injection
    //li.textContent = `<${user}> ${message}`;

    var checkedUser = user;
    var checkedMessage = message;
    var msgSections = [];
    // renderer
    var rawMsgSections = message.split(" ");
    if (!message.includes(" ")) { rawMsgSections = []; rawMsgSections.push(message); }
    for (let i = 0; i < rawMsgSections.length; i++) {
        var validator = document.createElement("a");
        validator.href = rawMsgSections[i];
        if (validator.host != document.location.host || rawMsgSections[i].includes(document.location.host)) {
            var protsec = validator.href.split(":");
            if ((protsec[0] == "http" || protsec[0] == "https") && (protsec[1].charAt(0) == "/" && protsec[1].charAt(1) == "/")) {
                msgSections.push(new MsgTextSel(rawMsgSections[i], true));
                continue;
            }
            else {
                msgSections.push(new MsgTextSel(rawMsgSections[i], false));
                continue;
            }
        } else {
            msgSections.push(new MsgTextSel(rawMsgSections[i], false));
            continue;
        }
        validator.remove();
    }

    if (document.getElementById("filterMode").checked == true) {
        checkedUser = pf_filter(checkedUser);
        //checkedMessage = pf_filter(checkedMessage);

        for (let i = 0; i < msgSections.length; i++) {
            if (msgSections[i].isLink == false) {
                msgSections[i].text = pf_filter(msgSections[i].text);
            }
        }
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

    // render compile
    li.innerText = `<${checkedUser}> `;
    var fileRenderer = document.createElement("div");
    var hasFiles = false;
    for (let i = 0; i < msgSections.length; i++) {
        if (msgSections[i].isLink) {
            // get file ext in case of img
            var fileExt = msgSections[i].text;
            fileExt = getFileExtention(fileExt);
            if (fileExt.includes("?")) {
                fileExt = fileExt.split("?")[0];      
            }
            if (fileExt.charAt(fileExt.length - 1) == "/") {
                fileExt = fileExt.substring(0, fileExt.length - 1);
            }
            // image
            if (fs_status["displayImages"]) {
                if (imageFormats.includes(fileExt)) {
                    hasFiles = true;
                    var img = document.createElement("img");
                    img.src = msgSections[i].text;
                    img.style.maxWidth = "50%";
                    img.style.maxHeight = "50%";
                    img.style.marginTop = "5px";
                    img.style.marginBottom = "5px";
                    img.style.marginRight = "5px";
                    //img.style.outline = "2px outset #17A2B8";
                    fileRenderer.appendChild(img);
                }
            }
            // video
            if (fs_status["displayImages"]) {
                if (videoFormats.includes(fileExt)) {
                    hasFiles = true;
                    var video = document.createElement("video");
                    video.style.maxWidth = "30%";
                    video.style.maxHeight = "30%";
                    video.style.marginTop = "5px";
                    video.style.marginBottom = "5px";
                    video.style.marginRight = "5px";
                    video.controls = "controls";
                    video.preload = "metadata";
                    var src = document.createElement("source");
                    src.src = msgSections[i].text;
                    var error = document.createElement("p");
                    error.classList.add("text-warning");
                    error.innerHTML = "Unable to display video.";
                    video.appendChild(src);
                    video.appendChild(error);
                    fileRenderer.appendChild(video);
                }
            }

            var a = document.createElement("a");
            a.href = `${msgSections[i].text}`;
            a.innerHTML = `${msgSections[i].text}`;
            a.target = "_blank";
            li.appendChild(a);
            if ((msgSections.length - 1) > i) {
                li.innerHTML = li.innerHTML + " ";
            }
        } else {
            li.innerHTML = li.innerHTML + `${msgSections[i].text} `;
        }
    }

    if (hasFiles) {
        li.appendChild(fileRenderer);
        li.dataset.files = li.lastChild.innerHTML;
    }
    li.dataset.msgSections = JSON.stringify(msgSections);
    document.getElementById("messagesList").appendChild(li);
    //li.textContent = `<${checkedUser}> ${checkedMessage}`;
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
            //var marker = "";
            var str = "";
            if (userdata[0] == uidCookie) {
                //marker = "(you!)";
                str = " <i>" + userdata[1] + "</i>";
            } else {
                str = " " + userdata[1];
            }
            //var str = " " + userdata[1] + marker;
            clientListStr = clientListStr + str;

            // admin panel list
            var str2 = " " + userdata[0] + "/" + userdata[1];// + marker;
            admin_clientListStr = admin_clientListStr + str2;

        });
        clientList.innerHTML = clientListStr;
        document.getElementById("admin-clientList").textContent = admin_clientListStr;
    }
    else if (type == "banMsg") {
        // user is banned
        console.error("User was found on the banlist");
        isBanned = true;
        connection.stop();
        connection = null;
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

document.getElementById("sendButton").addEventListener("click", async function (event) {
    event.preventDefault();
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
    if (message == "" && fs_pendingFiles.length == 0) {
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
    if (user.length > api_status["userCharLimit"]) {
        userDom.classList.add("is-invalid");
        userFbDom.classList.add("invalid-feedback");
        userFbDom.innerHTML = "Your username cannot be more than " + api_status["userCharLimit"] + " characters!";
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
    if (message.length > api_status["messageCharLimit"]) {
        messageDom.classList.add("is-invalid");
        messageFbDom.classList.add("invalid-feedback");
        messageFbDom.innerHTML = "Your message cannot be more than " + api_status["messageCharLimit"] + " characters!";
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

    // check for files
    if (fs_pendingFiles.length > 0) {
        var initlen = fs_pendingFiles.length;
        for (let i = initlen - 1; i > -1; i--) {
            await uploadFile(fs_pendingFiles[i].file, uid)
                .then(object => {
                    connection.invoke("SendMessage", user, window.location.href + object["url"]);
                    document.getElementById("FC_" + fs_pendingFiles[i].fileName).remove();
                    fs_pendingFiles.splice(i, 1);
                })
        }
    }
    else {
        connection.invoke("SendMessage", user, message).catch(function (err) {
            return console.error(err.toString());
        });
    }
    document.getElementById("messageInput").value = "";
    document.getElementById("messageInput").focus();
});

// show uids mode toggle thing
document.getElementById("showUidsMode").addEventListener("click", function (event) {
    if (document.getElementById("showUidsMode").checked == true) {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            var msgSections = JSON.parse(x[i].dataset.msgSections);
            var usersection = "";
            if (document.getElementById("filterMode").checked == true) {
                usersection = `<${x[i].dataset.uid}/${pf_filter(x[i].dataset.user)}> `;
                for (let i = 0; i < msgSections.length; i++) {
                    if (msgSections[i].isLink == false) {
                        msgSections[i].text = pf_filter(msgSections[i].text);
                    }
                }
            } else {
                usersection = `<${x[i].dataset.uid}/${x[i].dataset.user}> `;
            }

            x[i].innerHTML = "";
            x[i].innerText = usersection;
            for (let ii = 0; ii < msgSections.length; ii++) {
                if (msgSections[ii].isLink) {
                    var a = document.createElement("a");
                    a.href = `${msgSections[ii].text}`;
                    a.innerHTML = `${msgSections[ii].text}`;
                    a.target = "_blank";
                    x[i].appendChild(a);
                    if ((msgSections.length - 1) > ii) {
                        x[i].innerHTML = x[i].innerHTML + " ";
                    }
                } else {
                    x[i].innerHTML = x[i].innerHTML + `${msgSections[ii].text} `;
                }
            }

            if (x[i].dataset.files != null) {
                var fileRender = document.createElement("div");
                fileRender.innerHTML = x[i].dataset.files;
                x[i].appendChild(fileRender);
            }
        }
    }
    else {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            var msgSections = JSON.parse(x[i].dataset.msgSections);
            var usersection = "";
            if (document.getElementById("filterMode").checked == true) {
                usersection = `<${pf_filter(x[i].dataset.user)}> `;
                for (let i = 0; i < msgSections.length; i++) {
                    if (msgSections[i].isLink == false) {
                        msgSections[i].text = pf_filter(msgSections[i].text);
                    }
                }
            } else {
                usersection = `<${x[i].dataset.user}> `;
            }

            x[i].innerHTML = "";
            x[i].innerText = usersection;
            for (let ii = 0; ii < msgSections.length; ii++) {
                if (msgSections[ii].isLink) {
                    var a = document.createElement("a");
                    a.href = `${msgSections[ii].text}`;
                    a.innerHTML = `${msgSections[ii].text}`;
                    a.target = "_blank";
                    x[i].appendChild(a);
                    if ((msgSections.length - 1) > ii) {
                        x[i].innerHTML = x[i].innerHTML + " ";
                    }
                } else {
                    x[i].innerHTML = x[i].innerHTML + `${msgSections[ii].text} `;
                }
            }

            if (x[i].dataset.files != null) {
                var fileRender = document.createElement("div");
                fileRender.innerHTML = x[i].dataset.files;
                x[i].appendChild(fileRender);
            }
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

// color theme toggle
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