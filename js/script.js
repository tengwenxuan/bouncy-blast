let scene, camera, renderer, ball, platform, bricks;
let ballVelocity = new THREE.Vector3(0.15, -0.15, 0);
let gameState = {
    score: 0,
    level: 1,
    isGameOver: false,
    ballInPlay: false
};

function init() {
    console.log('Initializing game...');
    try {
        // Create scene
        scene = new THREE.Scene();
        console.log('Scene created');
        
        scene.background = new THREE.Color(0x000000);
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

        // Add lights
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 10, 10);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040));

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
            scene.remove(bricks[i]);
            bricks.splice(i, 1);
            ballVelocity.y *= -1;
            gameState.score += 10;
            document.getElementById('score-value').textContent = gameState.score;
            
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

function resetGame() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.isGameOver = false;
    document.getElementById('score-value').textContent = '0';
    document.getElementById('level-value').textContent = '1';
    
    // Clear existing bricks
    bricks.forEach(brick => scene.remove(brick));
    bricks = [];
    
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