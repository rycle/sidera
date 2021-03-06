﻿define(function(require) {

    var keyboard = require('input/keyboard'),
        Fighter = require('entities/Fighter'),
        Bomber = require('entities/Bomber'),
        MapGrid = require('entities/MapGrid'),
        Asteroid = require('entities/Asteroid'),
        Generator = require('entities/Generator'),
        Turret = require('entities/Turret'),
        Miner = require('entities/Miner');

    var state = {};

    var level = {
        camera: {
            x: 10,
            y: 10,
            viewport: {
                height: 400
            }
        },
        funds: 2500,
        friendlies: [{
            type: Generator,
            as: {
                x: 10,
                y: 10
            }
        }, {
            type: Miner,
            as: {
                x: 12,
                y: 10
            }
        }, {
            type: Turret,
            as: {
                x: 9,
                y: 9
            }
        }, {
            type: Turret,
            as: {
                x: 9,
                y: 10
            }
        }, {
            type: Turret,
            as: {
                x: 9,
                y: 11
            }
        }],
        enviroment: [{
            type: Asteroid,
            as: {
                x: 12,
                y: 9,
                amount: 1000
            }
        }, {
            type: Asteroid,
            as: {
                x: 12,
                y: 12,
                amount: 2000
            }
        }, {
            type: Asteroid,
            as: {
                x: 14,
                y: 9,
                amount: 500
            }
        }],
        waves: [{
            after: 2,
            formation: triangle,
            from: {
                x: 0,
                y: 0
            },
            send: [{
                type: Fighter,
                count: 5,
            }]
        }, {
            after: 5,
            from: {
                x: 0,
                y: 0
            },
            send: [{
                type: Bomber,
                count: 1
            }]
        }, {
            after: 12,
            from: {
                x: 0,
                y: 0
            },
            formation: triangle,
            send: [{
                type: Bomber,
                count: 1
            }, {
                type: Fighter,
                count: 10
            }]
        }]
    };

    function triangle(entities, origin) {

        var entity;
        var offsetX = 0,
            offsetY = 0;
        var space = 1.75;

        for(var i = entities.length - 1; i >= 0; i--) {
            entity = entities[i];

            entity.x = origin.x - offsetX * space;
            entity.y = origin.y - offsetY * space;

            offsetX++;

            if(offsetX > offsetY) {
                offsetX = 0;
                offsetY++;
            }
        }
    }

    state.update = function(elapsed) {

        this.timeUntilNextWave -= elapsed;

        if(this.timeUntilNextWave <= 0) {
            if(!this.waves[this.waveId]) return;
            this.sendWave();
            this.setupNextWave();
        }

        if(keyboard.isKeyPressed(81)) {
            //q
            sendWaveOf(Fighter);
        }
        if(keyboard.isKeyPressed(69)) {
            //e
            sendWaveOf(Bomber);
        }
    };

    state.render = function(ctx) {

        if(this.levelOver) return;

        ctx.fillStyle = 'yellow';
        ctx.font = '18px sans-serif';
        ctx.fillText('next wave in ' + Math.round(this.timeUntilNextWave / 1000), 500, 20);
    };

    state.sendWave = function() {
        var wave = this.waves[this.waveId];
        var queue = [];
        var entity;
        var type;
        var count;

        for(var i = wave.send.length - 1; i >= 0; i--) {
            type = wave.send[i].type;
            count = wave.send[i].count;
            while(count > 0) {
                entity = new type();
                this.objects.enemies.push(entity);
                queue.push(entity);
                count--;
            }
        }

        if(wave.formation) {
            wave.formation(queue, wave.from);
        }

    }

    state.setupNextWave = function() {
        this.waveId++;

        if(this.waveId < this.waveCount) {
            this.timeUntilNextWave = this.waves[this.waveId].after * 1000;
        } else {
            this.levelOver = true;
        }

    }

    function sendWaveOf(type) {
        var now = new Date();
        if(sendWaveOf.lastTime && (now - sendWaveOf.lastTime < 500)) {
            return;
        }
        sendWaveOf.lastTime = now;
        for(var i = 3; i > 0; i--) {
            var f = new type();
            f.x = -1 - (i * 1.1);
            f.y = -1 - (i * 1.1);
            state.objects.enemies.push(f);
        }
    }

    function addTo(definition) {
        var entity = new definition.type();
        entity.hydrate(definition.as);
        this.push(entity);
    }

    function next(objects) {

        level.friendlies.forEach(addTo.bind(objects.friendlies));
        level.enviroment.forEach(addTo.bind(objects.enviroment));

        objects.friendlies.forEach(function(friendly) {
            friendly.context = state;

        });

        state.camera = level.camera;
        state.objects = objects;
        state.waves = level.waves;
        state.waveId = 0;
        state.timeUntilNextWave = state.waves[0].after * 1000;;
        state.waveCount = state.waves.length;
        state.money = level.funds;

        return state;
    }

    //function loadLevel(done) {
    //    console.log('load level');
    //    var request = new XMLHttpRequest();
    //    request.open('GET', '/level.json', false);
    //    request.send(null);
    //    if (request.status === 200) {
    //        var responseText = JSON.stringify({
    //            'things': [{
    //                'type': 'asteroid',
    //                'x': 100,
    //                'y': 100,
    //                'amount': 1000
    //            }, {
    //                type: 'asteroid',
    //                x: 300,
    //                y: 100,
    //                amount: 500
    //            }]
    //        });
    //        //var data = JSON.parse(request.responseText);
    //        var data = JSON.parse(responseText);
    //        money = 1000;
    //        data.things.forEach(function (x) {
    //            var a = new Asteroid();
    //            a.hydrate(x);
    //            entities.push(a);
    //        });
    //    }
    //}
    return {
        next: next,
        current: state
    };

});