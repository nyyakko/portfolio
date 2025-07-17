import { LibEngine } from "./Engine.js";

const MAX_LEVEL_COUNT = 20;

/*
FIXME:
    performance disso é questionável pelo fato de eu estar
    realizando todos os algoritmos de maneira linear.
*/

class Entity {
    constructor(
        position = { x: 0, y: 0 },
        velocity = { x: 0, y: 0 },
        health = 1,
        radius = 0,
        lifetime = null
    ) {
        this.radius = radius;
        this.position = position;
        this.velocity = velocity;
        this.health = health;
        this.lifetime = lifetime;
        this.spawntime = performance.now();
    }
}

class EnergyShield extends Entity {
    static RADIUS = 80;
    static MAX_LIFE_TIME = 1500;

    owner = null

    constructor(owner) {
        super();
        super.radius = 0;
        this.owner = owner;
        this.lifetime = EnergyShock.MAX_LIFE_TIME + performance.now();
    }
}

class EnergyShock extends Entity {
    static RADIUS = 150;
    static MAX_LIFE_TIME = 1500;

    owner = null

    constructor(owner) {
        super();
        super.radius = 0;
        this.owner = owner;
        this.lifetime = EnergyShock.MAX_LIFE_TIME + performance.now();
    }
}

class Player extends Entity {
    static RADIUS = 96;
    static MAX_VELOCITY = 4;

    facingAngle = 0;
    lastShotTime = 0;
    lastShotTakenTime = 0;
    canBeShot = true;

    constructor () {
        super();
        super.radius = Player.RADIUS;
    }
}

class Bullet extends Entity {
    static RADIUS = 15;
    static MAX_LIFE_TIME = 6000;

    owner = null

    constructor(owner) {
        super();
        super.radius = Bullet.RADIUS;
        this.owner = owner;
        this.lifetime = Bullet.MAX_LIFE_TIME + performance.now();
    }
}

class Enemy extends Entity {
    static MAX_VELOCITY = 1;

    lastShotTime = 0;
    lastShotTakenTime = 0;

    constructor(position, velocity, health, radius) {
        super();
        super.position = position;
        super.velocity = velocity;
        super.health = health;
        super.radius = radius;
    }
}

class Core extends Enemy {
    static RADIUS = 30;

    constructor(position, velocity, health = 2) {
        super();
        super.position = position;
        super.velocity = velocity;
        super.health = health;
        super.radius = Core.RADIUS;
    }
}

class Follower extends Enemy {
    static RADIUS = 75;

    facingAngle = 0;

    constructor(position, velocity, health = 4) {
        super();
        super.position = position;
        super.velocity = velocity;
        super.health = health;
        super.radius = Follower.RADIUS;
    }
}

export class Game {
    engine = null;

    state = {
        started: false,
        running: false,
        song: null,
        canChangeLevel: true,
        level: 0,
        score: 0,
        kills: 0,
        trollingFactor: 0,
        entities: []
    }

    constructor () {
        this.engine = new LibEngine();
        this.engine.initWindow(window.innerWidth, window.innerHeight);
        globalThis.loadSound(`assets/sfx/player_shot.mp3`).then(shot => window.state.audio.buffer["sfx-player_shot"] = shot);
        globalThis.loadSound(`assets/sfx/player_damage.mp3`).then(shot => window.state.audio.buffer["sfx-player_damage"] = shot);
        globalThis.loadSound(`assets/sfx/player_death.mp3`).then(shot => window.state.audio.buffer["sfx-player_death"] = shot);
        globalThis.loadSound(`assets/sfx/enemy_shot.mp3`).then(shot => window.state.audio.buffer["sfx-enemy_shot"] = shot);
    }

    makePlayer = () => {
        let player = new Player();
        player.radius = Player.RADIUS;
        player.health = 3;
        player.position = {
            x: (window.innerWidth - Player.RADIUS)/2,
            y: (window.innerHeight - Player.RADIUS)/2
        }
        return player;
    }

    start = () => {
        this.state.started = true;
        this.state.running = true;

        this.state.entities.push(this.makePlayer());

        if (this.state.song == null) {
            this.playSong();
        } else {
            this.unmuffleSong();
        }

        document.getElementById("main-menu").style.display = "none";
        document.getElementById("canvas").style.display = "block";
        document.getElementById("begin-hacking").style.opacity = 1;
        setTimeout(() => {
            document.getElementById("begin-hacking").style.opacity = 0;
        }, 2000);

        this.loop();
    }

    loop = () => {
        const nextFrame = (_) => {
            if (this.state.running == true) {
                this.nextFrame();
                window.requestAnimationFrame(nextFrame);
            }
        };
        window.requestAnimationFrame(nextFrame);
    }

    stop = ({ failed, finished } = { failed: false, finished: false }) => {
        let scoreTabButton = document.getElementById("tab-button-3");
        scoreTabButton.style.visibility = "visible";

        globalThis.saveScore({
            score: this.state.score,
            level: this.state.level,
            kills: this.state.kills
        });

        if (failed) {
            document.getElementById("hacking-failed").style.opacity = 1;
            setTimeout(() => {
                this.muffleSong();
                document.getElementById("hacking-failed").style.opacity = 0;
                document.getElementById("main-menu").style.display = "flex";
                document.getElementById("canvas").style.display = "none";
            }, 2000);
        }

        if (finished) {
            document.getElementById("hacking-complete").style.opacity = 1;
            setTimeout(() => {
                this.muffleSong();
                globalThis.showToast("The [E]nd of YoRHa", "Parabéns por finalizar o minigame!");
                document.getElementById("hacking-complete").style.opacity = 0;
                document.getElementById("main-menu").style.display = "flex";
                document.getElementById("canvas").style.display = "none";
            }, 4000);
        }

        this.state.started = false;
        this.state.running = false;
        this.state.canChangeLevel = true;
        this.state.level = 0;
        this.state.score = 0;
        this.state.kills = 0;
        this.state.trollingFactor = 0;
        this.state.entities = [];

        this.engine.clearEvents();
    }

    resume = () => {
        this.state.running = true;

        this.loop();

        if (this.state.song) {
            this.unmuffleSong();
        } else {
            this.playSong();
        }

        document.getElementById("canvas").style.display = "block";
        document.getElementById("main-menu").style.display = "none";
        document.getElementById("system-interference").style.opacity = 0;
    }

    pause = ({ showMenu } = { showMenu: true }) => {
        this.state.running = false;
        this.state.entities[0].velocity = { x: 0, y: 0 };

        this.engine.clearEvents();

        if (this.state.song) {
            this.muffleSong();
        }

        if (showMenu) {
            document.getElementById("main-menu").style.display = "flex";
            document.getElementById("canvas").style.display = "none";
        } else {
            document.getElementById("system-interference").style.opacity = 1;
        }
    }

    playSong = async () => {
        const SONGS = [
            { name: "a_beautiful_song-8bit", real: "A beatiful song" },
            { name: "amusement_park-8bit", real: "Amusement Park" },
            { name: "birth_of_a_wish-8bit", real: "Birth of a Wish" },
            { name: "city_ruins-8bit", real: "City Ruins" },
            { name: "dark_colossus_kaiju-8bit", real: "Dark Colossus" },
            { name: "dependent_weakling-8bit", real: "Dependent Weakling" },
            { name: "end_of_the_unknown-8bit", real: "End of the Unknown" },
            { name: "forest_kingdom-8bit", real: "Forest Kingdom" },
            { name: "memories_of_dust-8bit", real: "Memories of Dust" },
            { name: "possessed_by_disease-8bit", real: "Possessed by Disease" },
            { name: "song_of_the_ancients_atonement-8bit", real: "Song of the Ancients - Atonement" },
            { name: "the_song_of_the_end-8bit", real: "The song of the End" },
            { name: "the_tower-8bit", real: "The Tower" },
            { name: "war_and_war-8bit", real: "War and War" },
            { name: "weight_of_the_world-8bit", real: "Weight of the World" },
            { name: "wretched_weaponry-8bit", real: "Wretched Weaponry" },
        ];

        let index = Math.floor(Math.random() * SONGS.length);
        let songBuffer = await globalThis.loadSound(`assets/songs/${SONGS[index].name}.mp3`);

        window.state.audio.buffer[SONGS[index].name] = songBuffer

        this.state.song = globalThis.playSound(SONGS[index].name);
        this.state.song.source.onended = () => {
            this.state.song = null;
            if (this.state.running) {
                this.playSong();
            }
        };

        globalThis.showToast("Tocando agora", `NieR: Automata OST - ${SONGS[index].real} - 8 Bit`);
    }

    muffleSong = () => {
        if (this.state.song.filters["gain"] === undefined) {
            this.state.song.filters["gain"] = window.state.audio.context.createGain();
        }
        if (this.state.song.filters["lowpass"] === undefined) {
            this.state.song.filters["lowpass"] = window.state.audio.context.createBiquadFilter();
            this.state.song.filters["lowpass"].type = "lowpass";
        }
        this.state.song.filters["gain"].gain.setValueAtTime(0.5, window.state.audio.context.currentTime);
        this.state.song.bindFilters();
    }

    unmuffleSong = () => {
        this.state.song.unbindFilters();
    }

    removeDeadEntities = () => {
        this.state.entities = this.state.entities.filter(entity =>
            (entity.lifetime == null && entity.health >= 1) || entity.lifetime > this.engine.getCurrentTime()
        );
    }

    shootTarget = (shooter, target) => {
        let bullet = new Bullet(shooter);
        let bulletVelocity = 1;

        switch (true) {
            case shooter instanceof Player: {
                bullet.position = {
                    x: Math.cos(shooter.facingAngle) * 50 + (shooter.position.x + shooter.radius/2),
                    y: Math.sin(shooter.facingAngle) * 50 + (shooter.position.y + shooter.radius/2)
                }
                bulletVelocity = 3 * Player.MAX_VELOCITY;
                globalThis.playSound("sfx-player_shot");
                break;
            }
            case shooter instanceof Follower: {
                bullet.position = {
                    x: Math.cos(shooter.facingAngle) * 50 + (shooter.position.x + shooter.radius/2),
                    y: Math.sin(shooter.facingAngle) * 50 + (shooter.position.y + shooter.radius/2)
                }
                bulletVelocity = 4 * Enemy.MAX_VELOCITY;
                globalThis.playSound("sfx-enemy_shot");
                break;
            }
        }

        const { x: targetX, y: targetY } = target;
        const dx = targetX - (shooter.position.x + shooter.radius/2);
        const dy = targetY - (shooter.position.y + shooter.radius/2);
        const angle = Math.atan2(dy, dx);

        bullet.velocity = {
            x: bulletVelocity * Math.cos(angle),
            y: bulletVelocity * Math.sin(angle)
        };

        this.state.entities.push(bullet);
    }

    updateEnemy = (enemy) => {
        let bullets =
            this.state.entities
                .filter(entity => entity instanceof Bullet)
                .filter(bullet => bullet.owner instanceof Player);
        bullets.forEach(bullet => {
            if (enemy instanceof Core && this.state.entities.filter(entity => entity instanceof Enemy).length > 1) {
                return;
            }

            let posA = bullet.position;
            let posB = { x: enemy.position.x + enemy.radius/2 , y: enemy.position.y + enemy.radius/2 };
            if (!this.engine.checkCollisionCircles(posA, bullet.radius, posB, enemy.radius/4)) {
                return;
            }

            bullet.lifetime = 0;

            const cooldown = 50;
            const currentTime = this.engine.getCurrentTime();
            if (currentTime - enemy.lastShotTakenTime >= cooldown) {
                enemy.lastShotTakenTime = currentTime;
                enemy.health -= 1;
            }
            if (enemy.health == 0) {
                if (enemy instanceof Core) this.state.score += 15;
                if (enemy instanceof Follower) this.state.score += 5;
                this.state.kills += 1;
            }
        });

        switch (true) {
            case enemy instanceof Core: {
                if ((enemy.position.x >= (window.innerWidth - enemy.radius)) || (enemy.position.x <= enemy.radius)) enemy.velocity.x *= -1.0;
                if ((enemy.position.y >= (window.innerHeight - enemy.radius)) || (enemy.position.y <= enemy.radius)) enemy.velocity.y *= -1.0;
                break;
            }
            case enemy instanceof Follower: {
                let player = this.state.entities[0];

                const dx = (player.position.x + Player.RADIUS/2) - (enemy.position.x + enemy.radius/2);
                const dy = (player.position.y + Player.RADIUS/2) - (enemy.position.y + enemy.radius/2);
                const angle = Math.atan2(dy, dx);

                enemy.facingAngle = angle;
                enemy.velocity = {
                    x: Enemy.MAX_VELOCITY * Math.cos(angle),
                    y: Enemy.MAX_VELOCITY * Math.sin(angle)
                }

                const cooldown = 1000;
                const currentTime = this.engine.getCurrentTime();
                if (currentTime - enemy.lastShotTime >= cooldown) {
                    enemy.lastShotTime = currentTime;
                    this.shootTarget(enemy, player.position);
                }
                break;
            }
        }
    }

    updateEnergyShock = (energyShock) => {
        let bullets =
            this.state.entities
                .filter(entity => entity instanceof Bullet)
                .filter(bullet => bullet.owner instanceof Enemy);
        bullets.forEach(bullet => {
            if (this.engine.checkCollisionCircles(bullet.position, bullet.radius, energyShock.position, energyShock.radius)) {
                bullet.lifetime = 0;
                bullet.owner.health -= 1;
            }
        });

        const elapsed = performance.now() - energyShock.spawntime;
        const t = Math.min(elapsed / EnergyShock.MAX_LIFE_TIME, 1);
        energyShock.radius = EnergyShock.RADIUS * (1 - Math.pow(1 - t, 5));
        energyShock.position = {
            x: energyShock.owner.position.x + Player.RADIUS/2,
            y: energyShock.owner.position.y + Player.RADIUS/2
        };
    }

    updateEnergyShield = (energyShield) => {
        let bullets =
            this.state.entities
                .filter(entity => entity instanceof Bullet)
                .filter(bullet => bullet.owner instanceof Enemy);
        bullets.forEach(bullet => {
            if (this.engine.checkCollisionCircles(bullet.position, bullet.radius, energyShield.position, energyShield.radius)) {
                bullet.lifetime = 0;
            }
        });

        const elapsed = performance.now() - energyShield.spawntime;
        const t = Math.min(elapsed / EnergyShield.MAX_LIFE_TIME, 1);
        energyShield.radius = EnergyShield.RADIUS * (1 - Math.pow(1 - t, 5));
        energyShield.position = {
            x: energyShield.owner.position.x + Player.RADIUS/2,
            y: energyShield.owner.position.y + Player.RADIUS/2
        };
    }

    updatePlayer = (player) => {
        let bullets =
            this.state.entities
                .filter(entity => entity instanceof Bullet)
                .filter(bullet => bullet.owner instanceof Enemy);
        bullets.forEach(bullet => {
            let posA = bullet.position;
            let posB = { x: player.position.x + player.radius/2 , y: player.position.y + player.radius/2 };
            if (!this.engine.checkCollisionCircles(posA, bullet.radius, posB, player.radius/4)) {
                return;
            }

            bullet.lifetime = 0;

            const cooldown = 1000;
            const currentTime = this.engine.getCurrentTime();
            if (currentTime - player.lastShotTakenTime >= cooldown && player.canBeShot) {
                player.lastShotTakenTime = currentTime;
                player.health -= player.health > 0;
                player.canBeShot = false;
                if (player.health >= 1) {
                    globalThis.playSound("sfx-player_damage");
                } else {
                    globalThis.playSound("sfx-player_death");
                }
                this.state.entities.push(new EnergyShock(player));
                this.state.entities.push(new EnergyShield(player));
                setTimeout(() => player.canBeShot = true, 2500);
            }
        });
    }

    updateBullet = (bullet) => {
        let bullets =
            this.state.entities
                .filter(entity => entity instanceof Bullet)
                .filter(neighbor => bullet != neighbor);
        bullets.forEach(neighbor => {
            if (bullet.owner instanceof Enemy && neighbor.owner instanceof Enemy) {
                return;
            }

            if (!this.engine.checkCollisionCircles(neighbor.position, neighbor.radius, bullet.position, bullet.radius)) {
                return
            }

            neighbor.lifetime = 0;
            bullet.lifetime = 0;
        });
    }

    updateEntities = () => {
        this.removeDeadEntities();
        this.state.entities.forEach(entity => {
            if (entity instanceof Enemy) this.updateEnemy(entity);
            if (entity instanceof Player) this.updatePlayer(entity);
            if (entity instanceof Bullet) this.updateBullet(entity);
            if (entity instanceof EnergyShock) this.updateEnergyShock(entity);
            if (entity instanceof EnergyShield) this.updateEnergyShield(entity);
            entity.position.x += entity.velocity.x;
            entity.position.y += entity.velocity.y;
        });
    }

    drawEntities = () => {
        const { x: mouseX, y: mouseY } = this.engine.getMousePosition();
        this.state.entities.forEach(entity => {
            switch (true) {
                case entity instanceof Player: {
                    const dx = mouseX - (entity.position.x + entity.radius/2);
                    const dy = mouseY - (entity.position.y + entity.radius/2);
                    const angle = Math.atan2(dy, dx);

                    entity.facingAngle = angle;

                    let texture = "";

                    if (entity.health == 3) {
                        texture = "assets/images/player/3-health.png";
                    } else if (entity.health == 2) {
                        texture = "assets/images/player/2-health.png";
                    } else if (entity.health == 1) {
                        texture = "assets/images/player/1-health.png";
                    }

                    this.engine.drawImage(entity.position.x, entity.position.y, texture, Player.RADIUS, Player.RADIUS, angle + Math.PI/2);
                    break;
                }
                case entity instanceof EnergyShock: {
                    this.engine.drawCircleContour(entity.position.x, entity.position.y, entity.radius, "white", 2);
                    break;
                }
                case entity instanceof EnergyShield: {
                    this.engine.drawCircleContour(entity.position.x, entity.position.y, entity.radius, "#4d493e", 2);
                    break;
                }
                case entity instanceof Bullet: {
                    if (entity.owner instanceof Player) {
                        this.engine.drawCircle(entity.position.x, entity.position.y, entity.radius - 5, "white");
                    } else {
                        this.engine.drawCircle(entity.position.x, entity.position.y, entity.radius, "orange");
                    }
                    break;
                }
                case entity instanceof Enemy: {
                    switch (true) {
                        case entity instanceof Core: {
                            this.engine.drawCircle(entity.position.x, entity.position.y, entity.radius, "#3e3d36");
                            break;
                        }
                        case entity instanceof Follower: {
                            let texture = "assets/images/enemies/follower.png";
                            this.engine.drawImage(entity.position.x, entity.position.y, texture, entity.radius, entity.radius, entity.facingAngle + Math.PI/2);
                            break;
                        }
                    }
                    break;
                }
            }
        });
    }

    getRandomSpawnPosition = (radius) => {
        return {
            x: random(radius, window.innerWidth - radius),
            y: random(radius, window.innerHeight - radius)
        };
    };

    nextLevel = async () => {
        this.state.canChangeLevel = false;
        this.state.level += 1;

        this.state.entities = this.state.entities.filter(entity => entity instanceof Player);
        let player = this.state.entities[0];
        player.canBeShot = false;
        setTimeout(() => player.canBeShot = true, 2000);

        if (this.state.level > 1) {
            document.getElementById("hacking-level-complete").style.opacity = 1;
            await sleep(4000);
            document.getElementById("hacking-level-complete").style.opacity = 0;
        }

        let enemies = Array.from({ length: random(2, 6) }, () => {
            return new Follower(this.getRandomSpawnPosition(Follower.RADIUS));
        });

        this.state.trollingFactor = random(0, 4);

        enemies.push(new Core(this.getRandomSpawnPosition(Core.RADIUS), { x: random(1, 10), y: random(1, 10) }));
        enemies.forEach(enemy => this.state.entities.push(enemy));

        this.state.canChangeLevel = true;
    }

    nextFrame = () => {
        this.engine.clearBackground("#c8c2aa");

        for (let x = 0; x <= window.innerWidth; x += 50) this.engine.drawLine(x, 0, x, window.innerHeight, "#ccc", 1);
        for (let y = 0; y <= window.innerHeight; y += 50) this.engine.drawLine(0, y, window.innerWidth, y, "#ccc", 1);

        this.engine.drawText(`Level: ${this.state.level} / ${MAX_LEVEL_COUNT}`, 32 + 16, 32 + 16, 32, "#4d493e");
        this.engine.drawText(`Score: ${this.state.score}`, 32 + 16, 32 + 48, 32, "#4d493e");

        this.updateEntities();
        this.drawEntities();

        let player = this.state.entities[0];

        if (this.engine.isKeyPressed(LibEngine.KEY_W) || this.engine.isKeyPressed(LibEngine.KEY_S)) {
            player.velocity.y = this.engine.isKeyPressed(LibEngine.KEY_W) ? -Player.MAX_VELOCITY : Player.MAX_VELOCITY;
        } else {
            player.velocity.y = 0;
        }

        if (this.engine.isKeyPressed(LibEngine.KEY_A) || this.engine.isKeyPressed(LibEngine.KEY_D)) {
            player.velocity.x = this.engine.isKeyPressed(LibEngine.KEY_A) ? -Player.MAX_VELOCITY : Player.MAX_VELOCITY;
        } else {
            player.velocity.x = 0;
        }

        if (this.engine.isKeyPressed(LibEngine.KEY_SPACE)) {
            const cooldown = 150;
            const currentTime = this.engine.getCurrentTime();
            if (currentTime - player.lastShotTime >= cooldown) {
                player.lastShotTime = currentTime;
                this.shootTarget(player, this.engine.getMousePosition());
            }
        }

        let enemyCount = this.state.entities.filter(entity => entity instanceof Enemy).length;
        let hasEnemies = enemyCount >= 1;

        if (enemyCount == 1 && this.state.trollingFactor > 0) {
            this.state.trollingFactor -= 1;
            let enemies = Array.from({ length: random(1, 3) }, () => {
                return new Follower(this.getRandomSpawnPosition(Follower.RADIUS));
            });
            enemies.forEach(enemy => this.state.entities.push(enemy));
        }

        if (!hasEnemies && this.state.canChangeLevel) {
            if (this.state.level <= MAX_LEVEL_COUNT) {
                this.nextLevel();
            } else {
                this.stop({ finished: true });
            }
        }

        if (player.health == 0) {
            this.stop({ failed: true });
        }
    }
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
