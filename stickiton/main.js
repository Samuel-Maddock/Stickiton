"use strict"

const { app, BrowserWindow, ipcMain, Menu, MenuItem } = require('electron');
const fs = require("fs");
const APP_PATH = app.getAppPath();
const mainBgColor = "#e8e285";
let noteColors = require("./scripts/core/NoteColors");
const colors = noteColors.getColorArray();

let windowStateList = [];
let StateHandler = require("./scripts/core/StateHandler");
let WindowManager = require("./scripts/events/main/WindowManager");
let AppManager = require("./scripts/events/main/TrayManager")
let MenuTemplate = require("./scripts/core/menuTemplate");
let TrayManager = AppManager.trayManager;

// Helper Functions
function getLength(arr) { //Returns true length of an array
  return Object.keys(arr).length;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

function fileExistsSync(filePath) {
  try {
    if (filePath == "") {
      return true;
    };
    fs.accessSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

//These global properties are used to calculate when to quit the application, or to just hide the windows in the tray.
app.hideClosedWindows = true;
app.quitApplication = false;
app.quitApplicationDock = false;

// APP EVENTS

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  let stateHandler = new StateHandler(null, null, APP_PATH);
  let windowStates = stateHandler.loadState();

  if (windowStates.length != 0) {
    for (let index in windowStates) {
      let noteManager = windowStates[index].noteManager;
      let colors = {};
      colors.backgroundColor = noteManager.settings.backgroundColor;
      colors.fontColor = noteManager.settings.fontColor;
      colors.menuColor = noteManager.settings.menuColor;
    
      if (fileExistsSync(noteManager.currentFile)) {
        let win = WindowManager.createWindow(noteManager.noteColor, windowStates[index]);
        win.webContents.once("did-finish-load", () => { //Once the window has loaded, colour the note 
          win.webContents.send("colourNote", colors);

          if (noteManager.hasFileOpen) { //Load the file that was open
            win.webContents.send("loadNote", { filePath: noteManager.currentFile }); //Must pass message.filePath object
          } else { //If there is no file then...
            win.webContents.send("loadContent", noteManager.content); //Load whatever was last typed into the note
          }

        });
      };
    };
  } else { //If there is no previous state, just load a normal plain note
    let win = WindowManager.createWindow(mainBgColor);
    let colors = {};
    colors.backgroundColor = mainBgColor;
    colors.menuColor = mainBgColor;
    win.webContents.once("did-finish-load", () => { //Once the window has loaded, colour the note with default bg color
      win.webContents.send("colourNote", colors);
    });
  };

  //Initialising the WindowManager and  TrayManager + creating the app menu and tray.
  let menuTemplate = new MenuTemplate()
  let menu = Menu.buildFromTemplate(menuTemplate.template);
  Menu.setApplicationMenu(menu);
  TrayManager.windows = WindowManager.windows;
  TrayManager.createTray(APP_PATH); //Requires application path to access tray icons.
  WindowManager.tray = TrayManager.tray; //WindowManager needs the tray to notify users when windows are hidden -> this is something the  TrayManager cant manage
  WindowManager.trayIconPath = TrayManager.trayIconPath;
  WindowManager.notify = TrayManager.windowTrayNotification; //notify is a function that will be used to notify users when there notes are hidden.
  
  WindowManager.updateNoteManagers();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  };
});

app.on('activate', () => {
  if (WindowManager.windows.length == 0) {
    WindowManager.createNewNote();
  };
});

function onQuit(event) {
  //Save state of all windows before they close down...
  //Do this here because these windows will de-instance after this event and close
  if (WindowManager.windows.length == 0) {
    let stateHandler = new StateHandler(null, null, APP_PATH);
    stateHandler.saveEmptyState(); //If there are no windows, save an empty state.
  } else {
    if (!app.quitApplication) { //If this is the first time a quit event has happened
      event.preventDefault() // Prevent the app from quitting untill all windows are saved
      AppManager.closeApp() // This is where all the windows states are saved
    }
  }
}

app.on("before-quit", onQuit);

// IPC MAIN EVENTS
ipcMain.on("newNote", (event, message) => {
  WindowManager.createNewNote(message.filePath, message.windowPosition)
});

// Events that require the NoteManager object
ipcMain.on("getNoteManager", (event, message) => { //This is passed the noteManager from the window process
  WindowManager.noteManagerList[message.id] = message.noteManager; //Add the note manager to the global list
  if (getLength(WindowManager.noteManagerList) == windowStateList.length) { //If this is the final callback, save the state of the windows.
    //Create a new state handler with the window states and note managers.
    if (message.saveState) {
      let stateHandler = new StateHandler(windowStateList, WindowManager.noteManagerList, APP_PATH);
      stateHandler.saveState(); //Save the state of the windows
    };
  };
});

ipcMain.on("openIfNotAlready", (event, message) => {
  WindowManager.checkNoteOpen(message.filePath, message.windowPosition, message.newWindow, message.winId);
});

ipcMain.on("setMenuOption", (event, message) => {
  let newTemplate = new MenuTemplate().template;
  let colorOptions = newTemplate[message.colorIndex].submenu;
  let colorItem;

  // If we are selecting a specific item to change, if not leave it as the last color element (Custom Colours option)
  if (message.itemIndex != undefined){
    colorItem = colorOptions[message.itemIndex];
  } else {
    colorItem = colorOptions[colorOptions.length-1];
  }

  colorItem.label = message.label;
  colorItem.checked = message.checked;
  let menu = Menu.buildFromTemplate(newTemplate);
  Menu.setApplicationMenu(menu);
});