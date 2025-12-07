animationDelay = 350;
minSearchTime = 100;

// Game Timer functionality
var gameStartTime = Date.now();
var timerDisplay = null;

// Move Queue System to prevent simultaneous AI computations
var moveQueue = [];
var isProcessingMove = false;

function queueMove(gameManager, callback) {
  moveQueue.push({ manager: gameManager, callback: callback });
  processNextMove();
}

function processNextMove() {
  if (isProcessingMove || moveQueue.length === 0) {
    return;
  }
  
  isProcessingMove = true;
  var nextMove = moveQueue.shift();
  
  // Execute the AI computation
  nextMove.callback(function() {
    // Mark processing as complete
    isProcessingMove = false;
    // Process next move in queue after a small delay
    setTimeout(processNextMove, 10);
  });
}

function updateTimer() {
  if (!timerDisplay) {
    timerDisplay = document.querySelector('.timer-display');
  }
  
  if (timerDisplay) {
    var elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    var minutes = Math.floor(elapsed / 60);
    var seconds = elapsed % 60;
    
    var timeString = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    timerDisplay.textContent = timeString;
  }
}

// Update timer every second
setInterval(updateTimer, 1000);

// Modified HTMLActuator that works with a specific container
function ContainerHTMLActuator(container) {
  this.container = container;
  this.tileContainer    = container.getElementsByClassName("tile-container")[0];
  this.scoreContainer   = container.getElementsByClassName("score-container")[0];
  this.messageContainer = container.getElementsByClassName("game-message")[0];
  this.sharingContainer = container.getElementsByClassName("score-sharing")[0];
  this.winsContainer    = container.getElementsByClassName("wins-count")[0];
  this.score = 0;
  this.wins = 0;
}

// Copy all methods from HTMLActuator
ContainerHTMLActuator.prototype = Object.create(HTMLActuator.prototype);
ContainerHTMLActuator.prototype.constructor = ContainerHTMLActuator;

// Override methods that need container-specific behavior
ContainerHTMLActuator.prototype.showHint = function(hint) {
  this.container.getElementsByClassName('feedback-container')[0].innerHTML = ['↑','→','↓','←'][hint];
};

ContainerHTMLActuator.prototype.setRunButton = function(message) {
  this.container.getElementsByClassName('run-button')[0].innerHTML = message;
};

ContainerHTMLActuator.prototype.incrementWins = function() {
  this.wins++;
  this.winsContainer.textContent = this.wins;
};

// Modified KeyboardInputManager that works with a specific container
function ContainerKeyboardInputManager(container) {
  this.container = container;
  this.events = {};
  this.listen();
}

// Copy all methods from KeyboardInputManager except listen
ContainerKeyboardInputManager.prototype.on = KeyboardInputManager.prototype.on;
ContainerKeyboardInputManager.prototype.emit = KeyboardInputManager.prototype.emit;

ContainerKeyboardInputManager.prototype.listen = function () {
  var self = this;
  var container = this.container;

  // Only listen to buttons within this container
  var hintButton = container.getElementsByClassName('hint-button')[0];
  hintButton.addEventListener('click', function(e) {
    e.preventDefault();
    var feedbackContainer = container.getElementsByClassName('feedback-container')[0];
    feedbackContainer.innerHTML = '<img src=img/spinner.gif />';
    self.emit('think');
  });

  var runButton = container.getElementsByClassName('run-button')[0];
  runButton.addEventListener('click', function(e) {
    e.preventDefault();
    self.emit('run');
  });

  var retry = container.getElementsByClassName("retry-button")[0];
  retry.addEventListener("click", this.restart.bind(this));
};

ContainerKeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

// Wait till the browser is ready to render the games (avoids glitches)
window.requestAnimationFrame(function () {
  // Create two separate game instances
  var game1Container = document.querySelector('.game-1');
  var game2Container = document.querySelector('.game-2');
  
  // AI Configuration for Game 1: Fast & Sloppy (Reduced performance)
  var fastSloppyAI = {
    minSearchTime: 10,        // Very short search time - more mistakes
    smoothWeight: 0.02,       // Much less concern for smoothness
    mono2Weight: 0.3,         // Poor strategic positioning
    emptyWeight: 1.0,         // Minimal emphasis on keeping spaces open
    maxWeight: 1.5            // Focus on immediate tiles but not too smart
  };
  
  // AI Configuration for Game 2: Careful & Thoughtful (Reduced performance)
  var carefulAI = {
    minSearchTime: 50,        // Reduced from 200ms - still thoughtful but not perfect
    smoothWeight: 0.1,        // Standard smoothness concern
    mono2Weight: 1.0,         // Standard strategic positioning
    emptyWeight: 2.0,         // Reduced emphasis on keeping spaces open
    maxWeight: 1.0            // Standard focus - not too aggressive
  };
  
  // Create managers with different AI personalities and animation delays
  // Game 1: Fast & Sloppy with 500ms delay
  var manager1 = new GameManager(4, function() { return new ContainerKeyboardInputManager(game1Container); }, function() { return new ContainerHTMLActuator(game1Container); }, 500, fastSloppyAI);
  
  // Small delay to ensure different random seed state for second game
  setTimeout(function() {
    // Game 2: Careful & Thoughtful with 750ms delay
    var manager2 = new GameManager(4, function() { return new ContainerKeyboardInputManager(game2Container); }, function() { return new ContainerHTMLActuator(game2Container); }, 750, carefulAI);
  }, 10);
});
