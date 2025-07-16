export class LibEngine {

    context = {
        canvas: null,
        canvasContext: null,
        frameHandler: null,
        keypressStack: {},
        textures: {},
        mouse: {
            position: {}
        },
    }

    constructor() {
        this.context.canvas = document.getElementById("canvas");
        this.context.canvasContext = this.context.canvas.getContext("2d");

        addEventListener("keydown", (event) => {
            if (event.key.length == 1) {
                this.context.keypressStack[event.key.toUpperCase()] = parseInt(event.key.toUpperCase().charCodeAt(0));
            } else switch (event.key) {
                case "Shift": {
                    this.context.keypressStack[event.key.toUpperCase()] = LibEngine.KEY_SPACE;
                }
            }
        });

        addEventListener("keyup", (event) => {
            delete this.context.keypressStack[event.key.toUpperCase()];
        });

        addEventListener("mousemove", (event) => {
            const bound = this.context.canvas.getBoundingClientRect();
            this.context.mouse.position = {
                x: event.clientX - bound.left,
                y: event.clientY - bound.top
            }
        });
    }

    initWindow = (width, height) => {
        this.context.canvas.width = width;
        this.context.canvas.height = height;
    }

    clearBackground = (color) => {
        this.context.canvasContext.fillStyle = color;
        this.context.canvasContext.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }

    drawText = (text, posX, posY, fontSize, color) => {
        this.context.canvasContext.fillStyle = color;
        this.context.canvasContext.font = `${fontSize}px 'Noto Sans'`;
        this.context.canvasContext.fillText(text, posX, posY);
    }

    measureText = (text, fontSize) => {
        this.context.canvasContext.font = `${fontSize}px serif`;
        return this.context.canvasContext.measureText(text).width;
    }

    drawCircle = (centerX, centerY, radius, color, thickness = 1) => {
        this.context.canvasContext.beginPath();
        this.context.canvasContext.lineWidth = thickness;
        this.context.canvasContext.fillStyle = color;
        this.context.canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.context.canvasContext.fill();
    }

    drawCircleContour = (centerX, centerY, radius, color, thickness = 1) => {
        this.context.canvasContext.beginPath();
        this.context.canvasContext.lineWidth = thickness;
        this.context.canvasContext.strokeStyle = color;
        this.context.canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.context.canvasContext.stroke();
    }

    isKeyPressed = (key) => {
        return Object.values(this.context.keypressStack).includes(key);
    }

    drawImage = (posX, posY, source, resX = undefined, resY = undefined, angle = undefined) => {
        if (!Object.keys(this.context.textures).includes(source)) {
            let image = new Image();

            this.context.textures[source] = {
                image: image,
                loaded: false
            };

            image.src = source;
            image.onload = () => this.context.textures[source].loaded = true;
        } else {
            if (angle) {
                this.context.canvasContext.save();

                this.context.canvasContext.translate(posX + resX / 2, posY + resY / 2);
                this.context.canvasContext.rotate(angle);

                this.context.canvasContext.drawImage(this.context.textures[source].image, -resX / 2, -resY / 2, resX, resY);

            } else {
                if (resX !== undefined && resY !== undefined) {
                    this.context.canvasContext.drawImage(this.context.textures[source].image, posX, posY, resX, resY);
                } else {
                    this.context.canvasContext.drawImage(this.context.textures[source].image, posX, posY);
                }
            }

            this.context.canvasContext.restore();
        }
    }

    getMousePosition = () => {
        return this.context.mouse.position;
    }

    clearEvents = () => {
        this.context.keypressStack = {};
    }

    playSound = (name, offset = 0, loop = { start: undefined, end: undefined }) => {
        if (window.state.audio.buffer[name] === undefined) {
            throw new Error("Song must have been already loaded!");
        }

        if (window.state.audio.context.state === "suspended") {
            window.state.audio.context.resume();
        }

        const source = window.state.audio.context.createBufferSource();
        source.buffer = window.state.audio.buffer[name];

        if (loop.start != undefined && loop.end != undefined) {
            source.loop = true;
            source.loopStart = loop.start;
            source.loopEnd = loop.end;
        }

        source.connect(window.state.audio.context.destination);
        source.start(0, offset);

        return ({
            source: source,
            filters: {},
            bindFilters: function () {
                this.source.disconnect();
                let filters = Object.values(this.filters);
                let result = filters.reduce((song, filter) => song.connect(filter), this.source);
                result.connect(window.state.audio.context.destination);
            },
            unbindFilters: function() {
                this.source.disconnect();
                let filters = Object.values(this.filters);
                filters.forEach(filter => filter.disconnect());
                this.source.connect(window.state.audio.context.destination);
            }
        })
    }

    loadSound = async (url) => {
        return fetch(url)
            .then(res => res.arrayBuffer())
            .then(data => window.state.audio.context.decodeAudioData(data));
    }

    getCurrentTime = () => {
        return performance.now();
    }

    checkCollisionCircles = (circle1, radiusA, circle2, radiusB) => {
        let distance_x = circle1.x - circle2.x;
        let distance_y = circle1.y - circle2.y;
        let radiiSum  = radiusA + radiusB;
        return distance_x * distance_x + distance_y * distance_y <= radiiSum * radiiSum;
    }

    drawLine = (x1, y1, x2, y2, color, thickness) => {
        this.context.canvasContext.strokeStyle = color;
        this.context.canvasContext.lineWidth = thickness;
        this.context.canvasContext.beginPath();
        this.context.canvasContext.moveTo(x1, y1);
        this.context.canvasContext.lineTo(x2, y2);
        this.context.canvasContext.stroke();
    }

    // Alphanumeric keys
    static KEY_APOSTROPHE      = 39;       // Key: '
    static KEY_COMMA           = 44;       // Key: ,
    static KEY_MINUS           = 45;       // Key: -
    static KEY_PERIOD          = 46;       // Key: .
    static KEY_SLASH           = 47;       // Key: /
    static KEY_ZERO            = 48;       // Key: 0
    static KEY_ONE             = 49;       // Key: 1
    static KEY_TWO             = 50;       // Key: 2
    static KEY_THREE           = 51;       // Key: 3
    static KEY_FOUR            = 52;       // Key: 4
    static KEY_FIVE            = 53;       // Key: 5
    static KEY_SIX             = 54;       // Key: 6
    static KEY_SEVEN           = 55;       // Key: 7
    static KEY_EIGHT           = 56;       // Key: 8
    static KEY_NINE            = 57;       // Key: 9
    static KEY_SEMICOLON       = 59;       // Key: ;
    static KEY_EQUAL           = 61;       // Key: =
    static KEY_A               = 65;       // Key: A | a
    static KEY_B               = 66;       // Key: B | b
    static KEY_C               = 67;       // Key: C | c
    static KEY_D               = 68;       // Key: D | d
    static KEY_E               = 69;       // Key: E | e
    static KEY_F               = 70;       // Key: F | f
    static KEY_G               = 71;       // Key: G | g
    static KEY_H               = 72;       // Key: H | h
    static KEY_I               = 73;       // Key: I | i
    static KEY_J               = 74;       // Key: J | j
    static KEY_K               = 75;       // Key: K | k
    static KEY_L               = 76;       // Key: L | l
    static KEY_M               = 77;       // Key: M | m
    static KEY_N               = 78;       // Key: N | n
    static KEY_O               = 79;       // Key: O | o
    static KEY_P               = 80;       // Key: P | p
    static KEY_Q               = 81;       // Key: Q | q
    static KEY_R               = 82;       // Key: R | r
    static KEY_S               = 83;       // Key: S | s
    static KEY_T               = 84;       // Key: T | t
    static KEY_U               = 85;       // Key: U | u
    static KEY_V               = 86;       // Key: V | v
    static KEY_W               = 87;       // Key: W | w
    static KEY_X               = 88;       // Key: X | x
    static KEY_Y               = 89;       // Key: Y | y
    static KEY_Z               = 90;       // Key: Z | z
    static KEY_LEFT_BRACKET    = 91;       // Key: [
    static KEY_BACKSLASH       = 92;       // Key: '\'
    static KEY_RIGHT_BRACKET   = 93;       // Key: ]
    static KEY_GRAVE           = 96;       // Key: `

    // Function keys
    static KEY_SPACE           = 32;       // Key: Space
    static KEY_ESCAPE          = 256;      // Key: Esc
    static KEY_ENTER           = 257;      // Key: Enter
    static KEY_TAB             = 258;      // Key: Tab
    static KEY_BACKSPACE       = 259;      // Key: Backspace
    static KEY_INSERT          = 260;      // Key: Ins
    static KEY_DELETE          = 261;      // Key: Del
    static KEY_RIGHT           = 262;      // Key: Cursor right
    static KEY_LEFT            = 263;      // Key: Cursor left
    static KEY_DOWN            = 264;      // Key: Cursor down
    static KEY_UP              = 265;      // Key: Cursor up
    static KEY_PAGE_UP         = 266;      // Key: Page up
    static KEY_PAGE_DOWN       = 267;      // Key: Page down
    static KEY_HOME            = 268;      // Key: Home
    static KEY_END             = 269;      // Key: End
    static KEY_CAPS_LOCK       = 280;      // Key: Caps lock
    static KEY_SCROLL_LOCK     = 281;      // Key: Scroll down
    static KEY_NUM_LOCK        = 282;      // Key: Num lock
    static KEY_PRINT_SCREEN    = 283;      // Key: Print screen
    static KEY_PAUSE           = 284;      // Key: Pause
    static KEY_F1              = 290;      // Key: F1
    static KEY_F2              = 291;      // Key: F2
    static KEY_F3              = 292;      // Key: F3
    static KEY_F4              = 293;      // Key: F4
    static KEY_F5              = 294;      // Key: F5
    static KEY_F6              = 295;      // Key: F6
    static KEY_F7              = 296;      // Key: F7
    static KEY_F8              = 297;      // Key: F8
    static KEY_F9              = 298;      // Key: F9
    static KEY_F10             = 299;      // Key: F10
    static KEY_F11             = 300;      // Key: F11
    static KEY_F12             = 301;      // Key: F12
    static KEY_LEFT_SHIFT      = 340;      // Key: Shift left
    static KEY_LEFT_CONTROL    = 341;      // Key: Control left
    static KEY_LEFT_ALT        = 342;      // Key: Alt left
    static KEY_LEFT_SUPER      = 343;      // Key: Super left
    static KEY_RIGHT_SHIFT     = 344;      // Key: Shift right
    static KEY_RIGHT_CONTROL   = 345;      // Key: Control right
    static KEY_RIGHT_ALT       = 346;      // Key: Alt right
    static KEY_RIGHT_SUPER     = 347;      // Key: Super right
    static KEY_KB_MENU         = 348;      // Key: KB menu

    // Keypad keys
    static KEY_KP_0            = 320;      // Key: Keypad 0
    static KEY_KP_1            = 321;      // Key: Keypad 1
    static KEY_KP_2            = 322;      // Key: Keypad 2
    static KEY_KP_3            = 323;      // Key: Keypad 3
    static KEY_KP_4            = 324;      // Key: Keypad 4
    static KEY_KP_5            = 325;      // Key: Keypad 5
    static KEY_KP_6            = 326;      // Key: Keypad 6
    static KEY_KP_7            = 327;      // Key: Keypad 7
    static KEY_KP_8            = 328;      // Key: Keypad 8
    static KEY_KP_9            = 329;      // Key: Keypad 9
    static KEY_KP_DECIMAL      = 330;      // Key: Keypad .
    static KEY_KP_DIVIDE       = 331;      // Key: Keypad /
    static KEY_KP_MULTIPLY     = 332;      // Key: Keypad *
    static KEY_KP_SUBTRACT     = 333;      // Key: Keypad -
    static KEY_KP_ADD          = 334;      // Key: Keypad +
    static KEY_KP_ENTER        = 335;      // Key: Keypad Enter
    static KEY_KP_EQUAL        = 336;      // Key: Keypad =
}
