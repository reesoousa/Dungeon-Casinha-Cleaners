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
        { name: "Tirar o Lixo", loot: 10, difficulty: "easy" },
        { name: "Arrumar a Cama", loot: 10, difficulty: "easy" },
        { name: "Guardar Sapatos", loot: 8, difficulty: "easy" },
        { name: "Organizar Controles", loot: 8, difficulty: "easy" },
        { name: "Regar as Plantas", loot: 12, difficulty: "easy" },
        { name: "Guardar Louça Limpa", loot: 10, difficulty: "easy" },
        { name: "Dobrar Panos de Prato", loot: 8, difficulty: "easy" },
        { name: "Organizar Revistas", loot: 9, difficulty: "easy" },
        { name: "Limpar Espelho", loot: 11, difficulty: "easy" },
        { name: "Guardar Brinquedos", loot: 10, difficulty: "easy" },
        { name: "Organizar Almofadas", loot: 7, difficulty: "easy" },
        { name: "Tirar Pó da Mesa", loot: 9, difficulty: "easy" },
        { name: "Organizar Livros", loot: 10, difficulty: "easy" },
        { name: "Limpar Porta", loot: 8, difficulty: "easy" },
        { name: "Organizar Chinelos", loot: 7, difficulty: "easy" },
        { name: "Limpar Teclado", loot: 9, difficulty: "easy" },
        { name: "Organizar Cabos", loot: 10, difficulty: "easy" },
        { name: "Limpar Monitor", loot: 9, difficulty: "easy" },
        { name: "Organizar Porta-Trecos", loot: 8, difficulty: "easy" },
        { name: "Limpar Interruptor", loot: 7, difficulty: "easy" }
    ],
    medium: [
        { name: "Organizar a Mesa", loot: 25, difficulty: "medium" },
        { name: "Dobrar Roupas", loot: 30, difficulty: "medium" },
        { name: "Lavar a Louça", loot: 28, difficulty: "medium" },
        { name: "Limpar a Pia", loot: 22, difficulty: "medium" },
        { name: "Organizar Gavetas", loot: 26, difficulty: "medium" },
        { name: "Passar Aspirador", loot: 30, difficulty: "medium" },
        { name: "Limpar Fogão", loot: 32, difficulty: "medium" },
        { name: "Organizar Guarda-Roupa", loot: 28, difficulty: "medium" },
        { name: "Limpar Janelas", loot: 30, difficulty: "medium" },
        { name: "Organizar Despensa", loot: 27, difficulty: "medium" },
        { name: "Limpar Microondas", loot: 24, difficulty: "medium" },
        { name: "Passar Pano nos Móveis", loot: 26, difficulty: "medium" },
        { name: "Organizar Armário", loot: 29, difficulty: "medium" },
        { name: "Limpar Estantes", loot: 25, difficulty: "medium" },
        { name: "Organizar Freezer", loot: 28, difficulty: "medium" },
        { name: "Limpar Box do Banheiro", loot: 30, difficulty: "medium" },
        { name: "Trocar Lençóis", loot: 23, difficulty: "medium" },
        { name: "Limpar Ventilador", loot: 26, difficulty: "medium" },
        { name: "Organizar Prateleiras", loot: 27, difficulty: "medium" },
        { name: "Limpar Tapetes", loot: 29, difficulty: "medium" }
    ],
    hard: [
        { name: "Varrer/Passar Pano", loot: 50, difficulty: "hard" },
        { name: "Limpar o Banheiro", loot: 60, difficulty: "hard" },
        { name: "Limpar a Cozinha", loot: 65, difficulty: "hard" },
        { name: "Aspirar Casa Toda", loot: 55, difficulty: "hard" },
        { name: "Limpar a Geladeira", loot: 70, difficulty: "hard" },
        { name: "Lavar/Estender Roupa", loot: 45, difficulty: "hard" },
        { name: "Limpar Azulejos", loot: 58, difficulty: "hard" },
        { name: "Organizar Closet Completo", loot: 62, difficulty: "hard" },
        { name: "Limpar Área Externa", loot: 68, difficulty: "hard" },
        { name: "Faxina na Sala", loot: 56, difficulty: "hard" },
        { name: "Limpar Todos os Vidros", loot: 54, difficulty: "hard" },
        { name: "Organizar Garagem", loot: 66, difficulty: "hard" },
        { name: "Limpar Armários por Dentro", loot: 60, difficulty: "hard" },
        { name: "Faxina no Quarto", loot: 52, difficulty: "hard" },
        { name: "Limpar Paredes", loot: 58, difficulty: "hard" },
        { name: "Organizar Documentos", loot: 48, difficulty: "hard" },
        { name: "Limpar Ar Condicionado", loot: 55, difficulty: "hard" },
        { name: "Faxina Geral na Casa", loot: 75, difficulty: "hard" },
        { name: "Limpar Quintal", loot: 64, difficulty: "hard" },
        { name: "Organizar Depósito", loot: 70, difficulty: "hard" }
    ]
};

const INITIAL_SHOP = [
    { id: 1, name: "Pedir Pizza", cost: 200 },
    { id: 2, name: "Vale Massagem", cost: 100 },
    { id: 3, name: "Cinema", cost: 150 }
];

let gameState = {
    players: [],
    gold: 0,
    activeMonsters: [],
    shopItems: JSON.parse(JSON.stringify(INITIAL_SHOP)),
    initialized: false,
    activityLog: [],
    purchaseHistory: []
};

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

function init() {
    const saved = localStorage.getItem('dungeonCleanersSave');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            
            if (!gameState.activityLog) gameState.activityLog = [];
            if (!gameState.purchaseHistory) gameState.purchaseHistory = [];
            
            if (gameState.initialized) {
                showGameInterface();
                renderDungeon();
                renderShop();
                renderHistory();
                updateGold();
            }
        } catch (e) {
            console.error('Erro ao carregar save:', e);
        }
    }
    
    initIcons();
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
    
    setTimeout(initIcons, 100);
}

function showGameInterface() {
    document.getElementById('screen-setup').classList.remove('active');
    document.getElementById('screen-dungeon').classList.add('active');
    document.getElementById('app-header').style.display = 'flex';
    document.getElementById('main-nav').style.display = 'flex';
    
    initIcons();
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
    container.innerHTML = '';
    
    // Função para pegar tarefa aleatória sem repetir as 3 últimas
    function getRandomTask(difficulty) {
        const pool = TASK_DATABASE[difficulty];
        const availableTasks = pool.filter(task => {
            return !gameState.activeMonsters.some(m => m.name === task.name);
        });
        
        if (availableTasks.length === 0) return pool[Math.floor(Math.random() * pool.length)];
        return availableTasks[Math.floor(Math.random() * availableTasks.length)];
    }
    
    const easyTask = getRandomTask('easy');
    const mediumTask = getRandomTask('medium');
    const hardTask = getRandomTask('hard');
    
    const tasks = [easyTask, mediumTask, hardTask];
    
    const difficultyLabels = {
        easy: 'Fácil',
        medium: 'Médio',
        hard: 'Difícil'
    };
    
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
                <span style="font-weight: 700; font-size: 1.05rem;">Recompensa:</span>
                <div class="loot-badge">
                    <i data-lucide="coins" style="width: 16px; height: 16px;"></i>
                    +${task.loot}
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
                    <span style="font-weight: 700;">Recompensa:</span>
                    <div class="loot-badge">
                        <i data-lucide="coins" style="width: 16px; height: 16px;"></i>
                        ${monster.loot}
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
