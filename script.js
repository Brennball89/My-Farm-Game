// =========================================================================
// 1. CORE SYSTEM STATE GAME ENGINE DATA CONFIGURATIONS
// =========================================================================
let currentUser = null;
let isRegisterMode = true; // toggles registration vs login modes

let money = 50;
let selectedSeed = 'carrot';
let rebirths = 0;
let moneyMultiplier = 1.0;
let currentRebirthCost = 30000;

// Massive 11 Crop Inventory Database - Sell values set exactly to 1.3x buying cost!
const cropData = {
    carrot:   { name: 'Carrot',    emoji: '🥕', cost: 10,     sell: 13,        time: 3,   color: '#ffb74d' }, // $10 * 1.3 = $13
    cucumber: { name: 'Cucumber',  emoji: '🥒', cost: 35,     sell: 46,        time: 7,   color: '#a5d6a7' }, // $35 * 1.3 = $46
    tomato:   { name: 'Tomato',    emoji: '🍅', cost: 120,    sell: 156,       time: 12,  color: '#ef9a9a' }, // $120 * 1.3 = $156
    grape:    { name: 'Grapes',    emoji: '🍇', cost: 450,    sell: 585,       time: 20,  color: '#ce93d8' }, // $450 * 1.3 = $585
    pumpkin:  { name: 'Pumpkin',   emoji: '🎃', cost: 1800,   sell: 2340,      time: 35,  color: '#ffcc80' }, // $1800 * 1.3 = $2340
    mango:    { name: 'Mango',     emoji: '🥭', cost: 7000,   sell: 9100,      time: 50,  color: '#ffe082' }, // $7000 * 1.3 = $9100
    melon:    { name: 'Melon',     emoji: '🍉', cost: 25000,  sell: 32500,     time: 75,  color: '#81c784' }, // $25000 * 1.3 = $32500
    berry:    { name: 'Blueberry', emoji: '🫐', cost: 90000,  sell: 117000,    time: 100, color: '#9fa8da' }, // $90000 * 1.3 = $117000
    pineapple:{ name: 'Pineapple', emoji: '🍍', cost: 350000, sell: 455000,    time: 140, color: '#fff59d' }, // $350000 * 1.3 = $455000
    golden:   { name: 'Gold Apple',emoji: '🍏', cost: 1500000,sell: 1950000,   time: 180, color: '#c5e1a5' }, // $1500000 * 1.3 = $1950000
    starfruit:{ name: 'Starfruit', emoji: '⭐',  cost: 6000000,sell: 7800000,   time: 245, color: '#fff59d' }  // $6000000 * 1.3 = $7800000
};

let totalPlotsCount = 24;
let plots = [];

// Initialize all plot dataset tracking states arrays
function initPlotsDataset() {
    plots = Array(totalPlotsCount).fill(null).map((_, index) => {
        let initialUnlockedCount = 9 + rebirths;
        return {
            state: index < initialUnlockedCount ? 'empty' : 'locked',
            cropType: null,
            timeLeft: 0,
            timerId: null
        };
    });
}

// =========================================================================
// 2. USER PROFILE AUTHENTICATION INTERFACE SYSTEMS
// =========================================================================
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-error').innerText = "";
    document.getElementById('auth-title').innerText = isRegisterMode ? "🌾 Create Farm Account" : "🌾 Account Log In";
    document.getElementById('primary-auth-btn').innerText = isRegisterMode ? "Register Account" : "Log In";
    document.getElementById('toggle-link-text').innerText = isRegisterMode ? "Log In here" : "Register here";
}
function handleAuthSubmit() {
    const user = document.getElementById('username-input').value.trim();
    const pass = document.getElementById('password-input').value.trim();
    const errorEl = document.getElementById('auth-error');

    if (!user || !pass) {
        errorEl.innerText = "⚠️ Inputs cannot be empty!";
        return;
    }

    let usersDatabase = JSON.parse(localStorage.getItem('farm_tycoon_users')) || {};

    if (isRegisterMode) {
        if (usersDatabase[user]) {
            errorEl.innerText = "❌ Username already taken!";
            return;
        }
        usersDatabase[user] = {
            password: pass,
            gameData: { money: 50, rebirths: 0, moneyMultiplier: 1.0, currentRebirthCost: 30000 }
        };
        localStorage.setItem('farm_tycoon_users', JSON.stringify(usersDatabase));
        alert("🎉 Account created successfully! Logging you in...");
    } else {
        if (!usersDatabase[user] || usersDatabase[user].password !== pass) {
            errorEl.innerText = "❌ Username or password incorrect!";
            return;
        }
    }

    currentUser = user;
    loadUserData();
    
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-game').classList.remove('hidden');
    document.getElementById('welcome-user').innerText = `👋 Welcome, ${currentUser}!`;

    buildShopInterface();
    buildGridPlotsInterface();
    updateDisplayPanels();
}

function handleLogout() {
    const userConfirmed = confirm("⚠️ WARNING: If you log out, your currently growing crops will despawn! Do you still want to log out?");
    
    if (!userConfirmed) {
        return; 
    }

    saveUserData();
    plots.forEach(plot => { if (plot.timerId) clearInterval(plot.timerId); });
    
    currentUser = null;
    document.getElementById('username-input').value = "";
    document.getElementById('password-input').value = "";
    
    document.getElementById('main-game').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}

function handleResetGame() {
    const firstCheck = confirm("⚠️ DANGER: Are you sure you want to RESET your entire farm progress? You will lose all your money, rebirths, and multipliers!");
    if (!firstCheck) return; 

    const secondCheck = confirm("🛑 FINAL WARNING: This cannot be undone! Your account will be completely wiped back to day one. Proceed?");
    if (!secondCheck) return; 

    plots.forEach(plot => { if (plot.timerId) clearInterval(plot.timerId); });

    money = 50;
    selectedSeed = 'carrot';
    rebirths = 0;
    moneyMultiplier = 1.0;
    currentRebirthCost = 30000;

    initPlotsDataset();
    saveUserData();

    buildShopInterface();
    buildGridPlotsInterface();
    updateDisplayPanels();

    alert("🔄 Your farm has been successfully reset to day one! Happy farming!");
}

// =========================================================================
// 3. SECURE SYSTEM REGISTRATION INTERFACES
// =========================================================================
function saveUserData() {
    if (!currentUser) return;
    let usersDatabase = JSON.parse(localStorage.getItem('farm_tycoon_users')) || {};
    if (usersDatabase[currentUser]) {
        usersDatabase[currentUser].gameData = {
            money: money,
            rebirths: rebirths,
            moneyMultiplier: moneyMultiplier,
            currentRebirthCost: currentRebirthCost
        };
        localStorage.setItem('farm_tycoon_users', JSON.stringify(usersDatabase));
    }
}

function loadUserData() {
    let usersDatabase = JSON.parse(localStorage.getItem('farm_tycoon_users')) || {};
    if (usersDatabase[currentUser]) {
        let saved = usersDatabase[currentUser].gameData;
        money = saved.money;
        rebirths = saved.rebirths;
        moneyMultiplier = saved.moneyMultiplier;
        currentRebirthCost = saved.currentRebirthCost;
    }
    initPlotsDataset();
}
// =========================================================================
// 4. INTERFACE DOM NODE ELEMENT BUILDERS
// =========================================================================
function buildShopInterface() {
    const container = document.getElementById('seeds-container');
    container.innerHTML = "";
    Object.keys(cropData).forEach((key) => {
        let crop = cropData[key];
        let activeClass = key === selectedSeed ? 'active' : '';
        container.innerHTML += `
            <button class="seed-btn ${activeClass}" id="seed-${key}" style="background-color: ${crop.color}" onclick="selectSeed('${key}')">
                ${crop.emoji} ${crop.name}
                <small>Buy: $${crop.cost.toLocaleString()}<br>Base Sell: $${crop.sell.toLocaleString()}<br>⏱️ ${crop.time}s</small>
            </button>
        `;
    });
}

function buildGridPlotsInterface() {
    const grid = document.getElementById('farm-grid');
    grid.innerHTML = "";
    plots.forEach((plot, index) => {
        let content = '<span class="status">Empty</span>';
        let stateClass = plot.state;
        if (plot.state === 'locked') content = '🔒<br>Locked';
        grid.innerHTML += `<div class="plot ${stateClass}" id="plot-${index}" onclick="clickPlot(${index})">${content}</div>`;
    });
}

function selectSeed(seedType) {
    selectedSeed = seedType;
    document.querySelectorAll('.seed-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`seed-${seedType}`).classList.add('active');
}

// =========================================================================
// 5. INTERACTIVE SIMULATION GAME LOOP TICK IMPLEMENTATIONS
// =========================================================================
function triggerScreenShake() {
    const container = document.querySelector('.game-container');
    container.classList.add('shake');
    setTimeout(() => { container.classList.remove('shake'); }, 400);
}

function clickPlot(index) {
    let plot = plots[index];
    let plotEl = document.getElementById(`plot-${index}`);
    if (plot.state === 'locked') return; 

    if (plot.state === 'empty') {
        let crop = cropData[selectedSeed];
        if (money >= crop.cost) {
            money -= crop.cost;
            updateDisplayPanels();
            saveUserData(); 

            plot.state = 'growing';
            plot.cropType = selectedSeed;
            plot.timeLeft = crop.time;
            plotEl.className = "plot growing";
            plotEl.innerHTML = `🌱 Growing<br>⏱️ ${plot.timeLeft}s`;

            plot.timerId = setInterval(() => {
                plot.timeLeft--;
                if (plot.timeLeft <= 0) {
                    clearInterval(plot.timerId);
                    plot.state = 'ready';
                    plotEl.className = "plot ready";
                    plotEl.innerHTML = `${crop.emoji}<br>HARVEST`;
                } else {
                    plotEl.innerHTML = `🌱 Growing<br>⏱️ ${plot.timeLeft}s`;
                }
            }, 1000);
        } else {
            triggerScreenShake();
        }
    } 
    else if (plot.state === 'ready') {
        let crop = cropData[plot.cropType];
        money += Math.round(crop.sell * moneyMultiplier);
        plot.state = 'empty';
        plot.cropType = null;
        plotEl.className = "plot empty";
        plotEl.innerHTML = '<span class="status">Empty</span>';
        updateDisplayPanels();
        saveUserData(); 
    }
}

function triggerRebirth() {
    if (money >= currentRebirthCost) {
        plots.forEach(plot => { if (plot.timerId) clearInterval(plot.timerId); });
        money = 50; 
        rebirths++;
        moneyMultiplier = parseFloat((moneyMultiplier * 1.25).toFixed(2));
        currentRebirthCost = currentRebirthCost * 5; 
        selectedSeed = 'carrot';
        
        initPlotsDataset();
        buildShopInterface();
        buildGridPlotsInterface();
        updateDisplayPanels();
        saveUserData(); 
        
        alert(`🌟 Rebirth #${rebirths} processed! Your earnings multiplier is now ${moneyMultiplier}x!`);
    } else {
        triggerScreenShake();
    }
}

function updateDisplayPanels() {
    document.getElementById('money-display').innerText = `💰 Money: $${money.toLocaleString()}`;
    document.getElementById('multiplier-display').innerText = `⚡ Multiplier: ${moneyMultiplier}x`;
    document.getElementById('rebirth-count').innerText = `🌟 Rebirths: ${rebirths}`;
    
    const rebirthBtn = document.getElementById('rebirth-btn');
    if (money >= currentRebirthCost) {
        reb1rthBtn.className = "";
        rebirthBtn.innerText = `READY! Rebirth (Costs $${currentRebirthCost.toLocaleString()})`;
    } else {
        rebirthBtn.className = "disabled";
        rebirthBtn.innerText = `🔒 Rebirth (Req: $${currentRebirthCost.toLocaleString()})`;
    }
}

// =========================================================================
// 6. SYSTEM RUNTIME STARTUP CORES
// =========================================================================
initPlotsDataset();
