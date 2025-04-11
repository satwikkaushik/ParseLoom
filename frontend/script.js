document.getElementById("parse").addEventListener("click", async function () {
    // Get user input for grammar and input string
    const grammarInput = document.getElementById("grammar").value.trim();
    const inputStr = document.getElementById("inputStr").value.trim();

    // Convert grammar input into an object representation
    const grammarLines = grammarInput.split(",");
    const grammarObject = {};

    grammarLines.forEach((line) => {
        const [nonTerminal, production] = line.split("->").map((part) => part.trim());
        if (nonTerminal && production) {
            grammarObject[nonTerminal] = production;
        }
    });

    console.log("Parsed Grammar Object:", grammarObject);

    // Check if the inputs are valid
    if (!grammarInput || !inputStr) {
        alert("Please enter valid grammar and input string.");
        return;
    }

    // Prepare the payload to send to the backend
    const requestPayload = {
        grammar: grammarObject,
        input_string: inputStr,
    };
    console.log("Request Payload:", requestPayload);

    // Send POST request to the Flask backend
    try {
        const response = await fetch("http://localhost:5000/LR0", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
        });

        const result = await response.json();
        console.log("Response from server:", result);
        displayResult(result);
    } catch (error) {
        console.error("Error during parsing:", error);
        alert("Error in parsing request.");
    }
});

// Function to display the parsing steps on the frontend
function displayResult(result) {
    const outputContainer = document.getElementById("output-container");
    outputContainer.innerHTML = ""; // Clear previous output

    const createSection = (title) => {
        const section = document.createElement("div");
        section.className = "result-section";
        section.style.marginBottom = "15px";

        const heading = document.createElement("h3");
        heading.textContent = title;
        section.appendChild(heading);

        return section;
    };

    const renderKeyValue = (label, value) => {
        const container = document.createElement("div");
        container.style.marginLeft = "10px";
        container.style.marginBottom = "5px";

        const labelSpan = document.createElement("strong");
        labelSpan.textContent = `${label}: `;

        const valueSpan = document.createElement("span");
        if (Array.isArray(value)) {
            valueSpan.textContent = value.join(", ");
        } else if (typeof value === "object") {
            valueSpan.textContent = JSON.stringify(value);
        } else {
            valueSpan.textContent = value;
        }

        container.appendChild(labelSpan);
        container.appendChild(valueSpan);
        return container;
    };

    // === Grammar Section ===
    if (result.grammar) {
        const grammarSection = createSection("Grammar");

        if (result.grammar.start_symbol)
            grammarSection.appendChild(renderKeyValue("Start Symbol", result.grammar.start_symbol));

        if (result.grammar.non_terminals)
            grammarSection.appendChild(renderKeyValue("Non Terminals", result.grammar.non_terminals));

        if (result.grammar.terminals)
            grammarSection.appendChild(renderKeyValue("Terminals", result.grammar.terminals));

        if (result.grammar.productions) {
            const prodContainer = document.createElement("div");
            const prodTitle = document.createElement("strong");
            prodTitle.textContent = "Productions:";
            prodContainer.appendChild(prodTitle);

            const ul = document.createElement("ul");
            for (const [lhs, rules] of Object.entries(result.grammar.productions)) {
                const li = document.createElement("li");
                const rightSide = rules.map(r => Array.isArray(r) ? r.join(' ') : r).join(" | ");
                li.textContent = `${lhs} → ${rightSide}`;
                ul.appendChild(li);
            }

            prodContainer.appendChild(ul);
            grammarSection.appendChild(prodContainer);
        }

        outputContainer.appendChild(grammarSection);
    }

    // === Item Sets Section ===
    if (result.item_set) {
        const itemSetSection = createSection("Item Sets");

        if (result.item_set.item_sets) {
            const itemList = document.createElement("div");
            result.item_set.item_sets.forEach((set, index) => {
                const setDiv = document.createElement("div");
                setDiv.style.marginBottom = "5px";
                const title = document.createElement("strong");
                title.textContent = `Set ${index}:`;
                setDiv.appendChild(title);

                const ul = document.createElement("ul");
                set.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = item.join(" , ");
                    ul.appendChild(li);
                });

                setDiv.appendChild(ul);
                itemList.appendChild(setDiv);
            });
            itemSetSection.appendChild(itemList);
        }

        if (result.item_set.goto_table) {
            const gotoDiv = document.createElement("div");
            gotoDiv.style.marginTop = "10px";

            const title = document.createElement("strong");
            title.textContent = "Goto Table:";
            gotoDiv.appendChild(title);

            const ul = document.createElement("ul");
            for (const [key, val] of Object.entries(result.item_set.goto_table)) {
                const li = document.createElement("li");
                li.textContent = `${key} → ${val}`;
                ul.appendChild(li);
            }

            gotoDiv.appendChild(ul);
            itemSetSection.appendChild(gotoDiv);
        }

        outputContainer.appendChild(itemSetSection);
    }

    // === Parsing Steps ===
    if (result.status === "accepted" && result.steps) {
        const stepsSection = createSection("Parsing Steps");
        const ol = document.createElement("ol");

        result.steps.forEach((step) => {
            const li = document.createElement("li");
            li.className = "step";
            li.textContent = `Action: ${step.action}, Stack: [${step.stack.join(", ")}], Remaining Input: ${step.input}`;
            ol.appendChild(li);
        });

        stepsSection.appendChild(ol);
        outputContainer.appendChild(stepsSection);

        animateSteps(); // Animate after appending
    }

    // === Error Message ===
    if (result.status !== "accepted" && result.message) {
        const errorDiv = createSection("Error");
        const msg = document.createElement("p");
        msg.textContent = result.message;
        errorDiv.appendChild(msg);
        outputContainer.appendChild(errorDiv);
    }
}

// Function to animate the parsing steps with a delay between each step
function animateSteps() {
    const steps = document.querySelectorAll(".step");
    let currentStep = 0;

    // Hide all steps initially
    steps.forEach((step) => {
        step.style.display = "none";
    });

    function showNextStep() {
        if (currentStep < steps.length) {
            steps[currentStep].style.display = "block";
            currentStep++;
            setTimeout(showNextStep, 1000); // 1 second delay
        }
    }

    showNextStep();
}
