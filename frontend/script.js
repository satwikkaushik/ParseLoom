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
        // Parse grammar to JSON format
        let grammarJSON;
        try {
            grammarJSON = JSON.parse(convertToJSON(grammarText));
        } catch (parseError) {
            throw new Error('Invalid grammar format. Please check your grammar syntax.');
        }

        // Send the request to the backend
        const response = await fetch(`${backendUrl}/LR0`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grammar: grammarJSON,
                string: inputString
            })
        });

        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.message || 
                `Server error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();

        // Check if response contains error
        if (data.error) {
            throw new Error(data.error);
        }

        // Hide loading spinner
        loadingSpinner.style.display = 'none';

        // Display the results
        displayResults(data);
        resultsSection.style.display = 'block';
        resultsSection.classList.add('animate-fade-in');

    } catch (error) {
        loadingSpinner.style.display = 'none';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError('Failed to connect to the server. Please check if the server is running.');
        } else {
            showError(error.message || 'An unexpected error occurred. Please try again.');
        }
        
        console.error('Error details:', error);
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function convertToJSON(input) {
  try {
    const lines = input.trim().split('\n');
    const result = {};

    lines.forEach((line) => {
      const [key, value] = line.split('->').map(part => part.trim());
      result[key] = value;
    });

    return JSON.stringify(result, null, 2);
  } catch (error) {
      throw new Error('Invalid grammar format. Please check your syntax.');
  }
}

function displayResults(result){    
    try {
        if (result.grammar) displayGrammar(result.grammar);
        if (result.item_set) displayItemSets(result.item_set);
        if (result.parsed_table && result.grammar) displayParseTable(result.parsed_table, result.grammar);
    } catch (error) {
        showError('Error displaying results: ' + error.message);
        console.error('Display error:', error);
    }
}

function displayGrammar(grammar) {
    if (!grammar || !grammar.productions) {
        showError('Invalid grammar data received');
        return;
    }
    
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

function displayItemSets(set){
    if (!set || !set.item_sets || !Array.isArray(set.item_sets)) {
        showError('Invalid itemsets data received');
        return;
    }
    
    itemsetsDisplay.innerHTML = ''; // Clear previous content
    
    set.item_sets.forEach((itemSet, index) => {
        let html = `<h3 class="itemset-header">Item Set ${index}:</h3>`;
        html += '<ul class="itemset-items">';
        
        itemSet.forEach(item => {
            const leftPart = item[0];
            const rightPart = item[1];
            const dotPlacement = item[2];
            let rightPartHtml = rightPart.map((symbol, index) => {
                if (index === dotPlacement) {
                    return `<span class="dot">•</span> ${symbol}`;
                } else {
                    return symbol;
                }
            }).join(' ');

            if(dotPlacement === rightPart.length){
                rightPartHtml += ` <span class="dot">•</span>`;
            }

            html += `<li class="item"> ${leftPart} → ${rightPartHtml} </li>`;
        });

        html += '</ul>';
        itemsetsDisplay.innerHTML += `<div class="itemset"> ${html} </div>`;
    });
}

function displayParseTable(parseTable, grammar){
    if (!parseTable || !parseTable.action_table || !parseTable.goto_table || !grammar) {
        showError('Invalid parse table data received');
        return;
    }
    
    const terminals = grammar.terminals || [];
    const nonTerminal = grammar.non_terminals || [];

    let html = '<table>';
    html += '<thead><tr><th>State</th>';
    terminals.forEach(term => {
        html += `<th>Action [ ${term} ]</th>`;
    });

    nonTerminal.forEach(nonTerm => {
        html += `<th>Goto [ ${nonTerm} ]</th>`;
    });
    html += '</tr></thead>';
    html += '<tbody>';

    const states = Object.keys(parseTable.action_table);
    const actionTable = parseTable.action_table;
    const gotoTable = parseTable.goto_table;

    states.forEach(state => {
        html += `<tr><td>${state}</td>`;
        
        terminals.forEach(term => {
            let cellContent = "";
            if (actionTable[state] && actionTable[state][term]) {
                const action = actionTable[state][term];
                if (action.type === 'shift') {
                    cellContent = `s${action.value}`;
                } else if (action.type === 'reduce' && action.production) {
                    const lhs = action.production.lhs;
                    const rhs = Array.isArray(action.production.rhs) ? action.production.rhs.join(' ') : '';
                    cellContent = `r(${lhs} → ${rhs})`;
                } else if (action.type === 'accept') {
                    cellContent = 'accept';
                }
            }
            html += `<td>${cellContent}</td>`;
        });
        
        nonTerminal.forEach(nonTerm => {
            let cellContent = "";
            if (gotoTable[state] && gotoTable[state][nonTerm] !== undefined) {
                cellContent = gotoTable[state][nonTerm];
            }
            html += `<td>${cellContent}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    parseTableDisplay.innerHTML = html;
}


// Add some sample data to the inputs
grammarTextarea.value = 'E -> E + T | T\nT -> id';
inputStringField.value = 'id';