let $  = require("jquery");
let {Menu, MenuItem} = remote;
let BrowserWindow = remote.BrowserWindow;
let rgbHex = require("rgb-hex");
let noteColors = require("../../core/NoteColors")
let colorOptions = new Map([[noteColors.yellow, "Yellow"], [noteColors.pink, "Pink"], [noteColors.green, "Green"], [noteColors.blue, "Blue"]]);

// IPC Recievers

ipcRenderer.on("openSettings", (event, message) => {
    let win = remote.getCurrentWindow();
    let winSize = win.getSize();
    noteManager.windowSize[0] = winSize[0];
    noteManager.windowSize[1] = winSize[1];
    win.setSize(600, 450);
    win.setResizable(false);
    noteManager.settings.initialiseInputForms();
    // Disable footer notification balloon and opening file via click
    $("#footer-div").addClass("disable-balloon");
    $("#footer-info").css("pointer-events", "none");
    // Fade out the nav bar and fade in the menu
    // Trigger the background color input and focus it
    $("#cpi-background").trigger("click");
    $("#hidden-menu").fadeIn("slow");
    $(".navbar").fadeOut("fast");
    $("#cpi-background").focus();
});

ipcRenderer.on("closeSettings", (event, message) => {
    if ($("#hidden-menu").css('display') == 'none') {
        return;
    }

    let win = remote.getCurrentWindow();
    win.setSize(noteManager.windowSize[0], noteManager.windowSize[1]);
    win.setResizable(true);

    // Enable footer notification balloon and opening file via click
    $("#footer-div").removeClass("disable-balloon");
    $("#footer-info").css("pointer-events", "auto");

    $(".navbar").fadeIn("fast");
    $("#hidden-menu").fadeOut("fast");
});       

ipcRenderer.on("balloonNotification", (event, message) => {
    noteManager.addBalloonNotification(message.notification, $("#footer-div").attr("data-balloon"))
});

ipcRenderer.on("loadNote", (event, message) => {
   noteManager.openFile(message.filePath);
});

ipcRenderer.on("loadContent", (event, content) =>{
    document.getElementById("note").innerText = content;
});

ipcRenderer.on("colourNote", (event, message) => { 
    let backgroundColor = message.backgroundColor;
    let menu = Menu.getApplicationMenu();
    
    let colorIndex = 3;
    if (process.platform === "darwin"){
        colorIndex = 4;
    }

    let colorMenuItems = menu.items[colorIndex].submenu.items;
    // If color is in colors array then update the menu options
    // This is done by an ipcRenderer call because we have to create a new Menu object and then set it
    if (colorOptions.has(backgroundColor)){
        for (let index in colorMenuItems){
            let item = colorMenuItems[index];
            if (item.label == colorOptions.get(backgroundColor)){
                item.checked = true
            }
        }
        Menu.setApplicationMenu(menu)
        //ipcRenderer.send("setMenuOption", {colorIndex: colorIndex, label: "Custom Colours", checked: false});
    } else {
        ipcRenderer.send("setMenuOption", {colorIndex: colorIndex, label: "Custom Colour: " + backgroundColor, checked: true});
    }

    noteManager.settings.colorNote(message);
    let win = remote.getCurrentWindow();
    noteManager.id = win.id;
});

ipcRenderer.on("newNote", (event, message) => {
    let win = remote.getCurrentWindow();
    ipcRenderer.send("newNote", {windowPosition: win.getPosition()});
});

ipcRenderer.on("openFileInCurrentNote", (event, message) => {
    openFileInCurrentNote();
});

ipcRenderer.on("openFileInNewNote", (event, message) => {
    openFileInNewNote();
});

ipcRenderer.on("saveNote", (event, message) => {
    noteManager.saveFile();
});

ipcRenderer.on("saveNoteAs", (event, message) => {
    noteManager.saveFile(true);
});

ipcRenderer.on("saveIfOpen", (event, message) => {
    noteManager.saveFileIfOpen();
});

ipcRenderer.on("closeIfEmpty", (event, message) => {
    noteManager.closeNoteIfEmpty();
});

ipcRenderer.on("getNoteColour", (event, message) => {
    let color = document.body.style.backgroundColor;
    if (color.startsWith("rgb")){
        color = "#" + rgbHex(color);
    };
    remote.getCurrentWebContents().send("colourNote", {backgroundColor: color});
});

ipcRenderer.on("getNoteManager", (event, message) => {
    noteManager.content = document.getElementById("note").innerText;  
    ipcRenderer.send("getNoteManager", {noteManager: noteManager, saveState: message.saveState, id: noteManager.id});
});

ipcRenderer.on("maximize", (event,message) => {
    let win = remote.getCurrentWindow(); 
    $(".maximize").addClass("fa-window-restore");
});

ipcRenderer.on("unmaximize", (event,message) => {
    let win = remote.getCurrentWindow();
    $(".maximize").removeClass("fa-window-restore");
});

ipcRenderer.on("initNavbar", (event, message) => {
    // Displays a more native looking navbar depending on OS
    if (message == "darwin"){
        $("#mac-start").removeClass("nav-hidden");
        $("#mac-end").removeClass("nav-hidden");

        $("#win-start").addClass("nav-hidden");
        $("#win-end").addClass("nav-hidden");
    } 
});

//Window event
window.addEventListener("contextmenu", (e) =>{
    let contextMenu = Menu.getApplicationMenu();
    contextMenu.popup(BrowserWindow.getFocusedWindow());
});