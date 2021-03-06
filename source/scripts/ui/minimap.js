﻿define(function(require) {

    var Entity = require('entities/Entity'),
        MapGrid = require('entities/MapGrid'),
        input = require('input/provider'),
        resolution = require('resolution');

    var MiniMap = function(gameObjects, camera) {

        Entity.prototype.constructor.call(this, 'MiniMap');

        this.gameObjects = gameObjects;
        this.camera = camera;

        this.unit = 5;

        // To create the correct size minimap, multiply the the grid by the unit
        // size we're using for the minimap. We'll also add two extra for padding
        // so that entities on the edge of the grid won't be on the edge of the 
        // minimap. 
        this.w = (this.unit * MapGrid.columns) + this.unit + this.unit;
        this.h = (this.unit * MapGrid.rows) + this.unit + this.unit;

        // We use this offset when rendering entities to the minimap to account
        // for the padding.
        this.entityOffset = this.unit;

        // The minimap is rendered to an independent canvas, and this canvas is 
        // later rendered to the main screen.
        var canvas = document.createElement('canvas');
        canvas.height = this.h;
        canvas.width = this.w;

        this.map = canvas.getContext('2d');

        this.colors = {};
        this.colors['enviroment'] = 'blue';
        this.colors['friendlies'] = 'green';
        this.colors['enemies'] = 'red';

        var pad = 20;
        this.x = pad;
        this.y = resolution.height - this.h - pad;
        this.bounds = {
            top: this.y,
            left: this.x,
            bottom: this.y + this.h,
            right: this.x + this.w
        };

        this.on = false;
        this.lastToggle = new Date();
    };

    MiniMap.prototype.commands = {
        77: function() {
            //m
            var now = new Date();
            if(now - this.lastToggle > 500) {
                this.on = !this.on;
                this.lastToggle = now;
            }
        }
    };

    MiniMap.prototype.render = function(ctx) {

        if(this.on) {
            this.renderMap(this.map);
            ctx.drawImage(this.map.canvas, this.x, this.y);

            ctx.beginPath();
            ctx.rect(this.x, this.y, this.w, this.h);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255, 0.3)';
            ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(255,255,255, 0.3)';
            ctx.font = '42px sans-serif';
            ctx.fillText('M', this.x, this.y + 140);
        }
    };


    MiniMap.prototype.renderMap = function(ctx) {
        var self = this;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.rect(0, 0, this.w, this.h);
        ctx.fill();

        Object.keys(this.colors).forEach(function(key) {
            var entities = self.gameObjects[key];
            ctx.fillStyle = self.colors[key];

            var i, entity;
            var x, y, r;
            for(i = entities.length - 1; i >= 0; i--) {
                entity = entities[i];
                r = Math.round(entity.radius) || 1;
                x = Math.round(entity.x * self.unit) - r + self.entityOffset;
                y = Math.round(entity.y * self.unit) - r + self.entityOffset;

                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        });

        // TODO: this is off 
        // camera position and view
        var cellSize = MapGrid.cellSize;
        var viewport = this.camera.viewport;

        var w = viewport.width / this.camera.scale / this.unit;
        var h = viewport.height / this.camera.scale / this.unit;

        var cx = this.camera.x * this.unit + self.entityOffset;
        var cy = this.camera.y * this.unit + self.entityOffset;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = 'rgba(0,255,255,0.3)';
        ctx.stroke();
        ctx.restore();
    };

    MiniMap.prototype.update = function(elapsed) {
        this.checkCommands();

        if(!input.state.handled && input.state.hasPointer) {

            var inBound = input.isPointWithinBounds(input.state, { left: this.x, right: this.x + this.w, top: this.y, bottom: this.y + this.h });

            if(inBound) {
                this.down = true;
                input.state.handled = true;
            }
        }

        if(!input.state.hasPointer && this.down) {
            this.on = !this.on;
            this.down = false;
            input.state.handled = true;
        }

    };

    return MiniMap;

});