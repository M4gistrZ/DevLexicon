let dictionaryData = [];

// Отображать датабазу
let state = {
    searchQuery: "",
    selectedCategory: "all",
    selectedLetter: "all",
    favorites: JSON.parse(localStorage.getItem("devlexicon_favorites")) || [],
    showOnlyFavorites: false,
    quizIndex: 0,
    quizScore: 0,
    quizAnswered: false
};

// ДУМ
const termsGrid = document.getElementById("terms-grid");
const heroSearchInput = document.getElementById("hero-search-input");
const heroSearchBtn = document.getElementById("hero-search-btn");
const resultsCountSpan = document.querySelector("#results-count span");
const categoryFilters = document.getElementById("category-filters");
const alphabetFilter = document.getElementById("alphabet-filter");
const emptyState = document.getElementById("empty-state");
const favoritesFilterBtn = document.getElementById("favorites-filter-btn");
const favCountSpan = document.getElementById("fav-count");
const themeToggleBtn = document.getElementById("theme-toggle");
const submitBtn = document.getElementById("submit-btn");
const submitModal = document.getElementById("submit-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const submitTermForm = document.getElementById("submit-term-form");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");
const dailyCardContent = document.getElementById("daily-card-content");
const shuffleDailyBtn = document.getElementById("shuffle-daily-btn");

// Квизхзчтоещесюдадобавить
const quizCurrent = document.getElementById("quiz-current");
const quizQuestionText = document.getElementById("quiz-question-text");
const quizOptionsGrid = document.getElementById("quiz-options-grid");
const quizFooter = document.getElementById("quiz-footer");
const quizFeedbackText = document.getElementById("quiz-feedback-text");
const nextQuizBtn = document.getElementById("next-quiz-btn");

// Инит
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("dictionary.json");
        dictionaryData = await response.json();
    } catch (e) {
        console.error("Ошибка загрузки dictionary.json:", e);
    }
    initTheme();
    renderAlphabetFilter();
    renderTerms();
    renderWordOfDay();
    initQuiz();
    setupEventListeners();
    updateFavCount();
});

// На темы
function initTheme() {
    const savedTheme = localStorage.getItem("devlexicon_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector("i");
    if (theme === "light") {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("devlexicon_theme", newTheme);
    updateThemeIcon(newTheme);
});

// Алфавитный фильтр
function renderAlphabetFilter() {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    
    alphabet.forEach(letter => {
        const btn = document.createElement("button");
        btn.className = "letter-btn";
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.addEventListener("click", () => {
            document.querySelectorAll(".letter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.selectedLetter = letter;
            state.showOnlyFavorites = false;
            favoritesFilterBtn.classList.remove("btn-primary");
            renderTerms();
        });
        alphabetFilter.appendChild(btn);
    });

    // Кнокпа на все
    const allLetterBtn = alphabetFilter.querySelector('[data-letter="all"]');
    allLetterBtn.addEventListener("click", () => {
        document.querySelectorAll(".letter-btn").forEach(b => b.classList.remove("active"));
        allLetterBtn.classList.add("active");
        state.selectedLetter = "all";
        renderTerms();
    });
}

// Рендер фильтр
function renderTerms() {
    let filtered = dictionaryData.filter(item => {
        // поиск
        const query = state.searchQuery.toLowerCase().trim();
        const matchesQuery = !query || 
            item.term.toLowerCase().includes(query) || 
            item.definition.toLowerCase().includes(query) ||
            item.example.toLowerCase().includes(query);

        // категории
        const matchesCategory = state.selectedCategory === "all" || item.category === state.selectedCategory;

        // буквенный
        const matchesLetter = state.selectedLetter === "all" || item.letter === state.selectedLetter;

        // лучшее
        const matchesFavorites = !state.showOnlyFavorites || state.favorites.includes(item.id);

        return matchesQuery && matchesCategory && matchesLetter && matchesFavorites;
    });

    resultsCountSpan.textContent = filtered.length;
    termsGrid.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.style.display = "block";
        return;
    } else {
        emptyState.style.display = "none";
    }

    filtered.forEach(item => {
        const isFav = state.favorites.includes(item.id);
        const card = document.createElement("div");
        card.className = "term-card";
        
        let categoryName = "";
        let badgeClass = "";
        switch(item.category) {
            case "slang": categoryName = "Сленг & Англицизмы"; badgeClass = "badge-slang"; break;
            case "abbrev": categoryName = "Аббревиатура"; badgeClass = "badge-abbrev"; break;
            case "process": categoryName = "Процессы & Agile"; badgeClass = "badge-process"; break;
            case "code": categoryName = "Код & Архитектура"; badgeClass = "badge-code"; break;
            case "culture": categoryName = "Культура & Мемы"; badgeClass = "badge-culture"; break;
        }

        card.innerHTML = `
            <div>
                <div class="term-card-top">
                    <div class="term-title-wrap">
                        <span class="term-name">${item.term}</span>
                        <span class="term-pronunciation">${item.pronunciation}</span>
                    </div>
                    <div class="term-actions">
                        <button class="action-icon-btn copy-btn" data-term="${item.term}: ${item.definition}" title="Копировать определение">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <button class="action-icon-btn bookmark-btn ${isFav ? 'bookmarked' : ''}" data-id="${item.id}" title="В избранное">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                        </button>
                    </div>
                </div>
                <span class="term-category-badge ${badgeClass}">${categoryName}</span>
                <p class="term-definition">${item.definition}</p>
            </div>
            <div class="term-example-box">
                <strong>Пример в диалоге:</strong>
                ${item.example}
            </div>
        `;

        // контрол эф
        card.querySelector(".copy-btn").addEventListener("click", (e) => {
            const textToCopy = e.currentTarget.dataset.term;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`Скопировано в буфер обмена: ${item.term}`);
            });
        });

        // закладка
        card.querySelector(".bookmark-btn").addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            toggleFavorite(id);
        });

        termsGrid.appendChild(card);
    });
}

// Обработчик избранного
function toggleFavorite(id) {
    if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(favId => favId !== id);
        showToast("Удалено из избранного");
    } else {
        state.favorites.push(id);
        showToast("Добавлено в избранное!");
    }
    localStorage.setItem("devlexicon_favorites", JSON.stringify(state.favorites));
    updateFavCount();
    renderTerms();
}

function updateFavCount() {
    favCountSpan.textContent = state.favorites.length;
}

favoritesFilterBtn.addEventListener("click", () => {
    state.showOnlyFavorites = !state.showOnlyFavorites;
    if (state.showOnlyFavorites) {
        favoritesFilterBtn.classList.add("btn-primary");
        favoritesFilterBtn.classList.remove("btn-subtle");
    } else {
        favoritesFilterBtn.classList.remove("btn-primary");
        favoritesFilterBtn.classList.add("btn-subtle");
    }
    renderTerms();
});

// Ивентлистенер для поиска
heroSearchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderTerms();
});

heroSearchBtn.addEventListener("click", () => {
    state.searchQuery = heroSearchInput.value;
    renderTerms();
    document.getElementById("dictionary").scrollIntoView({ behavior: "smooth" });
});

categoryFilters.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-chip")) {
        document.querySelectorAll(".filter-chip").forEach(chip => chip.classList.remove("active"));
        e.target.classList.add("active");
        state.selectedCategory = e.target.dataset.category;
        renderTerms();
    }
});

// Слово дня
function renderWordOfDay() {
    // Слово на рандом
    const randomIndex = Math.floor(Math.random() * dictionaryData.length);
    const item = dictionaryData[randomIndex];

    dailyCardContent.innerHTML = `
        <h3>${item.term}</h3>
        <p class="daily-pronounce">${item.pronunciation}</p>
        <p class="daily-definition">${item.definition}</p>
        <div class="daily-example">
            <strong>Контекст:</strong> «${item.example}»
        </div>
    `;
}

shuffleDailyBtn.addEventListener("click", () => {
    renderWordOfDay();
    showToast("Случайный термин обновлен!");
});

// Квизпочемуявообщеэтоначал
let quizQuestions = [];

function initQuiz() {
    // 5 вопросов
    quizQuestions = [...dictionaryData].sort(() => 0.5 - Math.random()).slice(0, 5);
    state.quizIndex = 0;
    state.quizScore = 0;
    loadQuizQuestion();
}

function loadQuizQuestion() {
    state.quizAnswered = false;
    quizFooter.style.display = "none";
    quizCurrent.textContent = state.quizIndex + 1;

    const currentQ = quizQuestions[state.quizIndex];
    quizQuestionText.textContent = `Что означает термин «${currentQ.term}» (${currentQ.pronunciation})?`;

    // 4 ответа
    let wrongOptions = dictionaryData.filter(item => item.id !== currentQ.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    let options = [...wrongOptions, currentQ].sort(() => 0.5 - Math.random());

    quizOptionsGrid.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "quiz-option-btn";
        btn.textContent = opt.definition;
        btn.addEventListener("click", () => checkQuizAnswer(opt.id === currentQ.id, btn, currentQ));
        quizOptionsGrid.appendChild(btn);
    });
}

function checkQuizAnswer(isCorrect, selectedBtn, correctItem) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;

    const allBtns = quizOptionsGrid.querySelectorAll(".quiz-option-btn");
    allBtns.forEach(btn => {
        if (btn.textContent === correctItem.definition) {
            btn.classList.add("correct");
        } else if (btn === selectedBtn && !isCorrect) {
            btn.classList.add("incorrect");
        }
        btn.disabled = true;
    });

    if (isCorrect) {
        state.quizScore++;
        quizFeedbackText.textContent = "🎉 Верно! Отличный результат.";
        quizFeedbackText.style.color = "#10b981";
    } else {
        quizFeedbackText.textContent = `❌ Ошибка. Правильный ответ: ${correctItem.definition}`;
        quizFeedbackText.style.color = "#e11d48";
    }

    quizFooter.style.display = "flex";
}

nextQuizBtn.addEventListener("click", () => {
    state.quizIndex++;
    if (state.quizIndex < quizQuestions.length) {
        loadQuizQuestion();
    } else {
        quizQuestionText.textContent = `🏆 Квиз завершен! Ваш результат: ${state.quizScore} из ${quizQuestions.length}`;
        quizOptionsGrid.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin: 20px 0;">Вы отлично освоили базовый IT-сленг! Продолжайте изучать словарь.</p>`;
        quizFooter.style.display = "none";
        
        const restartBtn = document.createElement("button");
        restartBtn.className = "btn btn-primary btn-block";
        restartBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Пройти квиз заново`;
        restartBtn.addEventListener("click", initQuiz);
        quizOptionsGrid.appendChild(restartBtn);
    }
});

submitBtn.addEventListener("click", () => {
    submitModal.classList.add("active");
});

document.getElementById("open-submit-modal").addEventListener("click", (e) => {
    e.preventDefault();
    submitModal.classList.add("active");
});

closeModalBtn.addEventListener("click", () => {
    submitModal.classList.remove("active");
});

submitModal.addEventListener("click", (e) => {
    if (e.target === submitModal) {
        submitModal.classList.remove("active");
    }
});

submitTermForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTermName = document.getElementById("term-name").value;
    const newCategory = document.getElementById("term-category").value;
    const newDef = document.getElementById("term-def").value;
    const newExample = document.getElementById("term-example").value || "Пример использования отсутствует";

    // Добавить в локалку
    const newItem = {
        id: dictionaryData.length + 1,
        term: newTermName,
        pronunciation: "[пользовательский]",
        category: newCategory,
        letter: newTermName.charAt(0).toUpperCase(),
        definition: newDef,
        example: newExample
    };

    dictionaryData.unshift(newItem);
    submitModal.classList.remove("active");
    submitTermForm.reset();
    renderTerms();
    showToast("Термин успешно добавлен в словарь!");
});

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function setupEventListeners() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}
