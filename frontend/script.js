document.getElementById('parse').addEventListener('click', function() {
    const grammarInput = document.getElementById('grammar').value;
    
    if (!grammarInput.trim()) {
        alert("Please enter a grammar.");
        return;
    }
    const rules = grammarInput.split(',').map(rule => rule.trim());

    const grammarJson = {};

    rules.forEach(rule => {
        const [leftSide, rightSide] = rule.split('->').map(part => part.trim());

        if (leftSide && rightSide) {
            grammarJson[leftSide] = rightSide;
        }
    });

    const outputContainer = document.getElementById('output-container');
    outputContainer.innerHTML = '';
    outputContainer.style.display = 'block';
    outputContainer.innerHTML = '<h3>Parsed Grammar:</h3>';
    for (const [leftSide, rightSide] of Object.entries(grammarJson)) {
        const ruleDiv = document.createElement('div');
        ruleDiv.classList.add('rule');
        ruleDiv.innerHTML = `<strong>${leftSide}</strong> → <span>${rightSide}</span>`;
        outputContainer.appendChild(ruleDiv);
    }

    console.log("Grammar in JSON format:", JSON.stringify(grammarJson, null, 2));
});
