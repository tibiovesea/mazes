function RoomAndCorridorMazeCarver(mz) {
    if (mz === null) {
        throw "cannot carve on null";
    }
    if (!(mz instanceof Maze)) {
        throw "must carve on a Maze";
    }

    this.currentRegion = 0;
    this.multipleConnectionsForSameRegionChance = 0;
    this.roomMinSize = 5;
    this.roomMaxSize = 10;
    this.windingPercent = 0.5;
    this.maxRoomPlacementTries = 200;

    this.maze = mz;
}
RoomAndCorridorMazeCarver.prototype.generate = function() {
    this.addRooms();
    for (var y = 1; y < this.maze.rows; y += 2) {
        for (var x = 1; x < this.maze.columns; x += 2) {
            var currentCell = this.maze.getCell(x, y);
            if (currentCell.visited) {
                continue;
            }
            this.growMaze(currentCell);
        }
    }
    this.addConnections();
    this.carveConnections();
    this.removeDeadEnds();
};
RoomAndCorridorMazeCarver.prototype.addRooms = function() {
    for (var i = 0; i < this.maxRoomPlacementTries; i++) {
        var roomWidth = MyMath.randomOddInteger(this.roomMinSize, this.roomMaxSize);
        var roomLength = MyMath.randomOddInteger(this.roomMinSize, this.roomMaxSize);
        var x = MyMath.randomOddInteger(0, this.maze.columns, roomWidth);
        var y = MyMath.randomOddInteger(0, this.maze.rows, roomLength);
        var currentRoom = new Room(x, y, roomWidth, roomLength);
        var overlaps = false;
        for (var r of this.maze.rooms) {
            if (r.overlaps(currentRoom)) {
                overlaps = true;
                break;
            }
        }
        if (overlaps) {
            continue;
        }
        this.maze.rooms.push(currentRoom);
        this.carveRoom(currentRoom)
    }
};
RoomAndCorridorMazeCarver.prototype.growMaze = function(startCell) {
    var possibleCells = [];
    var lastDirection;
    this.startRegion();
    this.carve(startCell);
    possibleCells.push(startCell);
    while (possibleCells.length > 0) {
        var cell = possibleCells[possibleCells.length - 1];
        var possibleDirections = [];
        for (var d of this.maze.directions.shuffle()) {
            if (this.maze.canCarve(cell, d)) {
                possibleDirections.push(d);
            }
        }
        if (possibleDirections.length > 0) {
            var carvingDirection;
            if (possibleDirections.indexOf(lastDirection) >= 0 && Math.random() > this.windingPercent) {
                carvingDirection = lastDirection;
            } else {
                carvingDirection = possibleDirections.pop();
            }
            var toCarve = this.maze.getCell(cell.x + carvingDirection.x, cell.y + carvingDirection.y);
            this.carve(toCarve);
            toCarve = this.maze.getCell(cell.x + carvingDirection.x * 2, cell.y + carvingDirection.y * 2);
            this.carve(toCarve);
            possibleCells.push(toCarve);
            lastDirection = carvingDirection;
        } else {
            possibleCells.splice(possibleCells.length - 1, 1);
            lastDirection = null;
        }
    }
};
RoomAndCorridorMazeCarver.prototype.addConnections = function() {
    for (var y = 1; y < this.maze.rows - 1; y++) {
        for (var x = 1; x < this.maze.columns - 1; x++) {
            var c = this.maze.getCell(x, y);
            if (c.visited) {
                continue;
            }
            var differingRegions = [];
            var regionConnections = [];
            for (var d of this.maze.directions) {
                var neighbor = this.maze.getCell(c.x + d.x, c.y + d.y);
                if (neighbor.visited && differingRegions.indexOf(neighbor.region) < 0) {
                    differingRegions.push(neighbor.region);
                    regionConnections.push(neighbor);
                }
            }
            if (differingRegions.length >= 2) {
                c.isConnection = true;
                c.regionConnections = regionConnections;
                this.maze.connections.push(c);
            }
        }
    }
};
RoomAndCorridorMazeCarver.prototype.carveConnections = function() {
    var shuffledConnections = this.maze.connections.shuffle();
    for (var cell of shuffledConnections) {
        var connectedToRegions = [];
        for (var connectionCell of cell.regionConnections) {
            if (connectedToRegions.indexOf(connectionCell.region) < 0) {
                connectedToRegions.push(connectionCell.region);
            }
        }
        if (connectedToRegions.length >= 2 || (Math.random() * 100) < this.multipleConnectionsForSameRegionChance) {
            this.currentRegion = connectedToRegions[0];
            this.carve(cell);
            if (connectedToRegions.length >= 2) {
                this.mergeRegions(connectedToRegions[0], connectedToRegions[1]);
            }
        } else {
            cell.isConnection = false;
        }
    }
};
RoomAndCorridorMazeCarver.prototype.removeDeadEnds = function() {
    var done = false;
    while (!done) {
        done = true;
        for (var y = 0; y < this.maze.rows; y++) {
            for (var x = 0; x < this.maze.columns; x++) {
                var cell = this.maze.getCell(x, y);
                if (!cell.visited) {
                    continue;
                }
                var exits = [];
                for (var dir of this.maze.directions) {
                    var neighbor = this.maze.getCell(x + dir.x, y + dir.y);
                    if (neighbor && neighbor.visited) {
                        exits.push(neighbor);
                    }
                }
                if (exits.length != 1) {
                    continue;
                }
                done = false;
                this.maze.getCell(x, y).visited = false;
                this.maze.getCell(x, y).isConnection = false;
            }
        }
    }
};
RoomAndCorridorMazeCarver.prototype.mergeRegions = function(region1, region2) {
    for (var y = 0; y < this.maze.rows; y++) {
        for (var x = 0; x < this.maze.columns; x++) {
            var cell = this.maze.getCell(x, y);
            if (cell.region === region2) {
                cell.region = region1;
            }
        }
    }
};
RoomAndCorridorMazeCarver.prototype.carveRoom = function(room) {
    this.startRegion();
    for (var c = room.position.x; c < room.position.x + room.size.width; c++) {
        for (var r = room.position.y; r < room.position.y + room.size.height; r++) {
            this.carve(this.maze.getCell(c, r));
        }
    }
};
RoomAndCorridorMazeCarver.prototype.startRegion = function() {
    this.currentRegion += 1;
};
RoomAndCorridorMazeCarver.prototype.carve = function(cell) {
    if (cell === null) {
        throw "cannot carve null";
    }
    if (!(cell instanceof Cell)) {
        throw "can only carve Cell objects";
    }

    cell.visited = true;
    cell.region = this.currentRegion;
};