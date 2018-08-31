let isRenderer = require("is-electron-renderer");
let remote = require("electron").remote;
const { BrowserWindow } = require('electron');
let win; 

let noteColors = require("./NoteColors")
let WindowManager = require("../events/main/WindowManager")

function getWindow(){
  if (isRenderer){
    let remoteWindow = remote.BrowserWindow;
    win = remoteWindow.getFocusedWindow(); //Called from renderer
  }else {
    win = BrowserWindow.getFocusedWindow(); //Called from main
  };  
  return win
}

function validateMenuOption(callback, closeSettings=true){
  if (!WindowManager.windows.length == 0){
    let win = getWindow();
    callback();
    if (closeSettings){
      win.webContents.send("closeSettings");
    }
  }
}

let template = [
    {
      label: "File",
      submenu: [
        {label: "New Note", accelerator: "CmdOrCtrl+N", click () {
          if (!WindowManager.windows.length == 0){
            getWindow().webContents.send("newNote", "");
          } else {
            WindowManager.createNewNote();
          }
        }},
        {type: "separator"},
        {label: "Open File", accelerator: "CmdOrCtrl+O", click () {validateMenuOption(() => {getWindow().webContents.send("openNote", "")})}},
        {label: "Open File In New Note", click () {validateMenuOption(()=> {getWindow().webContents.send("openFileInNewNote")})}},
        {type: "separator"},
        {label: "Save Note", accelerator: "CmdOrCtrl+S", click () {validateMenuOption(() => {getWindow().webContents.send("saveNote", "")})}},
        {label:"Save Note as...", accelerator: "CmdOrCtrl+S+shift", click () {validateMenuOption(() => {getWindow().webContents.send("saveNoteAs", "")})}},
        {label: "Save All Open Notes", click () {WindowManager.saveAllOpenNotes()}},
        {type: "separator"},
        {label: "Close All Empty Notes", click () {WindowManager.closeAllEmptyNotes()}}
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    /**{
      label: 'View',
      submenu: [
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'}
      ]
    },*/
    {
      label: "Colour",
      submenu: [
        {label: "Yellow", type: "radio", click () {validateMenuOption(() => {getWindow().webContents.send("colourNote", {backgroundColor: noteColors.yellow, menuColor: noteColors.yellow})})}},
        {label: "Pink", type: "radio", click () {validateMenuOption(() => {getWindow().webContents.send("colourNote", {backgroundColor: noteColors.pink, menuColor: noteColors.pink})})}},
        {label: "Green", type: "radio", click () {validateMenuOption(() => {getWindow().webContents.send("colourNote", {backgroundColor: noteColors.green, menuColor: noteColors.green})})}},
        {label: "Blue", type: "radio", click () {validateMenuOption(() => {getWindow().webContents.send("colourNote", {backgroundColor: noteColors.blue, menuColor: noteColors.blue})})}},
        {label: "Custom Colours", type: "radio", click () {validateMenuOption(() => {
          getWindow().webContents.send("openSettings")
        }, false)}}
      ]
    },
    {
      label: 'Window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('https://github.com/Samuel-Maddock/Stickiton') }
        }
      ]
    }
  ]

  if (process.platform === "darwin"){
    template.unshift({
        label: "Stickiton",
        submenu: [
          {role: "about"},
          {label: "View Repo", click () { require('electron').shell.openExternal('https://github.com/Samuel-Maddock/Stickiton') }},
          {type: "separator"},
          {role: "hide"},
          {role: "hideothers"},
          {type: "separator"},
          {role: "quit"}
        ]
    })
  }


  class MenuTemplate{
    constructor() {
      this.template = template;
    }
  }

  module.exports = MenuTemplate;