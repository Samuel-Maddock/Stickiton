// Click Event Listeners:
let $ = require("jquery");

document.getElementById("note").addEventListener("input", e => {
    noteManager.content = document.getElementById("note").innerText;
    if ((noteManager.content != noteManager.lastSavedContent)) {
        let footerContent = "(*) " + noteManager.getShortPath(noteManager.currentFile);
        noteManager.setFooterContent(footerContent, noteManager.currentFile);
    };

    if ((noteManager.content == noteManager.lastSavedContent)) {
        noteManager.setFooterContent(noteManager.getShortPath(noteManager.currentFile));
    };

    if ((noteManager.content == "") && !(noteManager.hasFileOpen)){
        noteManager.setFooterContent("Stickiton");
    }
});

//Settings related events

$(".note-settings").click(() => {
    $(".note-settings").addClass("is-active");
    $(".global-settings").removeClass("is-active");
});

$(".global-settings").click(() => {
    $(".global-settings").addClass("is-active");
    $(".note-settings").removeClass("is-active");
});

$("#settings").click(() => {
    if ($("#hidden-menu").css('display') == 'none') {
        remote.getCurrentWebContents().send("openSettings");
    } else {
        remote.getCurrentWebContents().send("closeSettings");
    }
});

//Navbar events

$(".newNote").click(() => {
    let window = remote.getCurrentWindow();
    ipcRenderer.send("newNote", { windowPosition: window.getPosition() });
});

$(".openFile").click(() => {
    openFileInNewNote();
});

$("#footer-info").click(() => {
    openFileInNewNote();
});

$(".save").click(() => {
    wasSaved = noteManager.saveFile();
});

$(".close").click(() => {
    let currentContent = document.getElementById("note").innerText;
    if (currentContent != noteManager.lastSavedContent){
        dialog.showMessageBox({ type: "question", buttons: ["Yes", "No", "Cancel"], title: "Save File?", message: "Unsaved changes have been made, save the file?", icon: dialogImage }, (response, checkboxChecked) => {
            if (response == 1) {
                noteManager.closeWindow();
            } else if (response == 0) {
                let hasSaved = noteManager.saveFile();
                if (hasSaved) { noteManager.closeWindow() };
            } else {
                // The user has closed the dialog or clicked cancel
                return;
            }
        });
    } else  {
        noteManager.closeWindow();
    }
});

$(".minimize").click(() => {
    let window = remote.getCurrentWindow();
    window.minimize();
});

$(".maximize").click(() => {
    let win = remote.getCurrentWindow();
    if (!win.isMaximized()) {
        noteManager.windowSize = win.getSize();
        noteManager.windowPosition = win.getPosition();
        $(this).addClass("fa-window-restore");
        win.maximize();
    } else {
        $(this).removeClass("fa-window-restore");
        win.unmaximize();
    };
});