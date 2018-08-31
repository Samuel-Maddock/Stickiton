let $ = require("jquery");
const remote = require("electron").remote;

class NoteManager {
    constructor() {
        this.id = "";
        this.windowSize = [];
        this.windowPosition = [];
        this.currentFile = "";
        this.lastSavedContent = ""; //The content of the note that has been last saved to disk
        this.content = ""; //The current content of the note 
        this.hasFileOpen = false;
        this.settings = require("../events/renderer/SettingsManager");
    }

    getShortPath(filePath) {
        let shortPath = "";
        if (process.platform === "darwin") {
            let pathArray = filePath.split("/");

            if (pathArray.length >= 2) {
                shortPath = ".../" + pathArray[pathArray.length - 2] + "/" + pathArray[pathArray.length - 1]
            } else {
                shortPath = filePath;
            }
        } else {
            let pathArray = filePath.split("\\");
            if (pathArray.length >= 2) {
                shortPath = "...\\" + pathArray[pathArray.length - 2] + "\\" + pathArray[pathArray.length - 1]
            } else {
                shortPath = filePath;
            }
        }
        return shortPath;
    }

    setFooterContent(content, balloon = content, isPath = false) {
        let shortContent = "";

        if (isPath) {
            shortContent = this.getShortPath(content)
        } else {
            shortContent = content;
        }

        document.getElementById("footer-info").innerHTML = shortContent;
        if (this.hasFileOpen) {
            $("#footer-div").attr("data-balloon", balloon);
        }
    }

    addFooterNotification(notification, content, balloon = content) {
        if (this.hasFileOpen) {
            $("#footer-div").attr("data-balloon", balloon);
        }
        content = this.getShortPath(content);
        document.getElementById("footer-info").innerHTML = notification;
        setTimeout(() => {
            document.getElementById("footer-info").innerHTML = content
        }, 3500);
    }

    addBalloonNotification(notification, content) {
        $("#footer-div").attr("data-balloon", notification);
        $("#footer-div").addClass("balloon-hover")

        setTimeout(() => {
            $("#footer-div").removeClass("balloon-hover")
            $("#footer-div").attr("data-balloon", content);
        }, 3500)
    }

    openFile(filePath) {
        fs.readFile(filePath, "utf8", (err, data) => {
            document.getElementById("note").innerText = data;
            this.hasFileOpen = true;
            this.currentFile = filePath;
            this.lastSavedContent = data;
            this.setFooterContent(filePath, undefined, true);
            let shortPath = this.getShortPath(filePath);
            this.addFooterNotification(shortPath, shortPath, filePath);
        });
    }

    saveFile(doSaveAs) {
        if (typeof doSaveAs == undefined) {
            doSaveAs = false;
        }

        let filePath;
        let content = document.getElementById("note").innerText;

        if (this.hasFileOpen) {
            filePath = this.currentFile;
            if (doSaveAs) {
                filePath = dialog.showSaveDialog({ title: "Save file as...", defaultPath: filePath, filters: [{ name: "Text file (.txt)", extensions: ["txt"] }] })
            };
        } else {
            filePath = dialog.showSaveDialog({ defaultPath: "Untitled.txt", filters: [{ name: "Text file (.txt)", extensions: ["txt"] }] });
        }

        if (filePath == undefined) {
            return false;
        }

        fs.writeFile(filePath, content, function (err) {
            if (err) {
                return console.log(err);
            }
        });

        this.currentFile = filePath;
        this.hasFileOpen = true;
        this.lastSavedContent = content;
        this.addFooterNotification("File has been saved...", filePath);
        return true;
    };

    saveFileIfOpen() {
        if (this.hasFileOpen) {
            let content = document.getElementById("note").innerText;
            let filePath = this.currentFile;

            fs.writeFile(filePath, content, function (err) {
                if (err) {
                    return console.log(err);
                }
            });

            this.currentFile = filePath;
            this.hasFileOpen = true;
            this.lastSavedContent = content;
            this.addFooterNotification("File has been saved...", filePath)
            return true;
        }
    }

    closeWindow() {
        let win = remote.BrowserWindow.getFocusedWindow();
        let app = remote.app;
        app.hideClosedWindows = false;
        win.close();
    };
}

module.exports = new NoteManager();

