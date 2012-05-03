var pollIntervalMin = 1 * 1000 * 60;  // 1 minute
var requestTimeout = 1000 * 10;  // 10 seconds

var rating = null;
var diffRating = null;
var karma = null;
var diffKarma = null;
var ratingPosition = null;
var diffRatingPosition = null;
var login = null;

function getRating() {
    return rating;
}

function getKarma() {
    return karma;
}

function getRatingPosition() {
    return ratingPosition;
}

function getLogin() {
    return login;
}

function getDiffRating() {
    return diffRating;
}

function getDiffKarma() {
    return diffKarma;
}

function getDiffRatingPosition() {
    return diffRatingPosition;
}

//init
document.addEventListener('DOMContentLoaded', init);

function init() {
    startRequest();
}

function scheduleRequest() {
    requestTimerId = window.setTimeout(startRequest, pollIntervalMin);
}

// ajax stuff
function startRequest() {
    update();
    scheduleRequest();
}

function update() {
    getInfo(
	    function (habrauser) {
	        updateInfo(habrauser);

		    if (localStorage["showStats"] != "false") {
		        chrome.browserAction.setIcon({ path: "icon.png" })
		    } else {
		        chrome.browserAction.setTitle({ title: "HabrInfo" });
		        chrome.browserAction.setBadgeText({ text: "" });
		        chrome.browserAction.setIcon({ path: "icon_alt.png" });
		    }
	    },
	    function () {
		    rating = null;
		    karma = null;
		    ratingPosition = null;

		    chrome.browserAction.setTitle({ title: "Sorry, I can't get information from habrahabr.ru" });
		    chrome.browserAction.setBadgeText({ text: "-" });
		    chrome.browserAction.setBadgeBackgroundColor({ color: [176, 196, 222, 225] });

		    if (localStorage["showStats"] != "false") {
		        chrome.browserAction.setIcon({ path: "icon.png" })
		    } else {
		        chrome.browserAction.setBadgeText({ text: "" });
		        chrome.browserAction.setIcon({ path: "icon_alt.png" });
		    }

		    console.error("HabrInfo - " + "Sorry, I can't get information from habrahabr.ru");
	    }
	);
}

function changeUsername() {
    update();
    rating = null;
    karma = null;
    ratingPosition = null;
}

function updateInfo(habrauser) {
    //get data
    var newRating = habrauser[0].getElementsByTagName("rating")[0].childNodes[0].nodeValue;
    var newKarma = habrauser[0].getElementsByTagName("karma")[0].childNodes[0].nodeValue;
    var newRatingPosition = habrauser[0].getElementsByTagName("ratingPosition")[0].childNodes[0].nodeValue;
    login = habrauser[0].getElementsByTagName("login")[0].childNodes[0].nodeValue;

    //generate tooltip text
    var toolTipText = "Username: " + login + ", karma: " + newKarma;

    if (karma != null) {
        diffKarma = newKarma - karma;
        if (karma > newKarma) {
            toolTipText += "(down)";
        }
        if (karma < newKarma) {
            toolTipText += "(up)";
        }
    } else {
        diffKarma = 0;
    }

    toolTipText += ", rating: " + newRating;

    if (rating != null) {
        diffRating = newRating - rating;
        if (rating > newRating) {
            toolTipText += "(down)";
        }
        if (rating < newRating) {
            toolTipText += "(up)";
        }
    } else {
        diffRating = 0;
    }

    toolTipText += ", position: "+newRatingPosition;

    if (ratingPosition != null) {
        diffRatingPosition = newRatingPosition - ratingPosition;
        if (ratingPosition < newRatingPosition) {
            toolTipText += "(down)";
        }
        if (ratingPosition > newRatingPosition) {
            toolTipText += "(up)";
        }
    } else {
        diffRatingPosition = 0;
    }

    chrome.browserAction.setTitle({ title: toolTipText })

    //round rating for badge text
    var rating2Badge = Math.round(newRating * Math.pow(10, 1)) / Math.pow(10, 1);
    if (rating2Badge > 99) {
        rating2Badge = Math.round(rating2Badge);
    }
    rating2Badge += "";

    chrome.browserAction.setBadgeText({ text: rating2Badge });

    if (rating == null) {
        chrome.browserAction.setBadgeBackgroundColor({ color: [176, 196, 222, 225] });
    } else {
        if (rating > newRating) {
            chrome.browserAction.setBadgeBackgroundColor({ color: [200, 0, 0, 225] });
        }
        if (rating < newRating) {
            chrome.browserAction.setBadgeBackgroundColor({ color: [100, 205, 50, 225] });
        }
        if (rating == newRating) {
            chrome.browserAction.setBadgeBackgroundColor({ color: [176, 196, 222, 225] });
        }
    }

    rating = newRating;
    karma = newKarma;
    ratingPosition = newRatingPosition;
}

function getInfo(onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    var abortTimerId = window.setTimeout(function () {
        xhr.abort();  // synchronously calls onreadystatechange
    }, requestTimeout);

    function handleSuccess(habrauser) {
        window.clearTimeout(abortTimerId);
        if (onSuccess)
            onSuccess(habrauser);
    }

    function handleError() {
        window.clearTimeout(abortTimerId);
        if (onError)
            onError();
    }

    try {
        xhr.onload = function () {
            if (xhr.responseText) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xhr.responseText, "text/xml");
                var error = xmlDoc.getElementsByTagName("error");

                if (error.length==0) {

                    handleSuccess(xmlDoc.getElementsByTagName("habrauser"));
                    return;

                } else {
                    console.error("HabrInfo - " + "Not valid xml.");
                }
            }

            handleError();
        }

        xhr.onerror = function (error) {
            handleError();
        }

        xhr.open("GET", getUrl(), true);
        xhr.send(null);

    } catch (e) {
        console.error("HabrInfo - " + "I can't get info: " + e);
        handleError();
    }
}

function getUrl() {
    if (!localStorage["username"] || localStorage["username"] == "" || localStorage["username"] == "undefined") {
        localStorage["username"] = "";
    }

    return "http://habrahabr.ru/api/profile/" + localStorage["username"];
}