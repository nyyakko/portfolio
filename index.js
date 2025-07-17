window.state = {
    game: null,
    audio: {
        buffer: {},
        context: null
    }
};

function showScore(score) {
    let pagebar = document.getElementById("pagebar-0d");
    let pageButtons = pagebar.children[0].children[0];

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    score.date = `${dd}/${mm}/${yyyy}`;

    let button = document.createElement("button");
    button.addEventListener("mousedown", () => playSound("sfx-click"));
    button.addEventListener("mouseover", () => {
        updateDescription(button.getAttribute("description"));
        playSound("sfx-hover");
    });

    button.classList.add("page-button");
    button.classList.add("button");
    button.classList.add("light");

    button.setAttribute("page", `${pageButtons.childElementCount}d`);
    button.setAttribute("onclick", "changePage(event)");
    button.setAttribute("description", `Score de ${score.date}, ${score.score} pontos`);

    let caret = document.createElement("div");
    caret.classList.add("button-caret");
    button.appendChild(caret);

    button.append(`Pontuação ${pageButtons.childElementCount}`);

    let page = document.createElement("div");
    page.setAttribute("id", `page-${pageButtons.childElementCount}d`);
    page.classList.add("page");
    page.classList.add("letter");

    let title = document.createElement("h2");
    title.classList.add("page-title");
    title.innerHTML = `Score ${pageButtons.childElementCount} - ${score.date}`;
    page.appendChild(title);

    let content = document.createElement("section");
    content.setAttribute("id", `page-${pageButtons.childElementCount}d-content`);
    content.classList.add("page-content");
    content.classList.add("generated");
    content.innerHTML =
        "<section>" +
            "<div>" +
                "<section>De: O Sistema</section>" +
            "</div>" +
            "<div class='separator'></div>" +
            "<div>" +
                "<section>Data:</section>" +
                `<section>${score.date}</section>` +
            "</div>" +
            "<div>" +
                "<section>Pontuação atingida:</section>" +
                `<section>${score.score}</section>` +
            "</div>" +
            "<div>" +
                "<section>Level alcançado:</section>" +
                `<section>${score.level}</section>` +
            "</div>" +
            "<div>" +
                "<section>Inimigos derrotados:</section>" +
                `<section>${score.kills}</section>` +
            "</div>" +
        "</section>"
    ;

    page.appendChild(content);

    pageButtons.appendChild(button);
    document.getElementById("tab-3-content").children[1].appendChild(page);
}

function saveScore(score) {
    let scores = [];
    if (localStorage.getItem("scores")) {
        scores = JSON.parse(localStorage.getItem("scores"));
    }
    scores.push(score);
    localStorage.setItem("scores", JSON.stringify(scores));
    showScore(score);
}

function showToast(title, message) {
    var toast = document.getElementById("toast");

    toast.children[0].innerHTML = title;
    toast.children[1].children[0].innerHTML = message;

    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

function scrambleText(element, text, intervalDelay = 45) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let scramble = new Array(text.length).fill('');

    let index = 0;
    const interval = setInterval(() => {
        for (let i = 0; i < text.length; i++) {
            if (i < index) {
                scramble[i] = text[i];
            } else {
                scramble[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
        }

        element.innerText = scramble.join('');

        if (++index > text.length) {
            clearInterval(interval);
            element.innerText = text;
        }
    }, intervalDelay);
}

async function loadSound(url) {
    return fetch(url)
        .then(res => res.arrayBuffer())
        .then(data => window.state.audio.context.decodeAudioData(data));
}

function playSound(song) {
    if (window.state.audio.buffer[song] === undefined) {
        throw new Error("Song must have been already loaded!");
    }

    if (window.state.audio.context.state === "suspended") {
        window.state.audio.context.resume();
    }

    const source = window.state.audio.context.createBufferSource();
    source.buffer = window.state.audio.buffer[song];
    source.connect(window.state.audio.context.destination);
    source.start();

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
    });
}

function updateDescription(text) {
    let description = document.getElementById("description");

    if (text !== '') {
        description.firstChild.innerHTML = text;
        description.firstChild.style.opacity = 1;
    } else {
        description.firstChild.style.opacity = 0;
    }
}

function activeTab() {
    return Object.values(document.getElementsByClassName("tab active"))[0];
}

function showDefaultTab() {
    Object.values(document.getElementsByClassName("tab-button")).forEach(button => {
        if (button.classList.contains("default")) {
            button.click();
        }
    });
}

function updateTabSubtitle(tab, text) {
    let currentTabTitle = tab.getElementsByClassName("tab-title")[0];

    if (currentTabTitle.childElementCount > 1) {
        currentTabTitle.removeChild(currentTabTitle.children[1]);
    }

    let small = document.createElement("small");
    small.innerHTML = text;
    small.classList.add("written");
    currentTabTitle.appendChild(small);
    scrambleText(small, small.innerText);
}

function showDefaultPageBar(tab) {
    Object.values(tab.getElementsByClassName("pagebar")).forEach(pagebar => {
        if (pagebar.classList.contains("default")) {
            pagebar.style.display = "flex";
            pagebar.classList.add("active");
        } else {
            pagebar.style.display = "none";
        }
    });
}

function showDefaultPage(tab) {
    Object.values(tab.getElementsByClassName("button")).forEach(button => {
        if (button.getAttribute("page") != undefined && button.classList.contains("default")) {
            button.click();
        }
    });
}

function changeTab({ currentTarget }) {
    Object.values(document.getElementsByClassName("tab")).forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
    });

    Object.values(document.getElementsByClassName("button")).forEach(button => {
        if (button.getAttribute("tab") != undefined) {
            button.classList.remove("active");
        }
    });

    Object.values(document.getElementsByClassName("skill")).forEach(skill => skill.style.opacity = 1);
    Object.values(document.getElementsByClassName("page")).forEach(page => page.style.display = "none");

    currentTarget.classList.add("active");

    let tab = document.getElementById(`tab-${currentTarget.getAttribute("tab")}`);

    tab.style.display = "block";
    tab.classList.add("active");

    let title = tab.getElementsByClassName("tab-title")[0];

    if (title.childElementCount > 1) {
        title.removeChild(title.children[1]);
    }

    scrambleText(Object.values(title.children)[0], tab.getAttribute("name"));

    showDefaultPage(tab);
    showDefaultPageBar(tab);
}

function activePage() {
    return Object.values(document.getElementsByClassName("page active"))[0];
}

function changePage({ currentTarget }) {
    Object.values(document.getElementsByClassName("page")).forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
    });

    Object.values(document.getElementsByClassName("button")).forEach(button => {
        if (button.getAttribute("page") != undefined || button.getAttribute("pageBar") != undefined) {
            button.classList.remove("active");
        }
    });

    Object.values(document.getElementsByClassName("skill")).forEach(skill => skill.style.opacity = 1);

    currentTarget.classList.add("active");

    let page = document.getElementById(`page-${currentTarget.getAttribute("page")}`);

    page.style.display = "flex";
    page.classList.add("active");

    if (!currentTarget.classList.contains("default")) {
        updateTabSubtitle(activeTab(), currentTarget.innerText);
    }
}

function changePagebar({ currentTarget }) {
    Object.values(document.getElementsByClassName("pagebar")).forEach(content => {
        content.style.display = "none";
        content.classList.remove("active");
    });

    Object.values(document.getElementsByClassName("button")).forEach(button => {
        if (button.getAttribute("page") != undefined) {
            button.classList.remove("active");
        }
    });

    let pageBar = document.getElementById(`pagebar-${currentTarget.getAttribute("pageBar")}`);

    pageBar.style.display = "flex";
    pageBar.classList.add("active");
    currentTarget.classList.add("active");

    if (!currentTarget.classList.contains("default")) {
        updateTabSubtitle(activeTab(), currentTarget.innerText);
    }
}

async function init() {
    showDefaultTab();

    window.addEventListener("visibilitychange", () => {
        if (document.hidden && window.state.game.state.running) {
            window.state.game.pause({ showMenu: false });
        }
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === 'Escape') {
            if (window.state.game.state.started == false) {
                window.state.game.start();
            } else {
                if (window.state.game.state.running == true) {
                    window.state.game.pause();
                } else {
                    window.state.game.resume();
                }
            }
        }
    });

    Object.values(document.getElementsByClassName("button")).forEach(button => {
        button.addEventListener("mouseover", () => {
            if (button.getAttribute("skill") != undefined) {
                let skill = document.getElementById(`skill-${button.getAttribute("skill")}`);
                skill.style.transform = "scale(1.1)";
            }

            if (button.getAttribute("description") != undefined) {
                updateDescription(button.getAttribute("description"));
            }

            playSound("sfx-hover");
        });

        button.addEventListener("mouseout", () => {
            if (button.getAttribute("skill") != undefined) {
                let skill = document.getElementById(`skill-${button.getAttribute("skill")}`);
                skill.style.transform = "scale(1)";
            }
        });

        button.addEventListener("mousedown", () => {
            if (button.getAttribute("skill") != undefined) {
                playSound("sfx-error");
            } else {
                playSound("sfx-click");
            }
        });
    });

    Object.values(document.getElementsByClassName("page-button")).forEach(button => {
        button.addEventListener("mouseover", () => {
            if (button.classList.contains("frontend")) {
                Object.values(document.getElementsByClassName("skill")).forEach(skill => {
                    if (skill.classList.contains("backend")) {
                        skill.style.opacity = 0.5;
                    } else {
                        skill.style.opacity = 1;
                    }
                });
            }
            if (button.classList.contains("backend")) {
                Object.values(document.getElementsByClassName("skill")).forEach(skill => {
                    if (skill.classList.contains("frontend")) {
                        skill.style.opacity = 0.5;
                    } else {
                        skill.style.opacity = 1;
                    }
                });
            }
        });
    });

    window.state.audio.context = new AudioContext();

    window.state.audio.buffer["sfx-hover"] = await loadSound("assets/sfx/hover.mp3");
    window.state.audio.buffer["sfx-click"] = await loadSound("assets/sfx/click.mp3");
    window.state.audio.buffer["sfx-error"] = await loadSound("assets/sfx/error.mp3");
    window.state.audio.buffer["sfx-enter"] = await loadSound("assets/sfx/enter.mp3");

    if (localStorage.getItem("scores")) {
        JSON.parse(localStorage.getItem("scores")).forEach(score => showScore(score));
        document.getElementById("tab-button-3").style.visibility = "visible";
    }
}

