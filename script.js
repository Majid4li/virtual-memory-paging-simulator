
// ==========================================
// VIRTUAL MEMORY AND PAGING SIMULATOR
// ==========================================


// 1. Virtual Memory Configuration

const PAGE_SIZE = 16;


// 2. Page Table: Virtual Page Number -> Physical Frame Number

const pageTable = [
    2, 4, 5, null,
    1, 6, 0, null,
    3, null, 7, null,
    null, null, null, null
];
const initialPageTable = [
    2, 4, 5, null,
    1, 6, 0, null,
    3, null, 7, null,
    null, null, null, null
];


// 3. FIFO Queue: Oldest page is at the beginning

let pageQueue = [0, 1, 2, 4, 5, 6, 8, 10];
const initialPageQueue = [0, 1, 2, 4, 5, 6, 8, 10];


// 4. Get HTML Elements

const addressInput = document.getElementById("virtualAddress");
const translateButton = document.getElementById("translateBtn");
const resultBox = document.getElementById("translationResult");


// ==========================================
// 5. TRANSLATE VIRTUAL ADDRESS
// ==========================================

function translateAddress() {

    const virtualAddress = Number(addressInput.value);

    // Validate input

    if (
        addressInput.value.trim() === "" ||
        !Number.isInteger(virtualAddress) ||
        virtualAddress < 0 ||
        virtualAddress > 255
    ) {
        resultBox.innerHTML = `
            <p class="error">
                Enter a valid address between 0 and 255.
            </p>
        `;

        return;
    }

    // Calculate VPN and Offset

    const vpn = Math.floor(virtualAddress / PAGE_SIZE);
    const offset = virtualAddress % PAGE_SIZE;

    // Find Physical Frame

    const frameNumber = pageTable[vpn];

    // Get Step-by-Step Result Box

    const stepsBox = document.getElementById("stepByStepResult");

    // Display Step-by-Step Translation

    stepsBox.innerHTML = `
        <h3>Step-by-Step Translation</h3>

        <div class="step-card">
            <h4>Step 1: Virtual Address</h4>
            <p>Virtual Address = ${virtualAddress}</p>
        </div>

        <div class="step-card">
            <h4>Step 2: Calculate Virtual Page Number</h4>
            <p>
                VPN = Floor(${virtualAddress} / ${PAGE_SIZE}) = ${vpn}
            </p>
        </div>

        <div class="step-card">
            <h4>Step 3: Calculate Offset</h4>
            <p>
                Offset = ${virtualAddress} % ${PAGE_SIZE} = ${offset}
            </p>
        </div>

        <div class="step-card">
            <h4>Step 4: Page Table Lookup</h4>
            <p>
                Page ${vpn} maps to
                ${frameNumber === null
                    ? "No Frame (Page Fault)"
                    : "Frame " + frameNumber}.
            </p>
        </div>

        <div class="step-card">
            <h4>Step 5: Physical Address</h4>
            <p>
                ${
                    frameNumber === null
                        ? "Cannot calculate until the page is loaded into RAM."
                        : "PA = (" + frameNumber + " × " + PAGE_SIZE +
                          ") + " + offset + " = " +
                          ((frameNumber * PAGE_SIZE) + offset)
                }
            </p>
        </div>
    `;


    // Check for Page Fault

    if (frameNumber === null) {

        resultBox.innerHTML = `
            <p class="error">Page Fault Detected!</p>

            <p>Virtual Address: ${virtualAddress}</p>
            <p>Virtual Page Number: ${vpn}</p>
            <p>Offset: ${offset}</p>

            <p>This page is not present in RAM.</p>

            <button id="loadPageBtn">
                Load Page into RAM
            </button>
        `;

        return;
    }


    // Calculate Physical Address

    const physicalAddress =
        (frameNumber * PAGE_SIZE) + offset;


    // Display Successful Translation

    resultBox.innerHTML = `
        <p class="success">
            Address Translation Successful!
        </p>

        <p>Virtual Address: ${virtualAddress}</p>
        <p>Virtual Page Number: ${vpn}</p>
        <p>Offset: ${offset}</p>
        <p>Physical Frame Number: ${frameNumber}</p>

        <p>
            <strong>Physical Address: ${physicalAddress}</strong>
        </p>
    `;
}



// ==========================================
// 6. LOAD PAGE USING FIFO
// ==========================================

function loadPage() {

    const virtualAddress = Number(addressInput.value);

    // Validate input again

    if (
        addressInput.value.trim() === "" ||
        !Number.isInteger(virtualAddress) ||
        virtualAddress < 0 ||
        virtualAddress > 255
    ) {
        translateAddress();
        return;
    }

    // Calculate VPN and Offset

    const vpn = Math.floor(virtualAddress / PAGE_SIZE);
    const offset = virtualAddress % PAGE_SIZE;

    // Check whether page is already present

    if (pageTable[vpn] !== null) {
        translateAddress();
        return;
    }

    // Select oldest page using FIFO

    const oldestPage = pageQueue.shift();

    // Get its physical frame

    const availableFrame = pageTable[oldestPage];

    // Safety check

    if (availableFrame === null || availableFrame === undefined) {

        resultBox.innerHTML = `
            <p class="error">
                Unable to load page. Please reset the simulator.
            </p>
        `;

        return;
    }

    // Remove old page from RAM mapping

    pageTable[oldestPage] = null;

    // Load new page into the available frame

    pageTable[vpn] = availableFrame;

    // Add new page to FIFO queue

    pageQueue.push(vpn);

    // Update Page Table and Physical RAM

    renderPageTable();
    renderRAM();

    // Calculate new Physical Address

    const physicalAddress =
        (availableFrame * PAGE_SIZE) + offset;

    // Update Step-by-Step Translation

    translateAddress();

    // Display Page Loading Result

    resultBox.innerHTML = `
        <p class="success">
            Page Loaded Successfully!
        </p>

        <p>Page ${oldestPage} was replaced.</p>

        <p>
            Page ${vpn} loaded into Frame ${availableFrame}.
        </p>

        <p>Virtual Address: ${virtualAddress}</p>

        <p>Offset: ${offset}</p>

        <p>
            <strong>Physical Address: ${physicalAddress}</strong>
        </p>

        <p>You can now translate this address again.</p>
    `;
}



// ==========================================
// 7. DISPLAY PHYSICAL RAM FRAMES
// ==========================================

function renderRAM() {

    const ramContainer = document.getElementById("ramContainer");

    if (!ramContainer) return;

    ramContainer.innerHTML = "";

    // Create 8 Physical Frames

    for (let frame = 0; frame < 8; frame++) {

        // Find which virtual page is stored in this frame

        const vpn = pageTable.indexOf(frame);

        const frameElement = document.createElement("div");

        frameElement.className = "ram-frame";


        if (vpn !== -1) {

            // Occupied Frame

            frameElement.classList.add("occupied");

            frameElement.innerHTML = `
                <h3>Frame ${frame}</h3>
                <p>Page ${vpn}</p>
                <p>Status: Occupied</p>
            `;

        } else {

            // Empty Frame

            frameElement.classList.add("empty");

            frameElement.innerHTML = `
                <h3>Frame ${frame}</h3>
                <p>Empty</p>
                <p>Status: Available</p>
            `;
        }

        ramContainer.appendChild(frameElement);
    }
}



// ==========================================
// 8. DISPLAY PAGE TABLE
// ==========================================

function renderPageTable() {

    const tableBody = document.getElementById("pageTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    pageTable.forEach((frameNumber, vpn) => {

        const row = document.createElement("tr");

        if (frameNumber === null) {

            row.innerHTML = `
                <td>Page ${vpn}</td>
                <td>---</td>
                <td class="absent-status">Not Present</td>
            `;

        } else {

            row.innerHTML = `
                <td>Page ${vpn}</td>
                <td>Frame ${frameNumber}</td>
                <td class="present-status">Present</td>
            `;
        }

        tableBody.appendChild(row);
    });
}
// ==========================================
// RESET SIMULATOR
// ==========================================

function resetSimulator() {

    // Restore original Page Table
    pageTable.splice(0, pageTable.length, ...initialPageTable);

    // Restore original FIFO Queue
    pageQueue = [...initialPageQueue];

    // Restore default Virtual Address
    addressInput.value = 37;

    // Clear previous translation result
    resultBox.innerHTML = `
        <p>Translation result will appear here.</p>
    `;

    // Reset Step-by-Step Result
    const stepsBox = document.getElementById("stepByStepResult");

    if (stepsBox) {
        stepsBox.innerHTML = `
            <h3>Step-by-Step Translation</h3>

            <p>
                Translate an address to see the detailed
                translation process here.
            </p>
        `;
    }

    // Refresh Page Table and RAM
    renderPageTable();
    renderRAM();

}


// ==========================================
// 9. BUTTON EVENTS
// ==========================================

// Translate Button

if (translateButton) {

    translateButton.addEventListener("click", translateAddress);
}
// Reset Button

const resetButton = document.getElementById("resetSimulatorBtn");

if (resetButton) {
    resetButton.addEventListener("click", resetSimulator);
}

// Handle dynamically created Load Page button

if (resultBox) {

    resultBox.addEventListener("click", function(event) {

        if (event.target.id === "loadPageBtn") {

            loadPage();
        }
    });
}



// ==========================================
// 10. INTERACTIVE QUIZ QUESTIONS
// ==========================================

const quizQuestions = [

    {
        question: "What is Virtual Memory?",

        options: [
            "A type of CPU",
            "A memory management technique",
            "A physical hard disk",
            "A programming language"
        ],

        answer: 1
    },

    {
        question: "What is the size of each page in our simulator?",

        options: [
            "8 bytes",
            "16 bytes",
            "32 bytes",
            "64 bytes"
        ],

        answer: 1
    },

    {
        question: "What does VPN stand for?",

        options: [
            "Virtual Page Number",
            "Virtual Physical Network",
            "Variable Page Name",
            "Virtual Program Node"
        ],

        answer: 0
    },

    {
        question: "What happens when a required page is not in RAM?",

        options: [
            "System shutdown",
            "Page fault",
            "Address deletion",
            "Nothing happens"
        ],

        answer: 1
    },

    {
        question: "Which formula calculates Physical Address?",

        options: [
            "Frame + Offset",
            "Frame × Page Size + Offset",
            "VPN × Offset",
            "Page Size - Frame"
        ],

        answer: 1
    }
];


// Quiz Variables

let currentQuestion = 0;
let score = 0;
let answered = false;


// Get Quiz HTML Elements

const questionText = document.getElementById("questionText");
const answerOptions = document.getElementById("answerOptions");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");
const quizFeedback = document.getElementById("quizFeedback");
const quizScore = document.getElementById("quizScore");



// ==========================================
// 11. SHOW QUIZ QUESTION
// ==========================================

function showQuestion() {

    if (
        !questionText ||
        !answerOptions ||
        !nextQuestionBtn ||
        !quizFeedback
    ) {
        return;
    }

    answered = false;

    const question = quizQuestions[currentQuestion];

    questionText.textContent =
        `Q${currentQuestion + 1}. ${question.question}`;

    answerOptions.innerHTML = "";

    quizFeedback.textContent = "";

    nextQuestionBtn.style.display = "inline-block";

    nextQuestionBtn.textContent =
        currentQuestion === quizQuestions.length - 1
            ? "Finish Quiz"
            : "Next Question";


    // Display Answer Options

    question.options.forEach((option, index) => {

        const button = document.createElement("button");

        button.className = "quiz-option";

        button.textContent = option;

        button.addEventListener("click", () => {

            checkAnswer(index, button);
        });

        answerOptions.appendChild(button);
    });
}



// ==========================================
// 12. CHECK SELECTED ANSWER
// ==========================================

function checkAnswer(selected, selectedButton) {

    if (answered) return;

    answered = true;

    const correctAnswer =
        quizQuestions[currentQuestion].answer;

    const allButtons =
        answerOptions.querySelectorAll("button");


    // Disable all options and highlight correct answer

    allButtons.forEach((button, index) => {

        button.disabled = true;

        if (index === correctAnswer) {

            button.classList.add("correct");
        }
    });


    // Check selected answer

    if (selected === correctAnswer) {

        score++;

        quizFeedback.textContent =
            "Correct Answer! Well Done.";

        quizFeedback.style.color = "#4ade80";

    } else {

        selectedButton.classList.add("wrong");

        quizFeedback.textContent =
            "Incorrect! The correct answer is highlighted.";

        quizFeedback.style.color = "#f87171";
    }
}



// ==========================================
// 13. NEXT QUESTION
// ==========================================

if (nextQuestionBtn) {

    nextQuestionBtn.addEventListener("click", () => {

        if (!answered) {

            quizFeedback.textContent =
                "Please select an answer first.";

            quizFeedback.style.color = "#fbbf24";

            return;
        }

        currentQuestion++;


        // Show Next Question

        if (currentQuestion < quizQuestions.length) {

            showQuestion();

        } else {

            // Quiz Completed

            questionText.textContent = "Quiz Completed!";

            answerOptions.innerHTML = "";

            quizFeedback.textContent =
                "You have completed all questions.";

            nextQuestionBtn.style.display = "none";

            if (quizScore) {

                quizScore.textContent =
                    `Your Score: ${score} / ${quizQuestions.length}`;
            }
        }
    });
}



// ==========================================
// 14. INITIALIZE WEBSITE
// ==========================================

// Display Page Table when website loads

renderPageTable();

// Display Physical RAM when website loads

renderRAM();

// Display first Quiz Question

showQuestion();
