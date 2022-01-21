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
                }
            }
        } else {
            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
            }
        }
    }
}

document.getElementById("uploadFileManual").addEventListener("change", () => {
    var files = document.getElementById("uploadFileManual").files;
    for (var i = 0; i < files.length; i++) {
        uploadFile(files[i], uid);
    }
});

function uploadFile(file, uid) {

}