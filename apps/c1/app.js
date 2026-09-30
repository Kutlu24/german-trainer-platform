// Global variables
let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let learnedWords = new Set();
let favoriteWords = new Set();
let reviewSchedule = {};
let isFlipped = false;
let currentMode = 'flashcard';
let quizScore = 0;
let quizAnswered = 0;
let typingScore = 0;
let typingAnswered = 0;
let dailyGoal = 10;
let todayStats = { date: new Date().toDateString(), learned: 0 };

// Load progress
function loadProgress() {
    const saved = localStorage.getItem('learnedWords');
    const savedFav = localStorage.getItem('favoriteWords');
    const savedReview = localStorage.getItem('reviewSchedule');
    const savedGoal = localStorage.getItem('dailyGoal');
    const savedToday = localStorage.getItem('todayStats');

    if (saved) learnedWords = new Set(JSON.parse(saved));
    if (savedFav) favoriteWords = new Set(JSON.parse(savedFav));
    if (savedReview) reviewSchedule = JSON.parse(savedReview);
    if (savedGoal) dailyGoal = parseInt(savedGoal);
    
    if (savedToday) {
        const parsed = JSON.parse(savedToday);
        if (parsed.date === new Date().toDateString()) {
            todayStats = parsed;
        } else {
            todayStats = { date: new Date().toDateString(), learned: 0 };
            saveProgress();
        }
    }
}

// Save progress
function saveProgress() {
    localStorage.setItem('learnedWords', JSON.stringify([...learnedWords]));
    localStorage.setItem('favoriteWords', JSON.stringify([...favoriteWords]));
    localStorage.setItem('reviewSchedule', JSON.stringify(reviewSchedule));
    localStorage.setItem('dailyGoal', dailyGoal.toString());
    localStorage.setItem('todayStats', JSON.stringify(todayStats));
}

// Load words
async function loadWords() {
    try {
        const response = await fetch('kelimeler_web.json');
        allWords = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error loading:', error);
        alert('Error loading words!');
    }
}

// Initialize app
function initializeApp() {
    loadProgress();
    populateFilters();
    applyFilters();
    updateStats();
    updateDailyGoal();
    showCard();
}

// Populate filters
function populateFilters() {
    const lektions = [...new Set(allWords.map(w => w.lektion))].sort((a, b) => a - b);
    const teils = [...new Set(allWords.map(w => w.teil))].sort((a, b) => a - b);

    console.log('Lessons found:', lektions);
    console.log('Parts found:', teils);

    const lektionSelect = document.getElementById('lektionFilter');
    if (!lektionSelect) {
        console.error('lektionFilter element not found!');
        return;
    }
    
    lektions.forEach(l => {
        const option = document.createElement('option');
        option.value = l;
        option.textContent = `Lesson ${l}`;
        lektionSelect.appendChild(option);
    });

    const teilSelect = document.getElementById('teilFilter');
    if (!teilSelect) {
        console.error('teilFilter element not found!');
        return;
    }
    
    teils.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = `Part ${t}`;
        teilSelect.appendChild(option);
    });
    
    console.log('Filters populated: ', lektions.length, 'lessons,', teils.length, 'parts');
}

// Apply filters
function applyFilters() {
    const lektionFilter = document.getElementById('lektionFilter').value;
    const teilFilter = document.getElementById('teilFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const favoriteFilter = document.getElementById('favoriteFilter').value;

    filteredWords = allWords.filter(word => {
        const matchLektion = lektionFilter === 'all' || word.lektion == lektionFilter;
        const matchTeil = teilFilter === 'all' || word.teil == teilFilter;
        const matchSearch = searchTerm === '' || 
            word.wort.toLowerCase().includes(searchTerm) ||
            word.grammatik.toLowerCase().includes(searchTerm) ||
            word.beispiel.toLowerCase().includes(searchTerm);
        
        let matchFavorite = true;
        if (favoriteFilter === 'favorites') {
            matchFavorite = favoriteWords.has(word.id);
        } else if (favoriteFilter === 'notLearned') {
            matchFavorite = !learnedWords.has(word.id);
        }
        
        return matchLektion && matchTeil && matchSearch && matchFavorite;
    });

    currentIndex = 0;
    updateStats();
    
    if (currentMode === 'flashcard') showCard();
    else if (currentMode === 'quiz') showQuiz();
    else if (currentMode === 'typing') showTypingQuiz();
    else if (currentMode === 'review') showReview();
}

// Update stats
function updateStats() {
    document.getElementById('totalWords').textContent = filteredWords.length;
    document.getElementById('learnedWords').textContent = 
        filteredWords.filter(w => learnedWords.has(w.id)).length;
    document.getElementById('remainingWords').textContent = 
        filteredWords.filter(w => !learnedWords.has(w.id)).length;
    document.getElementById('favoriteWords').textContent = 
        filteredWords.filter(w => favoriteWords.has(w.id)).length;
}

// Daily goal
function updateDailyGoal() {
    document.getElementById('dailyGoalNumber').textContent = dailyGoal;
    document.getElementById('dailyGoalText').textContent = `${dailyGoal} words`;
    document.getElementById('todayLearned').textContent = todayStats.learned;
    
    const progress = Math.min((todayStats.learned / dailyGoal) * 100, 100);
    document.getElementById('goalProgressFill').style.width = `${progress}%`;
}

// Show card
function showCard() {
    if (filteredWords.length === 0) {
        document.getElementById('wordText').textContent = 'No words found';
        return;
    }

    const word = filteredWords[currentIndex];
    isFlipped = false;

    document.getElementById('wordText').textContent = word.wort;
    document.getElementById('lektionBadge').textContent = `Lesson ${word.lektion}`;
    document.getElementById('teilBadge').textContent = `Part ${word.teil}`;

    document.getElementById('wordTextBack').textContent = word.wort;
    document.getElementById('grammarText').textContent = word.grammatik;
    document.getElementById('exampleText').textContent = word.beispiel;
    document.getElementById('lektionBadgeBack').textContent = `Lesson ${word.lektion}`;
    document.getElementById('teilBadgeBack').textContent = `Part ${word.teil}`;

    document.getElementById('cardFront').classList.remove('hidden');
    document.getElementById('cardBack').classList.add('hidden');

    const favBtn = document.getElementById('favoriteBtn');
    favBtn.textContent = favoriteWords.has(word.id) ? '★' : '☆';
    favBtn.classList.toggle('active', favoriteWords.has(word.id));

    const progress = ((currentIndex + 1) / filteredWords.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;

    const learnedBtn = document.getElementById('markLearnedBtn');
    if (learnedWords.has(word.id)) {
        learnedBtn.textContent = '❌ Mark as not learned';
        learnedBtn.classList.remove('btn-primary');
        learnedBtn.classList.add('btn-danger');
    } else {
        learnedBtn.textContent = '✅ Learned';
        learnedBtn.classList.remove('btn-danger');
        learnedBtn.classList.add('btn-primary');
    }
}

// Flip card
function flipCard() {
    isFlipped = !isFlipped;
    document.getElementById('cardFront').classList.toggle('hidden', isFlipped);
    document.getElementById('cardBack').classList.toggle('hidden', !isFlipped);
}

// Play audio
function playAudio(audioFile) {
    if (audioFile) {
        const audio = new Audio(`sesler/${audioFile}`);
        audio.play().catch(e => console.error('Audio error:', e));
    }
}

// Show quiz
function showQuiz() {
    if (filteredWords.length === 0) return;

    const correctWord = filteredWords[currentIndex];
    const wrongWords = allWords.filter(w => w.id !== correctWord.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5);

    document.getElementById('quizWord').textContent = correctWord.wort;
    
    const container = document.getElementById('quizOptions');
    container.innerHTML = '';

    options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.textContent = option.beispiel;
        div.onclick = () => checkQuizAnswer(option.id === correctWord.id, div);
        container.appendChild(div);
    });

    const progress = ((currentIndex + 1) / filteredWords.length) * 100;
    document.getElementById('quizProgressFill').style.width = `${progress}%`;
}

// Check quiz answer
function checkQuizAnswer(isCorrect, element) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => opt.style.pointerEvents = 'none');

    if (isCorrect) {
        element.classList.add('correct');
        quizScore++;
    } else {
        element.classList.add('wrong');
        options.forEach(opt => {
            if (opt.textContent === filteredWords[currentIndex].beispiel) {
                opt.classList.add('correct');
            }
        });
    }

    quizAnswered++;
    document.getElementById('quizScore').textContent = `Score: ${quizScore}/${quizAnswered}`;

    setTimeout(() => {
        if (currentIndex < filteredWords.length - 1) {
            currentIndex++;
            showQuiz();
        } else {
            alert(`Quiz complete!\nScore: ${quizScore}/${quizAnswered}\nPercent: ${Math.round((quizScore/quizAnswered)*100)}%`);
        }
    }, 2000);
}

// Typing quiz
function showTypingQuiz() {
    if (filteredWords.length === 0) return;

    const word = filteredWords[currentIndex];
    document.getElementById('typingGrammar').textContent = word.grammatik;
    document.getElementById('typingExample').textContent = word.beispiel;
    
    const input = document.getElementById('typingInput');
    input.value = '';
    input.className = 'typing-quiz-input';
    input.disabled = false;
    input.readOnly = false;
    
    // UI fix: make sure the input field is clickable and focusable
    input.style.pointerEvents = 'auto';
    input.style.zIndex = '100';
    
    // Set focus on input
    setTimeout(() => {
        input.focus();
        // Fallback in case the first focus attempt fails
        if (document.activeElement !== input) {
            input.click();
            input.focus();
        }
    }, 200);
    
    const progress = ((currentIndex + 1) / filteredWords.length) * 100;
    document.getElementById('typingProgressFill').style.width = `${progress}%`;
}

function checkTypingAnswer() {
    const word = filteredWords[currentIndex];
    const input = document.getElementById('typingInput');
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = word.wort.toLowerCase();

    typingAnswered++;

    if (userAnswer === correctAnswer) {
        input.classList.add('correct');
        typingScore++;
        setTimeout(() => {
            if (currentIndex < filteredWords.length - 1) {
                currentIndex++;
                showTypingQuiz();
            } else {
                alert(`Writing quiz complete!\nScore: ${typingScore}/${typingAnswered}\nPercent: ${Math.round((typingScore/typingAnswered)*100)}%`);
            }
        }, 1500);
    } else {
        input.classList.add('wrong');
        input.value = `Wrong! Correct: ${word.wort}`;
        input.disabled = true;
        setTimeout(() => {
            if (currentIndex < filteredWords.length - 1) {
                currentIndex++;
                showTypingQuiz();
            } else {
                alert(`Writing quiz complete!\nScore: ${typingScore}/${typingAnswered}\nPercent: ${Math.round((typingScore/typingAnswered)*100)}%`);
            }
        }, 2500);
    }

    document.getElementById('typingScore').textContent = `Score: ${typingScore}/${typingAnswered}`;
}

// Review
function showReview() {
    const today = new Date().toDateString();
    const wordsToReview = filteredWords.filter(w => {
        const schedule = reviewSchedule[w.id];
        return schedule && schedule.nextReview <= today && learnedWords.has(w.id);
    });

    if (wordsToReview.length === 0) {
        document.getElementById('reviewWord').textContent = 'No words to review today! 🎉';
        document.getElementById('reviewGrammar').textContent = '';
        document.getElementById('reviewExample').textContent = '';
        return;
    }

    const word = wordsToReview[currentIndex % wordsToReview.length];
    document.getElementById('reviewWord').textContent = word.wort;
    document.getElementById('reviewGrammar').textContent = word.grammatik;
    document.getElementById('reviewExample').textContent = word.beispiel;

    const favBtn = document.getElementById('reviewFavoriteBtn');
    favBtn.textContent = favoriteWords.has(word.id) ? '★' : '☆';

    const progress = ((currentIndex + 1) / wordsToReview.length) * 100;
    document.getElementById('reviewProgressFill').style.width = `${progress}%`;
}

function rateReview(difficulty) {
    const today = new Date();
    const word = filteredWords[currentIndex];
    
    let interval = difficulty === 'easy' ? 7 : difficulty === 'medium' ? 3 : 1;
    const nextReview = new Date(today);
    nextReview.setDate(nextReview.getDate() + interval);

    reviewSchedule[word.id] = {
        lastReview: today.toDateString(),
        nextReview: nextReview.toDateString(),
        interval: interval
    };

    saveProgress();

    if (currentIndex < filteredWords.length - 1) {
        currentIndex++;
        showReview();
    } else {
        alert('Review complete! 🎉');
    }
}

// Favorite
function toggleFavorite() {
    const word = filteredWords[currentIndex];
    if (favoriteWords.has(word.id)) {
        favoriteWords.delete(word.id);
    } else {
        favoriteWords.add(word.id);
    }
    saveProgress();
    updateStats();
    if (currentMode === 'flashcard') showCard();
    else if (currentMode === 'review') showReview();
}

// Mark as learned
function markAsLearned() {
    const word = filteredWords[currentIndex];
    if (learnedWords.has(word.id)) {
        learnedWords.delete(word.id);
        delete reviewSchedule[word.id];
    } else {
        learnedWords.add(word.id);
        todayStats.learned++;
        
        const today = new Date();
        const nextReview = new Date(today);
        nextReview.setDate(nextReview.getDate() + 1);
        
        reviewSchedule[word.id] = {
            lastReview: today.toDateString(),
            nextReview: nextReview.toDateString(),
            interval: 1
        };
    }
    saveProgress();
    updateStats();
    updateDailyGoal();
    showCard();
}

// Show stats
function showStats() {
    document.getElementById('statTotal').textContent = allWords.length;
    document.getElementById('statLearned').textContent = learnedWords.size;
    document.getElementById('statFavorites').textContent = favoriteWords.size;
    document.getElementById('statToday').textContent = todayStats.learned;
    document.getElementById('statProgress').textContent = 
        `${Math.round((learnedWords.size / allWords.length) * 100)}%`;

    const lektions = [...new Set(allWords.map(w => w.lektion))].sort((a, b) => a - b);
    const chartContainer = document.getElementById('lektionChart');
    chartContainer.innerHTML = '';

    lektions.forEach(lektion => {
        const wordsInLektion = allWords.filter(w => w.lektion === lektion);
        const learnedInLektion = wordsInLektion.filter(w => learnedWords.has(w.id)).length;
        const percentage = (learnedInLektion / wordsInLektion.length) * 100;

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${percentage}%`;
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = `L${lektion}`;
        
        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = `${learnedInLektion}/${wordsInLektion.length}`;
        
        bar.appendChild(label);
        bar.appendChild(value);
        chartContainer.appendChild(bar);
    });

    document.getElementById('statsModal').classList.remove('hidden');
}

// Event listeners
document.getElementById('flashcard').addEventListener('click', (e) => {
    if (!e.target.closest('.favorite-btn') && !e.target.closest('.audio-btn')) {
        flipCard();
    }
});

document.getElementById('favoriteBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite();
});

document.getElementById('reviewFavoriteBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite();
});

document.getElementById('audioBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const word = filteredWords[currentIndex];
    playAudio(word?.audio);
});

document.getElementById('quizAudioBtn').addEventListener('click', () => {
    const word = filteredWords[currentIndex];
    playAudio(word?.audio);
});

document.getElementById('typingAudioBtn').addEventListener('click', () => {
    const word = filteredWords[currentIndex];
    playAudio(word?.audio);
});

document.getElementById('reviewAudioBtn').addEventListener('click', () => {
    const word = filteredWords[currentIndex];
    playAudio(word?.audio);
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        showCard();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentIndex < filteredWords.length - 1) {
        currentIndex++;
        showCard();
    }
});

document.getElementById('typingCheckBtn').addEventListener('click', checkTypingAnswer);

document.getElementById('typingSkipBtn').addEventListener('click', () => {
    if (currentIndex < filteredWords.length - 1) {
        currentIndex++;
        showTypingQuiz();
    }
});

document.getElementById('typingInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkTypingAnswer();
});

document.getElementById('reviewHardBtn').addEventListener('click', () => rateReview('hard'));
document.getElementById('reviewMediumBtn').addEventListener('click', () => rateReview('medium'));
document.getElementById('reviewEasyBtn').addEventListener('click', () => rateReview('easy'));

document.getElementById('markLearnedBtn').addEventListener('click', markAsLearned);

document.getElementById('shuffleBtn').addEventListener('click', () => {
    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    if (currentMode === 'flashcard') showCard();
    else if (currentMode === 'quiz') showQuiz();
    else if (currentMode === 'typing') showTypingQuiz();
    else if (currentMode === 'review') showReview();
});

document.getElementById('statsBtn').addEventListener('click', showStats);

document.getElementById('closeStatsBtn').addEventListener('click', () => {
    document.getElementById('statsModal').classList.add('hidden');
});

document.getElementById('statsModal').addEventListener('click', (e) => {
    if (e.target.id === 'statsModal') {
        document.getElementById('statsModal').classList.add('hidden');
    }
});

document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (confirm('All progress will be reset. Are you sure?')) {
        learnedWords.clear();
        favoriteWords.clear();
        reviewSchedule = {};
        todayStats = { date: new Date().toDateString(), learned: 0 };
        saveProgress();
        updateStats();
        updateDailyGoal();
        showCard();
    }
});

document.getElementById('lektionFilter').addEventListener('change', applyFilters);
document.getElementById('teilFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('favoriteFilter').addEventListener('change', applyFilters);

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        currentMode = tab.dataset.mode;
        currentIndex = 0;

        document.getElementById('flashcardMode').classList.add('hidden');
        document.getElementById('quizMode').classList.add('hidden');
        document.getElementById('typingMode').classList.add('hidden');
        document.getElementById('reviewMode').classList.add('hidden');

        if (currentMode === 'flashcard') {
            document.getElementById('flashcardMode').classList.remove('hidden');
            showCard();
        } else if (currentMode === 'quiz') {
            document.getElementById('quizMode').classList.remove('hidden');
            quizScore = 0;
            quizAnswered = 0;
            document.getElementById('quizScore').textContent = 'Score: 0/0';
            showQuiz();
        } else if (currentMode === 'typing') {
            document.getElementById('typingMode').classList.remove('hidden');
            typingScore = 0;
            typingAnswered = 0;
            document.getElementById('typingScore').textContent = 'Score: 0/0';
            showTypingQuiz();
        } else if (currentMode === 'review') {
            document.getElementById('reviewMode').classList.remove('hidden');
            showReview();
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (currentMode === 'flashcard') {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            showCard();
        } else if (e.key === 'ArrowRight' && currentIndex < filteredWords.length - 1) {
            currentIndex++;
            showCard();
        } else if (e.key === ' ') {
            e.preventDefault();
            flipCard();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const word = filteredWords[currentIndex];
            playAudio(word?.audio);
        } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            toggleFavorite();
        }
    }
});

// Start app
loadWords();
;
