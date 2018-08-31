class WindowState {
    constructor(window) {
        this.id = window.id;
        this.position = window.getPosition();
        this.size = window.getSize();
    };
};

module.exports = WindowState;