var interpreter = interpreter || {},
    program = program || {},
    codeCell = codeCell || {},
    tmath = tmath || {};

(function(core, program, cell, tmath) {

    var Interpreter = function() {
        this.tape = new core.Tape();
        this.program = null;

        this.accept = false;
        this.running = false;

        this.position = new tmath.Vec2(0, 0);
        this.facing = program.directions.UP;
    };

    Interpreter.prototype.setProgram = function(program) {
        this.program = program;
    };

    Interpreter.prototype.setTape = function(tape) {
        this.tape = tape;
    };

    Interpreter.prototype.start = function() {
        this.accept = false;
        this.running = true;

        // Go to the start
        for (var x = 0; x < this.program.cols; x ++) {
            for (var y = 0; y < this.program.rows; y ++) {
                if (this.program.getCell(x, y).type == "Start") {
                    this.position.x = x;
                    this.position.y = y;
                }
            }
        }

        // Face +y;
        this.facing = program.directions.UP;
    };

    Interpreter.prototype.convertDirectionGlobalToCell = function(d, cell) {
        return cell.orientation.apply(d);
    };

    Interpreter.prototype.convertDirectionCellToGlobal = function(d, cell) {
        return cell.orientation.invert().apply(d);
    };

    // Returns tuple [pop tape head or not (bool), symbol to push (maybe null), new facing direction]
    Interpreter.prototype.evalCell = function(cell, tapeHead) {

        var cellFunc = codeCell.codeCells[cell.type];

        var result = null;

        if (cellFunc) {
            if (cell.type == "CrossConveyor") {
                // Special case. Convert this.facing into cell coordinates for CrossConveyor's function:
                var cellFacing = this.convertDirectionGlobalToCell(this.facing, cell);
                result = cellFunc(tapeHead, cellFacing);
            } else {
                // No knowledge of current facing needed
                result = cellFunc(tapeHead);
            }

            // Convert cell's returned direction into global direction
            console.log("(", result, ")");
            result[2] = this.convertDirectionCellToGlobal(result[2], cell);
            console.log(result)
            return result;
        }

        console.log("Invalid cell type.");

        return [false, null, program.directions.UP];
    };

    Interpreter.prototype.step = function() {

        if (!this.running) return;

        // Move 'facing' direction:
        this.position = this.position.add(this.facing);

        // Get state
        var cell = this.program.getCell(this.position.x, this.position.y);
        var head = this.tape.head();

        // Check if done
        if (cell.type == "Empty" || cell.type == "Start") {
            this.running = false;
            this.accept = false;
        } else if (cell.type == "End") {
            this.running = false;
            this.accept = true;
        } else {

            // Evaluate cell
            var result = this.evalCell(cell, head);

            // Perform result
            if (result[0]) {
                this.tape.pop();
            }

            if (result[1] != null) {
                this.tape.append(result[1]);
            }

            this.facing = result[2];

        }

    };

    interpreter.Interpreter = Interpreter;

    interpreter.dtest = function() {
        var intr = new interpreter.Interpreter();
        console.log(i);
        var a = new program.cellTypes["BranchBR"]();

        var dirs = [program.directions.UP, program.directions.LEFT, program.directions.DOWN, program.directions.RIGHT];

        for (var i = 0; i < dirs.length; i ++) {
            a.dir = dirs[i];
            console.log("Cell is ", a.dir);
            for (var j = 0; j < dirs.length; j ++) {
                console.log(dirs[j], " --> ", intr.convertDirectionCellToGlobal(dirs[j], a));
            }
        }

        console.log("mirroring cell");
        a.mirror = true;

        for (var i = 0; i < dirs.length; i ++) {
            a.dir = dirs[i];
            console.log("Cell is ", a.dir);
            for (var j = 0; j < dirs.length; j ++) {
                console.log(dirs[j], " --> ", intr.convertDirectionCellToGlobal(dirs[j], a));
            }
        }
    }

})(core, program, codeCell, tmath);
