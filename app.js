// Define the quiz questions in an array of objects containing the question, answers, and correct answer.[4]
const myQuestions =;

const quizContainer = document.getElementById('quiz');
const resultsContainer = document.getElementById('results');
const submitButton = document.getElementById('submit');

// Use a function to loop through questions and generate the HTML for the quiz interface.[4]
function buildQuiz() {
    const output =;
    myQuestions.forEach((currentQuestion, questionNumber) => {
        const answers =;
        for (let letter in currentQuestion.answers) {
            answers.push(
                `<label style="display:block; cursor:pointer;">
                    <input type="radio" name="question${questionNumber}" value="${letter}">
                    <strong>${letter.toUpperCase()}</strong> : ${currentQuestion.answers[letter]}
                </label>`
            );
        }
        output.push(
            `<div class="question-block" style="margin-bottom: 1.5rem;">
                <div class="question" style="font-weight: bold; margin-bottom: 0.5rem;">${questionNumber + 1}. ${currentQuestion.question}</div>
                <div class="answers"> ${answers.join('')} </div>
            </div>`
        );
    });
    quizContainer.innerHTML = output.join('');
}

// Evaluate the user's input and visually highlight the results.[4]
function showResults() {
    const answerContainers = quizContainer.querySelectorAll('.answers');
    let numCorrect = 0;
    
    myQuestions.forEach((currentQuestion, questionNumber) => {
        const answerContainer = answerContainers[questionNumber];
        const selector = `input[name=question${questionNumber}]:checked`;
        // Ensure the application does not crash if a user skips a question.[4]
        const userAnswer = (answerContainer.querySelector(selector) |

| {}).value;
        
        if (userAnswer === currentQuestion.correctAnswer) {
            numCorrect++;
            answerContainers[questionNumber].style.color = '#27ae60';
        } else {
            answerContainers[questionNumber].style.color = '#c0392b';
        }
    });
    
    resultsContainer.innerHTML = `VIVA Audience Score: ${numCorrect} out of ${myQuestions.length} correct!`;
}

if(quizContainer && submitButton) {
    buildQuiz();
    submitButton.addEventListener('click', showResults);
}

// Lightbox Logic: Toggle the display property of the modal element between block and none.[3]
let slideIndex = 1;

function openModal() {
    document.getElementById("evidenceModal").style.display = "block";
}

function closeModal() {
    document.getElementById("evidenceModal").style.display = "none";
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let slides = document.getElementsByClassName("mySlides");
    let captionText = document.getElementById("caption");
    
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    
    if(slides.length > 0) {
        slides[slideIndex - 1].style.display = "block";
        captionText.innerHTML = slides[slideIndex - 1].querySelector('img').alt;
    }
}

// Chart.js instantiation using a configuration object for Challenge 6 data visualization.[5]
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('impactChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels:,
                datasets: [{
                    label: 'Community Engagement (Participants)',
                    data: ,
                    backgroundColor: '#e74c3c'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Empirical Impact Tracking (Challenge 6)',
                        font: { size: 16, family: 'Arial' }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
});