"use strict";

// ezchat v2.8 / filesystem script
// made by nevadex (c) 2022

function dragOverHandler(ev) {
    if (fs_status["enabled"] == true) {
        ev.preventDefault();
    }
}

function uploadFileHandler(ev) {
    ev.preventDefault();

    if (fs_status["enabled"] == true) {
        if (ev.dataTransfer.items) {
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                if (ev.dataTransfer.items[i].kind === 'file') {
                    var file = ev.dataTransfer.items[i].getAsFile();
                    console.log('... file[' + i + '].name = ' + file.name);
                    uploadFile(file, uid);
                }
            }
        } else {
            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
                uploadFile(file, uid);
            }
        }
    }
}

document.getElementById("uploadFileManual").addEventListener("change", () => {
    var files = document.getElementById("uploadFileManual").files;
    for (var i = 0; i < files.length; i++) {
        uploadFile(files[i], uid);
    }
    files.value = "";
});

function uploadFile(file, uid) {
    console.log("Upload")

    var formData = new FormData();
    formData.append("file", file);

    fetch(c_fsUrl, {
        method: "POST", body: formData, headers: { "uid": uid }
    })
    .then(res => res.json())
    .then(json => console.log(json))
    .catch(err => console.error(err));
}