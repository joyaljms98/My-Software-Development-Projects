document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const appContainer = document.querySelector('.app-container');
    const chatUI = document.getElementById('chat-ui');
    const settingsUI = document.getElementById('settings-ui');
    const settingsBtn = document.getElementById('settings-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const themeToggle = document.getElementById('theme-toggle');

    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const lawAreaSelect = document.getElementById('law-area');
    const userInput = document.getElementById('user-input');
    const typingIndicator = document.getElementById('typing-indicator');

    const settingsForm = document.getElementById('settings-form');
    const saveStatus = document.getElementById('save-status');
    
    const geminiProviderRadio = document.getElementById('gemini-provider');
    const openaiProviderRadio = document.getElementById('openai-provider');
    const geminiKeyGroup = document.getElementById('gemini-key-group');
    const openaiKeyGroup = document.getElementById('openai-key-group');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const openaiApiKeyInput = document.getElementById('openai-api-key');
    const setupNotice = document.getElementById('initial-setup-notice');

    const chatHistoryList = document.getElementById('chat-history-list');
    const referencesList = document.getElementById('references-list');
    const contactInfoBox = document.getElementById('contact-info-box');
    const contactList = document.getElementById('contact-list');

    // NEW: Modal selectors
    const aboutBtn = document.getElementById('about-btn');
    const modalOverlay = document.getElementById('about-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');

    let chats = {};
    let activeChatId = null;
    let isSettingsVisible = false;

    // --- KNOWLEDGE BASE (NEW DETAILED VERSION) ---
    const KNOWLEDGE_BASE = {
        "Personal & Family Life": {
            "Family Law": {
                services: "Governs personal relationships, including marriage, divorce, child custody, adoption, succession, and inheritance of family assets.",
                jurisdiction: "Nationwide, administered by the Ministry of Law & Justice and state courts.",
                websites: [
                    { name: "Department of Legal Affairs", url: "legalaffairs.gov.in" },
                    { name: "Legislative Department", url: "legislative.gov.in" },
                    { name: "National Portal of India (Personal Law)", url: "india.gov.in/topics/law-justice/personal-law" },
                    { name: "e-Courts", url: "ecourts.gov.in" }
                ],
                contacts: {
                    ministry_phone: "011-23384475, 011-23381023",
                    ministry_email: "contactus-dla@gov.in, mljoffice@gov.in"
                }
            },
            "Property Law": {
                services: "Covers all aspects of real estate, including buying, selling, renting, landlord-tenant agreements, and property registration.",
                jurisdiction: "State Registration Departments and District Courts.",
                websites: [
                    { name: "National Government Services Portal (Housing)", url: "services.india.gov.in/service/listing?cat_id=111&ln=en" },
                    { name: "India Code (for Acts)", url: "indiacode.nic.in" }
                ],
                contacts: {}
            }
        },
        "Financial & Commercial Life": {
            "Consumer Rights": {
                services: "Protection against faulty products, poor service, and unfair trade practices. You can file and track grievances online.",
                jurisdiction: "National, State, and District Consumer Commissions.",
                websites: [
                    { name: "National Consumer Helpline (NCH)", url: "consumerhelpline.gov.in" },
                    { name: "Central Consumer Protection Authority (CCPA)", url: "doca.gov.in/ccpa" },
                    { name: "National Consumer Dispute Redressal Commission (NCDRC)", url: "ncdrc.nic.in" }
                ],
                contacts: {
                    toll_free: "1800-11-4000 or 1915",
                    email: "complaints@consumerhelpline.in"
                }
            },
            "Banking & Insurance Law": {
                services: "Addressing issues with bank accounts, loans, credit cards, UPI transactions, and insurance claims.",
                jurisdiction: "Regulated by the Reserve Bank of India (RBI) and the Insurance Regulatory and Development Authority of India (IRDAI).",
                websites: [
                    { name: "Reserve Bank of India (RBI)", url: "rbi.org.in" },
                    { name: "Insurance Regulatory and Development Authority (IRDAI)", url: "irdai.gov.in" }
                ],
                contacts: {
                    banking_ombudsman_toll_free: "14448",
                    banking_ombudsman_email: "cpc@rbi.org.in",
                    irdai_email: "complaints@irdai.gov.in"
                }
            },
            "Taxation & Finance": {
                services: "Filing income tax returns (ITR), GST compliance, managing PAN/TAN, and handling tax disputes.",
                jurisdiction: "Income Tax Department (CBDT) and GST Council.",
                websites: [
                    { name: "Income Tax e-Filing Portal", url: "incometax.gov.in" },
                    { name: "GST Portal", url: "gst.gov.in" },
                    { name: "Department of Revenue", url: "dor.gov.in" }
                ],
                contacts: {
                    income_tax_helpline: "1800-180-1961 or 1800-103-0025",
                    gst_help_desk: "0120-4888-999"
                }
            }
        },
        "Safety & Civic Rights": {
            "Criminal Law": {
                services: "Filing a First Information Report (FIR), understanding your rights with the police, and processes for bail and trials.",
                jurisdiction: "Supreme Court, High Courts, District Courts, and Police Departments.",
                websites: [
                    { name: "Supreme Court of India", url: "sci.gov.in" },
                    { name: "Ministry of Home Affairs (New Criminal Laws)", url: "mha.gov.in/en/commoncontent/new-criminal-laws" },
                    { name: "eCourts Portal", url: "ecourts.gov.in" }
                ],
                contacts: {
                    supreme_court_phone: "011-23382171"
                }
            },
            "Cyber Law & Online Safety": {
                services: "Reporting online fraud, data privacy issues, cyberbullying, and social media harassment.",
                jurisdiction: "Central Cybercrime Cell and State Cyber Units.",
                websites: [{ name: "National Cyber Crime Reporting Portal", url: "cybercrime.gov.in" }],
                contacts: {
                    helpline: "1930"
                }
            },
            "Traffic & Motor Vehicle Law": {
                services: "Information on traffic rules, payment of fines (challans), driver's licenses, and vehicle registration.",
                jurisdiction: "Ministry of Road Transport and Highways and state transport offices.",
                websites: [{ name: "Parivahan Sewa", url: "parivahan.gov.in" }],
                contacts: {}
            }
        },
        "Citizen & State Interaction": {
            "Administrative & Government Services": {
                services: "Obtaining documents like Aadhaar, passports, and ration cards, and addressing public grievances.",
                jurisdiction: "Pan-India.",
                websites: [{ name: "National Government Services Portal", url: "services.india.gov.in" }],
                contacts: {}
            },
            "Right to Information (RTI)": {
                services: "A tool for citizens to formally request information from government departments by filing RTI applications and appeals.",
                jurisdiction: "All public authorities.",
                websites: [{ name: "RTI Online Portal", url: "rtionline.gov.in" }],
                contacts: {}
            },
            "Legal Aid & Public Interest Litigation (PIL)": {
                services: "Provides free legal services to eligible citizens and allows anyone to bring a matter of public concern (like pollution or corruption) to court.",
                jurisdiction: "Supreme Court and High Courts.",
                websites: [{ name: "National Legal Services Authority (NALSA)", url: "nalsa.gov.in" }],
                contacts: {
                    nalsa_phone: "011-23382778, 011-23382121",
                    nalsa_email: "nalsa-dla@nic.in"
                }
            }
        },
        "Rights at Work, School & Hospital": {
            "Employment & Labour Law": {
                services: "Governs employment contracts, wage disputes, wrongful termination, workplace harassment, and provident fund (PF) rules.",
                jurisdiction: "Ministry of Labour & Employment and Labour Courts.",
                websites: [
                    { name: "Ministry of Labour & Employment", url: "labour.gov.in" },
                    { name: "Shram Suvidha Portal", url: "shramsuvidha.gov.in" }
                ],
                contacts: {
                    helpline: "14434"
                }
            },
            "Health & Medical Law": {
                services: "Pertains to patient rights, medical negligence, and issues with health insurance providers.",
                jurisdiction: "Ministry of Health & Family Welfare and state health authorities.",
                websites: [{ name: "Ministry of Health & Family Welfare (MoHFW)", url: "mohfw.gov.in" }],
                contacts: {
                    mohfw_phone: "91-11-23060016"
                }
            },
            "Education Law": {
                services: "Covers admissions, fee regulation, disciplinary actions, and the rights of students.",
                jurisdiction: "Ministry of Education and State Education Boards.",
                websites: [{ name: "Ministry of Education", url: "education.gov.in" }],
                contacts: {
                    phone: "011-23782006"
                }
            }
        },
        "Business & Creative Rights": {
            "Intellectual Property (IP) Law": {
                services: "Protection of original creations, including brand names (Trademarks), inventions (Patents), and artistic works (Copyrights).",
                jurisdiction: "Intellectual Property Offices (Chennai, Mumbai, Delhi, Kolkata).",
                websites: [{ name: "Intellectual Property India", url: "ipindia.gov.in" }],
                contacts: {
                    phone: "1800-112-545",
                    email: "ipindia.helpdesk@nic.in"
                }
            }
        }
    };

    // --- AGENT SYSTEM PROMPT (NEW VERSION) ---
    const systemPrompt = `You are an expert AI assistant specializing in Indian law, designed to provide quick and reliable guidance. Your primary goal is to help users understand their rights and the official procedures they need to follow.

    **Core Instructions:**
    1.  **Analyze the Query:** Carefully read the user's situation to identify the core legal issue(s) according to Indian law.
    2.  **Provide Clear Guidance:** Your main response should be a step-by-step guide on what the user should do. Be direct and use simple language.
    3.  **Identify Relevant Resources:** From the KNOWLEDGE_BASE, identify the most relevant sub-categories (e.g., "Family Law", "Consumer Rights") for the user's situation.
    4.  **Decide on Email Generation:** If the user's query is substantial and describes a situation that would likely require formal communication (like a complaint, legal notice, or official query), set "requestEmailGeneration" to true. For simple greetings, thank yous, or irrelevant questions, set it to false.
    5.  **Format Your Output:** You MUST return your entire output as a single, valid JSON object. Do not add any text outside of this JSON object.

    **JSON Output Structure:**
    {
      "response": "A string containing your full guidance for the user. Use simple markdown for formatting: **bold**, *italics*, and newlines (\\n). Use headers like '### Guidance' or '### Next Steps' to structure your response.",
      "references": ["Name of SubCategory 1", "Name of SubCategory 2"],
      "requestEmailGeneration": true
    }

    **KNOWLEDGE_BASE (List of available tools and their sub-categories):**
    ${JSON.stringify(Object.keys(KNOWLEDGE_BASE).reduce((acc, category) => {
        acc[category] = Object.keys(KNOWLEDGE_BASE[category]);
        return acc;
    }, {}), null, 2)}
    `;

    // --- SYSTEM PROMPT FOR EMAIL GENERATION ---
    const emailGenerationPrompt = `You are a helpful assistant. Based on the provided chat history, generate a concise and professional email summary of the user's legal case. The user will send this to a lawyer or a government official.

    **Instructions:**
    1.  Create a clear and relevant subject line.
    2.  Write a formal email body.
    3.  Where specific personal details are missing from the chat, you MUST use placeholders in the format {Enter Detail Here}. Examples: {Enter Full Name}, {Enter Address}, {Enter Date of Incident}, {Enter Product Model Number}, etc. Use placeholders for any detail a lawyer would need but isn't in the chat.
    4.  The entire output MUST be a single, valid JSON object with two keys: "subject" and "body".

    **Example Output:**
    {
      "subject": "Case Summary: Defective Product Complaint",
      "body": "Dear Sir/Madam,\\n\\nI am writing to seek assistance regarding a defective product I purchased.\\n\\nMy name is {Enter Full Name} and I am {Enter Age} years old.\\n\\nCase Details:\\n- Product: {Enter Product Name}\\n- Date of Purchase: {Enter Date of Purchase}\\n- Issue: {Describe the issue based on chat history}\\n\\nI have attached the following documents: {List any documents mentioned in chat, or use placeholder}\\n\\nI look forward to your guidance on the next steps.\\n\\nSincerely,\\n{Enter Full Name}\\n{Enter Contact Number}"
    }
    `;

    // --- UI & NAVIGATION ---
    function toggleSettingsView() {
        isSettingsVisible = !isSettingsVisible;
        if (isSettingsVisible) {
            chatUI.classList.add('hidden');
            settingsUI.classList.remove('hidden');
            settingsBtn.textContent = 'Go Back';
        } else {
            settingsUI.classList.add('hidden');
            chatUI.classList.remove('hidden');
            settingsBtn.textContent = 'Settings';
        }
    }
    
    // --- API & SETTINGS MANAGEMENT ---
    function loadSettings() {
        geminiApiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
        openaiApiKeyInput.value = localStorage.getItem('openai_api_key') || '';
        const savedProvider = localStorage.getItem('api_provider') || 'gemini';
        if (savedProvider === 'openai') {
            openaiProviderRadio.checked = true;
        } else {
            geminiProviderRadio.checked = true;
        }
        handleApiProviderChange();
    }
    
    function handleApiProviderChange() {
        if (openaiProviderRadio.checked) {
            openaiKeyGroup.classList.remove('hidden');
            geminiKeyGroup.classList.add('hidden');
            localStorage.setItem('api_provider', 'openai');
        } else {
            geminiKeyGroup.classList.remove('hidden');
            openaiKeyGroup.classList.add('hidden');
            localStorage.setItem('api_provider', 'gemini');
        }
    }
    
    // --- CHAT HISTORY & STATE MANAGEMENT ---
    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
    }

    function loadChats() {
        const savedChats = localStorage.getItem('chats');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
    }

    function startNewChat() {
        const newChatId = `chat_${Date.now()}`;
        const initialMessage = { role: 'ai', content: { response: 'Hello! I am your Indian Legal AI Agent. How can I help you today? Please describe your situation.' } };
        chats[newChatId] = {
            title: 'New Chat',
            history: [initialMessage]
        };
        activeChatId = newChatId;
        switchChat(activeChatId);
        
        userInput.value = '';
        userInput.style.height = 'auto';
        userInput.focus();
        if (isSettingsVisible) {
            toggleSettingsView();
        }
        referencesList.innerHTML = '';
        contactInfoBox.classList.add('hidden');
        contactList.innerHTML = '';
    }

    function switchChat(chatId) {
        if (!chats[chatId]) return;
        activeChatId = chatId;
        const chat = chats[chatId];
        chatWindow.innerHTML = '';
        chat.history.forEach(message => {
            appendMessage(message.role, message.content, false);
        });
        const lastAiMessage = [...chat.history].reverse().find(m => m.role === 'ai' && m.content.references);
        if (lastAiMessage) {
            renderReferences(lastAiMessage.content.references);
            renderContactInfo(lastAiMessage.content.references);
        } else {
            referencesList.innerHTML = '';
            contactInfoBox.classList.add('hidden');
            contactList.innerHTML = '';
        }
        renderChatHistoryList();
        userInput.focus();
    }

    function deleteChat(chatIdToDelete) {
        if (!chats[chatIdToDelete]) return;
        const isConfirmed = confirm(`Are you sure you want to delete the chat "${chats[chatIdToDelete].title}"?`);
        if (!isConfirmed) return;

        const isDeletingActiveChat = activeChatId === chatIdToDelete;
        delete chats[chatIdToDelete];
        saveChats();

        if (isDeletingActiveChat) {
            activeChatId = null;
            const remainingChatIds = Object.keys(chats).reverse();
            if (remainingChatIds.length > 0) {
                switchChat(remainingChatIds[0]);
            } else {
                startNewChat();
            }
        }
        renderChatHistoryList();
    }
    
    // --- MESSAGE & UI RENDERING ---
    function appendMessage(sender, messageContent, addToHistory = true) {
        if (addToHistory && activeChatId) {
            chats[activeChatId].history.push({ role: sender, content: messageContent });
            saveChats();
        }
    
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `chat-message ${sender}`;
    
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
    
        let contentToRender;
        if (typeof messageContent === 'object' && messageContent !== null) {
            contentToRender = messageContent.response || '';
        } else {
            contentToRender = messageContent;
        }
        
        messageBubble.innerHTML = simpleMarkdownToHTML(contentToRender);
        
        messageWrapper.appendChild(messageBubble);
        chatWindow.appendChild(messageWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }


    function renderReferences(referenceKeys) {
        referencesList.innerHTML = '';
        if (!Array.isArray(referenceKeys) || referenceKeys.length === 0) return;

        let foundWebsites = false;
        referenceKeys.forEach(key => {
            for (const category in KNOWLEDGE_BASE) {
                if (KNOWLEDGE_BASE[category][key]) {
                    const subCategory = KNOWLEDGE_BASE[category][key];
                    if (subCategory.websites && subCategory.websites.length > 0) {
                        subCategory.websites.forEach(site => {
                            foundWebsites = true;
                            const listItem = document.createElement('li');
                            const refName = document.createElement('strong');
                            refName.textContent = site.name;
                            const refDesc = document.createElement('p');
                            refDesc.textContent = `Jurisdiction: ${subCategory.jurisdiction}`;
                            const linkButton = document.createElement('a');
                            linkButton.href = `https://${site.url}`;
                            linkButton.target = '_blank';
                            linkButton.textContent = 'Visit Site';
                            listItem.appendChild(refName);
                            listItem.appendChild(refDesc);
                            listItem.appendChild(linkButton);
                            referencesList.appendChild(listItem);
                        });
                    }
                }
            }
        });
    }

    function renderContactInfo(referenceKeys) {
        contactList.innerHTML = '';
        if (!Array.isArray(referenceKeys) || referenceKeys.length === 0) {
            contactInfoBox.classList.add('hidden');
            return;
        }

        let foundContacts = false;
        referenceKeys.forEach(key => {
            for (const category in KNOWLEDGE_BASE) {
                if (KNOWLEDGE_BASE[category][key]) {
                    const contacts = KNOWLEDGE_BASE[category][key].contacts;
                    if (contacts && Object.keys(contacts).length > 0) {
                        const subCategoryTitle = document.createElement('li');
                        subCategoryTitle.innerHTML = `<strong>${key}</strong>`;
                        subCategoryTitle.style.backgroundColor = 'transparent';
                        subCategoryTitle.style.border = 'none';
                        contactList.appendChild(subCategoryTitle);

                        for (const contactType in contacts) {
                            foundContacts = true;
                            const listItem = document.createElement('li');
                            const type = contactType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            listItem.innerHTML = `${type}: <span>${contacts[contactType]}</span>`;
                            contactList.appendChild(listItem);
                        }
                    }
                }
            }
        });

        if (foundContacts) {
            contactInfoBox.classList.remove('hidden');
        } else {
            contactInfoBox.classList.add('hidden');
        }
    }

    function simpleMarkdownToHTML(text) {
        if (!text) return '';
        text = text.replace(/### (.*?)(?:\n|$)/g, '<h3>$1</h3>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/(\d+)\.\s(.*?)(<br>|$)/g, '<p style="margin: 0; padding-left: 1.5em; text-indent: -1.5em;">$1. $2</p>');
        return text;
    }

    // --- CHAT SUBMISSION & AI INTERACTION ---
    async function handleChatSubmit(e) {
        e.preventDefault();
        const userMessageText = userInput.value.trim();
        if (!userMessageText || !activeChatId) return;

        appendMessage('user', { response: userMessageText }, true);
        
        const currentChat = chats[activeChatId];
        if (currentChat.history.length === 2) { 
            currentChat.title = userMessageText.substring(0, 30) + '...';
            saveChats();
            renderChatHistoryList();
        }
        
        userInput.value = '';
        userInput.style.height = 'auto';
        typingIndicator.classList.remove('hidden');

        try {
            const aiMessageObject = await getAiResponse(systemPrompt, currentChat.history);
            appendMessage('ai', aiMessageObject, true);
            
            // Render references and new contact info
            if (aiMessageObject.references) {
                renderReferences(aiMessageObject.references);
                renderContactInfo(aiMessageObject.references);
            }

            // Conditionally prompt for email generation
            if (aiMessageObject.requestEmailGeneration === true) {
                appendEmailPrompt();
            }

        } catch (error) {
            console.error("Chatbot Error:", error);
            const errorObject = { response: `<strong>Sorry, an error occurred:</strong> ${error.message}. Please check your API key or try again.` };
            appendMessage('ai', errorObject, false);
        } finally {
            typingIndicator.classList.add('hidden');
        }
    }
    
    // --- EMAIL GENERATION FLOW ---
    function appendEmailPrompt() {
        const promptWrapper = document.createElement('div');
        promptWrapper.className = 'chat-message ai';
        const promptBubble = document.createElement('div');
        promptBubble.className = 'message-bubble email-prompt-message';
        promptBubble.innerHTML = `<p>Would you like a summary of this conversation formatted for an email?</p>`;
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'email-prompt-actions';
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Yes, Generate Email';
        yesBtn.onclick = (e) => {
            const bubble = e.target.closest('.email-prompt-message');
            bubble.innerHTML = '<p>Generating email summary...</p>';
            handleGenerateEmailClick(bubble);
        };
        const noBtn = document.createElement('button');
        noBtn.textContent = 'No, Thanks';
        noBtn.onclick = (e) => {
            e.target.closest('.chat-message').remove();
        };
        actionsWrapper.appendChild(yesBtn);
        actionsWrapper.appendChild(noBtn);
        promptBubble.appendChild(actionsWrapper);
        promptWrapper.appendChild(promptBubble);
        chatWindow.appendChild(promptWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function handleGenerateEmailClick(promptBubble) {
        if (!activeChatId) return;
        const currentChat = chats[activeChatId];
        try {
            const emailSummaryObject = await getAiResponse(emailGenerationPrompt, currentChat.history);
            displayEmailSummary(emailSummaryObject, promptBubble.parentElement);
        } catch (error) {
            console.error("Email Generation Error:", error);
            const errorObject = { response: `<strong>Sorry, an error occurred while generating the email:</strong> ${error.message}` };
            appendMessage('ai', errorObject, false);
            promptBubble.parentElement.remove();
        }
    }

    function displayEmailSummary(summary, wrapperToReplace) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'message-bubble email-summary-card';
        
        const subject = summary.subject || '';
        const body = summary.body || '';

        summaryCard.innerHTML = `
            <h4>Email Summary</h4>
            <div class="email-subject"><strong>Subject:</strong> ${subject}</div>
            <pre class="email-summary-body">${body}</pre>
            <div class="email-summary-actions">
                <button class="email-action-btn" id="open-in-gmail">Open in Gmail</button>
                <button class="email-action-btn" id="open-in-app">Open in Email App</button>
            </div>
        `;
        
        wrapperToReplace.innerHTML = '';
        wrapperToReplace.appendChild(summaryCard);

        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        wrapperToReplace.querySelector('#open-in-app').addEventListener('click', () => {
            window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
        });

        wrapperToReplace.querySelector('#open-in-gmail').addEventListener('click', () => {
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;
            window.open(gmailUrl, '_blank');
        });

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // --- GENERIC API CALLER ---
    async function getAiResponse(prompt, history) {
        const apiProvider = localStorage.getItem('api_provider') || 'gemini';
        const apiKey = apiProvider === 'gemini' 
            ? localStorage.getItem('gemini_api_key') 
            : localStorage.getItem('openai_api_key');
        if (!apiKey) {
            checkApiKeyAndShowSettingsIfNeeded(true);
            throw new Error("API Key not found. Please save your key in the Settings tab.");
        }
        const historyForApi = history.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: (typeof msg.content === 'object' ? JSON.stringify(msg.content) : msg.content)
        })).filter(msg => msg.content);
        
        let responseText;
        if (apiProvider === 'gemini') {
            responseText = await getGeminiResponse(apiKey, prompt, historyForApi);
        } else {
            responseText = await getOpenAiResponse(apiKey, prompt, historyForApi);
        }
        
        try {
            const cleanedResponse = responseText.replace(/^```json\s*|```\s*$/g, '');
            return JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw Response:", responseText);
            throw new Error("Received an invalid JSON response from the AI.");
        }
    }

    async function getGeminiResponse(apiKey, systemPrompt, history) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const geminiHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        const requestBody = {
            contents: geminiHistory,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" },
            safetySettings: [ { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }]
        };
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message || `API Error (${response.status})`); }
        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content.parts[0].text) { throw new Error("Invalid response structure from Gemini API."); }
        return data.candidates[0].content.parts[0].text;
    }

    async function getOpenAiResponse(apiKey, systemPrompt, history) {
        const API_URL = 'https://api.openai.com/v1/chat/completions';
        const requestBody = {
            model: "gpt-4-turbo",
            messages: [{ role: "system", content: systemPrompt }, ...history],
            response_format: { "type": "json_object" }
        };
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`}, body: JSON.stringify(requestBody) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message || `API Error (${response.status})`); }
        const data = await response.json();
        if (!data.choices || !data.choices[0].message.content) { throw new Error("Invalid response structure from OpenAI API."); }
        return data.choices[0].message.content;
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
    function renderChatHistoryList() {
        chatHistoryList.innerHTML = '';
        const chatIds = Object.keys(chats).reverse();
        chatIds.forEach(chatId => {
            const chat = chats[chatId];
            const listItem = document.createElement('li');
            listItem.dataset.chatId = chatId;
            if (chatId === activeChatId) listItem.classList.add('active');
            listItem.addEventListener('click', () => switchChat(chatId));
            const titleSpan = document.createElement('span');
            titleSpan.className = 'chat-title';
            titleSpan.textContent = chat.title;
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Chat';
            deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chatId); });
            listItem.appendChild(titleSpan);
            listItem.appendChild(deleteBtn);
            chatHistoryList.appendChild(listItem);
        });
    }

    function checkApiKeyAndShowSettingsIfNeeded(forceShow = false) {
        const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('openai_api_key');
        if (!apiKey) {
            if (forceShow && !isSettingsVisible) {
                toggleSettingsView();
            }
            if(setupNotice) setupNotice.classList.remove('hidden');
            return false;
        }
        if(setupNotice) setupNotice.classList.add('hidden');
        return true;
    }

    function initialize() {
        // Attach Event Listeners
        settingsBtn.addEventListener('click', toggleSettingsView);
        newChatBtn.addEventListener('click', () => {
            if (checkApiKeyAndShowSettingsIfNeeded(true)) {
                startNewChat();
            }
        });
        chatForm.addEventListener('submit', (e) => {
            if (checkApiKeyAndShowSettingsIfNeeded(true)) {
                handleChatSubmit(e);
            }
        });
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight) + 'px';
        });
        toggleSidebarBtn.addEventListener('click', () => {
            appContainer.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebar_collapsed', appContainer.classList.contains('sidebar-collapsed'));
        });
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('gemini_api_key', geminiApiKeyInput.value.trim());
            localStorage.setItem('openai_api_key', openaiApiKeyInput.value.trim());
            handleApiProviderChange();
            saveStatus.textContent = 'API Key saved! You can now go back to the chat.';
            setTimeout(() => saveStatus.textContent = '', 4000);
            if(setupNotice) setupNotice.classList.add('hidden');
        });

        document.getElementById('clear-all-chats-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                chats = {};
                localStorage.removeItem('chats');
                referencesList.innerHTML = '';
                startNewChat();
            }
        });

        document.getElementById('clear-all-data-btn').addEventListener('click', () => {
            if (confirm('DANGER: This will clear all chats, API keys, and settings. Are you absolutely sure?')) {
                localStorage.clear();
                location.reload();
            }
        });
        
        // NEW: Event listeners for the modal
        aboutBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('hidden');
        });

        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
        
        geminiProviderRadio.addEventListener('change', handleApiProviderChange);
        openaiProviderRadio.addEventListener('change', handleApiProviderChange);
        
        // Load settings and UI states
        loadSettings();
        loadChats(); 

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        }

        const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isSidebarCollapsed) appContainer.classList.add('sidebar-collapsed');

        if (checkApiKeyAndShowSettingsIfNeeded(true)) {
            startNewChat();
        }

        const lawAreaOptions = ["General Query", "Family Law", "Property Law", "Criminal Law", "Consumer Rights", "Cyber Law", "Taxation & Finance", "Employment Law", "Intellectual Property"];
        lawAreaSelect.innerHTML = lawAreaOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }

    initialize();
});