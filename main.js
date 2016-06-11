// Allowed keyboard keys
var keyCodes = {
	37: "left",
	38: "up",
	39: "right",
	40: "down",
	// Vi(m) style
	72: "left",
	75: "up",
	76: "right",
	74: "down"
};

// 2048 GAME CLASS //
// // // // // // //
function Game(display, rows, cols) {
	this.rows = rows || 4;
	this.cols = cols || 4;
	this.numStartTiles = 2;
	this.goal = 2048;
	this.plan = [];
	for (var i = 0; i < this.rows; i++) {
		this.plan.push([]);
		for (var j = 0; j < this.cols; j++) {
			this.plan[i][j] = 0;
		}
	}
	this.ended = false;
	this.paused = false;
	this.display = display;
}

Game.prototype.clear = function() {
	this.goal = 2048;
	this.ended = false;
	this.paused = false;
	this.display.clear();
	for (var i = 0; i < this.rows; i++) {
		for (var j = 0; j < this.cols; j++) {
			this.plan[i][j] = 0;
		}
	}
};

Game.prototype.withinBounds = function(x, y) {
	return (x >= 0 && y >= 0 &&
			x < this.rows && y < this.cols);
};

Game.prototype.start = function() {
	this.clear();
	for (var i = 0; i < this.numStartTiles; i++) {
		this.addRandomTile();
	}
};

Game.prototype.pause = function(state) {
	// state: 0 pause, else go
	this.paused = (state === 0) ? true : false;
};

Game.prototype.addRandomTile = function() {
	if (this.ended || this.paused)
		return;

	var randomIndex, rowIndex, colIndex;
		tileContent = Math.random() > 0.3 ? 2 : 4;

	do {
		randomIndex	= Math.floor(Math.random() * this.cols * this.rows);
		rowIndex = Math.floor(randomIndex / this.rows);
		colIndex = randomIndex % this.cols;
	} while(this.plan[rowIndex][colIndex] !== 0);

	this.plan[rowIndex][colIndex] = tileContent;
	this.display.newTile(this.plan, rowIndex, colIndex);

	this.checkResult();
};

// Move the tiles in the specific direction
Game.prototype.move = function(direction) {
	if (this.ended || this.paused)
		return;

	var that = this,
		planCopy = this.plan.slice(),
		didMerge = [],
		madeAMove = false,
		i, j;

	// Get the next tile for the specific direction
	function next(currIndex) {
		var vect = {
			x: currIndex.x,
			y: currIndex.y
		};
		switch (direction) {
			case "up":
				vect.x = currIndex.x - 1;
				break;
			case "down":
				vect.x = currIndex.x + 1;
				break;
			case "left":
				vect.y = currIndex.y - 1;
				break;
			case "right":
				vect.y = currIndex.y + 1;
				break;
		}
		return vect;
	}

	// Get the plan value for the index vector
	function planValue(indexVect) {
		if (!that.withinBounds(indexVect.x, indexVect.y))
			return undefined;

		return that.plan[indexVect.x][indexVect.y];
	}

	// Move the tile in the specific direction
	function updateTile(i, j) {
		var dest = {x: i, y: j},
			nextDest,
			shouldChange = false;
			val = that.plan[i][j];

		if (planCopy[i][j] === 0)
			return;

		// Get the next empty tile
		while (planValue(next(dest)) === 0) {
			dest = next(dest);
			madeAMove = true;
			shouldChange = true;
		}

		// Only one merge per row/col
		nextDest = next(dest);
		if (planValue(nextDest) === val && !didMerge[nextDest.x][nextDest.y]) {
			dest = nextDest;
			didMerge[nextDest.x][nextDest.y] = true;
			madeAMove = true;
			shouldChange = true;
		}

		// Update the plan content
		if (shouldChange) {
			that.plan[i][j] = 0;
			that.plan[dest.x][dest.y] += val;
			that.display.moveTile(that.plan, i, j, dest.x, dest.y);
		}
	}

	if (direction === "up" || direction === "left") {
		for (i = 0; i < this.rows; i++) {
			didMerge[i] = [];
			for (j = 0; j < this.cols; j++) {
				updateTile(i, j);
			}
		}
	} else {
		for (i = this.rows - 1; i >= 0; i--) {
			didMerge[i] = [];
			for (j = this.cols - 1; j >= 0; j--) {
				updateTile(i, j);
			}
		}
	}

	if (madeAMove)
		this.addRandomTile();
};

Game.prototype.checkResult = function() {
	var planFull = true;
	var highestTile = 0;
	this.plan.forEach(function(row) {
		row.forEach(function(val) {
			if (val === this.goal) {
				this.pause(0);
				this.display.result(1, this.goal);
				this.goal *= 2;
			} else if (val === 0) {
				planFull = false;
			}
		}, this);
	}, this);

	// Check if there are any more valable moves
	if (planFull) {
		for (var i = 0; i < this.rows; i++) {
			for (var j = 0; j < this.cols; j++) {
				if (this.withinBounds(i, j + 1) && this.plan[i][j] === this.plan[i][j + 1] ||
					this.withinBounds(i + 1, j) && this.plan[i][j] === this.plan[i + 1][j]) {
					return;
				}
				highestTile = (this.plan[i][j] > highestTile) ? this.plan[i][j] : highestTile;
			}
		}

		//result
		this.ended = true;
		this.display.result(0, highestTile);
	}
};

// DOM DISPLAY  //
// // // // // //
function DOMDisplay() {
	this.tiles = document.querySelectorAll(".tile");
	this.resultBox = document.querySelector("#result-box");
	this.colors = {
		2: "#D2AADA",
		4: "#AD7FB9",
		8: "#8F4C9F",
		16: "#693476",
		32: "#E387AD",
		64: "#D16B9B",
		128: "#9D437A",
		256: "#5E1C47",
		512: "#E0727F",
		1024: "#D05668",
		2048: "#CB0030",
		4096: "#900029",
		8192: "#5DA6C2",
		16384: "#4187AB",
		32768: "#286D89",
		65536: "#135A79",
		131072: "#0B2330"
	};
}

DOMDisplay.prototype.addTile = function(tile, val) {
	var length = val.toString().length,
		span = document.createElement("SPAN");

	span.style.backgroundColor = this.colors[val];
	span.textContent = val;
	tile.appendChild(span);

	// Add font-size classes
	if (length === 4) {
		span.className = "small-text";
	} else if (length === 5 || length === 6) {
		span.className = "smallest-text";
	}
};

DOMDisplay.prototype.newTile = function(plan, x, y) {

	var tile = this.tiles[x * plan[0].length + y],
		span,
		val = plan[x][y],
		interval,
		dimension = 0,
		offset = 50;

	// Add the tile
	this.addTile(tile, val);
	span = tile.firstChild;

	// Pop up animation
	span.style.height = "0%";
	span.style.width = "0%";
	span.style.top = "50%";
	span.style.left = "50%";
	span.textContent = "";

	interval = setInterval(function() {
		if (dimension === 100 && offset === 0) {
			clearInterval(interval);
			// Add value after the animation
			span.textContent = val;
			return;
		}

		dimension += 10;
		offset -= 5;
		span.style.height = dimension + "%";
		span.style.width = dimension + "%";
		span.style.top = offset + "%";
		span.style.left = offset + "%";
	}, 15);

};

DOMDisplay.prototype.mergeTile = function(tile, val) {
	var span,
		dimension = 100,
		offset = 0,
		way = 1,
		interval;

	// Remove the old tile
	this.removeTile(tile);

	// Add the merged tile
	this.addTile(tile, val);
	span = tile.firstChild;

	// Pop animation

	interval = setInterval(function() {
		if (dimension === 110) {
			way = -1;
		}

		dimension += way * 2;
		offset -= way * 1;

		span.style.height = dimension + "%";
		span.style.width = dimension + "%";
		span.style.top = offset + "%";
		span.style.left = offset + "%";

		if (dimension === 100) {
			clearInterval(interval);
			return;
		}

	}, 15);
};

DOMDisplay.prototype.removeTile = function(tile) {
	if (tile.firstChild !== null) {
		tile.removeChild(tile.firstChild);
	}
};

DOMDisplay.prototype.moveTile = function(plan, srcX, srcY, dstX, dstY) {

	var srcTile = this.tiles[srcX * plan[0].length + srcY],
		dstTile = this.tiles[dstX * plan[0].length + dstY];

	// Remove the source tile
	this.removeTile(srcTile);

	// Add the destination tile
	if (dstTile.firstChild !== null)
		this.mergeTile(dstTile, plan[dstX][dstY]);
	else
		this.addTile(dstTile, plan[dstX][dstY]);

};

DOMDisplay.prototype.clear = function() {
	for (var i = 0; i < this.tiles.length; i++) {
		this.removeTile(this.tiles[i]);
	}
	// Remove the result box if on display
	this.resultBox.style.display = "";
};

DOMDisplay.prototype.result = function(state, score) {
	// State: 0 = lost, 1 = won
	var lostMessage = "GAME OVER",
		wonMessages = ["AWESOME", "WELL DONE", "NICE PLAY", "BRILLIANT", "GREAT", "NEAT", "RIGHT ON",
					"FANTASTIC", "SUPERB", "EXCELLENT", "BRAVO", "CONGRATS", "WAY TO GO", "TERRIFIC"],
		backgroundColor = ["grey", "#5C4561"],
		that = this,
		resultButton;

	// Set up the result box
	resultButton = document.querySelector((state === 0) ? "#try-again-button" : "#keep-going-button");
	resultTile = document.querySelector("#result-tile");
	resultMessage = (state === 0) ? lostMessage : wonMessages[Math.floor(Math.random() * wonMessages.length)];

	setTimeout(function() {
		// Display the result box for the appropriate state
		that.resultBox.style.display = "block";
		document.querySelector("#result-background").style.backgroundColor = backgroundColor[state];
		document.querySelector("#result-message").textContent = resultMessage;
		that.removeTile(resultTile);
		that.addTile(resultTile, score);
		resultButton.style.display = "block";

		resultButton.addEventListener("click", function() {
			that.resultBox.style.display = "";
		});
	}, 300);

};

// DOCUMENT READY  //
// // // // // // //
window.onload = function() {

	// Resize
	var game = document.querySelector("#game");
	var resizeHandler = function() {
		var marginTop = (window.innerHeight - game.offsetHeight) / 2;
		if (marginTop > 0) {
			game.style.marginTop = marginTop + "px";
		}
	};

	resizeHandler();
	window.onresize = resizeHandler;

	// Game Logic
	// // // // //
	var myGame = new Game(new DOMDisplay());
	myGame.start();

	// "How to play" message
	var messageDisplay = document.querySelector("#message-box");
	var messageTimeout = setTimeout(function() {
		messageDisplay.textContent = "SWIPE OR USE ARROW KEYS TO PLAY";
	}, 4000);

	// Restart button
	var restartButton = document.querySelector("#restart");
	restartButton.addEventListener("click", function() {
		myGame.start();
	});

	// Menu buttons
	var keepGoingButton = document.querySelector("#keep-going-button");
	var tryAgainButton = document.querySelector("#try-again-button");
	keepGoingButton.addEventListener("click", function() {
		myGame.pause(1);
		keepGoingButton.style.display = "";
	});
	tryAgainButton.addEventListener("click", function() {
		myGame.start();
		tryAgainButton.style.display = "";
	});

	// Key events
	// // // // //
	addEventListener("keydown", function(event) {
		if (keyCodes.hasOwnProperty(event.keyCode)) {
			// Clear message box
			if (messageTimeout) {
				clearTimeout(messageTimeout);
				messageDisplay.textContent = "";
			}

			// Make the move
			myGame.move(keyCodes[event.keyCode]);
			event.preventDefault();
		}
	});

	// Touch events
	// // // // // //
	var board = document.querySelector("#board"),
		startX = null,
		startY = null,
		direction = null;

	board.addEventListener("touchstart", function(event) {
		var toucheStart = event.touches;
		if (toucheStart.length > 1)
			return;

		// Start position
		startX = toucheStart[0].clientX;
		startY = toucheStart[0].clientY;
	}, false);

	board.addEventListener("touchmove", function(event) {
		event.preventDefault();
	}, false);

	board.addEventListener("touchend", function(event) {
		if (!startX || !startY)
			return;

		var touchEnd = event.changedTouches;
		if (touchEnd.length > 1)
			return;

		// End position
		var endX = touchEnd[0].clientX,
			endY = touchEnd[0].clientY;

		// Distance moved
		var diffX = endX - startX,
			diffY = endY - startY;

		// Test direction to slide
		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 0)
				direction = "right";
			else if (diffX < 0)
				direction = "left";
		} else {
			if (diffY > 0)
				direction = "down";
			else if (diffY < 0)
				direction = "up";
		}

		// Move in specific direction
		if (direction) {
			// Clear message box
			if (messageTimeout) {
				clearTimeout(messageTimeout);
				messageDisplay.textContent = "";
			}

			myGame.move(direction);
		}

		// Reset
		startX = null;
		startY = null;
		direction = null;
	}, false);
};
