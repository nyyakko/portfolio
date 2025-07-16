window.state = {
    game: null,
    audio: {
        buffer: {},
        context: null
    }
};

function showToast(toast) {
    var toast = document.getElementById(toast);
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
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
    window.state.audio.context = new AudioContext();

    window.state.audio.buffer["sfx-hover"] = await loadSound("assets/sfx/hover.mp3");
    window.state.audio.buffer["sfx-click"] = await loadSound("assets/sfx/click.mp3");
    window.state.audio.buffer["sfx-error"] = await loadSound("assets/sfx/error.mp3");
    window.state.audio.buffer["sfx-enter"] = await loadSound("assets/sfx/enter.mp3");

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
            if (window.state.audio.context.state === "suspended") {
                window.state.audio.context.resume();
            }
            const source = window.state.audio.context.createBufferSource();
            source.buffer = window.state.audio.buffer["sfx-hover"];
            source.connect(window.state.audio.context.destination);
            source.start();

            if (button.getAttribute("skill") != undefined) {
                let skill = document.getElementById(`skill-${button.getAttribute("skill")}`);
                skill.style.transform = "scale(1.1)";
            }

            if (button.getAttribute("description") != undefined) {
                updateDescription(button.getAttribute("description"));
            }
        });

        button.addEventListener("mouseout", () => {
            if (button.getAttribute("skill") != undefined) {
                let skill = document.getElementById(`skill-${button.getAttribute("skill")}`);
                skill.style.transform = "scale(1)";
            }
        });

        button.addEventListener("mousedown", () => {
            if (window.state.audio.context.state === "suspended") {
                window.state.audio.context.resume();
            }

            const source = window.state.audio.context.createBufferSource();

            if (button.getAttribute("skill") != undefined) {
                source.buffer = window.state.audio.buffer["sfx-error"];
            } else {
                source.buffer = window.state.audio.buffer["sfx-click"];
            }

            source.connect(window.state.audio.context.destination);
            source.start();
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

    showDefaultTab();
}

