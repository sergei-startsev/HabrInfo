var requestTimeout = 1000 * 10;  // 10 seconds

init();

function init() {
    startRequest();
}

// ajax stuff
function startRequest() {
    
    getInfo(
		function (doc) {
		    updateInfo(doc);
		},
		function () {
		    chrome.extension.getBackgroundPage().console.error("HabrInfo - " + "Sorry, I can't get information from habrahabr.ru");
		}
	 );
}

function updateInfo(doc) {
    document.getElementById("container").innerHTML = doc;
    //get data
    var newRating = chrome.extension.getBackgroundPage().getRating();
    var newKarma = chrome.extension.getBackgroundPage().getKarma();
    var newRatingPosition = chrome.extension.getBackgroundPage().getRatingPosition();
    var login = chrome.extension.getBackgroundPage().getLogin();

    var diffRating = chrome.extension.getBackgroundPage().getDiffRating();
    var diffKarma = chrome.extension.getBackgroundPage().getDiffKarma();
    var diffRatingPosition = chrome.extension.getBackgroundPage().getDiffRatingPosition();

    var src = document.getElementsByClassName("avatar")[0].getElementsByTagName('img')[0].getAttribute("src");

    var posts = document.getElementsByClassName("posts_list")[0];

    var spam = posts.getElementsByTagName('img');
    for (var i = 0; i < spam.length; i++) {
        spam[i].parentNode.removeChild(spam[i]);
    }

    //generate info

    //set icon
    document.getElementsByClassName("icon")[0].getElementsByTagName('img')[0].setAttribute("src", src);
    document.getElementById("linkicon").setAttribute("href", "http://habrahabr.ru/users/"+login);

    //set username
    document.getElementById("name").innerHTML = login;
    document.getElementById("linkname").setAttribute("href", "http://habrahabr.ru/users/" + login);

    //set karma
    if (diffKarma == 0) {
        document.getElementById("karma").setAttribute("class", "value nochange");
    }
    if (diffKarma > 0) {
        document.getElementById("karma").innerHTML = "↑<span class='diff'>(" + Math.round(diffKarma * Math.pow(10, 2)) / Math.pow(10, 2) + ")</span> ";
        document.getElementById("karma").setAttribute("class", "value up");
    }
    if (diffKarma < 0) {
        document.getElementById("karma").innerHTML = "↓<span class='diff'>(" + Math.round(diffKarma * Math.pow(10, 2)) / Math.pow(10, 2) + ")</span> ";
        document.getElementById("karma").setAttribute("class", "value down");
    }
    document.getElementById("karma").innerHTML += newKarma;

    //set rating
    if (diffRating == 0) {
        document.getElementById("rating").setAttribute("class", "value nochange");
    }
    if (diffRating > 0) {
        document.getElementById("rating").innerHTML = "↑<span class='diff'>(" + Math.round(diffRating * Math.pow(10, 2)) / Math.pow(10, 2) + ")</span> ";
        document.getElementById("rating").setAttribute("class", "value up");
    }
    if (diffRating < 0) {
        document.getElementById("rating").innerHTML = "↓<span class='diff'>(" + Math.round(diffRating * Math.pow(10, 2)) / Math.pow(10, 2) + ")</span> ";
        document.getElementById("rating").setAttribute("class", "value down");
    }
    document.getElementById("rating").innerHTML += newRating;

    //set rating position
    if (diffRatingPosition == 0) {
        document.getElementById("position").setAttribute("class", "value nochange");
    }
    if (diffRatingPosition < 0) {
        document.getElementById("position").innerHTML = "↑<span class='diff'>(" + Math.round(diffRatingPosition * Math.pow(10, 2)) / Math.pow(10, 2) + ")</span> ";
        document.getElementById("position").setAttribute("class", "value up");
    }
    if (diffRatingPosition > 0) {
        document.getElementById("position").innerHTML = "↓<span class='diff'>(" + Math.round(diffRatingPosition * Math.pow(10, 2)) / Math.pow(10, 2) + ")</span> ";
        document.getElementById("position").setAttribute("class", "value down");
    }
    document.getElementById("position").innerHTML += newRatingPosition;

    //set links href
    document.getElementById("icon-posts").setAttribute("href", "http://habrahabr.ru/users/" + login + "/topics/");
    document.getElementById("icon-questions").setAttribute("href", "http://habrahabr.ru/users/" + login + "/qa/answers/");
    document.getElementById("icon-comments").setAttribute("href", "http://habrahabr.ru/users/" + login + "/comments/");
    document.getElementById("icon-notes").setAttribute("href", "http://habrahabr.ru/users/" + login + "/notes/");
    document.getElementById("icon-favorites").setAttribute("href", "http://habrahabr.ru/users/" + login + "/favorites/");
    document.getElementById("icon-mail").setAttribute("href", "http://habrahabr.ru/users/" + login + "/mail/");
    document.getElementById("icon-settings").setAttribute("href", "http://habrahabr.ru/settings/");

    //add the best topics
    document.getElementById("best").appendChild(posts);

    //process links
    var links = document.getElementsByClassName("wrapper")[0].getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("class") == "post_name") {
            links[i].setAttribute("href", "http://habrahabr.ru"+links[i].getAttribute("href"));
        }
        links[i].addEventListener('click', function () { createTab(this); }, true);
    }

    //hide user statistics if needed
    if (localStorage["showStats"] != "false") {
        document.getElementById("header").style.height = "105px";
        document.getElementsByClassName("stats")[0].style.display = "block";
    }

    //hide user info if username is absent
    if (!localStorage["username"] || localStorage["username"] == "" || localStorage["username"] == "undefined") {
        document.getElementById("header").style.display = "none";
        document.getElementById("sections").style.display = "none";
    }

    //hide loading
    document.getElementById("loading").style.display = "none";
    //show info
    document.getElementsByClassName("wrapper")[0].style.display = "block";
}

function getInfo(onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    var abortTimerId = window.setTimeout(function () {
        xhr.abort();
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

                if (xmlDoc.getElementById("layout") != null) {

                    handleSuccess(xhr.responseText);
                    return;

                } else {
                    chrome.extension.getBackgroundPage().console.error("HabrInfo - " + "Not valid html.");
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
        chrome.extension.getBackgroundPage().console.error("HabrInfo - " + "I can't get info: " + e);
        handleError();
    }
}

function getUrl() {
    if (!localStorage["username"] || localStorage["username"] == "" || localStorage["username"] == "undefined") {
        localStorage["username"] = "";
    }
    return "http://habrahabr.ru/users/" + localStorage["username"];
}

function createTab(obj) {
    chrome.tabs.create({ url: obj.getAttribute("href") });
}