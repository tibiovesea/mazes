//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
if (!Array.prototype.shuffle) {
    Array.prototype.shuffle = function() { //v1.0
        var o = Object(this);
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };
};

var MyMath = (function() {
    var ths = {};

    ths.randomOddInteger = function(lowerBound, upperBound, upperOffset) {
        var n = Math.floor(Math.random() * upperBound * 10) % upperBound;
        n = n <= lowerBound ? lowerBound : n;
        n = n % 2 == 0 ? n + 1 : n;
        n = n > upperBound - upperOffset - 1 ? upperBound - upperOffset - 1 : n;

        return n;
    };

    return ths;
}());

function Direction(x, y) {
    this.x = x;
    this.y = y;
};
Direction.prototype.opposite = function() {
    return new Direction(x * -1, y * -1);
};
Direction.prototype.equals = function(direction) {
    if (direction === null) {
        return false;
    }
    if (!(direction instanceof Direction)) {
        return false;
    }
    return direction.x === this.x && direction.y === this.y;
};

function Cell(x, y) {
    this.x = x;
    this.y = y;
    this.regionConnections = [];
    this.visited = false;
    this.loopedTo = false;
    this.loopedFrom = false;
    this.region = -1;
    this.isConnection = false;
};

function Room(x, y, w, h) {
    this.position = {
        x: x,
        y: y
    };
    this.size = {
        width: w,
        height: h
    };

    this.top = this.position.y;
    this.bottom = this.position.y + this.size.height;
    this.left = this.position.x;
    this.right = this.position.x + this.size.width
};
Room.prototype.overlaps = function(room) {
    return !(this.left > room.right || this.right < room.left || this.top > room.bottom || this.bottom < room.top)
};

function Maze(columns, rows) {
    this.cells = new Array();
    this.rooms = new Array();
    this.columns = columns % 2 === 0 ? columns + 1 : columns;
    this.rows = rows % 2 === 0 ? rows + 1 : rows;
    this.directions = [
        new Direction(1, 0),
        new Direction(-1, 0),
        new Direction(0, 1),
        new Direction(0, -1)
    ];
    this.connections = [];

    this.init();
};
Maze.prototype.init = function() {
    for (var c = 0; c < this.columns; c++) {
        this.cells[c] = [];
        for (var r = 0; r < this.rows; r++) {
            this.cells[c][r] = new Cell(c, r);
        }
    }
};
Maze.prototype.containsPosition = function(x, y) {
    return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
};
Maze.prototype.getCell = function(x, y) {
    if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) {
        return undefined;
    }
    return this.cells[x][y];
};
Maze.prototype.canCarve = function(cell, direction) {
    if (!this.containsPosition(cell.x + direction.x * 3, cell.y + direction.y * 3)) {
        return false;
    }
    return this.getCell(cell.x + direction.x * 2, cell.y + direction.y * 2).visited === false;
};