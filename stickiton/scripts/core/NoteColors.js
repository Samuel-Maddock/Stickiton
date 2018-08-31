
class NoteColors{
    constructor(window) {
        this.green = "#c2e7a1";
        this.pink = "#eec2c2";
        this.yellow = "#e8e285";
        this.blue = "#c1edf5";
    };

    getColorArray(){
        let colorArray = [];
        for (let color in this){
            colorArray.push(this[color]);
        }
        return colorArray;
    }
}

module.exports = new NoteColors();