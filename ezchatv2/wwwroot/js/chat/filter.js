"use strict";

// ezchat v2.7 / profanity filter script
// made by nevadex (c) 2021

// load word list
var profanity_list = [];
// using Shutterstock's LDNOOBW [CC-BY-4.0]
fetch('https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en')
  .then(response => response.text())
    .then(data => {
        profanity_list = data.split("\n");
    });

function pf_filter(text) {
    var x = text.toString();
    for (let i = 0; i < profanity_list.length; i++) {
        var regex = new RegExp(profanity_list[i], "img");
        var censor = profanity_list[i].charAt(0);
        for (let ii = 1; ii < profanity_list[i].length; ii++) {
            if (profanity_list[i].charAt(ii) != " ") {
                censor = censor + "*";
            }
            else {
                censor = censor + " ";
            }
        }
        x = x.replaceAll(regex, censor)
    }
    return x;
}

// filter mode toggle thing
document.getElementById("filterMode").addEventListener("click", function (event) {
    if (document.getElementById("filterMode").checked == true) {
        var x = document.querySelectorAll("li");

        for (let i = 0; i < x.length; i++) {
            var msgSections = JSON.parse(x[i].dataset.msgSections);
            var usersection = "";
            if (document.getElementById("showUidsMode").checked == true) {
                usersection = `<${x[i].dataset.uid}/${pf_filter(x[i].dataset.user)}> `;
            } else {
                usersection = `<${pf_filter(x[i].dataset.user)}> `;
            }

            for (let i = 0; i < msgSections.length; i++) {
                if (msgSections[i].isLink == false) {
                    msgSections[i].text = pf_filter(msgSections[i].text);
                }
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
            if (document.getElementById("showUidsMode").checked == true) {
                usersection = `<${x[i].dataset.uid}/${x[i].dataset.user}> `;
            } else {
                usersection = `<${pf_filter(x[i].dataset.user)}> `;
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