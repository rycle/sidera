﻿(function () {
    'use strict';

    var Entity = sidera.entities.Entity;
    var fullCircle = sidera.math.geometry.fullCircle;

    var Cursor = WinJS.Class.derive(Entity, function () {
        Entity.prototype.constructor.call(this, 'Cursor');
    }, {
        _entity: null,
        mode: 'nothing',
        overValidPlacement: true,

        render: function (ctx) {
            var e = this._entity;

            if (!e) { return; }

            if (e.range && this.overValidPlacement) {
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.arc(e.x, e.y, e.range, 0, fullCircle, false);
                ctx.stroke();
                ctx.fill();
            }

            if (!this.overValidPlacement) {
                ctx.fillStyle = 'rgba(255,0,0,0.9)';
                ctx.arc(e.x, e.y, e.radius + 3, 0, fullCircle, false);
                ctx.fill();
            }

            var w = Math.floor(e.sheet.width * e.scale);
            var h = Math.floor(e.sheet.height * e.scale);

            ctx.save();

            ctx.translate(e.x, e.y);

            if (e.orientation) {
                ctx.rotate(e.orientation);
            }

            ctx.drawImage(e.sheet, -w / 2, -h / 2, w, h);

            ctx.restore();


        },

        update: function (elapsed, gameObjects) {
            if (!this._entity) return;

            this._entity.x = this.x;
            this._entity.y = this.y;

            if (this._entity.find) {
                this._entity.find(this._entity, gameObjects);
            }

            this.overValidPlacement = this.canPlace(gameObjects.friendlies.concat(gameObjects.enviroment));

        },

        setContext: function (type) {
            if (!type) return;

            this.context = type;
            this._entity = new type();
            this.mode = this._entity.type;

            this.find = this._entity.find;
        },

        click: function (args, level, gameObjects) {

            if (!this.context.cost) throw new Error('no cost for context: ' + this.context);

            if (level.money < this.context.cost) return;

            level.money -= this.context.cost;

            var entity = new this.context();

            entity.hydrate({
                x: args.offsetX,
                y: args.offsetY,
                onmining: function (take) {
                    level.money += take;
                }
            });

            return entity;
        }
    });

    WinJS.Namespace.define('sidera', { Cursor: Cursor });
}());