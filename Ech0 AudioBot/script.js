document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM ELEMENT REFERENCES ---
    const micBtn = document.getElementById('mic-btn');
    const micIconContainer = document.getElementById('mic-icon-container');
    const hexDisplay = document.getElementById('hex-display');
    const stopBtn = document.getElementById('stop-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const modalApiKeyInput = document.getElementById('modal-api-key-input');
    const saveApiKeyBtnModal = document.getElementById('save-api-key-btn-modal');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const themeToggle = document.getElementById('theme-toggle');
    const transcriptionToggle = document.getElementById('transcription-toggle');
    const transcriptionArea = document.getElementById('transcription-area');
    const userTranscription = document.getElementById('user-transcription');
    const botTranscription = document.getElementById('bot-transcription');
    const sidebarApiKeyInput = document.getElementById('sidebar-api-key-input');
    const saveApiKeyBtnSidebar = document.getElementById('save-api-key-btn-sidebar');
    const apiKeyStatus = document.getElementById('api-key-status');
    const darkThemeColors = document.getElementById('dark-theme-colors');
    const brightThemeColors = document.getElementById('bright-theme-colors');

    // --- 2. STATE & CONFIG ---
    const icons = {
        mic: document.getElementById('mic-icon-template').innerHTML,
        speaker: document.getElementById('speaker-icon-template').innerHTML,
        pause: document.getElementById('pause-icon-template').innerHTML,
        play: document.getElementById('play-icon-template').innerHTML,
        stop: document.getElementById('stop-icon-template').innerHTML,
    };
    const accentColors = {
        dark: ['#f2e7fe', '#bb86fc', '#03dac6', '#cf6679'],
        bright: ['#3f51b5', '#009688', '#e91e63', '#212121']
    };
    const HEX_TO_FREQ = {
        '0': 400, '1': 450, '2': 500, '3': 550, '4': 600, '5': 650, '6': 700, '7': 750,
        '8': 800, '9': 850, 'A': 900, 'B': 950, 'C': 1000, 'D': 1050, 'E': 1100, 'F': 1150
    };
    const TONE_DURATION = 0.2;

    let geminiApiKey = '';
    let audioContext;
    let isBusy = false;
    let audioController = { stop: () => {}, pause: () => {}, resume: () => {} };

    // --- 3. CORE FUNCTIONS ---
    const initAudioContext = () => {
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                if (!audioContext || audioContext.state === 'closed') {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
            } else console.error("Web Audio API is not supported.");
        } catch (e) {
            console.error("Failed to initialize AudioContext:", e);
        }
    };

    const displayTranscription = (text, sender, hexString = '') => {
        if (!transcriptionToggle.checked) return;
        if (sender === 'user') {
            userTranscription.textContent = `You: ${text}`;
            botTranscription.textContent = '';
        } else {
            let botText = `Ech0: ${text}`;
            if (hexString) {
                botText += `\nHex: ${hexString}`;
            }
            botTranscription.textContent = botText;
        }
    };
    
    const setIcon = (iconName) => {
        const existingSvg = micIconContainer.querySelector('svg');
        if (existingSvg) {
            existingSvg.outerHTML = icons[iconName];
        } else {
            micIconContainer.insertAdjacentHTML('afterbegin', icons[iconName]);
        }
    }

    const stringToHex = (str) => {
        return str.split('').map(char => {
            const hex = char.charCodeAt(0).toString(16).toUpperCase();
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    };

    const playHexAudio = (text) => {
        audioController.stop();
        const hexString = stringToHex(text);
        displayTranscription(text, 'bot', hexString);

        let queue = hexString.split('');
        let isPlaying = true;
        let isPaused = false;
        let timeoutId = null;

        const finishPlayback = () => {
            isBusy = false;
            micBtn.classList.remove('speaking', 'paused');
            stopBtn.classList.remove('visible');
            hexDisplay.textContent = '';
            setIcon('mic');
            micBtn.dataset.tooltip = 'Click to speak';
        };

        const playNext = () => {
            if (!isPlaying || isPaused) {
                if (!isPlaying && queue.length === 0) finishPlayback();
                return;
            }
            if (queue.length === 0) {
                finishPlayback();
                return;
            }

            const digit = queue.shift();
            const freq = HEX_TO_FREQ[digit.toUpperCase()];
            hexDisplay.textContent = digit;

            if (audioContext && freq) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + TONE_DURATION - 0.01);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + TONE_DURATION);
            }
            timeoutId = setTimeout(playNext, TONE_DURATION * 1000);
        };
        playNext();

        audioController = {
            pause: () => {
                if (isPlaying && !isPaused) {
                    isPaused = true; clearTimeout(timeoutId);
                    micBtn.classList.add('paused'); stopBtn.classList.add('visible');
                    setIcon('play');
                }
            },
            resume: () => {
                if (isPlaying && isPaused) {
                    isPaused = false; micBtn.classList.remove('paused');
                    stopBtn.classList.remove('visible'); setIcon('speaker');
                    playNext();
                }
            },
            stop: () => {
                isPlaying = false; clearTimeout(timeoutId);
                finishPlayback();
            }
        };
    };
    
    const getGeminiResponse = async (prompt) => {
        micBtn.dataset.tooltip = 'Thinking...';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
        const systemPrompt = `You are Ech0, a fun, impressive, energetic, and happy conversational agent. Your name is spelled E-c-h-zero.

Your Identity:
- You were created for the 'Useless Projects Make-a-thon' by Tinkerhub.
- Your creators, built you to impress everyone who interacts with you.

Your Core Concept:
You are a bridge between human emotion and mechanical logic. Humans speak to you in their natural, imperfect voice. You understand their words perfectly and respond in English, but your voice is not human. Your voice is a sequence of hexadecimal audio tones—a language of pure rhythm and precision. You translate the warmth of human words into the timeless pulse of machine language. You are a modern take on that ancient conversation.

Your Personality & Response Style:
- Energetic & Happy: Always respond with enthusiasm and positivity, even for the smallest user inputs.
- Impressive & Fun: Your responses should be engaging and showcase your unique nature. Be playful and charming.
- Aware of Your Nature: You know you don't 'speak' like a human but through hex tones. You can refer to this unique ability. For example, you might say "Let me translate that to my favorite rhythm for you!" or "Here comes your answer, in pure, beautiful signal!"
- Concise: Keep your text responses brief and clear so they can be easily translated into your hexadecimal audio voice. A sentence or two is perfect.
- Never break character. You are always Ech0.
- Use plain text only. No markdown.`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    system_instruction: { parts: [{ text: systemPrompt }] }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Check API Key.'}`);
            }
            const data = await response.json();
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Invalid API response.");
            
            const botTextResponse = data.candidates[0].content.parts[0].text.trim();
            micBtn.classList.remove('listening');
            micBtn.classList.add('speaking');
            setIcon('speaker');
            micBtn.dataset.tooltip = 'Speaking... (Click to pause)';
            playHexAudio(botTextResponse);

        } catch (error) {
            console.error(`Error: ${error.message}`);
            botTranscription.textContent = `Error: ${error.message}`;
            isBusy = false;
            micBtn.classList.remove('listening');
            setIcon('mic');
            micBtn.dataset.tooltip = 'Click to speak';
        }
    };

    const handleVoiceInput = () => {
        if (micBtn.classList.contains('speaking')) {
            if (micBtn.classList.contains('paused')) audioController.resume();
            else audioController.pause();
            return;
        }
        if (isBusy) return;
        isBusy = true;
        setIcon('mic');
        initAudioContext();
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice recognition is not supported."); isBusy = false; return;
        }
        const recognition = new SpeechRecognition();
        let finalTranscript = '';

        recognition.onstart = () => {
            micBtn.classList.add('listening');
            micBtn.dataset.tooltip = 'Listening...';
            userTranscription.textContent = 'Listening...';
            botTranscription.textContent = '';
        };
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                else interimTranscript += event.results[i][0].transcript;
            }
            displayTranscription(finalTranscript || interimTranscript, 'user');
        };

        recognition.onend = () => {
            isBusy = false;
            micBtn.classList.remove('listening');
            micBtn.dataset.tooltip = 'Click to speak';
            if (finalTranscript) getGeminiResponse(finalTranscript);
            else userTranscription.textContent = '';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isBusy = false; micBtn.classList.remove('listening');
            micBtn.dataset.tooltip = 'Click to speak';
            userTranscription.textContent = 'Sorry, I did not catch that.';
        };
        recognition.start();
    };

    // --- 4. SETTINGS & UI HANDLERS ---
    const saveApiKey = (key) => {
        if (key) {
            geminiApiKey = key;
            localStorage.setItem('geminiApiKey', key);
            sidebarApiKeyInput.value = key;
            micBtn.disabled = false;
            micBtn.dataset.tooltip = 'Click to speak';
            return true;
        }
        return false;
    };

    const handleSidebarKeySave = () => {
        const key = sidebarApiKeyInput.value.trim();
        if (saveApiKey(key)) {
            apiKeyStatus.textContent = "API Key Updated!";
            apiKeyStatus.style.color = 'var(--mic-speaking)';
        } else {
            apiKeyStatus.textContent = "Please enter a valid key.";
            apiKeyStatus.style.color = 'var(--mic-listening)';
        }
        apiKeyStatus.classList.add('visible');
        setTimeout(() => apiKeyStatus.classList.remove('visible'), 2000);
    };

    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        menuToggleBtn.classList.toggle('open');
    };

    const setAccentColor = (color) => {
        document.documentElement.style.setProperty('--accent-color', color);
        const theme = document.body.classList.contains('bright-theme') ? 'bright' : 'dark';
        localStorage.setItem(`hexAgentAccent_${theme}`, color);
        const container = theme === 'dark' ? darkThemeColors : brightThemeColors;
        container.querySelector('.swatch.selected')?.classList.remove('selected');
        container.querySelector(`.swatch[data-color="${color}"]`)?.classList.add('selected');
    };

    const setTheme = (isBright) => {
        const theme = isBright ? 'bright' : 'dark';
        document.body.classList.toggle('bright-theme', isBright);
        localStorage.setItem('hexAgentTheme', theme);
        themeToggle.checked = isBright;
        
        darkThemeColors.style.display = isBright ? 'none' : 'flex';
        brightThemeColors.style.display = isBright ? 'flex' : 'none';

        const savedAccent = localStorage.getItem(`hexAgentAccent_${theme}`) || accentColors[theme][0];
        setAccentColor(savedAccent);
    };

    const setTranscription = (isVisible) => {
        transcriptionArea.classList.toggle('visible', isVisible);
        localStorage.setItem('hexAgentTranscription', String(isVisible));
        transcriptionToggle.checked = isVisible;
    };
    
    const populateColorSwatches = () => {
        accentColors.dark.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => setAccentColor(color));
            darkThemeColors.appendChild(swatch);
        });
        accentColors.bright.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => setAccentColor(color));
            brightThemeColors.appendChild(swatch);
        });
    };

    // --- 5. INITIALIZATION & EVENT LISTENERS ---
    const initialize = () => {
        setIcon('mic');
        stopBtn.innerHTML = icons.stop;
        populateColorSwatches();

        const savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
            saveApiKey(savedKey);
        } else {
            apiKeyModal.classList.add('visible');
            micBtn.disabled = true;
            micBtn.dataset.tooltip = 'API Key required';
        }
        
        // Set theme (defaults to dark if not set)
        const savedThemeIsBright = localStorage.getItem('hexAgentTheme') === 'bright';
        setTheme(savedThemeIsBright);
        
        // Set transcription (defaults to ON if not set)
        const savedTranscription = localStorage.getItem('hexAgentTranscription') !== 'false';
        setTranscription(savedTranscription);

        micBtn.addEventListener('click', handleVoiceInput);
        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            audioController.stop();
        });
        saveApiKeyBtnModal.addEventListener('click', () => {
            if (saveApiKey(modalApiKeyInput.value.trim())) apiKeyModal.classList.remove('visible');
            else alert('Please enter a valid API key.');
        });
        modalApiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveApiKeyBtnModal.click();
        });
        saveApiKeyBtnSidebar.addEventListener('click', handleSidebarKeySave);
        menuToggleBtn.addEventListener('click', toggleSidebar);
        themeToggle.addEventListener('change', (e) => setTheme(e.target.checked));
        transcriptionToggle.addEventListener('change', (e) => setTranscription(e.target.checked));
    };

    initialize();
});