document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#leaderboard-table tbody');
    
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Failed to fetch scores');
        
        const scores = await response.json();
        
        if (scores.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">No scores yet!</td></tr>';
            return;
        }

        scores.forEach((score, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.prize_money}</td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        tableBody.innerHTML = `<tr><td colspan="3">Failed to load scores.</td></tr>`;
    }
});