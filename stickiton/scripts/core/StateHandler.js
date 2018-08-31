class StateHandler{
    constructor(windowStateList, noteManagerList, appPath){
        this.noteManagerList = noteManagerList;
        this.windowStateList = windowStateList;
        this.filePath = appPath + "/stickiton/user_data/window_state.json";
    };
    
    saveState(){
        const fs = require("fs");
        
        for (let index in this.windowStateList){
            this.windowStateList[index].noteManager = this.noteManagerList[this.windowStateList[index].id];
        }

        let content = JSON.stringify(this.windowStateList);
        fs.writeFile(this.filePath, content, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    };

    loadState(){
        const fs = require("fs");
        let data = fs.readFileSync(this.filePath);

        if (data == ""){
            this.windowStateList = []; //No previous state
        } else {
            this.windowStateList = JSON.parse(data);
        };
        
        return this.windowStateList;
    };

    saveEmptyState() {
        const fs = require("fs");
        let content = "";
        fs.writeFile(this.filePath, content, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    };
};

module.exports = StateHandler;