class Game {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.baseHeight = 720;
        this.ratio = this.height / this.baseHeight;
        this.background = new Background(this);
        this.player = new Player(this);
        this.sound = new AudioControl();
        this.obstacles;
        this.numberOfObstacles = 25;
        this.debug = true;

        this.gravity;
        this.speed;
        this.minSpeed;
        this.maxSpeed;
        this.score;
        this.gameOver;
        this.bottomMargin;
        this.timer;
        this.message1;
        this.message2;
        this.smallFont;
        this.largeFont;
        this.eventTimer = 0;
        this.eventInterval = 150;
        this.eventUpdate = false;
        this.touchStartX;
        this.swipeDistance = 50;
        this.debug = false;
        this.playing = false;
        this.firstFrame = true;

        this.resize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', e => {
            this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
        });

        // mouse controls
        this.canvas.addEventListener('mousedown', e => {
            this.playing = true;
            this.player.flap();
        });
        this.canvas.addEventListener('mouseup', e => {
            setTimeout(() => {
                this.player.wingsUp();
            }, 50);
        });
        // keyboard controls

        window.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 'p') this.playing = !this.playing;
            else {
                this.playing = true;
                if (e.key === ' ' || e.key === 'Enter') this.player.flap();
                if (e.key === 'Shift' || e.key.toLowerCase() === 'c') this.player.startCharge();
                if (e.key.toLowerCase() === 'r') this.resize(window.innerWidth, window.innerHeight);
                if (e.key.toLowerCase() === 'd') this.debug = !this.debug;
            }
        });
        window.addEventListener('keyup', e => {
            this.player.wingsUp();
        })
        this.canvas.addEventListener('touchstart', e => {
            this.playing = true;
            this.player.flap();
            this.touchStartX = e.changedTouches[0].pageX;
        });
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
        });
        this.canvas.addEventListener('touchend', e => {
            if (e.changedTouches[0].pageX - this.touchStartX > this.swipeDistance) {
                this.player.startCharge();
            } else {
                this.player.flap();
            }
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        // this.ctx.fillStyle = 'blue';
        this.ctx.textAlign = 'right';
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'white';
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ratio = this.height / this.baseHeight;

        this.bottomMargin = Math.floor(50 * this.ratio);
        this.smallFont = Math.ceil(20 * this.ratio);
        this.largeFont = Math.ceil(45 * this.ratio);
        this.ctx.font = this.smallFont + 'px bungee';
        this.gravity = 0.15 * this.ratio;
        this.speed = 3 * this.ratio;
        this.minSpeed = this.speed;
        this.maxSpeed = this.speed * 5;
        this.background.resize();
        this.player.resize();
        this.createObstacles();
        this.obstacles.forEach(obstacle => {
            obstacle.resize();
        });
        this.score = 0;
        this.gameOver = false;
        this.timer = 0;
    }
    render(deltaTime) {
        if (!this.playing && !this.firstFrame) return;
        else this.firstFrame = false;

        if (!this.gameOver) this.timer += deltaTime;
        this.handlePeriodicEvents(deltaTime);
        this.background.update();
        this.background.draw();
        this.drawStatusText();
        this.player.update();
        this.player.draw();
        this.obstacles.forEach(obstacle => {
            obstacle.update();
            obstacle.draw();
        })
    }
    createObstacles() {
        this.obstacles = [];
        const firstX = this.baseHeight * this.ratio;
        const obstacleSpacing = 600 * this.ratio;
        for (let i = 0; i < this.numberOfObstacles; i++) {
            this.obstacles.push(new Obstacle(this, firstX + i * obstacleSpacing));
        }
    }
    checkCollision(a, b) {
        const dx = a.collisionX - b.collisionX;
        const dy = a.collisionY - b.collisionY;
        const distance = Math.hypot(dx, dy);
        const sumOfRadii = a.collisionRadius + b.collisionRadius;
        return distance <= sumOfRadii;
    }

    formatTimer() {
        return (this.timer * 0.001).toFixed(1);
    }
    handlePeriodicEvents(deltaTime) {
        if (this.eventTimer < this.eventInterval) {
            this.eventTimer += deltaTime;
            this.eventUpdate = false;
        } else {
            this.eventTimer = this.eventTimer % this.eventInterval;
            this.eventUpdate = true;
        }
    }
    triggerGameOver() {
        if (!this.gameOver) {
            this.gameOver = true;
            if (this.obstacles.length <= 0) {
                this.sound.play(this.sound.win);
                this.message1 = "Nailed it";
                this.message2 = "Can you do it faster than " + this.formatTimer() + ' seconds?';
            } else {
                this.sound.play(this.sound.lose);
                this.message1 = "Getting rusty?";
                this.message2 = "Collision time " + this.formatTimer() + ' seconds';
            }
        }
    }
    drawStatusText() {
        this.ctx.save();
        this.ctx.fillText('Score: ' + this.score, this.width - 10, this.largeFont);
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Timer: ' + this.formatTimer(), 10, this.largeFont);
        if (this.gameOver) {
            this.ctx.textAlign = 'center';
            this.ctx.font = this.largeFont + 'px bungee';
            this.ctx.fillText(this.message1, this.width * 0.5, this.height * 0.5 - this.largeFont, this.width);
            this.ctx.font = this.smallFont + 'px bungee';
            this.ctx.fillText(this.message2, this.width * 0.5, this.height * 0.5 - this.smallFont, this.width);
            this.ctx.fillText("Press 'R' to try again!", this.width * 0.5, this.height * 0.5);
        }
        if (this.player.energy <= this.player.minEnergy) this.ctx.fillStyle = 'red';
        else if (this.player.energy >= this.player.maxEnergy) this.ctx.fillStyle = 'orangered';

        for (let i = 0; i < this.player.energy; i++) {
            this.ctx.fillRect(10, this.height - 10 - this.player.barSize * i, this.player.barSize * 5, this.player.barSize * 0.5);
        }
        this.ctx.restore();
    }
}

window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 720;
    canvas.height = 720;

    const game = new Game(canvas, ctx);

    this.lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        game.render(deltaTime);
        requestAnimationFrame(animate);
    }

    let volume = document.getElementById('volume-slider');
    volume.addEventListener("change", function (e) {
        game.sound.charge.volume = e.currentTarget.value / 100;
        game.sound.win.volume = e.currentTarget.value / 100;
        game.sound.lose.volume = e.currentTarget.value / 100;
        game.sound.flap1.volume = e.currentTarget.value / 100;
        game.sound.flap2.volume = e.currentTarget.value / 100;
        game.sound.flap3.volume = e.currentTarget.value / 100;
        game.sound.flap4.volume = e.currentTarget.value / 100;
        game.sound.flap5.volume = e.currentTarget.value / 100;
    });
    requestAnimationFrame(animate);
});
