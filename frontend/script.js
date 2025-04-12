const grammarTextarea = document.getElementById('grammar-text');
const inputStringField = document.getElementById('input-string');
const parseBtn = document.getElementById('parse-btn');
const resultsSection = document.getElementById('results');
const loadingSpinner = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Grammar display elements
const grammarDisplay = document.getElementById('grammar-display');
const firstFollowDisplay = document.getElementById('first-follow-display');
const itemsetsDisplay = document.getElementById('itemsets-display');
const parseTableDisplay = document.getElementById('parse-table-display');

const backendUrl = 'http://localhost:5000';

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabName = button.getAttribute('data-tab');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Parse button click handler
parseBtn.addEventListener('click', async () => {
    const grammarText = grammarTextarea.value.trim();
    const inputString = inputStringField.value.trim();

    if (!grammarText || !inputString) {
        showError('Please enter both grammar and input string.');
        return;
    }

    // Show loading spinner and hide results and errors
    loadingSpinner.style.display = 'flex';
    resultsSection.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
        // Send the request to the backend
        const response = await fetch(`${backendUrl}/LR0`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            grammar: JSON.parse(convertToJSON(grammarText)),
            string: inputString
            })
        });

        const data = await response.json();

        // Hide loading spinner
        loadingSpinner.style.display = 'none';

        // Display the results
        displayResults(data);
        resultsSection.style.display = 'block';
        
        // Add fade-in animation to results section
        resultsSection.classList.add('animate-fade-in');

    } catch (error) {
        loadingSpinner.style.display = 'none';
        showError('Failed to connect to the server. Please check if the server is running.');
        console.error(error);
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function convertToJSON(input) {
  const lines = input.trim().split('\n');
  const result = {};

  lines.forEach(line => {
    const [key, value] = line.split('->').map(part => part.trim());
    result[key] = value;
  });

  return JSON.stringify(result, null, 2);
}

// Function to display the parsing steps on the frontend
function displayResults(result){
    displayGrammar(result.grammar);
    console.log(result.item_set);
    // displayItemSets(result.item_set);
    itemsetsDisplay.innerHTML = 'Item sets will be displayed here.'; // Placeholder for item sets display
    parseTableDisplay.innerHTML = 'Parse table will be displayed here.'; // Placeholder for parse table display
}

function displayGrammar(grammar) {
    const productions = grammar.productions;
    let html = '<div class="grammar-display">';
    
    // Original grammar
    html += '<h3>Original Grammar:</h3>';
    html += '<ul class="grammar-list">';
    
    for (const nonTerminal in productions) {
        if (nonTerminal !== grammar.augmented_start_symbol) {
            const prods = productions[nonTerminal].join(' | ');
            html += `<li><span class="non-terminal">${nonTerminal}</span> → ${formatProduction(prods)}</li>`;
        }
    }
    
    html += '</ul>';
    
    // Augmented grammar
    html += '<h3>Augmented Grammar:</h3>';
    html += '<ul class="grammar-list">';
    
    for (const nonTerminal in productions) {
        const prods = productions[nonTerminal].join(' | ');
        html += `<li><span class="non-terminal">${nonTerminal}</span> → ${formatProduction(prods)}</li>`;
    }
    
    html += '</ul>';
    
    html += '</div>';
    
    grammarDisplay.innerHTML = html;
    
    // Add animation
    const listItems = grammarDisplay.querySelectorAll('li');
    listItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 100);
    });
}

function formatProduction(production) {

    if (production.includes(',')) {
        // Remove commas and trim spaces
        production = production.replace(/\s*,\s*/g, ' ');
    }
    
    const parts = production.split(' ');
    let result = '';
    
    parts.forEach(part => {
            if (part === '|') {
                result += ' <span class="or-symbol">|</span> ';
            } else if (part === 'ε' || part === 'epsilon' || part === '') {
                result += '<span class="terminal">ε</span>';
            } else if (part.match(/^[A-Z][A-Z']*$/)) {
                // Non-terminals are typically uppercase
                result += `<span class="non-terminal">${part}</span> `;
            } else {
                // Terminals
                result += `<span class="terminal">${part}</span> `;
            }
        });
    
    return result;
}