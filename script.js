/*
  Main script for the Arabic trivia game.  This file handles loading
  categories and questions from the external JSON file, managing the
  game flow (category selection, question presentation and scoring),
  and updating the user interface accordingly.  All user-facing
  messages and labels remain in Arabic, and the layout supports
  right‑to‑left presentation.

  The game works in three stages:
   1. Category selection: the player chooses exactly three categories
      out of the available ones.  Once selected, a button appears to
      start the game.
   2. Question stage: for each selected category, two questions are
      randomly chosen and presented to the player.  The questions are
      shuffled so the order is unpredictable.  The player selects an
      answer and submits it to see if it is correct.
   3. Results: after all questions are answered, the final score is
      shown along with the total number of questions.  A button is
      provided to return to the landing page.

  Author: ChatGPT
*/

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const categoriesContainer = document.getElementById('categories');
  const startGameBtn = document.getElementById('startGameBtn');
  const categorySelection = document.getElementById('categorySelection');
  const questionStage = document.getElementById('questionStage');
  const resultStage = document.getElementById('resultStage');
  const questionTextEl = document.getElementById('questionText');
  const optionsListEl = document.getElementById('optionsList');
  const currentQuestionCounter = document.getElementById('currentQuestionCounter');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const submitAnswerBtn = document.getElementById('submitAnswerBtn');
  const finalScoreText = document.getElementById('finalScoreText');
  const playAgainBtn = document.getElementById('playAgainBtn');

  // Game state
  let categoriesData = [];
  let selectedCategories = [];
  let questionsPool = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let selectedOptionIndex = null;

  /*
    Fallback questions data.  When running the game directly from the
    file system (e.g. opening index.html with a file:// URL), the
    browser may block fetch() requests to local files for security
    reasons.  In such cases, the game will fall back to using this
    embedded set of questions.  If you serve the project via a local
    web server (e.g. using python -m http.server), the external
    questions.json file will be loaded instead.
  */
  const fallbackQuestions = {
    "categories": [
      {
        "id": "history",
        "name": "التاريخ",
        "questions": [
          {
            "question": "من هو أول رئيس لجمهورية مصر العربية؟",
            "options": ["أنور السادات", "جمال عبد الناصر", "محمد نجيب", "حسني مبارك"],
            "answer": 2
          },
          {
            "question": "في أي عام اندلعت الحرب العالمية الثانية؟",
            "options": ["1914", "1939", "1945", "1950"],
            "answer": 1
          },
          {
            "question": "من هو مؤسس الدولة السعودية الأولى؟",
            "options": ["الملك عبدالعزيز", "محمد بن سعود", "تركي بن عبدالله", "سلمان بن عبدالعزيز"],
            "answer": 1
          },
          {
            "question": "أين وقعت معركة بدر؟",
            "options": ["في مكة", "في المدينة", "في بدر", "في الطائف"],
            "answer": 2
          },
          {
            "question": "من هو الخليفة العباسي الذي بنى مدينة بغداد؟",
            "options": ["المنصور", "المأمون", "هارون الرشيد", "المعتصم"],
            "answer": 0
          },
          {
            "question": "كم عاماً استمرت الخلافة العثمانية؟",
            "options": ["400 عام", "623 عام", "100 عام", "300 عام"],
            "answer": 1
          }
        ]
      },
      {
        "id": "geography",
        "name": "الجغرافيا",
        "questions": [
          {
            "question": "ما هي أكبر دولة عربية من حيث المساحة؟",
            "options": ["السعودية", "الجزائر", "السودان", "ليبيا"],
            "answer": 1
          },
          {
            "question": "ما هو أطول نهر في العالم؟",
            "options": ["النيل", "الأمازون", "اليانغتسي", "الدانوب"],
            "answer": 0
          },
          {
            "question": "ما هي عاصمة دولة عمان؟",
            "options": ["مسقط", "الدوحة", "الرياض", "الكويت"],
            "answer": 0
          },
          {
            "question": "في أي قارة تقع جبال الأنديز؟",
            "options": ["أفريقيا", "آسيا", "أوروبا", "أمريكا الجنوبية"],
            "answer": 3
          },
          {
            "question": "ما هي أكبر محيطات العالم؟",
            "options": ["المحيط الهندي", "المحيط الهادئ", "المحيط الأطلسي", "المحيط المتجمد الشمالي"],
            "answer": 1
          },
          {
            "question": "كم عدد دول مجلس التعاون الخليجي؟",
            "options": ["5", "6", "7", "8"],
            "answer": 1
          }
        ]
      },
      {
        "id": "science",
        "name": "العلوم",
        "questions": [
          {
            "question": "ما هو الكوكب الأحمر؟",
            "options": ["المريخ", "الزهرة", "المشتري", "عطارد"],
            "answer": 0
          },
          {
            "question": "ما الوحدة الأساسية لقياس التيار الكهربائي؟",
            "options": ["الفولت", "الأمبير", "الأوم", "الواط"],
            "answer": 1
          },
          {
            "question": "أي عضو في جسم الإنسان مسؤول عن ضخ الدم؟",
            "options": ["الدماغ", "الكبد", "القلب", "الرئتين"],
            "answer": 2
          },
          {
            "question": "ما هو الغاز الأكثر وفرة في الغلاف الجوي للأرض؟",
            "options": ["الأكسجين", "ثاني أكسيد الكربون", "النيتروجين", "الهيدروجين"],
            "answer": 2
          },
          {
            "question": "ما هو رمز العنصر الكيميائي للماء؟",
            "options": ["CO2", "NaCl", "H2O", "O2"],
            "answer": 2
          },
          {
            "question": "كم عدد كواكب المجموعة الشمسية؟",
            "options": ["7", "8", "9", "10"],
            "answer": 1
          }
        ]
      },
      {
        "id": "literature",
        "name": "الأدب",
        "questions": [
          {
            "question": "من هو مؤلف رواية 'البؤساء'؟",
            "options": ["فيكتور هوغو", "دوستويفسكي", "تولستوي", "ديكنز"],
            "answer": 0
          },
          {
            "question": "أي شاعر عربي يُلقّب بأمير الشعراء؟",
            "options": ["أحمد شوقي", "عنترة بن شداد", "نزار قباني", "المتنبي"],
            "answer": 0
          },
          {
            "question": "من هو كاتب قصة 'قنديل أم هاشم'؟",
            "options": ["نجيب محفوظ", "يحيى حقي", "إحسان عبد القدوس", "طه حسين"],
            "answer": 1
          },
          {
            "question": "من هو مؤلف رواية 'ثلاثية غرناطة'؟",
            "options": ["رضوى عاشور", "نوال السعداوي", "أحلام مستغانمي", "إدوارد الخراط"],
            "answer": 0
          },
          {
            "question": "من كتب رواية 'رجال في الشمس'؟",
            "options": ["غسان كنفاني", "محمود درويش", "جبرا إبراهيم جبرا", "أمين معلوف"],
            "answer": 0
          },
          {
            "question": "أي من هذه الروايات كتبها مصطفى لطفي المنفلوطي؟",
            "options": ["ماجدولين", "زينب", "عودة الروح", "دعاء الكروان"],
            "answer": 0
          }
        ]
      },
      {
        "id": "sports",
        "name": "الرياضة",
        "questions": [
          {
            "question": "كم عدد لاعبي فريق كرة القدم الأساسي؟",
            "options": ["9", "10", "11", "12"],
            "answer": 2
          },
          {
            "question": "في أي دولة أُقيمت بطولة كأس العالم 2022؟",
            "options": ["روسيا", "البرازيل", "قطر", "ألمانيا"],
            "answer": 2
          },
          {
            "question": "كم عدد الأشواط في مباراة كرة السلة؟",
            "options": ["2", "3", "4", "5"],
            "answer": 2
          },
          {
            "question": "ما هو اسم البطولة الأوروبية لأبطال الدوري؟",
            "options": ["الدوري الأوروبي", "كأس العالم للأندية", "دوري أبطال أوروبا", "كأس الاتحاد"],
            "answer": 2
          },
          {
            "question": "في أي رياضة يُستخدم المضرب والكرة الصغيرة الخضراء؟",
            "options": ["التنس", "الاسكواش", "البيسبول", "الجولف"],
            "answer": 0
          },
          {
            "question": "ما هو عدد اللاعبين في فريق كرة الطائرة؟",
            "options": ["5", "6", "7", "8"],
            "answer": 1
          }
        ]
      },
      {
        "id": "technology",
        "name": "التكنولوجيا",
        "questions": [
          {
            "question": "في أي عام أطلقت شركة أبل أول جهاز آيفون؟",
            "options": ["2005", "2007", "2008", "2010"],
            "answer": 1
          },
          {
            "question": "ما هو نظام التشغيل المفتوح المصدر الشهير لتشغيل الخوادم؟",
            "options": ["ويندوز", "لينكس", "ماك أو إس", "أندرويد"],
            "answer": 1
          },
          {
            "question": "من هو مخترع لغة البرمجة جافا؟",
            "options": ["دينيس ريتشي", "جايمس جوسلينج", "غيدو فان روسم", "بيارن ستروستروب"],
            "answer": 1
          },
          {
            "question": "ما هي الشركة التي تطور نظام أندرويد؟",
            "options": ["سامسونج", "جوجل", "أبل", "مايكروسوفت"],
            "answer": 1
          },
          {
            "question": "ما هو بروتوكول نقل النص الفائق المستخدم في الإنترنت؟",
            "options": ["FTP", "SMTP", "HTTP", "SSH"],
            "answer": 2
          },
          {
            "question": "أي من هذه اللغات تُستخدم أساسًا لتطوير صفحات الويب؟",
            "options": ["C++", "HTML", "Swift", "Python"],
            "answer": 1
          }
        ]
      }
    ]
  };

  // Load categories and questions from JSON file.  If the fetch
  // succeeds, the data from the external file is used.  If the
  // browser blocks the request (e.g. when opened via file://), we
  // fall back to using the embedded questions defined above.
  fetch('questions.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      categoriesData = data.categories;
      renderCategories();
    })
    .catch((err) => {
      console.warn('Using fallback questions due to fetch error:', err);
      categoriesData = fallbackQuestions.categories;
      renderCategories();
    });

  /**
   * Render the category cards based on the loaded data.  Each card
   * displays the Arabic name of the category and can be selected
   * or deselected by the player.  Only three categories may be
   * selected at once.  Once three are selected, the Start Game
   * button becomes visible.
   */
  function renderCategories() {
    categoriesData.forEach((cat) => {
      const card = document.createElement('div');
      card.classList.add('category-card');
      card.textContent = cat.name;
      card.dataset.categoryId = cat.id;
      card.addEventListener('click', () => handleCategoryClick(card));
      categoriesContainer.appendChild(card);
    });
  }

  /**
   * Handle selection and deselection of a category card.  If a card
   * is already selected, clicking it again will remove it from the
   * selection.  Otherwise, if fewer than three categories are
   * currently selected, the card becomes selected.  The Start Game
   * button is only shown when exactly three categories are selected.
   *
   * @param {HTMLElement} card The category card that was clicked
   */
  function handleCategoryClick(card) {
    const categoryId = card.dataset.categoryId;
    if (card.classList.contains('selected')) {
      // Deselect this category
      card.classList.remove('selected');
      selectedCategories = selectedCategories.filter((id) => id !== categoryId);
    } else {
      // Select this category if limit not reached
      if (selectedCategories.length < 3) {
        card.classList.add('selected');
        selectedCategories.push(categoryId);
      }
    }
    // Toggle visibility of Start Game button based on selection count
    if (selectedCategories.length === 3) {
      startGameBtn.classList.remove('hidden');
    } else {
      startGameBtn.classList.add('hidden');
    }
  }

  // Start Game button click handler
  startGameBtn.addEventListener('click', () => {
    startGame();
  });

  /**
   * Initialize the game by building a pool of questions based on the
   * selected categories.  From each selected category, two random
   * questions are chosen.  The resulting list of questions is then
   * shuffled to randomize the order.  The question stage UI is
   * displayed and the first question is presented.
   */
  function startGame() {
    // Reset game state
    questionsPool = [];
    currentQuestionIndex = 0;
    score = 0;
    // Build the pool: select two random questions from each selected category
    selectedCategories.forEach((catId) => {
      const categoryObj = categoriesData.find((c) => c.id === catId);
      if (categoryObj) {
        const questionsCopy = [...categoryObj.questions];
        shuffleArray(questionsCopy);
        // Use first two questions
        questionsPool.push(...questionsCopy.slice(0, 2));
      }
    });
    // Shuffle the combined pool so the order is random
    shuffleArray(questionsPool);
    // Hide category selection stage and show question stage
    categorySelection.classList.add('hidden');
    questionStage.classList.remove('hidden');
    // Display the first question
    showQuestion();
  }

  /**
   * Present the current question on screen.  Updates the scoreboard
   * to show the current question number and total, resets any
   * previous selection state, and populates the answer options.
   */
  function showQuestion() {
    const q = questionsPool[currentQuestionIndex];
    // Update scoreboard before rendering question
    updateScoreboard();
    // Set question text
    questionTextEl.textContent = q.question;
    // Clear existing options
    optionsListEl.innerHTML = '';
    // Populate options list
    q.options.forEach((optionText, index) => {
      const li = document.createElement('li');
      li.textContent = optionText;
      li.dataset.index = index;
      // Click handler to select an option
      li.addEventListener('click', () => selectOption(li));
      optionsListEl.appendChild(li);
    });
    // Reset selected option
    selectedOptionIndex = null;
    submitAnswerBtn.disabled = true;
  }

  /**
   * Handle selection of an answer option.  Removes the selected
   * class from all options and applies it to the clicked option.
   * Enables the submit button once an option is selected.
   *
   * @param {HTMLElement} li The list item representing the option
   */
  function selectOption(li) {
    // Remove any previous selection styling
    Array.from(optionsListEl.children).forEach((child) => {
      child.classList.remove('selected');
    });
    // Highlight the clicked option
    li.classList.add('selected');
    selectedOptionIndex = parseInt(li.dataset.index, 10);
    submitAnswerBtn.disabled = false;
  }

  // Submit answer handler
  submitAnswerBtn.addEventListener('click', () => {
    submitAnswer();
  });

  /**
   * Process the selected answer when the player submits it.  Marks
   * the correct and incorrect answers with specific classes for
   * feedback, updates the score if the answer was correct, and
   * automatically advances to the next question after a brief delay.
   */
  function submitAnswer() {
    // Safety check
    if (selectedOptionIndex === null) return;
    const currentQ = questionsPool[currentQuestionIndex];
    // Highlight answers as correct or incorrect
    Array.from(optionsListEl.children).forEach((li) => {
      const index = parseInt(li.dataset.index, 10);
      // Remove selection styling
      li.classList.remove('selected');
      if (index === currentQ.answer) {
        li.classList.add('correct');
      } else if (index === selectedOptionIndex) {
        li.classList.add('incorrect');
      }
    });
    // Update score if the answer is correct
    if (selectedOptionIndex === currentQ.answer) {
      score++;
      updateScoreboard();
    }
    // Disable the submit button to prevent multiple submissions
    submitAnswerBtn.disabled = true;
    // Wait briefly before proceeding to the next question
    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex < questionsPool.length) {
        // Remove feedback classes from previous options
        Array.from(optionsListEl.children).forEach((li) => {
          li.classList.remove('correct', 'incorrect');
        });
        showQuestion();
      } else {
        showResults();
      }
    }, 1000);
  }

  /**
   * Update the scoreboard to reflect the current question number and
   * score.  The scoreboard shows the question counter in the format
   * "السؤال: current / total" and the score as "النقاط: score".
   */
  function updateScoreboard() {
    const totalQuestions = questionsPool.length || 0;
    // Display current question index + 1; if no questions yet, show 0
    const currentNumber = totalQuestions > 0 ? currentQuestionIndex + 1 : 0;
    // Use "من" (of) instead of slash for better RTL readability
    currentQuestionCounter.textContent = `السؤال ${currentNumber} من ${totalQuestions}`;
    scoreDisplay.textContent = `النقاط: ${score}`;
  }

  /**
   * Display the results screen once all questions have been answered.
   * Shows the final score and provides a button to return to the
   * landing page.
   */
  function showResults() {
    questionStage.classList.add('hidden');
    resultStage.classList.remove('hidden');
    finalScoreText.textContent = `لقد حصلت على ${score} من أصل ${questionsPool.length} نقاط.`;
  }

  // Handle play again button: navigate back to the landing page
  playAgainBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  /**
   * Fisher–Yates shuffle algorithm to randomize an array in place.
   *
   * @param {Array} arr The array to shuffle
   */
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
});