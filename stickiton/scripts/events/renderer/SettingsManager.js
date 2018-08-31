let $ = require("jquery");
let iro = require("../../core/iro");
let rgbHex = require("rgb-hex");

class SettingsManager {
    initialiseColorPicker() {
        let colorPicker = new iro.ColorPicker("#color-picker-container", {
            width: 200,
            height: 200,
            color: "#fff",
            wheelLightness: false
        });

        colorPicker.on("color:change", function (color, changes) {
            let hexMessage = color.hexString;
            $("#hex-color").html(hexMessage);
            $("#hex-color").css("color", color.hexString);
            $(".cp-square").css("background-color", color.hexString);
        });

        return colorPicker
    }

    // Add better default values...
    constructor(backgroundColor = undefined, fontColor = undefined, menuColor = undefined) {
        this.colorPicker = this.initialiseColorPicker();
        this.backgroundColor = backgroundColor;
        this.fontColor = fontColor;
        this.menuColor = menuColor;
        this.boundInput = undefined;
    }

    colorNote(colors) {
        if (colors.backgroundColor != undefined) {
            document.body.style.backgroundColor = colors.backgroundColor;
            this.backgroundColor = colors.backgroundColor;

            let rgb = document.body.style.backgroundColor;

            // Detect if the current footer text is visible on the current background color
            // If it isn't then we change it to be more visible
            var pattern = /rgb\((\d+),\s?(\d+),\s?(\d+)\)/;
            var matches = rgb.match(pattern);
            var o = Math.round(((parseInt(matches[1]) * 299) + (parseInt(matches[2]) * 587) + (parseInt(matches[3]) * 114)) /1000);
        
            if(o > 125) {
                $("#footer-info").css('color', '#313131');
                $("#footer-div").removeClass("balloon-hover-light");
                $("#footer-div").addClass("balloon-hover-dark");
            }else{
                $("#footer-info").css('color', '#e8e285');
                $("#footer-div").removeClass("balloon-hover-dark");
                $("#footer-div").addClass("balloon-hover-light");
            }
        }

        if (colors.fontColor != undefined) {
            $(".textarea").css("color", colors.fontColor)
            this.fontColor = colors.fontColor;
        }

        if (colors.menuColor != undefined) {
            $(".window-button").css("color", colors.menuColor);
            this.menuColor = colors.menuColor;
        }
    }

    initialiseInputForms() {
        // Initialise the colour picker forms with there current hex colours
        let backgroundColor = "#" + rgbHex(document.body.style.backgroundColor);
        let fontColor = "#" + rgbHex($(".textarea").css("color"));
        let menuColor = "#" + rgbHex($(".window-button").css("color"));

        $("#cpi-background").val(backgroundColor);
        $("#cpi-font").val(fontColor)
        $("#cpi-menu").val(menuColor);

        this.backgroundColor = backgroundColor;
        this.fontColor = fontColor;
        this.menuColor = menuColor;

        // Initialise click events for all input forms
        var settingsManager = this;

        this.colorPicker.on("color:change", function (color, changes) {
            if (settingsManager.boundInput != undefined) {
                settingsManager.boundInput.val(color.hexString);
                let inputId = settingsManager.boundInput.attr('id');

                let colors = {};
                if (inputId == "cpi-background") {
                    colors.backgroundColor = settingsManager.boundInput.val();
                } else if (inputId == "cpi-font") {
                    colors.fontColor = settingsManager.boundInput.val()
                } else {
                    colors.menuColor = settingsManager.boundInput.val();
                }

                //settingsManager.colorNote(colors);
                remote.getCurrentWebContents().send("colourNote", colors);
            }
        });

        let inputOptions = ["#cpi-background", "#cpi-font", "#cpi-menu"];

        // For each input, setup there click and keypress events to update the color picker
        // and there respective elements
        for (let index in inputOptions) {
            let inputId = inputOptions[index];

            $(inputId).click((event) => {
                let element = $(event.target);
                let hexColor = element.val();

                settingsManager.boundInput = element;
                settingsManager.colorPicker.color.hexString = hexColor;
            });

            $(inputId).on('keypress', function (e) {
                if (e.which === 13) {
                    let element = $(event.target);
                    let hexColor = element.val();

                    settingsManager.boundInput = element;
                    settingsManager.colorPicker.color.hexString = hexColor;
                }
            });
        }
    }
}

module.exports = new SettingsManager();