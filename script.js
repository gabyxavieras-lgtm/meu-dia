// Variáveis globais para gerenciar dados
let agendaItems = [];
let notes = [];
let goals = [];
let reflections = {};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    initializeFeelingSelector();
    
    // Configurar data mínima para metas (hoje)
    const goalDeadlineInput = document.getElementById('goalDeadline');
    if (goalDeadlineInput) {
        const today = new Date().toISOString().split('T')[0];
        goalDeadlineInput.min = today;
    }
});

// === SELETOR DE SENTIMENTOS ===
function initializeFeelingSelector() {
    const feelingOptions = document.querySelectorAll('.feeling-option');
    const hiddenInput = document.getElementById('dayFeeling');
    
    feelingOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove seleção anterior
            feelingOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Adiciona seleção atual
            this.classList.add('selected');
            
            // Atualiza o input hidden
            const value = this.getAttribute('data-value');
            hiddenInput.value = value;
            
            // Adiciona feedback visual
            this.style.animation = 'pulse 0.3s ease-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
        });
    });
}

function setFeelingValue(value) {
    const feelingOptions = document.querySelectorAll('.feeling-option');
    const hiddenInput = document.getElementById('dayFeeling');
    
    // Remove todas as seleções
    feelingOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Seleciona o valor correto
    const selectedOption = document.querySelector(`[data-value="${value}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Atualiza o input hidden
    hiddenInput.value = value;
}

// Atualizar horário atual
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('currentTime').innerHTML = `
        <div style="text-align: right;">
            <div style="font-size: 1.2em; font-weight: 600;">${timeString}</div>
            <div style="font-size: 0.85em; opacity: 0.8; text-transform: capitalize;">${dateString}</div>
        </div>
    `;
}

// === SISTEMA DE ARMAZENAMENTO ===
function saveData() {
    const data = {
        agendaItems,
        notes,
        goals,
        reflections,
        lastUpdate: new Date().toISOString()
    };
    localStorage.setItem('meuDiaApp', JSON.stringify(data));
}

function loadData() {
    const data = localStorage.getItem('meuDiaApp');
    if (data) {
        const parsed = JSON.parse(data);
        agendaItems = parsed.agendaItems || [];
        notes = parsed.notes || [];
        goals = parsed.goals || [];
        reflections = parsed.reflections || {};
        
        renderAgenda();
        renderNotes();
        renderGoals();
        loadTodayReflection();
    }
}

// === SISTEMA DE REFLEXÃO DIÁRIA ===
function saveReflection() {
    const today = new Date().toISOString().split('T')[0];
    const dayFeeling = document.getElementById('dayFeeling').value;
    const productivity = document.getElementById('productivity').value;
    const gratitude = document.getElementById('gratitude').value;
    const tomorrow = document.getElementById('tomorrow').value;
    
    if (!dayFeeling || !productivity.trim()) {
        showToast('Por favor, preencha pelo menos como você está se sentindo e o que fez de produtivo.', 'warning');
        return;
    }
    
    reflections[today] = {
        dayFeeling,
        productivity: productivity.trim(),
        gratitude: gratitude.trim(),
        tomorrow: tomorrow.trim(),
        timestamp: new Date().toISOString()
    };
    
    saveData();
    showToast('Reflexão salva com sucesso! 🌟', 'success');
}

function loadTodayReflection() {
    const today = new Date().toISOString().split('T')[0];
    const todayReflection = reflections[today];
    
    if (todayReflection) {
        setFeelingValue(todayReflection.dayFeeling || '');
        document.getElementById('productivity').value = todayReflection.productivity || '';
        document.getElementById('gratitude').value = todayReflection.gratitude || '';
        document.getElementById('tomorrow').value = todayReflection.tomorrow || '';
    }
}

// === SISTEMA DE AGENDA ===
function addAgendaItem() {
    const form = document.getElementById('agendaForm');
    form.style.display = 'block';
    form.classList.add('fade-in');
    document.getElementById('agendaTime').focus();
}

function cancelAgendaForm() {
    const form = document.getElementById('agendaForm');
    form.style.display = 'none';
    clearAgendaForm();
}

function clearAgendaForm() {
    document.getElementById('agendaTime').value = '';
    document.getElementById('agendaTask').value = '';
    document.getElementById('agendaPriority').value = 'medium';
}

function saveAgendaItem() {
    const time = document.getElementById('agendaTime').value;
    const task = document.getElementById('agendaTask').value.trim();
    const priority = document.getElementById('agendaPriority').value;
    
    if (!time || !task) {
        showToast('Por favor, preencha o horário e a tarefa.', 'warning');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        time,
        task,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    agendaItems.push(newItem);
    agendaItems.sort((a, b) => a.time.localeCompare(b.time));
    
    saveData();
    renderAgenda();
    cancelAgendaForm();
    showToast('Compromisso adicionado à agenda! 📅', 'success');
}

function toggleAgendaItem(id) {
    const item = agendaItems.find(item => item.id === id);
    if (item) {
        item.completed = !item.completed;
        saveData();
        renderAgenda();
        showToast(item.completed ? 'Tarefa concluída! ✅' : 'Tarefa reaberta', 'success');
    }
}

function deleteAgendaItem(id) {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
        agendaItems = agendaItems.filter(item => item.id !== id);
        saveData();
        renderAgenda();
        showToast('Compromisso excluído', 'success');
    }
}

function renderAgenda() {
    const container = document.getElementById('agendaList');
    
    if (agendaItems.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum compromisso agendado para hoje.</p>';
        return;
    }
    
    container.innerHTML = agendaItems.map(item => `
        <div class="agenda-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
            <div class="agenda-time">${item.time}</div>
            <div class="agenda-task">
                <div class="priority-indicator priority-${item.priority}"></div>
                ${item.task}
            </div>
            <div class="agenda-actions">
                <button onclick="toggleAgendaItem(${item.id})" class="btn btn-sm ${item.completed ? 'btn-secondary' : 'btn-primary'}" title="${item.completed ? 'Marcar como pendente' : 'Marcar como concluído'}">
                    <i class="fas fa-${item.completed ? 'undo' : 'check'}"></i>
                </button>
                <button onclick="deleteAgendaItem(${item.id})" class="btn btn-sm btn-danger" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// === SISTEMA DE NOTAS ===
function addNote() {
    const form = document.getElementById('noteForm');
    form.style.display = 'block';
    form.classList.add('fade-in');
    document.getElementById('noteTitle').focus();
}

function cancelNoteForm() {
    const form = document.getElementById('noteForm');
    form.style.display = 'none';
    clearNoteForm();
}

function clearNoteForm() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (!title || !content) {
        showToast('Por favor, preencha o título e o conteúdo da nota.', 'warning');
        return;
    }
    
    const newNote = {
        id: Date.now(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(newNote);
    
    saveData();
    renderNotes();
    cancelNoteForm();
    showToast('Nota criada com sucesso! 📝', 'success');
}

function deleteNote(id) {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
        notes = notes.filter(note => note.id !== id);
        saveData();
        renderNotes();
        showToast('Nota excluída', 'success');
    }
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const newTitle = prompt('Novo título:', note.title);
    if (newTitle === null) return;
    
    const newContent = prompt('Novo conteúdo:', note.content);
    if (newContent === null) return;
    
    if (newTitle.trim() && newContent.trim()) {
        note.title = newTitle.trim();
        note.content = newContent.trim();
        note.updatedAt = new Date().toISOString();
        
        saveData();
        renderNotes();
        showToast('Nota atualizada! ✏️', 'success');
    }
}

function renderNotes() {
    const container = document.getElementById('notesGrid');
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma nota criada ainda.</p>';
        return;
    }
    
    container.innerHTML = notes.map(note => {
        const date = new Date(note.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="note-item fade-in" data-id="${note.id}">
                <div class="note-timestamp">${date}</div>
                <div class="note-title">${escapeHtml(note.title)}</div>
                <div class="note-content">${escapeHtml(note.content)}</div>
                <div class="note-actions">
                    <button onclick="editNote(${note.id})" class="btn btn-sm btn-secondary" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteNote(${note.id})" class="btn btn-sm btn-danger" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// === SISTEMA DE METAS E PROPÓSITOS ===
function addGoal() {
    const form = document.getElementById('goalForm');
    form.style.display = 'block';
    form.classList.add('fade-in');
    document.getElementById('goalTitle').focus();
}

function cancelGoalForm() {
    const form = document.getElementById('goalForm');
    form.style.display = 'none';
    clearGoalForm();
}

function clearGoalForm() {
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDescription').value = '';
    document.getElementById('goalCategory').value = 'personal';
    document.getElementById('goalDeadline').value = '';
}

function saveGoal() {
    const title = document.getElementById('goalTitle').value.trim();
    const description = document.getElementById('goalDescription').value.trim();
    const category = document.getElementById('goalCategory').value;
    const deadline = document.getElementById('goalDeadline').value;
    
    if (!title || !description) {
        showToast('Por favor, preencha o título e a descrição da meta.', 'warning');
        return;
    }
    
    const newGoal = {
        id: Date.now(),
        title,
        description,
        category,
        deadline,
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    goals.unshift(newGoal);
    
    saveData();
    renderGoals();
    cancelGoalForm();
    showToast('Meta criada com sucesso! 🎯', 'success');
}

function updateGoalProgress(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const newProgress = prompt(`Progresso atual da meta "${goal.title}" (0-100):`, goal.progress);
    if (newProgress === null) return;
    
    const progress = parseInt(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
        showToast('Por favor, insira um valor entre 0 e 100.', 'warning');
        return;
    }
    
    goal.progress = progress;
    goal.completed = progress === 100;
    
    saveData();
    renderGoals();
    showToast(`Progresso atualizado para ${progress}%! ${progress === 100 ? '🎉' : '📈'}`, 'success');
}

function deleteGoal(id) {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
        goals = goals.filter(goal => goal.id !== id);
        saveData();
        renderGoals();
        showToast('Meta excluída', 'success');
    }
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    
    if (goals.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma meta definida ainda.</p>';
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const deadlineDate = goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo';
        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.completed;
        
        const categoryLabels = {
            personal: 'Pessoal',
            professional: 'Profissional',
            health: 'Saúde',
            learning: 'Aprendizado',
            financial: 'Financeiro'
        };
        
        return `
            <div class="goal-item fade-in ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-title">${escapeHtml(goal.title)}</div>
                    <div class="goal-category">${categoryLabels[goal.category]}</div>
                </div>
                <div class="goal-description">${escapeHtml(goal.description)}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
                <div class="goal-footer">
                    <div class="goal-deadline ${isOverdue ? 'overdue' : ''}">
                        📅 ${deadlineDate} ${isOverdue ? '(Atrasado)' : ''}
                        <span style="margin-left: 1rem;">📊 ${goal.progress}%</span>
                    </div>
                    <div class="goal-actions">
                        <button onclick="updateGoalProgress(${goal.id})" class="btn btn-sm btn-secondary" title="Atualizar progresso">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button onclick="deleteGoal(${goal.id})" class="btn btn-sm btn-danger" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === SISTEMA DE NOTIFICAÇÕES (TOAST) ===
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type} fade-in`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.success}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="removeToast(this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            removeToast(toast);
        }
    }, 5000);
}

function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

// === FUNÇÕES UTILITÁRIAS ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Adicionar animação de slideOut ao CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .overdue {
        color: var(--accent-danger) !important;
        font-weight: 600;
    }
`;
document.head.appendChild(style);

// === ATALHOS DE TECLADO ===
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S para salvar reflexão
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveReflection();
    }
    
    // Ctrl/Cmd + N para nova nota
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addNote();
    }
    
    // Ctrl/Cmd + A para nova agenda
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        addAgendaItem();
    }
    
    // Ctrl/Cmd + G para nova meta
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        addGoal();
    }
    
    // Escape para cancelar formulários abertos
    if (e.key === 'Escape') {
        const forms = ['agendaForm', 'noteForm', 'goalForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form && form.style.display !== 'none') {
                form.style.display = 'none';
                if (formId === 'agendaForm') clearAgendaForm();
                if (formId === 'noteForm') clearNoteForm();
                if (formId === 'goalForm') clearGoalForm();
            }
        });
    }
});

// === FUNCIONALIDADES EXTRAS ===

// Backup e restauração de dados
function exportData() {
    const data = {
        agendaItems,
        notes,
        goals,
        reflections,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-dia-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso! 💾', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Importar dados substituirá todos os dados atuais. Continuar?')) {
                agendaItems = data.agendaItems || [];
                notes = data.notes || [];
                goals = data.goals || [];
                reflections = data.reflections || {};
                
                saveData();
                renderAgenda();
                renderNotes();
                renderGoals();
                loadTodayReflection();
                
                showToast('Dados importados com sucesso! 📥', 'success');
            }
        } catch (error) {
            showToast('Erro ao importar dados. Verifique o arquivo.', 'error');
        }
    };
    reader.readAsText(file);
}

// Adicionar botões de exportar/importar ao footer se necessário
console.log('Aplicação "Meu Dia" carregada com sucesso!');
console.log('Atalhos disponíveis:');
console.log('- Ctrl/Cmd + S: Salvar reflexão');
console.log('- Ctrl/Cmd + N: Nova nota');
console.log('- Ctrl/Cmd + A: Novo compromisso');
console.log('- Ctrl/Cmd + G: Nova meta');
console.log('- Esc: Cancelar formulários');