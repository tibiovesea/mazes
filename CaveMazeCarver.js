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
    this.connectionEnds = [];

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
    this.findClosestCellsBetweenRegions();
    this.linkRegions();
};
CaveMazeCarver.prototype.findClosestCellsBetweenRegions = function() {
    for (var r0 of this.regions) {
        for (var r1 of this.regions) {
            if (r0.id === r1.id) {
                continue;
            }

            var md = -1;
            var c0, c1;
            for (var e0 of r0.regionEdges) {
                for (var e1 of r1.regionEdges) {
                    var cd = (e1.x - e0.x) * (e1.x - e0.x) + (e1.y - e0.y) * (e1.y - e0.y);
                    if (md === -1 || cd <= md) {
                        md = cd;
                        c0 = e0;
                        c1 = e1;
                    }
                }
            }

            c0.isConnection = true;
            c1.isConnectino = true;

            r0.closestCells.push({
                c0: c0,
                c1: c1
            });
        }
    }
};
CaveMazeCarver.prototype.linkRegions = function() {
    for (var r of this.regions) {
        for (var cc of r.closestCells) {
            if (this.hasClearPath(cc.c0, cc.c1)) {
                this.carveTunnel(cc.c0, cc.c1);
            }
        }
    }
    // //  6,43
    // // 43,19
    // var c0 = this.maze.getCell(6, 43);
    // var c1 = this.maze.getCell(43, 19);

    // this.carveTunnel(c0, c1);
};
CaveMazeCarver.prototype.carveTunnel = function(c0, c1, action) {
    var x0 = c0.x;
    var y0 = c0.y;
    var x1 = c1.x;
    var y1 = c1.y;

    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
        var cc = this.maze.getCell(x0, y0);
        this.carve(cc);

        if (x0 == x1 && y0 == y1) {
            break;
        }

        var err2 = 2 * err;
        if (err2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (err2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
};
CaveMazeCarver.prototype.hasClearPath = function(c0, c1) {
    var x0 = c0.x;
    var y0 = c0.y;
    var x1 = c1.x;
    var y1 = c1.y;

    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
        var cc = this.maze.getCell(x0, y0);
        if ((cc !== c0 && cc != c1 && cc.visited) || (cc.region != -1 && cc.region != c0.region && cc.region != c1.region)) {
            return false;
        }

        if (x0 == x1 && y0 == y1) {
            break;
        }

        var err2 = 2 * err;
        if (err2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (err2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return true;
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
    var regionEdges = [];
    var minX, maxX, minY, maxY, center;
    var ix = 0;
    while (ix < regionCells.length) {
        for (var nd of this.maze.directions) {
            var currentCell = regionCells[ix];
            var n = this.maze.getCell(currentCell.x + nd.x, currentCell.y + nd.y);
            if ((n === undefined || !n.visited) && regionEdges.indexOf(currentCell) === -1) {
                regionEdges.push(currentCell);
            }
            if (n !== undefined && n.visited && regionCells.indexOf(n) === -1) {
                regionCells.push(n);
                if (minX === undefined || minX.x > n.x) {
                    minX = n;
                }
                if (maxX === undefined || maxX.x < n.x) {
                    maxX = n;
                }
                if (minY === undefined || minY.y > n.y) {
                    minY = n;
                }
                if (maxY === undefined || maxY.y < n.y) {
                    maxY = n;
                }
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
        // minX.isConnection = true;
        // maxX.isConnection = true;
        // minY.isConnection = true;
        // maxY.isConnection = true;
        center = this.maze.getCell(parseInt((minX.x + maxX.x) / 2), parseInt((minY.y + maxY.y) / 2));
        // center.isConnection = true;
        this.regions[this.currentRegion] = {
            id: this.currentRegion + 1,
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY,
            center: center,
            regionCells: regionCells,
            regionEdges: regionEdges,
            closestCells: []
        };
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