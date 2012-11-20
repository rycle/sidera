(function() {

    'use strict';

    var Entity = sidera.entities.Entity,
        Miner = sidera.entities.Miner,
        Turret = sidera.entities.Turret,
        Generator = sidera.entities.Generator;

    var newBuilding;
    var gameObjects;
    var status;
    var cursor = new sidera.Cursor();
    var camera;
    var minimap;
    var isGameOver = false;

    var map = {
        columns: 30,
        rows: 30,
        cellSize: 30
    };

    function initializeGameObjectSets() {

        function entityArray() {
            var array = [];
            array.dead = [];
            return array;
        }

        return {
            background: entityArray(),
            enviroment: entityArray(),
            enemies: entityArray(),
            friendlies: entityArray(),
            doodads: entityArray(),
            ui: entityArray()
        };
    }

    function draw(ctx, elapsed) {

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        ctx.clearRect(0, 0, width, height);

        // draw background
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        // draw entities
        drawSet(gameObjects.background, ctx);

        drawGrid(ctx, camera);

        drawSet(gameObjects.enviroment, ctx);
        drawSet(gameObjects.friendlies, ctx);
        drawSet(gameObjects.enemies, ctx);
        drawSet(gameObjects.doodads, ctx);
        drawSet(gameObjects.ui, ctx, false);

        cursor.render(ctx, camera);

        if(isGameOver) {
            var centerText = function(ctx, text, y) {
                    var measurement = ctx.measureText(text);
                    var x = (ctx.canvas.width - measurement.width) / 2;
                    ctx.fillText(text, x, y);
                }

            ctx.fillStyle = 'white';
            ctx.font = '48px monospace';
            centerText(ctx, 'game over', 300);
        }


    }

    function drawGrid(ctx, camera) {
        var cellSize = map.cellSize * camera.scale();
        var width = map.columns * cellSize;
        var height = map.rows * cellSize;

        var offsetX = camera.bounds.left;
        var offsetY = camera.bounds.top;

        ctx.strokeStyle = 'hsl(120,50%,10%)';
        ctx.lineWidth = 1;

        // horizontal
        for(var r = 0; r <= map.rows; r++) {

            ctx.beginPath();
            ctx.moveTo(offsetX, r * cellSize + offsetY);
            ctx.lineTo(offsetX + width, r * cellSize + offsetY);
            ctx.stroke();
        }

        // vertical
        for(var c = 0; c <= map.columns; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cellSize + offsetX, offsetY);
            ctx.lineTo(c * cellSize + offsetX, offsetY + height);
            ctx.stroke();
        }
    }

    function drawSet(entities, ctx, scales) {
        if(scales === undefined) scales = true;

        //todo: move this calculations somewhere else
        var scale = camera.scale();

        var i, entity;
        var sprite;
        for(i = entities.length - 1; i >= 0; i--) {
            entity = entities[i];
            sprite = entity.sheet;

            if(scales) {
                var coords = camera.project(entity);

                ctx.save();

                ctx.translate(coords.x, coords.y);
            }

            entity.render(ctx, scale, camera.project);

            if(scales) {
                if(entity.orientation) {
                    ctx.rotate(entity.orientation);
                }

                if(sprite) {
                    var w = Math.floor(sprite.width * entity.scale * scale);
                    var h = Math.floor(sprite.height * entity.scale * scale);
                    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
                }
                ctx.restore();
            }
        }
    }

    function updateSet(entities, elapsed) {
        var entity;
        var dead = entities.dead;
        var index;

        for(var i = entities.length - 1; i >= 0; i--) {
            entity = entities[i];
            if(entity.update) entity.update(elapsed, gameObjects);

            // collect the dead
            if(entity.dead) {
                dead.push(entity);
            }
        }

        // bury the dead
        for(var i = dead.length - 1; i >= 0; i--) {
            index = entities.indexOf(dead[i]);
            entities.splice(index, 1);

            if(dead[i].shoudExplode) {
                var explosion = new sidera.entities.Explosion(dead[i]);
                gameObjects.doodads.push(explosion);
            }
        }
        entities.dead = [];
    }

    function update(elapsed) {

        status.mode = cursor.mode;

        updateSet(gameObjects.background, elapsed);
        updateSet(gameObjects.enviroment, elapsed);
        updateSet(gameObjects.friendlies, elapsed);
        updateSet(gameObjects.enemies, elapsed);
        updateSet(gameObjects.doodads, elapsed);
        updateSet(gameObjects.ui, elapsed);

        cursor.update(elapsed, gameObjects);
        camera.update();

        if(newBuilding) {
            var entity;
            for(var i = gameObjects.friendlies.length - 1; i >= 0; i--) {
                entity = gameObjects.friendlies[i];
                if(entity.whenBuilding) entity.whenBuilding(newBuilding, gameObjects);
            }
            newBuilding = null;
        }

        if(gameObjects.friendlies.length === 0 && status.state.money < 9999) {
            isGameOver = true;
        }

    }

    function sendWaveOf(type) {

        for(var i = 3; i > 0; i--) {
            var f = new type();
            f.x = -50 - (i * 25);
            f.y = -50 - (i * 25);
            gameObjects.enemies.push(f);
        }
    }

    function start(options) {

        isGameOver = false;

        camera = new sidera.Camera(sidera.resolution);
        gameObjects = initializeGameObjectSets();

        var level = sidera.levels.next(gameObjects);
        cursor.setContext(Miner);

        status = new sidera.Status(level);
        minimap = new sidera.MiniMap(gameObjects, camera);
        gameObjects.ui.push(minimap);
        gameObjects.ui.push(new sidera.FPS());
        gameObjects.ui.push(status);
        // gameObjects.ui.push(cursor);
    }

    function handle_click(evt) {
        var coords = {
            offsetX: evt.offsetX - camera.x,
            offsetY: evt.offsetY - camera.y
        }
        var entity = cursor.click(coords, sidera.levels.current, gameObjects);

        if(entity) {
            gameObjects.friendlies.push(entity);
            newBuilding = entity;
        }
    }

    function handle_mouseover(evt) {
        cursor.x = evt.offsetX;
        cursor.y = evt.offsetY;
    }

    function handle_onkeypress(evt) {
        var keyCode = evt.keyCode;

        // pressed escape
        if(keyCode === 27) {
            this.transition(sidera.start.screen);
        }

        var types = {
            49: Miner,
            50: Generator,
            51: Turret
        };

        console.log(keyCode);

        if(types[keyCode]) {
            cursor.setContext(types[keyCode]);
        } else {
            switch(keyCode) {
            case 113:
                //q
                sendWaveOf(sidera.entities.Fighter);
                break;
            case 101:
                //e
                sendWaveOf(sidera.entities.Bomber);
                break;
            case 119:
                //w
                camera.y -= 5;
                break;
            case 115:
                //s
                camera.y += 5;
                break;
            case 97:
                //a
                camera.x -= 5;
                break;
            case 100:
                //d
                camera.x += 5;
                break;
            case 122:
                //z
                camera.z -= 0.1;
                camera.z = Math.max(camera.z, 1);
                break;
            case 99:
                //c
                camera.z += 0.1;
                camera.z = Math.min(camera.z, 4);
                break;
            case 109:
                //m
                minimap.on = !minimap.on;
                break;
            }
        }
    }

    sidera.framework.namespace.define('sidera.game', {
        draw: draw,
        update: update,
        start: start,
        mouseover: handle_mouseover,
        onkeypress: handle_onkeypress,
        click: handle_click
    });

}());