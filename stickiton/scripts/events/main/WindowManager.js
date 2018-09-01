const { BrowserWindow, Menu, app } = require('electron');
const path = require('path');
const url = require('url');
let noteColors = require("../..//core/NoteColors");
let MenuTemplate = require("../../core/menuTemplate")
const colors = noteColors.getColorArray();

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

class WindowManager {
  constructor() {
    this.windows = [];
    this.noteManagerList = [];
    this.tray = null;
  }

  createWindow(bgColor, windowState) {
    let win;

    if (windowState != null) {
      //Create new window with the previous state that has been saved
      win = new BrowserWindow({
        width: windowState.size[0],
        height: windowState.size[1],
        minHeight: 150,
        minWidth: 300,
        frame: false,
        backgroundColor: windowState.noteManager.noteColor,
        fullscreenable: false,
        show: false
      });

      win.setPosition(windowState.position[0], windowState.position[1]);
    } else {
      // Create the browser window.
      win = new BrowserWindow({
        width: 300,
        height: 250,
        minHeight: 150,
        minWidth: 300,
        frame: false,
        backgroundColor: bgColor,
        fullscreenable: false,
        show: false
      });
    };

    win.isInitialised = false;
    let windowManager = this;
    this.windows.push(win); //Add it to global list of windows

    win.loadURL(url.format({ //Load index.html for the window
      pathname: path.join(__dirname, "../../../index.html"),
      protocol: 'file:',
      slashes: true
    }));

    win.on("close", (event) => {
      if (process.platform == "darwin") {
        app.hideClosedWindows = false;
      }

      if (app.hideClosedWindows) {
        event.preventDefault();
        win.hide();
      } else {
        for (let index in this.windows) {
          if (win.id == this.windows[index].id) {
            this.windows.splice(index, 1); //Remove window from list of open windows
          }
        }
        if (!app.quitApplication) {
          app.hideClosedWindows = true;
        }
      }
    });

    win.on('closed', () => {
      win = null;
    });

    win.on("hide", (event) => {
      if (this.areAllWindowsHidden()) {
        this.notify("All your notes have been hidden...");
      } else {
        this.notify("Your note has been hidden...")
      }
    });

    win.on("focus", e => {
      if (win.isInitialised) {
        win.webContents.send("getNoteColour", "");
      }
      win.isInitialised = true;
    });

    win.on("ready-to-show", e => {
      win.webContents.send("initNavbar", process.platform);
      win.show();
    });

    win.on("maximize", e => {
      win.webContents.send("maximize");
    });

    win.on("unmaximize", e => {
      win.webContents.send("unmaximize");
    });

    return win;
  };

  showWindows() {
    let windows = this.windows;
    for (let index in windows) {
      windows[index].show();
      windows[index].focus();
    };
  };

  hideWindows() {
    let windows = this.windows;
    for (let index in windows) {
      windows[index].hide();
    };
  };

  areAllWindowsHidden() {
    let windows = this.windows;
    for (let index in windows) {
      if (windows[index].isVisible()) {
        return false;
      }
    }
    return true;
  }

  closeAllEmptyNotes() {
    this.updateNoteManagers(() => {
      for (let index in this.noteManagerList) {
        let noteManager = this.noteManagerList[index];
        if (noteManager.content == "") {
          BrowserWindow.fromId(noteManager.id).close();
        }
      }
    });
  }

  saveAllOpenNotes() {
    let windows = this.windows;
    for (let index in windows) {
      let win = windows[index];
      win.webContents.send("saveIfOpen");
    }
  }

  checkNoteOpen(filePath, windowPosition, newWindow=true, winId=0) {
    this.updateNoteManagers(() => {
      for (let index in this.noteManagerList) {
        let noteManager = this.noteManagerList[index];
        if (noteManager.currentFile == filePath) {
          let win = BrowserWindow.fromId(noteManager.id)
          win.focus();
          win.webContents.send("balloonNotification", {notification: "This file is already open!"})
          return;
        };
      };

      // Either load the file in a new note, or the one that sent this message
      if (newWindow) {
        this.createNewNote(filePath, windowPosition)
      } else {
        BrowserWindow.fromId(winId).webContents.send("loadNote", {filePath: filePath});
      }
    });
  };

  createNewNote(filePath, windowPosition) {
    let backgroundColor = colors[getRandomInt(0, 4)];
    let win = this.createWindow(backgroundColor);

    if (windowPosition != undefined){
      win.setPosition(windowPosition[0] + 50, windowPosition[1] + 50); //Create the window at an offset to the original window
    }

    win.webContents.once('did-finish-load', () => {
      if (filePath != undefined) {
        win.webContents.send("loadNote", { filePath: filePath });
      }
      win.webContents.send("colourNote", {backgroundColor: backgroundColor, menuColor: backgroundColor});
    });
  }

  getNoteList() {
    this.updateNoteManagers(() => {
      let noteList = [];
      for (let index in this.noteManagerList){
        let noteManager = this.noteManagerList[index];
        if (!noteManager.hasFileOpen){
          noteList.push("Sticky Note " + noteManager.id);
        } else{
          noteList.push(noteManager.fileName);
        }
      }
    });
  }

  updateNoteManagers(callback = undefined) { //This updates the note manager list
    //The callback passed to this function, is a function that should make use of the noteManagerList
    this.noteManagerList = [];

    for (let index in this.windows) {
      let win = this.windows[index];
      win.webContents.send("getNoteManager", { saveState: false });
    }

    if (callback != undefined) {
      setTimeout(callback, 500); //Wait for the noteManagers to be added to the list.
    }
  }
};

module.exports = new WindowManager();
