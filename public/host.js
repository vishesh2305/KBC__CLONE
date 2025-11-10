document.addEventListener('DOMContentLoaded', () => {
    // Simple password prompt for security
    const password = prompt("Enter Host Password:");
    if (password !== "kbchost") { // Change this password!
        alert("Incorrect Password!");
        document.body.innerHTML = "<h1>Access Denied</h1>";
        return;
    }

    const clearBtn = document.getElementById('clear-leaderboard-btn');

    clearBtn.addEventListener('click', async () => {
        if (!confirm('ARE YOU ABSOLUTELY SURE?\nThis will delete all scores and cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/leaderboard/all', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear leaderboard');
            
            alert('Leaderboard has been cleared successfully.');

        } catch (error) {
            console.error('Error clearing leaderboard:', error);
            alert('An error occurred. Leaderboard was not cleared.');
        }
    });
});