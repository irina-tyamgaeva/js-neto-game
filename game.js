'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
        throw new Error(`Можно прибавлять к вектору только вектор типа Vector`);
    }
    return new Vector(vector.x + this.x, vector.y + this.y);
  }

  times(n = 1) {
      return new Vector(this.x * n, this.y * n);
  }
};

class Actor {
  constructor(pos = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
        throw new Error();
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return `actor`;
  }

  act() {}

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
        throw new Error();
    }
    if (actor === this) {
      return false;
    }

    let XIntersect = false;
    let YIntersect = false;
    if ((this.right > actor.left) && (this.left < actor.right)) {
      XIntersect = true;
    }
    if ((this.top < actor.bottom) && (this.bottom > actor.top)) {
      YIntersect = true;
    }
    if (this.left == actor.left && this.left == actor.left &&
        this.bottom == actor.bottom && this.top == actor.top) {
      XIntersect = true;
      YIntersect = true;
    }
   return (XIntersect && YIntersect);
  }
}

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

class Level{
  constructor(grid, actors) {
    this.grid = grid;
    this.actors = actors;
    this.status = null;
    this.finishDelay = 1;
  }

  get player() {
    return this.actors.find(function(element, index, array) {
      return element.type === 'player';
    });
  }

  get height() {
    if (this.grid === undefined) {
      return 0;
    }
    return this.grid.length;
  }

  get width() {
    if (this.grid === undefined) {
      return 0;
    }
    let cells = [];
    this.grid.forEach(function(item, i) {
      cells.push(item.length);
    });
	  return getMaxOfArray(cells);
  }

  isFinished() {
    return (this.status !== null && this.finishDelay < 0);
  }

  actorAt(actor) {
    if (actor === undefined ||
        !(actor instanceof Actor)) {
      throw new Error();
    }
    if (this.grid === undefined && this.actors === undefined) {
       return undefined;
     }
    return this.actors.find(function(element, index, array) {
        return element.isIntersect(actor);
    });
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) ||
        !(pos instanceof Vector)) {
      throw new Error();
    }
    if (pos.x < 0 ||
        pos.x > this.width ||
        pos.x + size.x < 0 ||
        pos.x + size.x > this.width ||
        pos.y < 0 ||
        pos.y + size.y < 0) {
      return `wall`;
    }
    if (pos.y > this.height ||
        pos.y + size.y > this.height) {
      return `lava`;
    }
    for (let y = Math.floor(pos.y); y < size.y; y++) {
      for (let x = Math.floor(pos.x); x < size.x; x++) {
        if (this.grid[x][y] === `wall`) {
          return `wall`;
        } else if (this.grid[x][y] === `lava`) {
            return `lava`;
        }
      }
    }
    return undefined;
  }

  removeActor(actor) {
    let idx = this.actors.indexOf(actor);
    if (idx != -1) {
      this.actors.splice(idx, 1);
    }
  }

  noMoreActors(type) {
    if (this.actors === undefined) {
      return true;
    }
    for (let i = 0; i < this.actors.length; i++) {
      if (this.actors[i].type === type) {
        return false;
      }
    }
    return true;
  }

  playerTouched(type, actor) {
      if (type === 'lava' || type === `fireball`) {
         this.status = `lost`;
      } else if (type === `coin`) {
          if (actor !== undefined) {
              this.removeActor(actor);
              if (this.noMoreActors(`coin`)) {
                this.status = `won`;
              }
          }
      }
    }
}

class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(symbol) {
    if (symbol === undefined) {
      return undefined;
    }
    for (let key in this.dictionary) {
      if (key === symbol) {
        return  this.dictionary[symbol];
      }
    }
    return undefined;
  }

  obstacleFromSymbol(symbol) {
    switch(symbol) {
      case 'x': return `wall`;
      case '!': return `lava`;
      default: undefined;
    }
  }

  createGrid(plan) {
    let grid = [];
    plan.forEach(function(item, i, arr) {
      let row = [];
      let symbols = item.split('');
      symbols.forEach(symbol => row.push(this.obstacleFromSymbol(symbol)));
      grid.push(row);
    }, this);
    return grid;
  }

  createActors(plan) {
    let actors = [];
    plan.forEach(function(item, y, arr) {
      let symbols = item.split('');
      symbols.forEach(function(item, x, arr) {
        let actorConctructor = this.actorFromSymbol(item);
        if (actorConctructor !== undefined) {
          if (typeof actorConctructor === `function`) {
              let actor = new actorConctructor(new Vector(x, y));
              if (actor.constructor === Actor ||
                  (actor.constructor).__proto__ === Actor ||
                  (actor.constructor).__proto__.__proto__ === Actor) {
                actors.push(actor);
              }
          }
        }
      }, this);
    }, this);
    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time,
                      this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    this.speed.x =  this.speed.x * -1;
    this.speed.y =  this.speed.y * -1;
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, new Vector(1, 1))) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball{
  constructor(pos = new Vector()) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball{
  constructor(pos = new Vector()) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball{
  constructor(pos = new Vector()) {
    super(pos, new Vector(0, 3));
    this.startPosition = pos;
  }

  handleObstacle() {
    this.pos = this.startPosition;
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, new Vector(1, 1))) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring =  Math.random() * 3.14 * 2;
    this.startPosition = this.pos;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPosition.plus(this.getSpringVector());
  }

  act(time = 1) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector()) {
    super(new Vector(pos.x, pos.y - 0.5), new Vector(0.8, 1.5), new Vector(0, 0));
  }

  get type() {
    return 'player';
  }
}


const schemas = [
  [
    '         ',
    '  =      ',
    '    v    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
}
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!'));
