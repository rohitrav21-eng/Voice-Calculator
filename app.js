class Calculator {
    constructor(previousOpElement, currentOpElement) {
        this.previousOpElement = previousOpElement;
        this.currentOpElement = currentOpElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        // Explicitly clear the DOM elements
        this.previousOpElement.innerText = '';
        this.updateDisplay();
    }

    delete() {
        if (this.currentOperand === '0') return;
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') this.currentOperand = '0';
        this.updateDisplay();
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
        this.updateDisplay();
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
        this.updateDisplay();
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '−':
            case '-':
                computation = prev - current;
                break;
            case '×':
            case '*':
                computation = prev * current;
                break;
            case '÷':
            case '/':
                if (current === 0) {
                    alert("Cannot divide by zero");
                    this.clear();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.updateDisplay();
        return computation;
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOpElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOpElement.innerText = `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        }
    }
}

// Initializations
const numberButtons = document.querySelectorAll('[data-num]');
const operationButtons = document.querySelectorAll('[data-action]');
const equalsButton = document.querySelector('[data-action="equals"]');
const deleteButton = document.querySelector('[data-action="backspace"]');
const allClearButton = document.querySelector('[data-action="clear"]');
const previousOpElement = document.getElementById('previous-op');
const currentOpElement = document.getElementById('current-op');
const micButton = document.getElementById('mic-button');
const statusText = document.getElementById('status-text');

const calculator = new Calculator(previousOpElement, currentOpElement);

// Event Listeners for Buttons
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        playSound('click');
    });
});

operationButtons.forEach(button => {
    if (['add', 'subtract', 'multiply', 'divide'].includes(button.dataset.action)) {
        button.addEventListener('click', () => {
            calculator.chooseOperation(button.innerText);
            playSound('click');
        });
    }
});

equalsButton.addEventListener('click', () => {
    calculator.compute();
    playSound('equals');
});

allClearButton.addEventListener('click', () => {
    calculator.clear();
    playSound('click');
});

deleteButton.addEventListener('click', () => {
    calculator.delete();
    playSound('click');
});

// Sound Effects (Simulated for now, can use Web Audio API)
function playSound(type) {
    // We could use a small beep or click sound here
    // console.log(`Playing sound: ${type}`);
}

// --- VOICE LOGIC (REFACTORED) ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isListening = false;
    let wakeWordDetected = false;
    let speechBuffer = "";

    const transcriptDisplay = document.getElementById('live-transcript');

    recognition.onstart = () => {
        console.log('Voice recognition started');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                speechBuffer += event.results[i][0].transcript + " ";
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const currentFullTranscript = (speechBuffer + interimTranscript).toLowerCase();

        if (!wakeWordDetected) {
            if (currentFullTranscript.includes('get up calculator')) {
                speechBuffer = ""; // Reset buffer after wake
                activateCalculator();
            }
        } else {
            transcriptDisplay.innerText = currentFullTranscript;

            if (currentFullTranscript.includes('stop listening')) {
                handleStopListening(currentFullTranscript);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            statusText.innerText = 'No speech detected.';
        }
    };

    recognition.onend = () => {
        if (isListening) recognition.start(); // Keep listening
    };

    // Auto-start listening for wake word
    window.addEventListener('load', () => {
        recognition.start();
        isListening = true;
    });

    micButton.addEventListener('click', () => {
        if (!wakeWordDetected) {
            activateCalculator();
        } else {
            deactivateCalculator();
        }
    });

    function activateCalculator() {
        wakeWordDetected = true;
        speechBuffer = "";
        micButton.classList.add('listening');
        statusText.innerText = 'Listening... (Say "Stop Listening" to calculate)';
        transcriptDisplay.innerText = "";
        speak("I'm listening.");
    }

    function deactivateCalculator() {
        wakeWordDetected = false;
        micButton.classList.remove('listening');
        statusText.innerText = 'Say "Get Up Calculator"';
        transcriptDisplay.innerText = "";
        speechBuffer = "";
    }

    function handleStopListening(fullTranscript) {
        console.log("Stop command detected. Processing:", fullTranscript);

        let command = fullTranscript.toLowerCase();

        // Match numbers globally
        const numbers = command.match(/\d+/g);

        if (numbers && numbers.length >= 2) {
            // 1. Chains for Addition
            if (command.includes('add')) {
                processFinalMath(numbers.join(' + '));
                deactivateCalculator();
                return;
            }
            // 2. Chains for Multiplication
            if (command.includes('multiply')) {
                processFinalMath(numbers.join(' * '));
                deactivateCalculator();
                return;
            }
            // 3. Subtraction (usually binary, order sensitive)
            if (command.includes('subtract')) {
                if (command.includes('from')) {
                    processFinalMath(`${numbers[1]} - ${numbers[0]}`);
                } else {
                    processFinalMath(`${numbers[0]} - ${numbers[1]}`);
                }
                deactivateCalculator();
                return;
            }
            // 4. Division (usually binary, order sensitive)
            if (command.includes('divide')) {
                processFinalMath(`${numbers[0]} / ${numbers[1]}`);
                deactivateCalculator();
                return;
            }
        }

        // 5. Fallback for direct phrases like "5 plus 10"
        let cleanCommand = command
            .replace('get up calculator', '')
            .replace('stop listening', '')
            .replace('calculate', '')
            .replace('equals', '')
            .replace(/plus|to|and/g, '+')
            .replace(/minus/g, '-')
            .replace(/times|into/g, '*')
            .replace(/divide/g, '/')
            .replace(/by/g, '')
            .replace(/add|subtract|multiply/g, '')
            .trim();

        processFinalMath(cleanCommand);
        deactivateCalculator();

        try {
            recognition.stop();
        } catch (e) { }
    }

    function processFinalMath(expression) {
        // Sanitize: only allow numbers, operators, and spaces
        const sanitized = expression.replace(/[^0-9+\-*/. ]/g, '');

        try {
            // we'll use a simple parser or eval if safe enough for this demo
            const result = eval(sanitized);

            calculator.clear();
            // Show the expression in previous-op
            previousOpElement.innerText = sanitized + " =";
            calculator.currentOperand = result.toString();
            calculator.updateDisplay();

            speak(`The answer is ${result}`);
        } catch (e) {
            statusText.innerText = "Couldn't understand math, please try again.";
            console.error("Math Error:", e);
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

} else {
    statusText.innerText = "Speech API not supported in this browser.";
    micButton.style.display = 'none';
}

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (e.key >= 0 && e.key <= 9) calculator.appendNumber(e.key);
    if (e.key === '.') calculator.appendNumber('.');
    if (e.key === '=' || e.key === 'Enter') calculator.compute();
    if (e.key === 'Backspace') calculator.delete();
    if (e.key === 'Escape') calculator.clear();
    if (e.key === '+') calculator.chooseOperation('+');
    if (e.key === '-') calculator.chooseOperation('−');
    if (e.key === '*') calculator.chooseOperation('×');
    if (e.key === '/') calculator.chooseOperation('÷');
});
