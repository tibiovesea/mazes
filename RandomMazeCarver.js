function RandomMazeCarver(mz) {
    if (mz === null) {
        throw "cannot carve on null";
    }
    if (!(mz instanceof Maze)) {
        throw "must carve on a Maze";
    }

    this.maze = mz;
    this.numSteps = (this.maze.columns * this.maze.rows) * 0.75;
    this.continueOnLastDirectionChance = 30;
};
RandomMazeCarver.prototype.generate = function() {
    var carvedCells = new Array();
    var startingCell = this.maze.getCell(MyMath.randomOddInteger(1, this.maze.columns - 1), MyMath.randomOddInteger(1, this.maze.rows - 1));
    var lastDirection = this.maze.directions.shuffle()[0];
    var newDirection = null;
    this.carve(startingCell);
    carvedCells[carvedCells.length] = startingCell;
    while (carvedCells.length < this.numSteps) {
        if ((Math.random() * 100) < this.continueOnLastDirectionChance) {
            newDirection = lastDirection;
        } else {
            newDirection = this.maze.directions.shuffle()[0];
        }
        if (startingCell.x + newDirection.x === 0 || startingCell.y + newDirection.y === 0 || startingCell.x + newDirection.x === this.maze.columns - 1 || startingCell.y + newDirection.y === this.maze.rows - 1) {
            continue;
        }
        lastDirection = newDirection;
        startingCell = this.maze.getCell(startingCell.x + newDirection.x, startingCell.y + newDirection.y);
        this.carve(startingCell);
        carvedCells[carvedCells.length] = startingCell;
    }
};
RandomMazeCarver.prototype.carve = function(cell) {
    if (cell === null) {
        throw "cannot carve null";
    }
    if (!(cell instanceof Cell)) {
        throw "can only carve Cell objects";
    }
    cell.visited = true;
};