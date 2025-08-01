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
  // Container for subcategories and back button
  const subcategoriesContainer = document.getElementById('subcategories');
  const subcategorySelection = document.getElementById('subcategorySelection');
  const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');
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
  // The currently chosen main category and subcategory
  let selectedCategory = null;
  let selectedSubcategory = null;
  // Pool of questions for the active subcategory
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
      // Normalize categories: ensure each has subcategories array
      normalizeCategories(categoriesData);
      renderCategories();
    })
    .catch((err) => {
      console.warn('Using fallback questions due to fetch error:', err);
      categoriesData = fallbackQuestions.categories;
      // Normalize categories from fallback data
      normalizeCategories(categoriesData);
      renderCategories();
    });

  /**
   * Render the category cards based on the loaded data.  Each card
   * displays the Arabic name of the main category along with an
   * image.  Clicking a card selects the category and transitions
   * to the subcategory selection stage.
   */
  function renderCategories() {
    // Clear any existing cards
    categoriesContainer.innerHTML = '';
    categoriesData.forEach((cat) => {
      const card = document.createElement('div');
      card.classList.add('category-card');
      // Image element
      const img = document.createElement('img');
      img.src = cat.image || '';
      img.alt = cat.name;
      card.appendChild(img);
      // Title overlay
      const title = document.createElement('div');
      title.classList.add('card-title');
      title.textContent = cat.name;
      card.appendChild(title);
      // Click handler to select this main category
      card.addEventListener('click', () => handleMainCategoryClick(cat));
      categoriesContainer.appendChild(card);
    });
  }

  /**
   * Handle click on a main category card.  Stores the selected
   * category, hides the main category selection section, and
   * displays the subcategories for that category.
   *
   * @param {Object} categoryObj The category object that was clicked
   */
  function handleMainCategoryClick(categoryObj) {
    selectedCategory = categoryObj;
    // Hide main category selection and show subcategory selection
    categorySelection.classList.add('hidden');
    // Render subcategories for this category
    renderSubcategories(categoryObj.subcategories || []);
    subcategorySelection.classList.remove('hidden');
  }

  /**
   * Render the subcategory cards for a given list of subcategories.
   * Each subcategory card shows an image and name.  Clicking a card
   * selects the subcategory and starts the game with its questions.
   *
   * @param {Array} subcats Array of subcategory objects
   */
  function renderSubcategories(subcats) {
    // Clear existing subcategory cards
    subcategoriesContainer.innerHTML = '';
    subcats.forEach((sub) => {
      const card = document.createElement('div');
      card.classList.add('category-card');
      // Image for subcategory
      const img = document.createElement('img');
      img.src = sub.image || '';
      img.alt = sub.name;
      card.appendChild(img);
      // Title overlay
      const title = document.createElement('div');
      title.classList.add('card-title');
      title.textContent = sub.name;
      card.appendChild(title);
      // Click handler: choose this subcategory and start game
      card.addEventListener('click', () => handleSubcategoryClick(sub));
      subcategoriesContainer.appendChild(card);
    });
  }

  /**
   * Handle the selection of a subcategory.  Stores the selected
   * subcategory, builds the pool of questions from it, and starts
   * the game by showing the question stage.
   *
   * @param {Object} subcat The selected subcategory object
   */
  function handleSubcategoryClick(subcat) {
    selectedSubcategory = subcat;
    // Build question pool from subcategory
    questionsPool = [...(subcat.questions || [])];
    // Shuffle questions for randomness
    shuffleArray(questionsPool);
    currentQuestionIndex = 0;
    score = 0;
    // Hide subcategory selection and show question stage
    subcategorySelection.classList.add('hidden');
    questionStage.classList.remove('hidden');
    // Show first question
    showQuestion();
  }

  // Back button from subcategories to main categories
  if (backToCategoriesBtn) {
    backToCategoriesBtn.addEventListener('click', () => {
      // Hide subcategories and show categories again
      subcategorySelection.classList.add('hidden');
      categorySelection.classList.remove('hidden');
      selectedCategory = null;
      selectedSubcategory = null;
    });
  }

  /**
   * Initialize the game by building a pool of questions based on the
   * selected categories.  From each selected category, two random
   * questions are chosen.  The resulting list of questions is then
   * shuffled to randomize the order.  The question stage UI is
   * displayed and the first question is presented.
   */
  /**
   * Start the game by preparing a pool of questions and showing the
   * question stage.  This function can be used for backward
   * compatibility if called directly, but in the new game flow it
   * is not invoked because the pool is prepared when a subcategory
   * is selected.  If a subcategory has been selected, it uses
   * `selectedSubcategory.questions`; otherwise it falls back to
   * the old logic of selecting questions from multiple categories.
   */
  function startGame() {
    // Reset game state
    questionsPool = [];
    currentQuestionIndex = 0;
    score = 0;
    if (selectedSubcategory && Array.isArray(selectedSubcategory.questions)) {
      // Use all questions from the selected subcategory
      questionsPool = [...selectedSubcategory.questions];
    } else if (typeof selectedCategories !== 'undefined' && Array.isArray(selectedCategories)) {
      // Backward compatibility: select two questions from each chosen category
      selectedCategories.forEach((catId) => {
        const categoryObj = categoriesData.find((c) => c.id === catId);
        if (categoryObj) {
          const questionsCopy = [...(categoryObj.questions || [])];
          shuffleArray(questionsCopy);
          questionsPool.push(...questionsCopy.slice(0, 2));
        }
      });
    }
    // Shuffle the pool for randomness
    shuffleArray(questionsPool);
    // Hide selections and show question stage
    categorySelection.classList.add('hidden');
    subcategorySelection.classList.add('hidden');
    questionStage.classList.remove('hidden');
    // Show first question
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

  /**
   * Normalize the category data to ensure each category contains a
   * `subcategories` array.  If a category does not define
   * subcategories (e.g. fallback data uses a flat structure with
   * `questions` directly under the category), this function wraps
   * those questions into a single synthetic subcategory so the rest
   * of the game logic can treat both data shapes uniformly.
   *
   * @param {Array} cats Array of category objects to normalize
   */
  function normalizeCategories(cats) {
    cats.forEach((cat) => {
      if (!cat.subcategories) {
        const sc = {
          id: `${cat.id}_sub`,
          name: cat.name,
          image: cat.image || '',
          questions: cat.questions || [],
        };
        cat.subcategories = [sc];
      }
    });
  }
});