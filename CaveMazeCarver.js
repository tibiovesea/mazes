function CaveMazeCarver(mz) {
    if (mz === null) {
        throw "cannot carve on null";
    }
    if (!(mz instanceof Maze)) {
        throw "must carve on a Maze";
    }

    this.maze = mz;

    this.currentRegion = 0;
    this.regions = [];

    this.sparseness = 0.50;
    this.generations = 3;
    this.allNeighbourDirections = [
        new Direction(-1, -1),
        new Direction(0, -1),
        new Direction(1, -1),
        new Direction(-1, 0),
        new Direction(1, 0),
        new Direction(-1, 1),
        new Direction(0, 1),
        new Direction(1, 1)
    ];
};
CaveMazeCarver.prototype.generate = function() {
    for (var y = 1; y < this.maze.rows - 1; y++) {
        for (var x = 1; x < this.maze.columns - 1; x++) {
            var currentCell = this.maze.getCell(x, y);
            if (Math.random() >= this.sparseness) {
                this.carve(currentCell);
            }
        }
    }

    this.makeCaverns();
    this.identifyRegions();
};
CaveMazeCarver.prototype.makeCaverns = function() {
    for (var g = 0; g < this.generations; g++) {
        for (var y = 0; y < this.maze.rows; y++) {
            for (var x = 0; x < this.maze.columns; x++) {
                var currentCell = this.maze.getCell(x, y);
                currentCell.visited = this.isVisited(currentCell);
            }
        }
    }
};
CaveMazeCarver.prototype.identifyRegions = function() {
    for (var y = 0; y < this.maze.rows; y++) {
        for (var x = 0; x < this.maze.columns; x++) {
            var currentCell = this.maze.getCell(x, y);
            if (currentCell.region > 0 || !currentCell.visited) {
                continue;
            }
            this.floodFill(currentCell, this.currentRegion);
        }
    }
};
CaveMazeCarver.prototype.floodFill = function(startCell) {
    var regionCells = [startCell];
    var ix = 0;
    while (ix < regionCells.length) {
        for (var nd of this.maze.directions) {
            var n = this.maze.getCell(regionCells[ix].x + nd.x, regionCells[ix].y + nd.y);
            if (n !== undefined && n.visited && regionCells.indexOf(n) === -1) {
                regionCells.push(n);
            }
        }
        ix += 1;
    }

    if (regionCells.length < (this.maze.columns * this.maze.rows) * 0.005) {
        for (var rc of regionCells) {
            rc.region = -1;
            rc.visited = false;
        }
    } else {
        this.regions[this.currentRegion] = regionCells;
        this.startRegion();
        for (var rc of regionCells) {
            rc.region = this.currentRegion;
        }
    }
};
CaveMazeCarver.prototype.isVisited = function(cell) {
    var wallNeighbours = 0;
    for (var nd of this.allNeighbourDirections) {
        var n = this.maze.getCell(cell.x + nd.x, cell.y + nd.y);
        if (n === undefined || !n.visited) {
            wallNeighbours += 1;
        }
    }

    if (!cell.visited) {
        if (wallNeighbours >= 4) {
            return false;
        } else if (wallNeighbours < 2) {
            return true;
        }
    } else {
        if (wallNeighbours >= 5) {
            return false;
        }
    }

    //set this to >1 if you want to never change so you don't get single walls in a region
    return Math.random() < 0.991;
};
CaveMazeCarver.prototype.carve = function(cell) {
    if (cell === null) {
        throw "cannot carve null";
    }
    if (!(cell instanceof Cell)) {
        throw "can only carve Cell objects";
    }
    cell.visited = true;
};
CaveMazeCarver.prototype.startRegion = function() {
    this.currentRegion += 1;
};