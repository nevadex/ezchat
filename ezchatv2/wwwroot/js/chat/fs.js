"use strict";

// ezchat v2.8 / filesystem script
// made by nevadex (c) 2022

function dragOverHandler(ev) {
    if (fs_status["enabled"] == true) {
        ev.preventDefault();
    }
}

function getFileExtention(fileName) {
    var sections = fileName.split(".");
    var ext = sections[sections.length - 1];
    if (ext == fileName) {
        return "";
    }
    return "." + ext;
}

function uploadFileHandler(ev) {
    ev.preventDefault();

    if (fs_status["enabled"] == true) {
        if (ev.dataTransfer.items) {
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                if (ev.dataTransfer.items[i].kind === 'file') {
                    var file = ev.dataTransfer.items[i].getAsFile();
                    //uploadFile(file, uid);
                    queueFileUpload(file, file.name);
                }
            }
        } else {
            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                //uploadFile(file, uid);
                queueFileUpload(files[i], files[i].name);
            }
        }
    }
}

document.getElementById("uploadFileManual").addEventListener("change", () => {
    var files = document.getElementById("uploadFileManual").files;
    for (var i = 0; i < files.length; i++) {
        //uploadFile(files[i], uid);
        queueFileUpload(files[i], files[i].name);

    }
    document.getElementById("uploadFileManual").value = "";
});

async function uploadFile(file, uid) {
    var formData = new FormData();
    formData.append("file", file);
    var result;

    await fetch(c_fsUrl+"/Upload", {
        method: "POST", body: formData, headers: { "uid": uid }
    })
    .then(res => res.json())
    .then(json => JSON.parse(json))
    .then(object => { result = object;})
    .catch(err => console.error(err));

    return Promise.resolve(result);
}

function queueFileUpload(file, fileName) {
    var maindiv = document.getElementById("messageInputCardDeck");
    var fileFeedback = document.getElementById("fileUploadFeedback");

    // client validation
    var acceptedExts = fs_status["acceptedExts"];
    var blockedExts = fs_status["blockedExts"];
    var fileExt = getFileExtention(fileName);
    var accepted = false;
    var blocked = false;
    // accepted exts
    for (let i = 0; i < acceptedExts.length; i++) {
        if (fileExt == acceptedExts[i]) {
            accepted = true;
            break;
        }
    }
    // blocked exts
    if (accepted == false) {
        for (let i = 0; i < blockedExts.length; i++) {
            if (fileExt == blockedExts[i]) {
                blocked = true;
                break;
            }
        }
    }

    if (accepted) {
        fileFeedback.innerHTML = "";
        fileFeedback.style.display = "none";

        var uploadObj = new FSFileUpload(file, fileName);
        fs_pendingFiles.push(uploadObj);

        var carddiv = document.createElement("div");
        let index1 = (fs_pendingFiles.length).toString();
        carddiv.id = "FC_" + fileName;
        carddiv.classList.add("card", "border-info");
        carddiv.style.marginTop = "1px";

        var cardheader = document.createElement("div");
        cardheader.classList.add("card-header");
        cardheader.innerHTML = fileName;
        var cardclosebutton = document.createElement("button");
        cardclosebutton.type = "button";
        cardclosebutton.classList.add("close");
        cardclosebutton.onclick = function () { fs_pendingFiles.splice(fs_pendingFiles.indexOf(uploadObj), 1); document.getElementById("FC_" + fileName).remove(); };
        var buttonspan = document.createElement("span");
        buttonspan.innerHTML = "&times;";
        cardclosebutton.appendChild(buttonspan);
        cardheader.appendChild(cardclosebutton);
        carddiv.appendChild(cardheader);


        var cardbody = document.createElement("div");
        cardbody.classList.add("card-body");
        var img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.maxHeight = "100%";
        img.style.maxWidth = "100%";
        cardbody.appendChild(img);
        carddiv.appendChild(cardbody);

        maindiv.appendChild(carddiv);
    }
    else {
        fileFeedback.onclick = function () { document.getElementById("fileUploadFeedback").innerHTML = ""; document.getElementById("fileUploadFeedback").style.display = "none"; };
        if (!blocked) { fileFeedback.innerHTML = "Files of type " + fileExt + " are not accepted. <u>Hide</u>"; }
        else { fileFeedback.innerHTML = "Files of type " + fileExt + " are blocked. <u>Hide</u>"; }
        fileFeedback.style.display = "block";
    }
}

class FSFileUpload {
    constructor(file, fileName) {
        this.file = file;
        this.fileName = fileName;
    }
}