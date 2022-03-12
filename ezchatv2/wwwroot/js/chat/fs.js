"use strict";

// ezchat v2.8 / filesystem script
// made by nevadex (c) 2022

// formats
var imageFormats = [".apng", ".avif", ".gif", ".jpg", ".jpeg", ".jfif", ".pjpeg", ".pjp", ".png", ".svg", ".webp"];
var videoFormats = [".ogg", ".mp4", ".webm"];
var spoilerSvgOn = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16">
  <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/>
  <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/>
</svg>`;
var spoilerSvgOff = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
</svg>`;

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

document.getElementById("messageInput").addEventListener("paste", function (event) {
    if (event.clipboardData.files.length > 0) {
        for (let i = 0; i < event.clipboardData.files.length; i++) {
            var file = event.clipboardData.files[i];
            queueFileUpload(file, file.name);
        }
    }
});

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
    var fileSizeValid = true;
    var accepted = false;
    var blocked = false;
    // accepted exts
    if (acceptedExts.includes(fileExt) && fs_status["filterExts"]) {
        accepted = true;
    } else if (!fs_status["filterExts"]) {
        accepted = true
    }
    // blocked exts
    if (blockedExts.includes(fileExt)) {
        blocked = true;
    }
    // file size
    if (file.size > (fs_status["maxFileSizeMB"] * 1000000)) {
        fileSizeValid = false;
    }

    if (accepted && fileSizeValid && !blocked) {
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

        /*var cardspoiler = document.createElement("button");
        cardspoiler.classList.add("btn", "btn-sm", "btn-outline-info");
        cardspoiler.style.display = "inline";
        cardspoiler.style.marginLeft = "5px";
        cardspoiler.dataset.spoiler = false;
        cardspoiler.innerHTML = spoilerSvgOff;
        cardspoiler.onclick = function () {
            if (this.dataset.spoiler == "true") {
                this.innerHTML = spoilerSvgOff;
                this.dataset.spoiler = false;
            } else {
                this.innerHTML = spoilerSvgOn;
                this.dataset.spoiler = true;
            }
        }*/

        var cardbody = document.createElement("div");
        cardbody.classList.add("card-body");
        if (imageFormats.includes(fileExt)) {
            var img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.style.maxHeight = "100%";
            img.style.maxWidth = "100%";
            cardbody.appendChild(img);
            //cardheader.appendChild(cardspoiler);
        } else if (videoFormats.includes(fileExt)) {
            var video = document.createElement("video");
            video.style.maxHeight = "100%";
            video.style.maxWidth = "100%";
            video.controls = "controls";
            video.preload = "auto";
            var src = document.createElement("source");
            src.src = URL.createObjectURL(file);
            var error = document.createElement("p");
            error.classList.add("text-warning");
            error.innerHTML = "Unable to display video.";
            video.appendChild(src);
            video.appendChild(error);
            cardbody.appendChild(video);
            //cardheader.appendChild(cardspoiler);
        } else {
            var error = document.createElement("p");
            error.classList.add("text-warning");
            error.innerHTML = "Unable to display file.";
            cardbody.appendChild(error);
        }
        carddiv.appendChild(cardheader);
        carddiv.appendChild(cardbody);

        maindiv.appendChild(carddiv);
    }
    else {
        fileFeedback.onclick = function () { document.getElementById("fileUploadFeedback").innerHTML = ""; document.getElementById("fileUploadFeedback").style.display = "none"; };
        
        
        if (blocked) { fileFeedback.innerHTML = "Files of type " + fileExt + " are blocked. <u>Hide</u>"; }
        else if (!blocked && fs_status["filterExts"]) { fileFeedback.innerHTML = "Files of type " + fileExt + " are not accepted. <u>Hide</u>"; }
        else if (!fileSizeValid) { fileFeedback.innerHTML = "File too large! Limit: " + fs_status["maxFileSizeMB"] + ".0MB, Your file: " + (file.size / 1000000).toFixed(1).toString() + "MB <u>Hide</u>"; }
        else { fileFeedback.innerHTML = blocked + "|" + accepted + "|" + fileSizeValid}
        fileFeedback.style.display = "block";
    }
}

class FSFileUpload {
    constructor(file, fileName) {
        this.file = file;
        this.fileName = fileName;
    }
}