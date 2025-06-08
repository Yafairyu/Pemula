import './main.scss';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './game/constants';
import Pipe from './game/pipe';
import Bird from './game/bird';
import Floor from './game/floor';
import Text from './game/gameText';
import Button from './game/gameButton';
import P5 from 'p5';
import Images from './assets/sprite.png';
import BackgroundImage from './assets/background.png';
import font from './assets/FlappyBirdy.ttf';
import Storage from './storage';

import p5 from 'p5'; // Import p5.js as a module
window.p5 = p5;  // Assign it to window to make it globally available

// Game state variables
let gameStart, gameOver, bird, pipe, floor, gameButton, gameText, score, storage, bestScore, strt;
let spriteImage;  // Declare globally

async function init() {
var Recording = function(cb){
  var recorder = null;
  var recording = true;
  var audioInput = null;
  var volume = null;
  var audioContext = null;
  var callback = cb;

  navigator.getUserMedia = navigator.getUserMedia    || navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || navigator.msGetUserMedia;

  if(navigator.getUserMedia){
    navigator.getUserMedia({audio:true},
      function(e){ //success
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        volume = audioContext.createGain(); // creates a gain node
        audioInput = audioContext.createMediaStreamSource(e); // creates an audio node from the mic stream
        audioInput.connect(volume);// connect the stream to the gain node
        recorder = audioContext.createScriptProcessor(2048, 1, 1);

        recorder.onaudioprocess = function(e){
            if(!recording) return;
            var left = e.inputBuffer.getChannelData(0);
            //var right = e.inputBuffer.getChannelData(1);
            callback(new Float32Array(left));
        };
        volume.connect(recorder);// connect the recorder
        recorder.connect(audioContext.destination);
      },
      function(e){ //failure
        alert('Error capturing audio.');
      }
    );
  } else {
    alert('getUserMedia not supported in this browser.');
  }
};

var lastClap = (new Date()).getTime();

function detectClap(data){
  var t = (new Date()).getTime();
  if(t - lastClap < 200) return false; // TWEAK HERE
  var zeroCrossings = 0, highAmp = 0;
  for(var i = 1; i < data.length; i++){
    if(Math.abs(data[i]) > 0.25) highAmp++; // TWEAK HERE
    if(data[i] > 0 && data[i-1] < 0 || data[i] < 0 && data[i-1] > 0) zeroCrossings++;
  }
  if(highAmp > 20 && zeroCrossings > 30){ // TWEAK HERE
    //console.log(highAmp+' / '+zeroCrossings);
    lastClap = t;
    return true;
  }
  return false;
}

var rec = new Recording(function(data){
  if(detectClap(data)){
    console.log('clap!');
    if(bird && gameStart && !gameOver) {
        if(!bird.isDead()) terbanglah();
    }
}
});}

// Function to start the game
window.startGame = function() {
    new window.p5(sketch, 'Game');  // Initialize p5 with the game logic
};

// Start listening to the microphone
init();  // Start the voice recognition and model listening

function terbanglah() {
    strt = gameStart = 1;
    bird.jump();
}


const sketch = p5 => {
    let background = p5.loadImage(BackgroundImage);
    spriteImage = p5.loadImage(Images);  // Load the sprite image for the bird
    let birdyFont = p5.loadFont(font);
    gameStart = false;
    gameOver = false;
    strt = 0;

    const resetGame = () => {
    // Reset all game state variables
    gameStart = false;
    gameOver = false;
    bird = new Bird(p5, spriteImage);  // Inisialisasi burung
    pipe = new Pipe(p5, spriteImage);
    floor = new Floor(p5, spriteImage);
    gameText = new Text(p5, birdyFont);
    gameButton = new Button(p5, gameText, spriteImage);
    storage = new Storage();
    score = 0;
    strt = 0;
    pipe.generateFirst();
    bird.draw();
    floor.draw();
    let dataFromStorage = storage.getStorageData();

    if (dataFromStorage === null) {
        bestScore = 0;
    } else {
        bestScore = dataFromStorage.bestScore;
    }

    // Start the game again
    gameStart = true;
    };

    // Modify the canvas click handler to trigger resetGame when game is over
    const canvasClick = () => {
        if (gameOver) resetGame();
        else terbanglah();
    };

    // Modify the canvas touch handler to trigger resetGame when game is over
    const canvasTouch = () => {
        if (gameOver) resetGame();
        else terbanglah();
    };

    // Add a spacebar event listener to reset the game
    p5.keyPressed = (e) => {
        if (e.key === ' ' || e.key === 'r') {
            if (gameOver) resetGame();
            else terbanglah();
        }
    };


    p5.setup = () => {
        var canvas = p5.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        canvas.mousePressed(canvasClick);
        canvas.touchStarted(canvasTouch);
        resetGame();
    }

    p5.draw = () => {
    p5.image(background, 0, 0);
    const level = Math.floor(score / 10);
    if (gameStart && !gameOver && strt) {
        pipe.move(level);
        pipe.draw();

        bird.update();
        bird.draw();

        floor.update();
        floor.draw();

        gameOver = pipe.checkCrash(bird) || bird.isDead();

        if (pipe.getScore(bird))
            score++;
    }
    else {
        pipe.draw();
        bird.draw();
        floor.draw();
        if (gameOver) {
            bird.update();  // Burung tetap bergerak meski game over
        } else {
            floor.update();
        }
    }

    if (gameStart === false) {
        gameText.startText();
    }

    if (gameOver) {
        // Setelah game over, tampilkan hasil skor
        if (score > bestScore) {
            bestScore = score;
            storage.setStorageData({ bestScore: score });
        }

        gameText.gameOverText(score, bestScore, level);

        gameButton.resetButton(); // Reset tombol reset
    }
    else {
        gameText.scoreText(score, level);
    }
};
}
new P5(sketch, 'Game');
