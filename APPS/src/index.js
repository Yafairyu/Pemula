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

const URL = "https://teachablemachine.withgoogle.com/models/cZhGo_gpJ/";
import * as speechCommands from '@tensorflow-models/speech-commands'; // Import model suara

// Variables for classifier and label
let classifier;
let label = 'listening...'; // Default label for audio

import * as tf from '@tensorflow/tfjs';

// Game state variables
let gameStart, gameOver, bird, pipe, floor, gameButton, gameText, score, storage, bestScore;
let spriteImage;  // Declare globally

async function setBackend() {
  try {
    await tf.setBackend('webgl');  // Atur backend ke WebGL (disarankan untuk kecepatan lebih)
    console.log('Backend set to WebGL');
  } catch (error) {
    console.error('Error setting backend:', error);
    await tf.setBackend('cpu');  // Fallback ke CPU jika WebGL gagal
    console.log('Backend set to CPU');
  }
}

async function createModel() {
    const checkpointURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    const recognizer = speechCommands.create(
        "BROWSER_FFT", 
        undefined, 
        checkpointURL,
        metadataURL
    );

    await recognizer.ensureModelLoaded();
    return recognizer;
}

async function init() {
    await setBackend(); // Set backend untuk TensorFlow.js
    const recognizer = await createModel(); // Mengambil model suara
    const classLabels = recognizer.wordLabels(); // Mendapatkan label dari model suara
let clapLocked = false; // true = sedang mengabaikan suara clap yang sama

recognizer.listen(result => {
    const scores = result.scores;
    let detectedLabel = null;
    let maxScore = 0;

    // Temukan label dengan skor tertinggi
    for (let i = 0; i < classLabels.length; i++) {
        if (scores[i] > maxScore) {
            maxScore = scores[i];
            detectedLabel = classLabels[i];
        }
    }

    if (maxScore > 0.75) {
        if (detectedLabel === "clap") {
            if (!clapLocked) {
                console.log("Clap detected and accepted!");

                if (bird && !bird.isDead()) {
                    triggerBirdJump();
                }

                // Kunci sampai suara berubah
                clapLocked = true;
            } else {
                console.log("Clap detected but ignored (still locked).");
            }
        } else {
            // Suara sudah berubah dari "clap", buka kunci lagi
            if (clapLocked) {
                console.log("Different sound detected, unlocking clap.");
            }
            clapLocked = false;
        }
    }
    }, {
        includeSpectrogram: true,  // Visualisasi spektrum suara
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: false,  // Mendengarkan terus menerus walaupun tidak ada input yang dikenali
        overlapFactor: 0.9  // Mengurangi jeda antara deteksi suara
    });
}

// Fungsi untuk memulai melompatkan burung
function triggerBirdJump() {
    if (bird) {
        console.log('Triggering bird jump!');
        bird.jump();  // Panggil fungsi melompat pada objek bird
    } else {
        console.error('Bird object is not defined yet!');
    }
}

function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }

    // Tampilkan hasil label dan skor di konsol
    console.log('Detected label:', results[0].label);
    console.log('Scores:', results[0].scores);

    label = results[0].label;  // Menetapkan label yang terdeteksi
    document.getElementById('label-container').innerHTML = label;

    // Trigger aksi melompat jika "Jump" terdeteksi dengan confidence lebih dari 0.75
    if (label === 'Jump' && results[0].confidence > 0.75) {
        console.log('Jump detected, triggering bird jump');
        triggerBirdJump();  // Memanggil fungsi untuk membuat burung melompat
    }
}

// Function to start the game
window.startGame = function() {
    new window.p5(sketch, 'Game');  // Initialize p5 with the game logic
};

// Start listening to the microphone
init();  // Start the voice recognition and model listening


const sketch = p5 => {
    let background = p5.loadImage(BackgroundImage);
    spriteImage = p5.loadImage(Images);  // Load the sprite image for the bird
    let birdyFont = p5.loadFont(font);
    gameStart = false;
    gameOver = false;

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
        if (gameOver) {
            // If game is over, click anywhere on the game screen will reset the game
            resetGame();
        } else {
            // If game is ongoing, make the bird jump
            bird.jump();
            if (gameStart === false) gameStart = true;
        }
    };

    // Modify the canvas touch handler to trigger resetGame when game is over
    const canvasTouch = () => {
        if (gameOver) {
            // If game is over, touch anywhere to reset the game
            resetGame();
        } else {
            bird.jump();
            if (gameStart === false) gameStart = true;
        }
    };

    // Add a spacebar event listener to reset the game
    p5.keyPressed = (e) => {
        if (e.key === ' ' || e.key === 'r') {
            if (gameOver) {
                // If the game is over, pressing space or 'r' will reset the game
                resetGame();
            } else {
                bird.jump();  // If not over, bird will jump
            }
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
    if (gameStart && gameOver === false) {
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
