// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {
            // Registro falhou silenciosamente para não impactar o app.
        });
    });
}

// ============================================
// BANCO DE DADOS EXPANDIDO (20+ tarefas por nível)
// ============================================
const TASK_DATABASE = {
    easy: [
        { name: "Tirar o Lixo", loot: 10, difficulty: "easy", time: 5 },
        { name: "Arrumar a Cama", loot: 10, difficulty: "easy", time: 5 },
        { name: "Guardar Sapatos", loot: 8, difficulty: "easy", time: 5 },
        { name: "Regar as Plantas", loot: 12, difficulty: "easy", time: 10 },
        { name: "Guardar Louça Limpa", loot: 10, difficulty: "easy", time: 10 },
        { name: "Limpar Espelho", loot: 11, difficulty: "easy", time: 5 },
        { name: "Limpar a Mesa da Cozinha", loot: 9, difficulty: "easy", time: 5 },
        { name: "Organizar Livros", loot: 10, difficulty: "easy", time: 10 },
        { name: "Organizar Chinelos", loot: 7, difficulty: "easy", time: 5 },
        { name: "Limpar Teclado", loot: 9, difficulty: "easy", time: 5 },
        { name: "Limpar Caixinha do Juuj", loot: 9, difficulty: "easy", time: 5 },
        { name: "Organizar estante da sala", loot: 10, difficulty: "easy", time: 10 },
        { name: "Limpar Interruptores", loot: 7, difficulty: "easy", time: 5 }
    ],
    medium: [
        { name: "Limpar e organizar mesas do Escritório", loot: 20, difficulty: "medium", time: 20 },
        { name: "Dobrar Roupas", loot: 30, difficulty: "medium", time: 30 },
        { name: "Lavar a Louça", loot: 28, difficulty: "medium", time: 30 },
        { name: "Arrumar a sala", loot: 32, difficulty: "medium", time: 30 },
        { name: "Pano de Prato de Molho", loot: 28, difficulty: "medium", time: 30 },
        { name: "Limpar a Pia", loot: 22, difficulty: "medium", time: 15 },
        { name: "Organizar Gavetas", loot: 26, difficulty: "medium", time: 15 },
        { name: "Passar Aspirador ou Varrer", loot: 30, difficulty: "medium", time: 30 },
        { name: "Limpar Fogão", loot: 32, difficulty: "medium", time: 30 },
        { name: "Organizar Guarda-Roupa", loot: 28, difficulty: "medium", time: 30 },
        { name: "Limpar Janelas", loot: 30, difficulty: "medium", time: 30 },
        { name: "Organizar Despensa e lavanderia", loot: 27, difficulty: "medium", time: 30 },
        { name: "Limpar Microondas", loot: 24, difficulty: "medium", time: 15 },
        { name: "Passar Pano nos Móveis", loot: 26, difficulty: "medium", time: 15 },
        { name: "Limpar Estantes", loot: 25, difficulty: "medium", time: 15 },
        { name: "Lavar/Estender Roupa", loot: 35, difficulty: "medium", time: 20 },
        { name: "Trocar Lençóis", loot: 23, difficulty: "medium", time: 15 }
    ],
    hard: [
        { name: "Varrer/Passar Pano", loot: 50, difficulty: "hard", time: 30 },
        { name: "Lavar o Banheiro", loot: 60, difficulty: "hard", time: 60 },
        { name: "Lavar a caixinha do juuj", loot: 60, difficulty: "hard", time: 30 },
        { name: "Limpar a Cozinha", loot: 65, difficulty: "hard", time: 60 },
        { name: "Aspirar Casa Toda", loot: 55, difficulty: "hard", time: 60 },
        { name: "Limpar a Geladeira", loot: 70, difficulty: "hard", time: 60 },
        { name: "Limpar chão da cozinha e armários", loot: 58, difficulty: "hard", time: 60 },
        { name: "Organizar Guarda Roupa", loot: 62, difficulty: "hard", time: 60 },
        { name: "Limpar Área Externa", loot: 68, difficulty: "hard", time: 60 },
        { name: "Faxina na Sala", loot: 56, difficulty: "hard", time: 60 },
        { name: "Limpar Todos os Vidros", loot: 54, difficulty: "hard", time: 60 },
        { name: "Limpar Armários por Dentro", loot: 60, difficulty: "hard", time: 60 },
        { name: "Faxina no Quarto", loot: 52, difficulty: "hard", time: 60 },
        { name: "Limpar Paredes", loot: 58, difficulty: "hard", time: 60 },
        { name: "Tirar o pó de trás dos pcs", loot: 48, difficulty: "hard", time: 30 },
        { name: "Faxina Geral na Casa", loot: 75, difficulty: "hard", time: 60 }
    ]
};

const INITIAL_SHOP = [
    { id: 1, name: "Pedir Pizza", cost: 200 },
    { id: 2, name: "Vale Massagem", cost: 100 },
    { id: 3, name: "Cinema", cost: 150 }
];

const DAILY_QUEST_TARGET = 2;

let gameState = {
    players: [],
    gold: 0,
    activeMonsters: [],
    shopItems: JSON.parse(JSON.stringify(INITIAL_SHOP)),
    initialized: false,
    activityLog: [],
    purchaseHistory: [],
    timeAvailable: null
};

let currentDayKey = null;

// ============================================
// INICIALIZAÇÃO - CORRIGIDO PARA EVITAR ERRO LUCIDE
// ============================================
function initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    } else {
        setTimeout(initIcons, 100);
    }
}

function getDateKey(date) {
    const parsed = new Date(date);
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayKey() {
    return getDateKey(new Date());
}

function getTaskByName(taskName) {
    const allTasks = Object.values(TASK_DATABASE).flat();
    return allTasks.find(task => task.name === taskName) || null;
}

function ensureTaskTimes() {
    gameState.activeMonsters = gameState.activeMonsters.map(monster => {
        if (monster.time) return monster;
        const match = getTaskByName(monster.name);
        return { ...monster, time: match ? match.time : 10 };
    });
}

function getAvailableTasksByTime(timeAvailable) {
    const activeNames = new Set(gameState.activeMonsters.map(monster => monster.name));
    const allTasks = Object.values(TASK_DATABASE).flat();
    const timeFiltered = allTasks.filter(task => typeof task.time === 'number' && task.time <= timeAvailable);
    const available = timeFiltered.filter(task => !activeNames.has(task.name));
    return {
        timeFiltered,
        available: available.length ? available : timeFiltered
    };
}

function getRandomTasks(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const unique = [];
    const names = new Set();
    shuffled.forEach(task => {
        if (unique.length >= count) return;
        if (names.has(task.name)) return;
        names.add(task.name);
        unique.push(task);
    });
    return unique;
}

function formatTimeLabel(minutes) {
    return `${minutes} min`;
}

function getDailyProgress() {
    const todayKey = getTodayKey();
    const progress = gameState.players.map(() => ({
        count: 0,
        tasks: new Set()
    }));
    
    gameState.activityLog.forEach(entry => {
        if (getDateKey(entry.date) !== todayKey) return;
        const playerIndex = gameState.players.indexOf(entry.player);
        if (playerIndex === -1) return;
        if (progress[playerIndex].tasks.has(entry.task)) return;
        progress[playerIndex].tasks.add(entry.task);
        progress[playerIndex].count += 1;
    });
    
    return progress;
}
function init() {
    const saved = localStorage.getItem('dungeonCleanersSave');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            
            if (!gameState.activityLog) gameState.activityLog = [];
            if (!gameState.purchaseHistory) gameState.purchaseHistory = [];
            if (!gameState.timeAvailable) gameState.timeAvailable = null;
            
            if (gameState.initialized) {
                ensureTaskTimes();
                showGameInterface();
                renderDungeon();
                renderShop();
                renderHistory();
                updateGold();
                renderTimeSelector();
                renderDailyStatus();
            }
        } catch (e) {
            console.error('Erro ao carregar save:', e);
        }
    }
    
    initIcons();
    currentDayKey = getTodayKey();
    setInterval(refreshDailyStatusIfNeeded, 60000);
}

function saveGame() {
    try {
        localStorage.setItem('dungeonCleanersSave', JSON.stringify(gameState));
        updateGold();
    } catch (e) {
        console.error('Erro ao salvar:', e);
    }
}

function startGame() {
    const p1 = document.getElementById('p1-name').value.trim() || "Jogador 1";
    const p2 = document.getElementById('p2-name').value.trim() || "Jogador 2";
    
    gameState.players = [p1, p2];
    gameState.initialized = true;
    
    saveGame();
    showGameInterface();
    renderDungeon();
    renderShop();
    renderHistory();
    renderTimeSelector();
    renderDailyStatus();
    
    setTimeout(initIcons, 100);
}

function showGameInterface() {
    document.getElementById('screen-setup').classList.remove('active');
    document.getElementById('screen-dungeon').classList.add('active');
    document.getElementById('app-header').style.display = 'flex';
    document.getElementById('main-nav').style.display = 'flex';
    
    initIcons();
}

function updateTimeAvailable() {
    const select = document.getElementById('time-available');
    const selectedValue = parseInt(select.value, 10);
    
    if (Number.isNaN(selectedValue)) {
        gameState.timeAvailable = null;
    } else {
        gameState.timeAvailable = selectedValue;
    }
    
    setTaskFeedback('');
    renderTimeSelector();
    saveGame();
}

function renderTimeSelector() {
    const select = document.getElementById('time-available');
    const indicator = document.getElementById('time-indicator');
    if (!select || !indicator) return;
    
    if (gameState.timeAvailable) {
        select.value = String(gameState.timeAvailable);
        indicator.textContent = `Selecionado: ${formatTimeLabel(gameState.timeAvailable)}`;
    } else {
        select.value = '';
        indicator.textContent = 'Nenhum tempo definido';
    }
}

function setTaskFeedback(message) {
    const feedback = document.getElementById('task-feedback');
    if (feedback) {
        feedback.textContent = message;
    }
}

function renderDailyStatus() {
    const dayElement = document.getElementById('current-day');
    const today = new Date();
    const dateLabel = today.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
    });
    
    if (dayElement) {
        dayElement.textContent = dateLabel;
    }
    
    const progress = getDailyProgress();
    
    gameState.players.forEach((player, index) => {
        const playerEl = document.getElementById(`quest-player-${index}`);
        const progressEl = document.getElementById(`quest-progress-${index}`);
        const itemEl = document.getElementById(`quest-item-${index}`);
        if (!playerEl || !progressEl || !itemEl) return;
        
        const count = progress[index] ? progress[index].count : 0;
        playerEl.textContent = player;
        progressEl.textContent = `${Math.min(count, DAILY_QUEST_TARGET)}/${DAILY_QUEST_TARGET}`;
        
        if (count >= DAILY_QUEST_TARGET) {
            itemEl.classList.add('complete');
        } else {
            itemEl.classList.remove('complete');
        }
    });
    
    currentDayKey = getTodayKey();
    initIcons();
}

function refreshDailyStatusIfNeeded() {
    const todayKey = getTodayKey();
    if (todayKey !== currentDayKey) {
        renderDailyStatus();
    }
}

function switchTab(tab) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`screen-${tab}`).classList.add('active');
    
    const btns = document.querySelectorAll('.nav-btn');
    if (tab === 'dungeon') btns[0].classList.add('active');
    if (tab === 'tavern') btns[1].classList.add('active');
    if (tab === 'history') btns[2].classList.add('active');
    
    if (tab === 'history') renderHistory();
    
    setTimeout(initIcons, 50);
}

// ============================================
// MODAL DE INVOCAÇÃO - RANDOMIZAÇÃO EXPANDIDA
// ============================================
function openTaskModal() {
    const modal = document.getElementById('task-modal');
    const container = document.getElementById('task-selection-cards');
    const modalTime = document.getElementById('modal-time');
    container.innerHTML = '';
    
    if (!gameState.timeAvailable) {
        setTaskFeedback('Defina o tempo disponível antes de invocar uma tarefa.');
        return;
    }
    
    const { timeFiltered, available } = getAvailableTasksByTime(gameState.timeAvailable);
    if (timeFiltered.length === 0) {
        setTaskFeedback('Não há tarefas compatíveis com esse tempo.');
        return;
    }
    
    setTaskFeedback('');
    const tasks = getRandomTasks(available, 3);
    
    const difficultyLabels = {
        easy: 'Fácil',
        medium: 'Médio',
        hard: 'Difícil'
    };
    
    if (modalTime) {
        modalTime.textContent = `Tempo disponível: ${formatTimeLabel(gameState.timeAvailable)}`;
    }
    
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-selection-card';
        card.onclick = () => selectTask(task);
        
        card.innerHTML = `
            <div class="task-selection-header ${task.difficulty}">
                <div class="task-selection-title">${task.name}</div>
                <div class="card-difficulty">${difficultyLabels[task.difficulty]}</div>
            </div>
            <div class="task-selection-body">
                <div>
                    <span style="font-weight: 700; font-size: 1.05rem;">Recompensa:</span>
                    <div class="loot-badge">
                        <i data-lucide="coins" style="width: 16px; height: 16px;"></i>
                        +${task.loot}
                    </div>
                </div>
                <div class="time-badge">
                    <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                    ${formatTimeLabel(task.time)}
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    modal.classList.add('open');
    setTimeout(initIcons, 50);
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('open');
}

function handleModalOutsideClick(event) {
    if (event.target.id === 'task-modal') {
        closeTaskModal();
    }
}

function selectTask(task) {
    const instanceTask = {
        ...task,
        id: Date.now() + Math.random()
    };
    
    gameState.activeMonsters.push(instanceTask);
    saveGame();
    
    // FECHA O MODAL IMEDIATAMENTE
    closeTaskModal();
    
    // Renderiza depois de fechar
    setTimeout(() => {
        renderDungeon();
        document.getElementById('total-gold').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('total-gold').classList.remove('pulse');
        }, 300);
    }, 100);
}

// ============================================
// MODAL DE GERENCIAMENTO
// ============================================
function openManagementModal() {
    const modal = document.getElementById('management-modal');
    const container = document.getElementById('management-list');
    container.innerHTML = '';
    
    if (gameState.activeMonsters.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">Nenhum monstro na mesa</div>
            </div>
        `;
    } else {
        const difficultyLabels = {
            easy: 'Fácil',
            medium: 'Médio',
            hard: 'Difícil'
        };
        
        gameState.activeMonsters.forEach((monster, index) => {
            const item = document.createElement('div');
            item.className = 'management-item';
            
            item.innerHTML = `
                <div class="management-item-info">
                    <h4>${monster.name}</h4>
                    <div class="management-item-meta">
                        <span class="card-difficulty ${monster.difficulty}">${difficultyLabels[monster.difficulty]}</span>
                        <span class="loot-badge">
                            <i data-lucide="coins" style="width: 14px; height: 14px;"></i>
                            ${monster.loot}
                        </span>
                        <span class="time-badge">
                            <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                            ${formatTimeLabel(monster.time)}
                        </span>
                    </div>
                </div>
                <button class="icon-btn" onclick="removeMonster(${monster.id})">
                    <i data-lucide="trash-2" style="width: 24px; height: 24px; color: #EF476F;"></i>
                </button>
            `;
            
            container.appendChild(item);
        });
    }
    
    modal.classList.add('open');
    setTimeout(initIcons, 50);
}

function closeManagementModal() {
    document.getElementById('management-modal').classList.remove('open');
}

function handleManagementOutsideClick(event) {
    if (event.target.id === 'management-modal') {
        closeManagementModal();
    }
}

function removeMonster(id) {
    const index = gameState.activeMonsters.findIndex(m => m.id === id);
    if (index !== -1) {
        const monster = gameState.activeMonsters[index];
        if (confirm(`Remover "${monster.name}" da mesa?`)) {
            gameState.activeMonsters.splice(index, 1);
            saveGame();
            renderDungeon();
            openManagementModal(); // Recarrega o modal
        }
    }
}

function clearAllMonsters() {
    if (gameState.activeMonsters.length === 0) {
        alert('Não há monstros para limpar!');
        return;
    }
    
    if (confirm(`Remover TODOS os ${gameState.activeMonsters.length} monstros da mesa?`)) {
        gameState.activeMonsters = [];
        saveGame();
        renderDungeon();
        closeManagementModal();
    }
}

// ============================================
// MECÂNICA: MASMORRA
// ============================================
function killMonster(id, playerIndex) {
    const monsterIndex = gameState.activeMonsters.findIndex(m => m.id === id);
    if (monsterIndex === -1) return;
    
    const monster = gameState.activeMonsters[monsterIndex];
    const player = gameState.players[playerIndex];
    
    gameState.gold += monster.loot;
    
    gameState.activityLog.unshift({
        player: player,
        task: monster.name,
        gold: monster.loot,
        date: new Date().toISOString()
    });
    
    gameState.activeMonsters.splice(monsterIndex, 1);
    
    saveGame();
    renderDungeon();
    renderHistory();
    
    document.getElementById('total-gold').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('total-gold').classList.remove('pulse');
    }, 300);
}

function renderDungeon() {
    const container = document.getElementById('active-monsters');
    const emptyState = document.getElementById('empty-dungeon');
    
    container.innerHTML = '';
    renderTimeSelector();
    renderDailyStatus();
    
    if (gameState.activeMonsters.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }
    
    const difficultyLabels = {
        easy: 'Fácil',
        medium: 'Médio',
        hard: 'Difícil'
    };
    
    gameState.activeMonsters.forEach(monster => {
        const card = document.createElement('div');
        card.className = 'tcg-card';
        
        card.innerHTML = `
            <div class="tcg-card-header ${monster.difficulty}">
                <div class="card-title">${monster.name}</div>
                <div class="card-difficulty">${difficultyLabels[monster.difficulty]}</div>
            </div>
            <div class="tcg-card-body">
                <div class="card-stats">
                    <div>
                        <span style="font-weight: 700;">Recompensa:</span>
                        <div class="loot-badge">
                            <i data-lucide="coins" style="width: 16px; height: 16px;"></i>
                            ${monster.loot}
                        </div>
                    </div>
                    <div class="time-badge">
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                        ${formatTimeLabel(monster.time)}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-success btn-small" onclick="killMonster(${monster.id}, 0)">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                        ${gameState.players[0]}
                    </button>
                    <button class="btn btn-success btn-small" onclick="killMonster(${monster.id}, 1)">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                        ${gameState.players[1]}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    initIcons();
}

// ============================================
// SHOP
// ============================================
function renderShop() {
    const container = document.getElementById('shop-list');
    container.innerHTML = '';
    
    gameState.shopItems.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'shop-item';
        const canBuy = gameState.gold >= item.cost;
        
        el.innerHTML = `
            <div class="shop-item-info">
                <h3>${item.name}</h3>
                <div class="cost">
                    <i data-lucide="coins" style="width: 18px; height: 18px;"></i>
                    ${item.cost}
                </div>
            </div>
            <div class="shop-actions">
                <button class="btn btn-primary btn-small ${canBuy ? '' : ''}" 
                    ${canBuy ? '' : 'disabled'}
                    onclick="buyItem(${index})">
                    <i data-lucide="shopping-cart" style="width: 18px; height: 18px;"></i>
                    Comprar
                </button>
                <button class="icon-btn" onclick="deleteShopItem(${index})">
                    <i data-lucide="trash-2" style="width: 22px; height: 22px; color: #EF476F;"></i>
                </button>
            </div>
        `;
        
        container.appendChild(el);
    });
    
    initIcons();
}

function buyItem(index) {
    const item = gameState.shopItems[index];
    if (gameState.gold < item.cost) {
        alert("Ouro insuficiente! Vá limpar a casa!");
        return;
    }
    
    if (confirm(`Comprar "${item.name}" por ${item.cost} moedas?`)) {
        gameState.gold -= item.cost;
        
        gameState.purchaseHistory.unshift({
            item: item.name,
            cost: item.cost,
            date: new Date().toISOString()
        });
        
        saveGame();
        renderShop();
        renderHistory();
        
        alert(`Compra realizada!\n"${item.name}" desbloqueado!`);
    }
}

function addCustomReward() {
    const name = prompt("Nome da Recompensa:\n(ex: Jantar no Japonês)");
    if (!name || !name.trim()) return;
    
    const cost = prompt("Custo em Ouro:\n(ex: 300)");
    if (!cost || isNaN(cost) || cost <= 0) {
        alert("Valor inválido!");
        return;
    }
    
    gameState.shopItems.push({
        id: Date.now(),
        name: name.trim(),
        cost: parseInt(cost)
    });
    
    saveGame();
    renderShop();
}

function deleteShopItem(index) {
    const item = gameState.shopItems[index];
    if (confirm(`Excluir "${item.name}" da loja?`)) {
        gameState.shopItems.splice(index, 1);
        saveGame();
        renderShop();
    }
}

// ============================================
// HISTORY
// ============================================
function switchHistoryTab(tab) {
    document.querySelectorAll('.history-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.history-list').forEach(el => el.classList.remove('active'));
    
    if (tab === 'activity') {
        document.querySelectorAll('.history-tab')[0].classList.add('active');
        document.getElementById('activity-log').classList.add('active');
    } else {
        document.querySelectorAll('.history-tab')[1].classList.add('active');
        document.getElementById('purchase-history').classList.add('active');
    }
    
    initIcons();
}

function renderHistory() {
    renderActivityLog();
    renderPurchaseHistory();
}

function renderActivityLog() {
    const container = document.getElementById('activity-log');
    container.innerHTML = '';
    
    if (gameState.activityLog.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="scroll-text" style="width: 64px; height: 64px;"></i>
                </div>
                <div class="empty-state-text">Nenhuma tarefa concluída ainda</div>
            </div>
        `;
        initIcons();
        return;
    }
    
    gameState.activityLog.forEach(entry => {
        const el = document.createElement('div');
        el.className = 'history-item';
        
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        el.innerHTML = `
            <div class="history-item-header">
                <span class="history-player">${entry.player}</span>
                <span class="history-item-date">${dateStr}</span>
            </div>
            <div class="history-task">${entry.task}</div>
            <div class="loot-badge">
                <i data-lucide="coins" style="width: 14px; height: 14px;"></i>
                +${entry.gold}
            </div>
        `;
        
        container.appendChild(el);
    });
    
    initIcons();
}

function renderPurchaseHistory() {
    const container = document.getElementById('purchase-history');
    container.innerHTML = '';
    
    if (gameState.purchaseHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="shopping-cart" style="width: 64px; height: 64px;"></i>
                </div>
                <div class="empty-state-text">Nenhuma compra realizada ainda</div>
            </div>
        `;
        initIcons();
        return;
    }
    
    gameState.purchaseHistory.forEach(entry => {
        const el = document.createElement('div');
        el.className = 'history-item';
        
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        el.innerHTML = `
            <div class="history-item-header">
                <span class="history-player">${entry.item}</span>
                <span class="history-item-date">${dateStr}</span>
            </div>
            <div class="cost">
                <i data-lucide="coins" style="width: 16px; height: 16px;"></i>
                -${entry.cost}
            </div>
        `;
        
        container.appendChild(el);
    });
    
    initIcons();
}

// ============================================
// UTILS
// ============================================
function updateGold() {
    document.getElementById('total-gold').textContent = gameState.gold;
}

function hardReset() {
    if (confirm("⚠️ TEM CERTEZA?\n\nIsso vai apagar TODO o progresso, ouro, e histórico!")) {
        localStorage.removeItem('dungeonCleanersSave');
        location.reload();
    }
}

// Aguarda o DOM e Lucide carregarem completamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
