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