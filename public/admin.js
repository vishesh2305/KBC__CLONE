document.addEventListener('DOMContentLoaded', () => {
    // Simple password prompt for security
    const password = prompt("Enter Admin Password:");
    if (password !== "kbcadmin") { // Change this password!
        alert("Incorrect Password!");
        document.body.innerHTML = "<h1>Access Denied</h1>";
        return;
    }

    const form = document.getElementById('admin-form');
    const tableBody = document.querySelector('#questions-table tbody');
    const formTitle = document.getElementById('form-title');
    const questionIdInput = document.getElementById('question-id');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');

    // --- Form Inputs ---
    const qText = document.getElementById('question-text');
    const ans1 = document.getElementById('answer-1');
    const ans2 = document.getElementById('answer-2');
    const ans3 = document.getElementById('answer-3');
    const ans4 = document.getElementById('answer-4');
    const correct = document.getElementById('correct-answer');
    const difficulty = document.getElementById('difficulty');
    
    const apiUrl = '/api/questions';

    // --- Load all questions on page load ---
    async function loadQuestions() {
        try {
            const response = await fetch(`${apiUrl}/all`);
            if (!response.ok) throw new Error('Failed to fetch');
            const questions = await response.json();
            
            tableBody.innerHTML = ''; // Clear table
            questions.forEach(q => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${q.id}</td>
                    <td>${q.difficulty}</td>
                    <td>${q.question.substring(0, 50)}...</td>
                    <td>${q.answers[q.correct]}</td>
                    <td>
                        <button class="edit-btn" data-id="${q.id}">Edit</button>
                        <button class="delete-btn" data-id="${q.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Add event listeners to new buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editQuestion(btn.dataset.id, questions));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteQuestion(btn.dataset.id));
            });

        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Failed to load questions.');
        }
    }

    // --- Handle Form Submit (Create or Update) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const questionData = {
            question: qText.value,
            answers: [ans1.value, ans2.value, ans3.value, ans4.value],
            correct: parseInt(correct.value, 10),
            difficulty: parseInt(difficulty.value, 10)
        };
        
        const id = questionIdInput.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrl}/${id}` : apiUrl;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });

            if (!response.ok) throw new Error('Failed to save question');
            
            alert(`Question ${id ? 'updated' : 'added'} successfully!`);
            resetForm();
            loadQuestions();

        } catch (error) {
            console.error('Error saving question:', error);
            alert('Failed to save question.');
        }
    });

    // --- Edit Question ---
    function editQuestion(id, questions) {
        const q = questions.find(q => q.id == id);
        if (!q) return;

        formTitle.textContent = 'Edit Question';
        questionIdInput.value = q.id;
        qText.value = q.question;
        ans1.value = q.answers[0];
        ans2.value = q.answers[1];
        ans3.value = q.answers[2];
        ans4.value = q.answers[3];
        correct.value = q.correct;
        difficulty.value = q.difficulty;
        submitBtn.textContent = 'Update Question';
        clearBtn.style.display = 'inline-block';
        
        window.scrollTo(0, 0); // Scroll to top
    }

    // --- Delete Question ---
    async function deleteQuestion(id) {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            
            alert('Question deleted successfully!');
            loadQuestions();

        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Failed to delete question.');
        }
    }

    // --- Reset Form ---
    function resetForm() {
        form.reset();
        questionIdInput.value = '';
        formTitle.textContent = 'Add New Question';
        submitBtn.textContent = 'Add Question';
        clearBtn.style.display = 'none';
    }
    
    clearBtn.addEventListener('click', resetForm);

    // Initial load
    loadQuestions();
});