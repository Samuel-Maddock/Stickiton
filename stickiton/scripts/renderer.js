const remote = require("electron").remote;
let ipcRenderer = require("electron").ipcRenderer;
const dialog = remote.dialog;
const fs = require("fs");

// Disable Zooming
var webFrame = require('electron').webFrame;
webFrame.setVisualZoomLevelLimits(1, 1);
webFrame.setLayoutZoomLevelLimits(0, 0); 

let noteManager = require("./scripts/core/NoteManager");
let dialogImage = remote.app.getAppPath() + "/stickiton/Icons/png/512x512.png";

if (process.platform == "win32") {
    dialogImage = remote.app.getAppPath() + "/stickiton/Icons/sticky.ico";
}

function openMessageBox(callback) {
    dialog.showMessageBox({
        type: "question",
        buttons: ["Save and open in current note", "Open in current note", "Cancel"],
        title: "Save Current File?",
        message: "You are attempting to open a new file",
        icon: dialogImage
    }, callback);
}

function openDirectoryBox(callback) {
    dialog.showOpenDialog({ defaultPath: noteManager.currentFile, filters: [{ name: "Text file (.txt)", extensions: ["txt"] }], properties: ["openFile"] }, callback)
}

function openFileInNewNote(){
    openDirectoryBox((fileNames) => {
        if (fileNames == undefined) {
            return;
        }
        let fileName = fileNames[0];
        let window = remote.getCurrentWindow();
        ipcRenderer.send("openIfNotAlready", {filePath: fileName, windowPosition: window.getPosition()});
    });
}

function openFileInCurrentNote(){
    openDirectoryBox((fileNames) => {
        if (fileNames == undefined) {
            return;
        }
        let fileName = fileNames[0];
        let window = remote.getCurrentWindow();

        if (noteManager.hasFileOpen){
            openMessageBox((response, checkboxChecked) => {
                if (response == 0){
                    noteManager.saveFile()
                }
            });
        }
        ipcRenderer.send("openIfNotAlready", {filePath: fileName, windowPosition: window.getPosition(), newWindow: false, winId: window.id});
    });
}

require("./scripts/events/renderer/clickEvents"); //Load DOM click events
require("./scripts/events/renderer/ipcEvents");   //Load ipcRenderer events