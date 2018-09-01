const {Menu, Tray, app, dialog} = require('electron');
let WindowManager = require("./WindowManager");
let WindowState = require("../../core/WindowState")
let StateHandler = require("../../core/StateHandler")
const mainBgColor = "#e8e285";
const APP_PATH = app.getAppPath();
let dialogImage = APP_PATH + "/stickiton/Icons/png/512x512.png";

if (process.platform == "win32") {
    dialogImage = remote.app.getAppPath() + "/stickiton/Icons/sticky.ico";
}

function saveWindowStates(){
    let windowStateList = [];

    for (let index in WindowManager.windows){
      let win = WindowManager.windows[index];
      windowStateList.push(new WindowState(win)); //Store the state of each window and add it to the list.
    }
      
    let stateHandler = new StateHandler(windowStateList, WindowManager.noteManagerList, APP_PATH); 
    stateHandler.saveState(); //Save the state of the windows
}

function closeApp(){
    app.hideClosedWindows = false;
    app.quitApplication = true;

    WindowManager.updateNoteManagers(() => {
        let saveAll = false;
        let cancelClose = false;

        for (let index in WindowManager.noteManagerList){
            let noteManager = WindowManager.noteManagerList[index];
            if ((noteManager.content != noteManager.lastSavedContent) && (noteManager.hasFileOpen)){
                saveAll = true;
            }
        }

        if (saveAll){
            dialog.showMessageBox({
                type: "question", 
                buttons: ["Yes, save all", "No, exit", "Cancel"], 
                title: "Save All Notes", 
                message: "Do you want to save all unsaved changes before exiting?",
                icon: dialogImage
            }, (response, checkboxChecked) => {
                if (response == 0){
                    for (let index in WindowManager.windows) {
                        let window = WindowManager.windows[index];
                        let winId = window.id;
                        if (WindowManager.noteManagerList[winId].hasFileOpen){
                            window.webContents.send("saveNote");
                        }
                    }
                } else if (response == 2){
                    cancelClose = true;
                }

                if (!cancelClose) {
                    saveWindowStates();
                    app.quit();
                }
            });
        }else {
            saveWindowStates();
            app.quit();
        }
    });
}

class TrayManager {
    constructor(){
        this.trayContextMenu = [
            {label: "Show All Windows", click() {WindowManager.showWindows()}},
            {label: "Hide All Windows", click(){WindowManager.hideWindows()}},
            {type: "separator"},
            {label: "Create A New Note", click(){WindowManager.createWindow(mainBgColor)}},
            {type: "separator"},
            {label: "Quit Stickiton", click() {closeApp()}}
        ];
        this.tray = null;
    }
    
    createTray(APP_PATH){
        let trayIconPath;
        if (process.platform == "darwin"){
            trayIconPath = APP_PATH + "/stickiton/Icons/png/24x24.png";
        } else{
            trayIconPath = APP_PATH + "/stickiton/Icons/png/32x32.png";
        }

        this.tray = new Tray(trayIconPath);
        this.trayIconPath = trayIconPath;

        if (process.platform == "darwin"){
           /* this.tray.on("mouse-enter", e => {
                this.tray.setImage("./stickiton/Icons/png/24x24.png");
            });
    
            this.tray.on("mouse-leave", e => {
                this.tray.setImage("./stickiton/Icons/trayIcons/24x24.png");
            });
            
            this.tray.setPressedImage("./stickiton/Icons/png/24x24.png"); */
        }
        
        this.tray.setToolTip("Stickiton");

        this.tray.on("click", e => {
            WindowManager.showWindows();
        });

        this.tray.on("right-click", e => {
            this.tray.popUpContextMenu(Menu.buildFromTemplate(this.trayContextMenu));
        });

        this.tray.on("balloon-click", e =>{
            WindowManager.showWindows();
        });
    }

    //Private, should only be used under WindowManager.notify()
    windowTrayNotification(notification){
        let tray = this.tray;
        tray.displayBalloon({
            icon: this.trayIconPath,
            title: "Stickiton",
            content: notification,
        });
    };
}   

module.exports.trayManager = new TrayManager()
module.exports.closeApp = closeApp