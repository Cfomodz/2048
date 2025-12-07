function GameManager(size, InputManager, Actuator, animationDelay, aiConfig) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator     = new Actuator;
  this.animationDelay = animationDelay || 350; // Default animation delay
  this.aiConfig     = aiConfig; // AI configuration

  this.running      = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));

  this.inputManager.on('think', function() {
    var best = this.ai.getBest();
    this.actuator.showHint(best.move);
  }.bind(this));


  this.inputManager.on('run', function() {
    if (this.running) {
      this.running = false;
      this.actuator.setRunButton('Auto-run');
    } else {
      this.running = true;
      this.run()
      this.actuator.setRunButton('Stop');
    }
  }.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.restart();
  this.running = false;
  this.actuator.setRunButton('Auto-run');
  this.setup();
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid         = new Grid(this.size);
  this.grid.addStartTiles();

  this.ai           = new AI(this.grid, this.aiConfig);

  this.score        = 0;
  this.over         = false;
  this.won          = false;

  // Update the actuator
  this.actuate();
};


// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  this.actuator.actuate(this.grid, {
    score: this.score,
    over:  this.over,
    won:   this.won
  });
};

// makes a given move and updates state
GameManager.prototype.move = function(direction) {
  var result = this.grid.move(direction);
  this.score += result.score;

  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
  }

  //console.log(this.grid.valueSum());

  if (!this.grid.movesAvailable()) {
    this.over = true; // Game over!
  }

  this.actuate();
}

// moves continuously until game is over
GameManager.prototype.run = function() {
  var self = this;
  
  // Use the move queue to prevent simultaneous AI computations
  if (typeof queueMove !== 'undefined') {
    queueMove(this, function(done) {
      var best = self.ai.getBest();
      self.move(best.move);
      done(); // Signal that AI computation is complete
    });
  } else {
    // Fallback if queue system isn't available
    var best = this.ai.getBest();
    this.move(best.move);
  }
  
  var timeout = this.animationDelay;
  
  if (this.running && !this.over && !this.won) {
    // Continue playing
    setTimeout(function(){
      self.run();
    }, timeout);
  } else if (this.running && (this.over || this.won)) {
    // Game ended, handle restart
    if (this.over) {
      // Game lost - restart immediately
      setTimeout(function(){
        self.restart();
        self.running = true;
        self.actuator.setRunButton('Stop');
        self.run();
      }, timeout);
    } else if (this.won) {
      // Game won - increment win counter and wait 3 seconds then restart
      if (self.actuator.incrementWins) {
        self.actuator.incrementWins();
      }
      setTimeout(function(){
        self.restart();
        self.running = true;
        self.actuator.setRunButton('Stop');
        self.run();
      }, 3000);
    }
  }
}
