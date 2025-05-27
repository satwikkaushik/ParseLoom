const grammarTextarea = document.getElementById('grammar-text');
const inputStringField = document.getElementById('input-string');
const parseBtn = document.getElementById('parse-btn');
const resultsSection = document.getElementById('results');
const loadingSpinner = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const itemsetsHeading = document.getElementById('itemsets-heading');
const parserTypeDropdown = document.getElementById('parser-type');
const firstFollowDisplay = document.getElementById('first-follow-display');
const firstFollowCard = firstFollowDisplay.closest('.visual-card');
const themeToggleBtn = document.getElementById('theme-toggle');

// Grammar display elements
const grammarDisplay = document.getElementById('grammar-display');
const itemsetsDisplay = document.getElementById('itemsets-display');
const parseTableDisplay = document.getElementById('parse-table-display');
const parseStepsDisplay = document.getElementById('parsing-steps-display');

const backendUrl = 'http://localhost:5000';

// Initialize with selected parser type
let selectedParserType = parserTypeDropdown.value;

// Update heading when parser type changes
parserTypeDropdown.addEventListener('change', function() {
    selectedParserType = this.value;
    updateUIForParserType(selectedParserType);
});

function updateUIForParserType(parserType) {
    // Update UI elements based on parser type
    if (parserType === 'LR0') {
        itemsetsHeading.textContent = 'LR(0) Items';
        // Hide First/Follow card for LR0
        firstFollowCard.style.display = 'none';
        
        // Show all tabs for LR0
        document.querySelector('.tab-btn[data-tab="itemsets"]').style.display = '';
        document.querySelector('.tab-btn[data-tab="parse-table"]').style.display = '';
        
        // Show example grammar for LR0
        if (!grammarTextarea.value.trim()) {
            grammarTextarea.value = 'E -> E + T | T\nT -> id';
            inputStringField.value = 'id';
        }
    } else if (parserType === 'LL1') {
        itemsetsHeading.textContent = 'LL(1) Items';
        // Show First/Follow card for LL1
        firstFollowCard.style.display = 'block';
        
        // Hide itemsets tab for LL1 since there are no itemsets
        document.querySelector('.tab-btn[data-tab="itemsets"]').style.display = 'none';
        
        // Show example grammar for LL1
        // if (!grammarTextarea.value.trim()) {
            grammarTextarea.value = 'E -> T E\'\nE\' -> + T E\' | ε\nT -> F T\'\nT\' -> * F T\' | ε\nF -> ( E ) | id';
            inputStringField.value = 'id + id * id';
        // }
    }
    
    // Make sure we're on a visible tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab.style.display === 'none') {
        // Switch to Grammar tab as default
        document.querySelector('.tab-btn[data-tab="grammar"]').click();
    }
}

// Initialize UI for the default parser type
updateUIForParserType(selectedParserType);

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
    
    // Clear previous results
    clearResults();

    try {
        // Parse grammar to JSON format
        let grammarJSON;
        try {
            grammarJSON = JSON.parse(convertToJSON(grammarText));
        } catch (parseError) {
            throw new Error('Invalid grammar format. Please check your grammar syntax.');
        }

        // Get the currently selected parser type
        const parserType = selectedParserType;
        
        // Send the request to the backend
        const response = await fetch(`${backendUrl}/${parserType}`, {
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
        displayResults(data, parserType);
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

function clearResults() {
    grammarDisplay.innerHTML = '';
    firstFollowDisplay.innerHTML = '';
    itemsetsDisplay.innerHTML = '';
    parseTableDisplay.innerHTML = '';
    parseStepsDisplay.innerHTML = '';
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

function displayResults(result, parserType) {
    if (!result) {
        showError('No results returned from the server.');
        return;
    }
    
    try {
        if (parserType === 'LR0') {
            displayLR0Results(result);
        } else if (parserType === 'LL1') {
            displayLL1Results(result);
        } else {
            showError(`Unsupported parser type: ${parserType}`);
        }
    } catch (error) {
        showError('Error displaying results: ' + error.message);
        console.error('Display error:', error);
    }
}

function displayLR0Results(result) {
    firstFollowCard.style.display = 'none';

    document.querySelector('.tab-btn[data-tab="itemsets"]').style.display = '';
    document.querySelector('.tab-btn[data-tab="parse-table"]').style.display = '';

    if (result.grammar) {
        displayLR0Grammar(result.grammar);
    }
    if (result.item_set) {
        displayItemSets(result.item_set);
    }
    if (result.parsed_table && result.grammar) {
        displayParseTable(result.parsed_table, result.grammar);
    }
    if (result.parsed_table && result.parsed_table.parsing_steps) {
        displayParsingSteps(result.parsed_table.parsing_steps);
    }
}

function displayLL1Results(result) {
    itemsetsDisplay.innerHTML = '';
    const itemsetsTab = document.getElementById('itemsets-tab');
    itemsetsTab.classList.remove('active');
    document.querySelector('.tab-btn[data-tab="itemsets"]').style.display = 'none';
    
    // Hide parse table tab if no data
    if (!result.parse_table) {
        document.querySelector('.tab-btn[data-tab="parse-table"]').style.display = 'none';
    } else {
        document.querySelector('.tab-btn[data-tab="parse-table"]').style.display = '';
        displayLL1ParseTable(result.parse_table);
    }
    
    document.querySelector('.tab-btn[data-tab="grammar"]').click();

    const firstFollowData = result.first_follow || result['first_follow: '];
    
    if (firstFollowData) {
        displayFirstFollow(firstFollowData);
        firstFollowCard.style.display = 'block';
    } else {
        firstFollowCard.style.display = 'none';
    }
    
    if (result.grammar) {
        displayLL1Grammar(result.grammar);
    }
    
    if (result.parsing_steps) {
        if (Array.isArray(result.parsing_steps) && 
            result.parsing_steps.length > 0 && 
            Array.isArray(result.parsing_steps[0])) {
            // This is LL1 format with [stack, input] pairs
            displayLL1ParsingSteps(result.parsing_steps);
        } else {
            // This might be a different format
            displayParsingSteps(result.parsing_steps);
        }
    }
}

function displayLR0Grammar(grammar) {
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

function displayLL1Grammar(grammar) {
    if (!grammar) {
        showError('Invalid grammar data received');
        return;
    }
    
    let html = '<div class="grammar-display">';
    
    if (grammar.grammar) {
    
        html += '<h3>Grammar:</h3>';
        html += '<ul class="grammar-list">';
        
        const grammarRules = grammar.grammar;
        for (const nonTerminal in grammarRules) {
            html += `<li><span class="non-terminal">${nonTerminal}</span> → ${formatProduction(grammarRules[nonTerminal])}</li>`;
        }
        
        html += '</ul>';
        html += '</div>';
        grammarDisplay.innerHTML += html;

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
    if (grammar.removed_left_recursion || grammar.removed_left_factoring) {
        displayGrammarTransformations(grammar);
    }
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

// Function to display LL(1) First/Follow Sets
function displayFirstFollow(firstFollow) {
    console.log('Displaying First/Follow sets:', firstFollow);
    
    // Handle different property names in the backend response
    const firstSets = firstFollow.first || firstFollow.firsts;
    const followSets = firstFollow.follow || firstFollow.follows;
    
    if (!firstFollow || !firstSets || !followSets) {
        showError('Invalid First/Follow sets data received');
        return;
    }
    
    let html = '<div class="first-follow-container">';
    
    // First Sets
    html += '<div class="first-sets">';
    html += '<h3>First Sets</h3>';
    html += '<ul class="set-list">';
    
    for (const nonTerminal in firstSets) {
        html += `<li><span class="non-terminal">${nonTerminal}</span>: { `;
        const symbols = firstSets[nonTerminal];
        html += symbols.map(sym => {
            if (sym === 'ε' || sym === 'epsilon' || sym === '#') {
                return `<span class="terminal">ε</span>`;
            } else {
                return `<span class="terminal">${sym}</span>`;
            }
        }).join(', ');
        html += ' }</li>';
    }
    
    html += '</ul>';
    html += '</div>';
    
    // Follow Sets
    html += '<div class="follow-sets">';
    html += '<h3>Follow Sets</h3>';
    html += '<ul class="set-list">';
    
    for (const nonTerminal in followSets) {
        html += `<li><span class="non-terminal">${nonTerminal}</span>: { `;
        const symbols = followSets[nonTerminal];
        html += symbols.map(sym => {
            if (sym === '$') {
                return `<span class="terminal">$</span>`;
            } else {
                return `<span class="terminal">${sym}</span>`;
            }
        }).join(', ');
        html += ' }</li>';
    }
    
    html += '</ul>';
    html += '</div>';
    
    html += '</div>';
    firstFollowDisplay.innerHTML = html;
}

// Function to display LL(1) parse table
function displayLL1ParseTable(parseTable) {
    if (!parseTable || !parseTable.table || !parseTable.terminals || !parseTable.non_terminals) {
        showError('Invalid LL(1) parse table data received');
        return;
    }
    
    const terminals = parseTable.terminals || [];
    const nonTerminals = parseTable.non_terminals || [];
    const table = parseTable.table || {};    let html = '<div class="table-responsive"><table class="parse-table">';
    html += '<thead><tr><th class="header-cell">Non-Terminal</th>';
    
    // Add terminal headers
    terminals.forEach(term => {
        const displayTerm = term === '#' ? 'ε' : term;
        html += `<th class="header-cell">${displayTerm}</th>`;
    });
    
    html += '</tr></thead>';
    html += '<tbody>';

    // Add rows for each non-terminal
    nonTerminals.forEach(nonTerm => {
        html += `<tr><td class="non-terminal-cell"><span class="non-terminal">${nonTerm}</span></td>`;
        
        terminals.forEach(term => {
            let cellContent = "";
            if (table[nonTerm] && table[nonTerm][term]) {
                const production = table[nonTerm][term];
                
                // Format the production with proper styling for terminals and non-terminals
                let formattedProduction = '';
                if (Array.isArray(production)) {
                    formattedProduction = production.map(symbol => {
                        if (symbol === '#') {
                            return '<span class="terminal">ε</span>';
                        } else if (symbol.match(/^[A-Z][A-Z']*$/)) {
                            return `<span class="non-terminal">${symbol}</span>`;
                        } else {
                            return `<span class="terminal">${symbol}</span>`;
                        }
                    }).join(' ');
                } else if (typeof production === 'string') {
                    // Handle string format (might be "symbol1 symbol2")
                    formattedProduction = production.split(' ').map(symbol => {
                        if (symbol === '#' || symbol === 'ε') {
                            return '<span class="terminal">ε</span>';
                        } else if (symbol.match(/^[A-Z][A-Z']*$/)) {
                            return `<span class="non-terminal">${symbol}</span>`;
                        } else {
                            return `<span class="terminal">${symbol}</span>`;
                        }
                    }).join(' ');
                }
                
                cellContent = `<span class="non-terminal">${nonTerm}</span> → ${formattedProduction}`;
            }
            html += `<td class="production-cell">${cellContent}</td>`;        });
        
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    parseTableDisplay.innerHTML = html;
}


// Function to display parsing steps in tabular format
function displayParsingSteps(parsingSteps) {
    if (!parsingSteps || !Array.isArray(parsingSteps)) {
        showError('Invalid parsing steps data received');
        return;
    }
    
    const parsingStepsDisplay = document.getElementById('parsing-steps-display');
    parsingStepsDisplay.innerHTML = '';
    
    if (parsingSteps.length === 0) {
        parsingStepsDisplay.innerHTML = '<div class="no-data">No parsing steps available.</div>';
        return;
    }
    
    // Create table structure
    let html = `
    <div class="parsing-table-container">
        <table class="parsing-table">
            <thead>
                <tr>
                    <th>Step</th>
                    <th>Stack</th>
                    <th>Input</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
      // Add rows for each parsing step
    parsingSteps.forEach((step, index) => {
        const animationDelay = index * 50;html += `        <tr class="parsing-table-row parsing-animation" style="animation-delay: ${animationDelay}ms">
            <td class="step-number">${step.step}</td>
            <td class="step-stack">
                <div class="stack-container">
                    ${step.stack.map((item, i) => 
                        `<span class="stack-item" title="Stack position ${i}">${item}</span>`
                    ).join('')}
                </div>
            </td>
            <td class="step-input">
                <div class="input-container">
                    ${step.input.map((token, i) => 
                        `<span class="input-token" title="Input position ${i}">${token}</span>`
                    ).join('')}
                </div>
            </td>
            <td class="step-action">${step.action}</td>
        </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    </div>
    `;
    
    parsingStepsDisplay.innerHTML = html;
    
    // Add click handler to highlight active row
    const tableRows = parsingStepsDisplay.querySelectorAll('.parsing-table-row');
    tableRows.forEach(row => {
        row.addEventListener('click', () => {
            // Remove active class from all rows
            tableRows.forEach(r => r.classList.remove('active'));
            // Add active class to clicked row
            row.classList.toggle('active');
        });
    });
}

// Function to display parsing steps for LL1 parser
function displayLL1ParsingSteps(parsingSteps) {
    if (!parsingSteps || !Array.isArray(parsingSteps)) {
        showError('Invalid LL1 parsing steps data received');
        return;
    }
    
    const parsingStepsDisplay = document.getElementById('parsing-steps-display');
    parsingStepsDisplay.innerHTML = '';
    
    if (parsingSteps.length === 0) {
        parsingStepsDisplay.innerHTML = '<div class="no-data">No parsing steps available.</div>';
        return;
    }
    
    // Create table structure
    let html = `
    <div class="parsing-table-container">
        <table class="parsing-table">
            <thead>
                <tr>
                    <th>Step</th>
                    <th>Stack</th>
                    <th>Input</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows for each parsing step
    parsingSteps.forEach((step, index) => {
        const stack = step[0];
        const input = step[1];
        const animationDelay = index * 50;
        
        // Determine action based on differences between current and next step
        let action = "";
        if (index < parsingSteps.length - 1) {
            const nextStack = parsingSteps[index + 1][0];
            const nextInput = parsingSteps[index + 1][1];
            
            // Check if a terminal was matched (stack and input both lost the same terminal)
            if (stack.length > nextStack.length && input.length > nextInput.length && stack[0] === input[0]) {
                action = `Match '${stack[0]}'`;
            } 
            // Check if a production was expanded (stack changed but input didn't)
            else if (stack.length !== nextStack.length && input.length === nextInput.length) {
                // Find the non-terminal that was expanded
                const nonTerminal = stack[0];
                action = `Expand ${nonTerminal}`;
            }
            // If we can't determine action, leave it blank
        } else if (index === parsingSteps.length - 1) {
            // Last step typically indicates acceptance if stack is [$] and input is [$]
            if (stack.length === 1 && stack[0] === '$' && input.length === 1 && input[0] === '$') {
                action = 'Accept';
            }
        }
        
        html += `
        <tr class="parsing-table-row parsing-animation" style="animation-delay: ${animationDelay}ms">
            <td class="step-number">${index + 1}</td>
            <td class="step-stack">
                <div class="stack-container">
                    ${stack.map((item, i) => 
                        `<span class="stack-item" title="Stack position ${i}">${item}</span>`
                    ).join('')}
                </div>
            </td>
            <td class="step-input">
                <div class="input-container">
                    ${input.map((token, i) => 
                        `<span class="input-token" title="Input position ${i}">${token}</span>`
                    ).join('')}
                </div>
            </td>
            <td class="step-action">${action}</td>
        </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    </div>
    `;
    
    parsingStepsDisplay.innerHTML = html;
    
    // Add click handler to highlight active row
    const tableRows = parsingStepsDisplay.querySelectorAll('.parsing-table-row');
    tableRows.forEach(row => {
        row.addEventListener('click', () => {
            // Remove active class from all rows
            tableRows.forEach(r => r.classList.remove('active'));
            // Add active class to clicked row
            row.classList.toggle('active');
        });
    });
}

// Function to display grammar transformations for LL1 parser
function displayGrammarTransformations(grammar) {
    if (!grammar) {
        return;
    }
    
    let html = '<div class="grammar-transformations">';
    
    // Left Recursion Removal
    if (grammar.removed_left_recursion) {
        html += '<h3>Grammar After Left Recursion Removal:</h3>';
        html += '<ul class="grammar-list">';
        
        for (const nonTerminal in grammar.removed_left_recursion) {
            const productions = grammar.removed_left_recursion[nonTerminal];
            html += `<li><span class="non-terminal">${nonTerminal}</span> → `;
            
            const productionsHtml = productions.map(prod => {
                // Handle empty production (epsilon)
                if (prod.length === 1 && (prod[0] === '' || prod[0] === '#')) {
                    return '<span class="terminal">ε</span>';
                }
                return prod.map(symbol => {
                    if (symbol === '#') {
                        return '<span class="terminal">ε</span>';
                    } else if (symbol.match(/^[A-Z][A-Z']*$/)) {
                        return `<span class="non-terminal">${symbol}</span>`;
                    } else {
                        return `<span class="terminal">${symbol}</span>`;
                    }
                }).join(' ');
            }).join(' <span class="or-symbol">|</span> ');
            
            html += productionsHtml + '</li>';
        }
        
        html += '</ul>';
    }
    
    // Left Factoring
    if (grammar.removed_left_factoring) {
        html += '<h3>Grammar After Left Factoring:</h3>';
        html += '<ul class="grammar-list">';
        
        for (const nonTerminal in grammar.removed_left_factoring) {
            const productions = grammar.removed_left_factoring[nonTerminal];
            html += `<li><span class="non-terminal">${nonTerminal}</span> → `;
            
            const productionsHtml = productions.map(prod => {
                if (prod.length === 1 && (prod[0] === '' || prod[0] === '#')) {
                    return '<span class="terminal">ε</span>';
                }
                return prod.map(symbol => {
                    if (symbol === '#') {
                        return '<span class="terminal">ε</span>';
                    } else if (symbol.match(/^[A-Z][A-Z']*$/)) {
                        return `<span class="non-terminal">${symbol}</span>`;
                    } else {
                        return `<span class="terminal">${symbol}</span>`;
                    }
                }).join(' ');
            }).join(' <span class="or-symbol">|</span> ');
            
            html += productionsHtml + '</li>';
        }
        
        html += '</ul>';
    }
    
    html += '</div>';
    
    grammarDisplay.innerHTML += html;
    
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

// Theme toggle functionality
function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    updateThemeToggleIcon(savedTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        updateThemeToggleIcon(newTheme);
        
        localStorage.setItem('theme', newTheme);
    });
}

function updateThemeToggleIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'light') {
        icon.className = 'bx bx-sun';
        themeToggleBtn.title = 'Switch to dark theme';
    } else {
        icon.className = 'bx bx-moon';
        themeToggleBtn.title = 'Switch to light theme';
    }
}

initThemeToggle();

// Initial setup with sample data
updateUIForParserType(selectedParserType);
