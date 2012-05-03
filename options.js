
document.addEventListener('DOMContentLoaded', function () {
    var save= document.getElementById('save');
    save.addEventListener('click', save_options);

    restore_options();
});

// Saves options to localStorage.
function save_options() {
    var login = document.getElementById("login");
    var username = login.value;
    if (!username || username == "" || username == "undefined") {
        username = "";
    }
    localStorage["username"] = username;
    //console.log(localStorage["username"]);

    localStorage["showStats"] = document.getElementById("showStats").checked;
    //console.log(localStorage["showStats"]);

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "HabrInfo - Настройки сохранены!";
    setTimeout(function () {
        status.innerHTML = "";
    }, 1000);

    chrome.extension.getBackgroundPage().changeUsername();
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    var username = localStorage["username"];
    if (!username || username == "" || username == "undefined") {
        username = "";
    }
    var login = document.getElementById("login");
    login.value = username;

    document.getElementById("showStats").checked = (localStorage["showStats"]=="false")?false:true;
}