document.getElementById("parse").addEventListener("click", async function () {
    // Get user input for grammar and input string
    const grammarInput = document.getElementById("grammar").value.trim();
    const inputStr = document.getElementById("inputStr").value.trim();

    // Check if the inputs are valid
    if (!grammarInput || !inputStr) {
        alert("Please enter valid grammar and input string.");
        return;
    }

    // Prepare the payload to send to the backend
    const requestPayload = {
        grammar: grammarInput,
        input_string: inputStr
    };
    console.log("Request Payload:", requestPayload);

    // Send POST request to the Flask backend
    try {
        const response = await fetch('http://localhost:5000/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
        });

        const result = await response.json();
        console.log("Response from server:", result);
        // Display the result from the backend
        displayResult(result);
    } catch (error) {
        console.error('Error during parsing:', error);
        alert("Error in parsing request.");
    }
});

// Function to display the parsing steps on the frontend
function displayResult(result) {
    const outputContainer = document.getElementById("output-container");
    outputContainer.innerHTML = "";  // Clear previous output

    // Check if the parsing was successful
    if (result.status === "accepted") {
        const steps = result.steps;
        let stepsHtml = "<h3>Parsing Steps:</h3>";
        stepsHtml += "<ol>";
        
        steps.forEach(step => {
            stepsHtml += `<li>Action: ${step.action}, Stack: [${step.stack.join(", ")}], Remaining Input: ${step.input}</li>`;
        });

        stepsHtml += "</ol>";
        outputContainer.innerHTML = stepsHtml;
    } else {
        outputContainer.innerHTML = `<h3>Error:</h3><p>${result.message}</p>`;
    }
}

// Function to animate the parsing steps with a delay between each step
function animateSteps() {
    const steps = document.querySelectorAll(".step");
    let currentStep = 0;
    
    // Hide all steps initially
    steps.forEach(step => {
        step.style.display = "none";
    });

    // Show the steps one by one with a delay
    function showNextStep() {
        if (currentStep < steps.length) {
            steps[currentStep].style.display = "block";  // Show current step
            currentStep++;
            setTimeout(showNextStep, 1000);  // Wait 1 second before showing the next step
        }
    }

    // Start the animation
    showNextStep();
}
