let scene, camera, renderer, ball, platform, bricks;
let ballVelocity = new THREE.Vector3(0.15, -0.15, 0);
let gameState = {
    score: 0,
    level: 1,
    isGameOver: false,
    ballInPlay: false
};

// Add these variables at the top with other global variables
let powerUps = [];
const POWER_UP_CHANCE = 0.2; // 20% chance for power-up to spawn when breaking a brick

function init() {
    console.log('Initializing game...');
    try {
        // Create scene
        scene = new THREE.Scene();
        console.log('Scene created');
        
        scene.background = new THREE.Color(0x808080); // Medium gray background
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        console.log('Camera created');
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        console.log('Renderer created');
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        const container = document.getElementById('game-container');
        if (!container) {
            throw new Error('Game container not found');
        }
        container.appendChild(renderer.domElement);
        console.log('Renderer added to container');

        // Add walls - Add this new section here
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000, // Change to black
            transparent: true,
            opacity: 0.7     // Increased opacity to make the black more visible
        });

        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 20, 1),
            wallMaterial
        );
        leftWall.position.set(-9.25, 0, 0);
        scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 20, 1),
            wallMaterial
        );
        rightWall.position.set(9.25, 0, 0);
        scene.add(rightWall);

        const topWall = new THREE.Mesh(
            new THREE.BoxGeometry(19, 0.5, 1),
            wallMaterial
        );
        topWall.position.set(0, 9.25, 0);
        scene.add(topWall);

        // Create platform first
        const platformGeometry = new THREE.BoxGeometry(5, 0.5, 1);
        const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, -8, 0);
        scene.add(platform);
        console.log('Platform created');
        
        // Create ball after platform
        const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        ball = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(ball);
        resetBall(); // Now resetBall() can access platform.position
        console.log('Ball created');

        // Rest of the initialization...
        createBricks();

        // Replace the existing lighting section with this enhanced lighting setup
        const mainLight = new THREE.PointLight(0xffffff, 1.5, 100);
        mainLight.position.set(0, 10, 10);
        scene.add(mainLight);

        const secondaryLight = new THREE.PointLight(0xffffff, 0.8, 100);
        secondaryLight.position.set(0, -10, 10);
        scene.add(secondaryLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        scene.add(ambientLight);

        const leftLight = new THREE.PointLight(0xffffff, 0.5, 50);
        leftLight.position.set(-15, 0, 10);
        scene.add(leftLight);

        const rightLight = new THREE.PointLight(0xffffff, 0.5, 50);
        rightLight.position.set(15, 0, 10);
        scene.add(rightLight);

        // Position camera
        camera.position.z = 15;

        // Add event listeners
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('click', startGame);
        window.addEventListener('resize', onWindowResize);
        
        // Start animation
        animate();
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error in init:', error);
    }
}

function createBricks() {
    bricks = [];
    const brickGeometry = new THREE.BoxGeometry(2, 1, 1);
    const colors = [0x0000ff, 0x00ff00, 0xff0000]; // Different colors for each row

    for(let i = 0; i < 5; i++) {
        for(let j = 0; j < 3; j++) {
            const brickMaterial = new THREE.MeshPhongMaterial({ color: colors[j] });
            const brick = new THREE.Mesh(brickGeometry, brickMaterial);
            brick.position.set(i * 2.5 - 5, j * 1.5 + 5, 0);
            scene.add(brick);
            bricks.push(brick);
        }
    }
}

function resetBall() {
    ball.position.set(platform.position.x, -7, 0);
    ballVelocity.set(0.15, 0.15, 0);
    gameState.ballInPlay = false;
}

function startGame() {
    if (!gameState.ballInPlay) {
        gameState.ballInPlay = true;
    }
}

function onMouseMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    platform.position.x = THREE.MathUtils.clamp(x * 8, -8, 8);
    if (!gameState.ballInPlay) {
        ball.position.x = platform.position.x;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkCollision(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}

// Add this new function to create power-ups
function createPowerUp(position) {
    const powerUpGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const powerUpMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 }); // Yellow color
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.position.copy(position);
    powerUp.userData.type = 'paddleSize';
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Add this function to handle power-up effects
function activatePowerUp(type) {
    if (type === 'paddleSize') {
        // Increase platform size
        platform.scale.x += 0.5;
        document.getElementById('power-up-status').textContent = 'Bigger Paddle!';
        
        // Reset after 10 seconds
        setTimeout(() => {
            platform.scale.x = 1;
            document.getElementById('power-up-status').textContent = 'None';
        }, 10000);
    }
}

// Modify the handleCollisions function to include power-up collision detection
function handleCollisions() {
    // Platform collision
    if (checkCollision(ball, platform)) {
        const relativePosition = (ball.position.x - platform.position.x) / 2.5;
        ballVelocity.y = Math.abs(ballVelocity.y); // Reverse vertical direction
        ballVelocity.x = relativePosition * 0.2; // Add horizontal influence based on hit position
    }

    // Brick collisions
    for (let i = bricks.length - 1; i >= 0; i--) {
        if (checkCollision(ball, bricks[i])) {
            // Store brick position before removing it
            const brickPos = bricks[i].position.clone();
            scene.remove(bricks[i]);
            bricks.splice(i, 1);
            ballVelocity.y *= -1;
            gameState.score += 10;
            document.getElementById('score-value').textContent = gameState.score;
            
            // Chance to spawn power-up
            if (Math.random() < POWER_UP_CHANCE) {
                createPowerUp(brickPos);
            }
            
            if (bricks.length === 0) {
                levelUp();
            }
            break;
        }
    }

    // Wall collisions
    if (ball.position.x > 9 || ball.position.x < -9) {
        ballVelocity.x *= -1;
    }
    if (ball.position.y > 9) {
        ballVelocity.y *= -1;
    }
    
    // Bottom collision (game over)
    if (ball.position.y < -10) {
        gameOver();
    }

    // Power-up collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.position.y -= 0.1; // Make power-up fall

        if (checkCollision(platform, powerUp)) {
            activatePowerUp(powerUp.userData.type);
            scene.remove(powerUp);
            powerUps.splice(i, 1);
        } else if (powerUp.position.y < -10) {
            // Remove power-up if it falls off screen
            scene.remove(powerUp);
            powerUps.splice(i, 1);
        }
    }
}

function levelUp() {
    gameState.level++;
    document.getElementById('level-value').textContent = gameState.level;
    resetBall();
    createBricks();
    
    // Increase ball speed with each level
    ballVelocity.multiplyScalar(1.2);
}

function gameOver() {
    gameState.isGameOver = true;
    alert(`Game Over! Final Score: ${gameState.score}`);
    resetGame();
}

// Modify resetGame to clear power-ups
function resetGame() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.isGameOver = false;
    document.getElementById('score-value').textContent = '0';
    document.getElementById('level-value').textContent = '1';
    
    // Clear existing bricks
    bricks.forEach(brick => scene.remove(brick));
    bricks = [];
    
    // Clear power-ups
    powerUps.forEach(powerUp => scene.remove(powerUp));
    powerUps = [];
    platform.scale.x = 1; // Reset paddle size
    document.getElementById('power-up-status').textContent = 'None';
    
    resetBall();
    createBricks();
}

function updateGame() {
    if (gameState.ballInPlay && !gameState.isGameOver) {
        ball.position.add(ballVelocity);
        handleCollisions();
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Make sure init is called
console.log('Script loaded');
init();