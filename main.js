
var core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    view = view || {},
    tmath = tmath || {},
    loader = loader || {},
    editor = editor || {};

function App() {
    this.program = null;
    this.programView = null;
    this.tape = new core.Tape();

    var linkForm = $("#link-form");
    linkForm.find("button").click(this.generateLink.bind(this));
    linkForm.find("input").val("");

    var loadForm = $("#load-form");
    loadForm.find("button").click(this.loadLevel.bind(this));

    var controls = $("#controls");

    controls.find("[data-action=run]").click(() => {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.run();
        }
    });

    controls.find("[data-action=pause]").click(() => {
        this.isPaused = !!!this.isPaused;
    });


    var hash = window.location.hash;

    if (hash) {
        hash = decodeURI(hash.replace('#', '')).trim();

        if (hash.startsWith("lvl")) {
            this.program = program.readLegacyProgramString(hash);
        } else {
            var level = loader.fromJson(hash);
            if (level) {
                this.program = level.program;
                this.tape = level.tape[0];
            } else {
                // Error case
                console.log("Unable to load program string");
            }

        }
    }

}

App.prototype.loadLevel = function() {
    var loadForm = $("#load-form"),
        levelString = loadForm.find("input").val().trim(),
        newProgram = null;

    if (levelString.startsWith("lvl")) {
        newProgram = program.readLegacyProgramString(levelString);

    } else {
        var level = loader.fromJson(levelString);
        if (level) {
            newProgram = level.program;
            this.tape = level.tape[0];
        } else {
            // Error case
            console.log("Unable to load program string");
        }
    }
    if (newProgram) {
        this.program = newProgram;
        this.programView.setProgram(newProgram);
        this.programView.drawProgram();
    }
};

App.prototype.generateLink = function() {
    if (this.program != null && this.tape != null) {
        var link = window.location.href.split("#")[0] + "#";
        link += loader.toJson("Sample", this.tape, this.program);
        $("#link-form").find("input").val(decodeURI(link));
    }
};

App.prototype.main = function() {

    var paper = Snap(900, 640);
    this.paper = paper;
    // Set up UI elements
    graphics.preload(paper).then(function() {

        var programLayer = paper.g().addClass("program-layer");

        paper.appendTo(document.getElementById("main"));

        if (this.program == null) {
            this.program = new program.Program(10, 10);
        }

        this.palette = new view.Palette(paper, 10, 30, 2);

        this.programView = new view.ProgramView(
            programLayer,
            10 + this.palette.drawWidth,
            30,
            56,
            this.program
        );

        this.editor = new editor.Editor(paper, this.programView);

        this.programView.drawProgram();

        this.tapeView = new view.TapeView(paper, 0, 0, 400, 20, this.tape);
        this.tapeView.drawTape();

        editor.init();

    }.bind(this));

};

App.prototype.run = function() {
    var paper = this.paper,
        pView = this.programView;

    var myInterpreter = new interpreter.Interpreter();
    myInterpreter.setProgram(this.program);
    myInterpreter.setTape(this.tape);

    var token = paper.circle(0, 0, 10);
    token.attr({fill: "#E0E"});
    token.appendTo(paper);

    myInterpreter.start();

    var mainLoop = (function () {

        var curPos = myInterpreter.position;
        token.transform(
            pView.gridView.getGlobalCellMatrix(curPos.x, curPos.y)
                .toTransformString()
        );

        if (!this.isPaused) {
            myInterpreter.step();

            curPos = myInterpreter.position;
        }

        var update = function() {
            token.animate(
                {
                    transform:
                    pView.gridView.getGlobalCellMatrix(curPos.x, curPos.y)
                        .toTransformString()
                },
                500,
                mina.linear,
                function() {
                    //field.drawTape();
                    mainLoop();
                }
            );
        };

        setTimeout(update, 0);
    }).bind(this);

    mainLoop();
};


/*
 Example hash level:
 #{"title":"Sample","tape":["BYRGGYRYRGRRGBYRGYRYRGYRGBRYRRBRBGBBYRBYRBGBRBYRRYRYRGBGGBGRYRRGRRYRYRRYRBRRBYRGGRBYRBRBYRRYRGRRGGRRRGYRBYRRRRRRBYRBBGBBRG"],"program":{"cols":9,"rows":9,"cells":[{"x":2,"y":1,"orientation":"ROT3","type":"Conveyor"},{"x":2,"y":2,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":3,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":4,"orientation":"ROT3","type":"BranchGY"},{"x":2,"y":5,"orientation":"ROT3","type":"BranchGY"},{"x":3,"y":1,"orientation":"ROT2","type":"Conveyor"},{"x":3,"y":2,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":3,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":4,"orientation":"ROT2","type":"BranchGY"},{"x":3,"y":5,"orientation":"ROT2","type":"BranchGY"},{"x":4,"y":1,"orientation":"ROT1","type":"Conveyor"},{"x":4,"y":2,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":3,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":4,"orientation":"ROT1","type":"BranchGY"},{"x":4,"y":5,"orientation":"ROT1","type":"BranchGY"},{"x":5,"y":1,"orientation":"ID","type":"Conveyor"},{"x":5,"y":2,"orientation":"MIR","type":"BranchBR"},{"x":5,"y":3,"orientation":"ID","type":"BranchBR"},{"x":5,"y":4,"orientation":"MIR","type":"BranchGY"},{"x":5,"y":5,"orientation":"ID","type":"BranchGY"}],"start":{"x":4,"y":0,"orientation":"ID"},"end":{"x":4,"y":8,"orientation":"ID"}}}
 */
