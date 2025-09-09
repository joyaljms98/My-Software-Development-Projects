document.addEventListener('DOMContentLoaded', () => {
    // Global variables to store file contents and selected element
    let allFiles = []; // Stores all file objects from the selected folder
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';
    let htmlFileName = '';
    let cssFileName = '';
    let jsFileName = '';
    let selectedElement = null;
    let imageBlobUrls = {};

    // History management for Undo/Redo
    let history = [];
    let historyIndex = -1;
    let isSavingToHistory = false;

    const fileInput = document.getElementById('file-input');
    const fileSelectionContainer = document.getElementById('file-selection-container');
    const projectSelectionContainer = document.getElementById('project-selection-container');
    const fileListContainer = document.getElementById('file-list');
    const loadFilesButton = document.getElementById('load-files-button');
    const editorContainer = document.getElementById('editor-container');
    const loadingScreen = document.getElementById('loading-screen');
    const previewIframe = document.getElementById('preview-iframe');

    // Control panel elements
    const textEditor = document.getElementById('text-editor');
    const linkEditorContainer = document.getElementById('link-editor-container');
    const linkEditor = document.getElementById('link-editor');
    const colorPicker = document.getElementById('color-picker');
    const colorValue = document.getElementById('color-value');
    const paddingInput = document.getElementById('padding-input');
    const fontSizeInput = document.getElementById('font-size-input');
    const fontFamilySelect = document.getElementById('font-family-select');
    const headerStyleBtns = document.querySelectorAll('.header-style-btn');
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');

    // Monaco Editor instances
    let htmlEditorInstance, cssEditorInstance, jsEditorInstance;

    // Code editor elements
    const htmlEditorContainer = document.getElementById('html-editor-container');
    const cssEditorContainer = document.getElementById('css-editor-container');
    const jsEditorContainer = document.getElementById('js-editor-container');
    const htmlTab = document.getElementById('html-tab');
    const cssTab = document.getElementById('css-tab');
    const jsTab = document.getElementById('js-tab');

    const previewButton = document.getElementById('preview-button');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');
    
    // Footer elements
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutModal = document.getElementById('close-about-modal');

    // New tab elements for the left panel
    const editPanelTabBtn = document.getElementById('edit-panel-tab-btn');
    const codeEditorTabBtn = document.getElementById('code-editor-tab-btn');
    const editPanel = document.getElementById('edit-panel');
    const codeEditorSection = document.getElementById('code-editor-section');

    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Initialize Monaco Editor
    const initializeMonacoEditors = () => {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs' }});
        require(['vs/editor/editor.main'], () => {
            monaco.editor.defineTheme('myCustomTheme', {
                base: 'vs', // can also be 'vs-dark' or 'hc-black'
                inherit: true,
                rules: [],
                colors: {
                    'editor.lineHighlightBackground': '#eeeeee',
                }
            });

            htmlEditorInstance = monaco.editor.create(htmlEditorContainer, {
                value: htmlContent,
                language: 'html',
                theme: 'myCustomTheme',
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                minimap: { enabled: false }
            });

            cssEditorInstance = monaco.editor.create(cssEditorContainer, {
                value: cssContent,
                language: 'css',
                theme: 'myCustomTheme',
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                minimap: { enabled: false }
            });

            jsEditorInstance = monaco.editor.create(jsEditorContainer, {
                value: jsContent,
                language: 'javascript',
                theme: 'myCustomTheme',
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                minimap: { enabled: false }
            });

            // Listen for changes in the Monaco editors
            htmlEditorInstance.onDidChangeModelContent(refreshIframe);
            cssEditorInstance.onDidChangeModelContent(refreshIframe);
            jsEditorInstance.onDidChangeModelContent(refreshIframe);
        });
    };

    const saveStateToHistory = () => {
        if (isSavingToHistory) return;
        isSavingToHistory = true;
        const iframeDoc = previewIframe.contentDocument;
        if (!iframeDoc) {
            isSavingToHistory = false;
            return;
        }
        const currentState = iframeDoc.documentElement.outerHTML;

        // Clear redo history
        history = history.slice(0, historyIndex + 1);
        history.push(currentState);
        historyIndex++;
        
        updateUndoRedoButtons();
        isSavingToHistory = false;
    };

    const updateUndoRedoButtons = () => {
        undoButton.disabled = historyIndex <= 0;
        redoButton.disabled = historyIndex >= history.length - 1;
        undoButton.classList.toggle('opacity-50', undoButton.disabled);
        undoButton.classList.toggle('cursor-not-allowed', undoButton.disabled);
        redoButton.classList.toggle('opacity-50', redoButton.disabled);
        redoButton.classList.toggle('cursor-not-allowed', redoButton.disabled);
    };

    undoButton.addEventListener('click', () => {
        if (historyIndex > 0) {
            historyIndex--;
            const previousState = history[historyIndex];
            previewIframe.contentDocument.open();
            previewIframe.contentDocument.write(previousState);
            previewIframe.contentDocument.close();
            setupIframeListeners();
            updateUndoRedoButtons();
        }
    });

    redoButton.addEventListener('click', () => {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const nextState = history[historyIndex];
            previewIframe.contentDocument.open();
            previewIframe.contentDocument.write(nextState);
            previewIframe.contentDocument.close();
            setupIframeListeners();
            updateUndoRedoButtons();
        }
    });

    // Keyboard shortcuts for Undo/Redo
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undoButton.click();
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redoButton.click();
        }
    });

    const showLoading = (show) => {
        loadingScreen.classList.toggle('hidden', !show);
    };

    const showStatus = (message, isError = true) => {
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden');
        statusMessage.style.color = isError ? '#ef4444' : '#22c55e';
    };

    const updateControls = (element) => {
        if (!element) {
            textEditor.value = '';
            linkEditor.value = '';
            linkEditorContainer.classList.add('hidden');
            colorPicker.value = '#000000';
            colorValue.textContent = '#000000';
            paddingInput.value = '';
            fontSizeInput.value = '';
            fontFamilySelect.value = 'Inter, sans-serif';
            return;
        }

        // Update text editor
        textEditor.value = element.innerText;

        // Find the closest ancestor that is a link
        const linkElement = findLinkParent(element);
        if (linkElement) {
            linkEditorContainer.classList.remove('hidden');
            linkEditor.value = linkElement.getAttribute('href') || '';
        } else {
            linkEditorContainer.classList.add('hidden');
            linkEditor.value = '';
        }

        // Update color picker
        const color = window.getComputedStyle(element).color;
        const hexColor = rgbToHex(color);
        colorPicker.value = hexColor;
        colorValue.textContent = hexColor;

        // Update padding input
        const padding = window.getComputedStyle(element).padding.replace('px', '');
        paddingInput.value = parseInt(padding, 10) || '';

        // Update font size input
        const fontSize = window.getComputedStyle(element).fontSize.replace('px', '');
        fontSizeInput.value = parseInt(fontSize, 10) || '';
        
        // Update font family select
        const fontFamily = window.getComputedStyle(element).fontFamily;
        fontFamilySelect.value = fontFamily.split(',')[0].replace(/['"]+/g, '');
    };

    const findLinkParent = (element) => {
        let current = element;
        while (current) {
            if (current.tagName.toLowerCase() === 'a') {
                return current;
            }
            current = current.parentNode;
        }
        return null;
    };

    const rgbToHex = (rgb) => {
        const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
        if (!result) return '#000000';
        return "#" +
            ((1 << 24) + (parseInt(result[1], 10) << 16) + (parseInt(result[2], 10) << 8) + parseInt(result[3], 10)).toString(16).slice(1);
    };

    const setupIframeListeners = () => {
        const iframeDoc = previewIframe.contentDocument;
        if (!iframeDoc) return;

        // Inject a new style to handle selection and drag-drop
        const style = iframeDoc.createElement('style');
        style.textContent = `
            body, body * {
                user-select: none;
                -webkit-user-select: none;
                cursor: pointer;
                box-sizing: border-box;
            }
        `;
        iframeDoc.head.appendChild(style);

        // Add a click listener to the iframe document
        iframeDoc.body.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Deselect previous element
            if (selectedElement) {
                selectedElement.classList.remove('selected-element');
            }

            // Select the new element
            selectedElement = e.target;
            selectedElement.classList.add('selected-element');
            
            // Update controls
            updateControls(selectedElement);
        });
        
        // Add a drag-and-drop handler for padding
        let isDragging = false;
        let startY = 0;
        let startPadding = 0;

        iframeDoc.body.addEventListener('mousedown', (e) => {
            if (selectedElement && e.target === selectedElement) {
                isDragging = true;
                startY = e.clientY;
                startPadding = parseInt(window.getComputedStyle(selectedElement).padding, 10) || 0;
                selectedElement.style.cursor = 'move';
            }
        });

        iframeDoc.body.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaY = e.clientY - startY;
                const newPadding = Math.max(0, startPadding + deltaY);
                selectedElement.style.padding = `${newPadding}px`;
                paddingInput.value = newPadding;
                debounce(saveStateToHistory, 500)();
            }
        });

        iframeDoc.body.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (selectedElement) {
                    selectedElement.style.cursor = 'pointer';
                }
                saveStateToHistory();
            }
        });
    };

    const refreshIframe = debounce(() => {
        const iframeDoc = previewIframe.contentDocument;
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview</title>
                <style>${cssEditorInstance.getValue()}</style>
            </head>
            <body>
                ${htmlEditorInstance.getValue()}
                <script>${jsEditorInstance.getValue()}<\/script>
            </body>
            </html>
        `;
        iframeDoc.open();
        iframeDoc.write(fullHtml);
        iframeDoc.close();
        setupIframeListeners();
        saveStateToHistory();
    }, 500);

    // Tab switching logic for code editor
    const tabs = {
        'html': { tab: htmlTab, editorContainer: htmlEditorContainer, editorInstance: () => htmlEditorInstance },
        'css': { tab: cssTab, editorContainer: cssEditorContainer, editorInstance: () => cssEditorInstance },
        'js': { tab: jsTab, editorContainer: jsEditorContainer, editorInstance: () => jsEditorInstance }
    };

    const setActiveTab = (activeTabId) => {
        for (const id in tabs) {
            const { tab, editorContainer, editorInstance } = tabs[id];
            if (id === activeTabId) {
                tab.classList.replace('bg-gray-200', 'bg-blue-500');
                tab.classList.replace('text-gray-700', 'text-white');
                editorContainer.classList.remove('hidden');
                // Force a layout update for the active editor
                editorInstance().layout();
            } else {
                tab.classList.replace('bg-blue-500', 'bg-gray-200');
                tab.classList.replace('text-white', 'text-gray-700');
                editorContainer.classList.add('hidden');
            }
        }
    };

    htmlTab.addEventListener('click', () => setActiveTab('html'));
    cssTab.addEventListener('click', () => setActiveTab('css'));
    jsTab.addEventListener('click', () => setActiveTab('js'));

    fileInput.addEventListener('change', (event) => {
        showLoading(true);
        statusMessage.classList.add('hidden');
        
        allFiles = Array.from(event.target.files);

        if (allFiles.length === 0) {
            showLoading(false);
            return;
        }

        // Show the project selection screen and populate the file list
        fileSelectionContainer.classList.add('hidden');
        projectSelectionContainer.classList.remove('hidden');
        fileListContainer.innerHTML = '';
        
        allFiles.forEach(file => {
            const fileType = file.name.split('.').pop().toLowerCase();
            const isHtml = fileType === 'html';
            const isCss = fileType === 'css';
            const isJs = fileType === 'js';
            const isImage = file.type.startsWith('image/');
            
            if (isHtml || isCss || isJs || isImage) {
                const li = document.createElement('li');
                li.className = 'flex items-center space-x-2';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `file-${file.name}`;
                checkbox.value = file.name;
                
                // Pre-select files
                if (isHtml || isCss || isJs) {
                   checkbox.checked = true;
                }

                const label = document.createElement('label');
                label.htmlFor = `file-${file.name}`;
                label.textContent = file.name;

                if (isHtml) label.className = 'font-bold text-blue-600';
                else if (isCss) label.className = 'font-semibold text-green-600';
                else if (isJs) label.className = 'font-semibold text-yellow-600';
                else if (isImage) label.className = 'text-gray-500';

                li.appendChild(checkbox);
                li.appendChild(label);
                fileListContainer.appendChild(li);
            }
        });

        showLoading(false);
    });

    loadFilesButton.addEventListener('click', () => {
        showLoading(true);
        
        const selectedFiles = Array.from(fileListContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
            return allFiles.find(file => file.name === cb.value);
        });

        if (selectedFiles.length === 0) {
            showStatus('Please select at least one file to load.', true);
            showLoading(false);
            return;
        }

        const selectedHtmlFile = selectedFiles.find(file => file.name.endsWith('.html'));
        const selectedCssFile = selectedFiles.find(file => file.name.endsWith('.css'));
        const selectedJsFile = selectedFiles.find(file => file.name.endsWith('.js'));
        const selectedImageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));

        if (!selectedHtmlFile) {
            showStatus('An HTML file must be selected to proceed.', true);
            showLoading(false);
            return;
        }

        htmlFileName = selectedHtmlFile.name;
        if (selectedCssFile) cssFileName = selectedCssFile.name;
        if (selectedJsFile) jsFileName = selectedJsFile.name;

        const readFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        };
        
        const readImageFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({ name: file.name, url: e.target.result });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        Promise.all([
            readFile(selectedHtmlFile),
            selectedCssFile ? readFile(selectedCssFile) : Promise.resolve(''),
            selectedJsFile ? readFile(selectedJsFile) : Promise.resolve(''),
            ...selectedImageFiles.map(readImageFile)
        ]).then(([htmlResult, cssResult, jsResult, ...imageResults]) => {
            htmlContent = htmlResult;
            cssContent = cssResult;
            jsContent = jsResult;

            imageBlobUrls = {};
            imageResults.forEach(img => {
                imageBlobUrls[img.name] = img.url;
            });
            
            // Replace image paths in HTML with temporary blob URLs
            let tempHtml = htmlContent;
            for (const name in imageBlobUrls) {
                tempHtml = tempHtml.replace(new RegExp(`src=['"]([^'"]*?)${name}['"]`, 'g'), `src="${imageBlobUrls[name]}"`);
            }

            // Write the full HTML content to the editors
            if (htmlEditorInstance) {
                htmlEditorInstance.setValue(tempHtml);
                cssEditorInstance.setValue(cssContent);
                jsEditorInstance.setValue(jsContent);
            }

            // Write the initial content to the iframe
            const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Preview</title>
                    <style>${cssContent}</style>
                </head>
                <body>
                    ${tempHtml}
                    <script>${jsContent}<\/script>
                </body>
                </html>
            `;
            iframeDoc.open();
            iframeDoc.write(fullHtml);
            iframeDoc.close();

            // Initialize history
            history = [iframeDoc.documentElement.outerHTML];
            historyIndex = 0;
            updateUndoRedoButtons();
            
            projectSelectionContainer.classList.add('hidden');
            editorContainer.classList.remove('hidden');
            setupIframeListeners();
            showLoading(false);

        }).catch(() => {
            showStatus('Error reading files. Please try again.', true);
            showLoading(false);
        });
    });

    // Listen for changes in the control panel
    textEditor.addEventListener('input', debounce(() => {
        if (selectedElement) {
            selectedElement.innerText = textEditor.value;
            saveStateToHistory();
        }
    }, 500));
    
    linkEditor.addEventListener('input', debounce(() => {
        const linkElement = findLinkParent(selectedElement);
        if (linkElement) {
            linkElement.setAttribute('href', linkEditor.value);
            saveStateToHistory();
        }
    }, 500));

    colorPicker.addEventListener('input', debounce(() => {
        if (selectedElement) {
            selectedElement.style.color = colorPicker.value;
            colorValue.textContent = colorPicker.value.toUpperCase();
            saveStateToHistory();
        }
    }, 500));
    
    paddingInput.addEventListener('input', debounce(() => {
        if (selectedElement) {
            selectedElement.style.padding = `${paddingInput.value}px`;
            saveStateToHistory();
        }
    }, 500));

    fontSizeInput.addEventListener('input', debounce(() => {
        if (selectedElement) {
            selectedElement.style.fontSize = `${fontSizeInput.value}px`;
            saveStateToHistory();
        }
    }, 500));

    fontFamilySelect.addEventListener('change', debounce(() => {
        if (selectedElement) {
            selectedElement.style.fontFamily = fontFamilySelect.value;
            saveStateToHistory();
        }
    }, 500));

    headerStyleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedElement) {
                const newTag = btn.dataset.tag;
                const originalText = selectedElement.innerText;
                const newElement = document.createElement(newTag);
                newElement.innerText = originalText;
                selectedElement.parentNode.replaceChild(newElement, selectedElement);
                selectedElement = newElement;
                updateControls(selectedElement);
                saveStateToHistory();
            }
        });
    });

    // Preview Button Logic
    previewButton.addEventListener('click', () => {
        const iframeDoc = previewIframe.contentDocument;
        if (!iframeDoc) {
            showStatus('No website loaded to preview.', true);
            return;
        }
        const newWindow = window.open('', '_blank');
        newWindow.document.write(iframeDoc.documentElement.outerHTML);
        newWindow.document.close();
    });

    // Save as ZIP Button Logic
    saveButton.addEventListener('click', () => {
        if (!htmlContent) {
            showStatus('No website loaded to save.', true);
            return;
        }

        showLoading(true);

        const zip = new JSZip();
        
        // Get the latest HTML content from the iframe
        const iframeDoc = previewIframe.contentDocument;
        let updatedHtml = iframeDoc.documentElement.outerHTML;

        // Strip the added styles and scripts for the editor
        updatedHtml = updatedHtml.replace(/<style id="variable-styles">[\s\S]*?<\/style>/, '');
        
        zip.file(htmlFileName || "index.html", updatedHtml);
        
        // Add CSS and JS files as they were originally
        if (cssContent) {
            zip.file(cssFileName || "style.css", cssContent);
        }
        if (jsContent) {
            zip.file(jsFileName || "script.js", jsContent);
        }

        zip.generateAsync({ type: "blob" })
            .then((content) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = "edited-website.zip";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showLoading(false);
                showStatus('Website saved as a ZIP file!', false);
            })
            .catch(() => {
                showLoading(false);
                showStatus('Error generating ZIP file.', true);
            });
    });

    // About Modal Logic
    aboutBtn.addEventListener('click', () => {
        aboutModal.classList.remove('hidden');
    });
    closeAboutModal.addEventListener('click', () => {
        aboutModal.classList.add('hidden');
    });
    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.classList.add('hidden');
        }
    });

    // Logic for the new switchable tabs
    const setActiveMainTab = (tabId) => {
        if (tabId === 'edit-panel') {
            editPanel.classList.remove('hidden');
            codeEditorSection.classList.add('hidden');
            editPanelTabBtn.classList.replace('bg-gray-200', 'bg-blue-500');
            editPanelTabBtn.classList.replace('text-gray-700', 'text-white');
            codeEditorTabBtn.classList.replace('bg-blue-500', 'bg-gray-200');
            codeEditorTabBtn.classList.replace('text-white', 'text-gray-700');
        } else if (tabId === 'code-editor') {
            codeEditorSection.classList.remove('hidden');
            editPanel.classList.add('hidden');
            codeEditorTabBtn.classList.replace('bg-gray-200', 'bg-blue-500');
            codeEditorTabBtn.classList.replace('text-gray-700', 'text-white');
            editPanelTabBtn.classList.replace('bg-blue-500', 'bg-gray-200');
            editPanelTabBtn.classList.replace('text-white', 'text-gray-700');
            // Force a layout update for the active editor
            if (htmlEditorContainer.classList.contains('hidden')) {
                // Determine which editor is active and force a layout refresh
                const activeId = document.querySelector('#code-editor-section > div > button.bg-blue-500')?.id;
                if (activeId === 'html-tab') htmlEditorInstance.layout();
                if (activeId === 'css-tab') cssEditorInstance.layout();
                if (activeId === 'js-tab') jsEditorInstance.layout();
            } else {
                htmlEditorInstance.layout();
            }
        }
    };

    editPanelTabBtn.addEventListener('click', () => setActiveMainTab('edit-panel'));
    codeEditorTabBtn.addEventListener('click', () => setActiveMainTab('code-editor'));

    // Initialize Monaco after the DOM is loaded
    initializeMonacoEditors();
});
