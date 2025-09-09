// --- CONSTANTS & DOM ELEMENTS ---
const API_KEY_STORAGE_KEY = 'youtube_api_key';
const CANVAS_STATE_KEY = 'canvas_state';
const THEME_STORAGE_KEY = 'youtube_canvas_theme';
const CLICK_HISTORY_STORAGE_KEY = 'youtube_click_history';
const CANVAS_HISTORY_STORAGE_KEY = 'youtube_canvas_history';

// Search & Main Content
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchTypeVideoBtn = document.getElementById('search-type-video');
const searchTypePlaylistBtn = document.getElementById('search-type-playlist');
const videoGrid = document.getElementById('video-grid');

// Settings Sidebar
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsSidebar = document.getElementById('settings-sidebar');
const settingsOverlay = document.getElementById('settings-overlay');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const editApiKeyBtn = document.getElementById('edit-api-key-btn');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeyDisplay = document.getElementById('api-key-display');
const deleteAllDataBtn = document.getElementById('delete-all-data-btn');

// Click History Sidebar
const clickHistoryBtn = document.getElementById('click-history-btn');
const closeClickHistoryBtn = document.getElementById('close-click-history-btn');
const clickHistorySidebar = document.getElementById('click-history-sidebar');
const clickHistoryOverlay = document.getElementById('click-history-overlay');
const clickHistoryListContainer = document.getElementById('click-history-list-container');
const clearClickHistoryBtn = document.getElementById('clear-click-history-btn');

// Canvas History Modal
const canvasHistoryBtn = document.getElementById('canvas-history-btn');
const canvasHistoryModal = document.getElementById('canvas-history-modal');
const closeCanvasHistoryBtn = document.getElementById('close-canvas-history-btn');
const canvasHistoryListContainer = document.getElementById('canvas-history-list-container');
const clearCanvasHistoryBtn = document.getElementById('clear-canvas-history-btn');

// Canvas Sidebar
const canvasBtn = document.getElementById('canvas-btn');
const closeCanvasBtn = document.getElementById('close-canvas-btn');
const canvasSidebar = document.getElementById('canvas-sidebar');
const canvasOverlay = document.getElementById('canvas-overlay');
const canvasArea = document.getElementById('canvas-area');
const nodesContainer = document.getElementById('nodes-container');
const svgLayer = document.getElementById('canvas-svg-layer');
const panZoomContainer = document.getElementById('canvas-pan-zoom-container');

// Canvas Controls
const tabsContainer = document.getElementById('tabs-container');
const pasteUrlInput = document.getElementById('paste-url-input');
const addFromUrlBtn = document.getElementById('add-from-url-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const zoomSlider = document.getElementById('zoom-slider');
const sidebarResizer = document.getElementById('sidebar-resizer');
const deleteConnectionBtn = document.getElementById('delete-connection-btn');
const expandCanvasBtn = document.getElementById('expand-canvas-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Tab Selection Modal
const tabSelectModal = document.getElementById('tab-select-modal');
const tabSelectionList = document.getElementById('tab-selection-list');
const cancelTabSelectBtn = document.getElementById('cancel-tab-select-btn');

// Player Modal
const playerModal = document.getElementById('player-modal');
const closePlayerBtn = document.getElementById('close-player-btn');
const playerContainer = document.getElementById('youtube-player-container');
const branchChoiceOverlay = document.getElementById('branch-choice-overlay');
const branchOptionsContainer = document.getElementById('branch-options');

// Export Modal elements
const exportModal = document.getElementById('export-modal');
const exportTabList = document.getElementById('export-tab-list');
const cancelExportBtn = document.getElementById('cancel-export-btn');
const confirmExportBtn = document.getElementById('confirm-export-btn');
const exportSelectAllBtn = document.getElementById('export-select-all-btn');

// Import Modal elements
const importModal = document.getElementById('import-modal');
const importMergeBtn = document.getElementById('import-merge-btn');
const importOverwriteBtn = document.getElementById('import-overwrite-btn');
const cancelImportBtn = document.getElementById('cancel-import-btn');

// About Modal
const aboutBtn = document.getElementById('about-btn');
const aboutModalOverlay = document.getElementById('about-modal-overlay');
const aboutModalCloseBtn = document.getElementById('about-modal-close-btn');


let youtubePlayer;
let currentPlayingNodeId = null;


// --- APPLICATION STATE MANAGEMENT ---
let state = { queues: [], activeQueueId: null, clickHistory: [], canvasHistory: [] };
let uiState = {
    isConnecting: false,
    connectionStart: { element: null, nodeId: null, direction: null, x: 0, y: 0 },
    draggedNode: { element: null, offsetX: 0, offsetY: 0, wasDragged: false },
    mediaToAdd: null,
    isResizing: false,
    hoverTimeout: null,
    connectionToDelete: null,
    resizeStart: { x: 0, width: 0 },
    stateToImport: null,
    searchType: 'video',
    currentSearchQuery: '',
    nextPageToken: null,
    isLoadingMore: false,
};

const saveState = () => { localStorage.setItem(CANVAS_STATE_KEY, JSON.stringify({ queues: state.queues, activeQueueId: state.activeQueueId })); };
const saveClickHistory = () => { localStorage.setItem(CLICK_HISTORY_STORAGE_KEY, JSON.stringify(state.clickHistory)); };
const saveCanvasHistory = () => { localStorage.setItem(CANVAS_HISTORY_STORAGE_KEY, JSON.stringify(state.canvasHistory)); };


const loadState = () => {
    const savedState = localStorage.getItem(CANVAS_STATE_KEY);
    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.queues = parsed.queues;
        state.activeQueueId = parsed.activeQueueId;
        // Data migration for older versions
        state.queues.forEach(queue => {
            queue.nodes.forEach(node => {
                if (!node.type) { // If type doesn't exist, it's a video
                    node.type = 'video';
                    node.videoId = node.id.split('_')[0];
                }
            });
        });
    } else {
        const defaultId = `q_${Date.now()}`;
        state.queues = [{ id: defaultId, name: 'My First Queue', nodes: [], connections: [] }];
        state.activeQueueId = defaultId;
    }
};

const loadClickHistory = () => {
    const savedHistory = localStorage.getItem(CLICK_HISTORY_STORAGE_KEY);
    if (savedHistory) state.clickHistory = JSON.parse(savedHistory);
}
const loadCanvasHistory = () => {
    const savedHistory = localStorage.getItem(CANVAS_HISTORY_STORAGE_KEY);
    if (savedHistory) state.canvasHistory = JSON.parse(savedHistory);
}

// --- UTILITY FUNCTIONS ---
const showLoadingState = (container, clear = true) => { if (clear) { container.innerHTML = '' } container.insertAdjacentHTML('beforeend', `<div class="flex justify-center items-center h-64"><div class="spinner"></div></div>`); };
const getActiveQueue = () => state.queues.find(q => q.id === state.activeQueueId);
const getVideoIdFromUrl = (url) => { const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/; const match = url.match(regex); return match ? match[1] : null; };

// --- YOUTUBE API & SEARCH LOGIC ---
const fetchFromApi = async (query, type = 'video', isSearch = false, isById = false, pageToken = null) => {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
        videoGrid.innerHTML = `<p class="text-yellow-400 col-span-full text-center text-lg mt-8">Please enter a valid YouTube API Key in Settings to search.</p>`;
        return null;
    }
    let url;
    if (isById) { 
        url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${query}&key=${apiKey}`;
    } else {
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=${isSearch ? 20 : 8}&type=${type}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message || `HTTP error! Status: ${response.status}`); }
        const data = await response.json();
        return { items: data.items, nextPageToken: data.nextPageToken };
    } catch (error) {
        console.error('API Error:', error);
        videoGrid.innerHTML = `<p class="text-red-500 col-span-full text-center text-lg">Error: ${error.message}. Please check your API key.</p>`;
        return null;
    }
};

const createVideoCardsHTML = (items) => {
    return items.map(item => {
        const videoId = item.id.videoId || item.id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const { title, channelTitle, thumbnails } = item.snippet;
        const thumbnailUrl = thumbnails.high?.url || thumbnails.medium.url;
        const mediaData = { type: 'video', videoId, title, thumbnailUrl, url: videoUrl };
        const mediaDataString = JSON.stringify(mediaData).replace(/'/g, "&apos;");

        return `
            <div draggable="true" ondragstart="event.dataTransfer.setData('application/json', '${mediaDataString}')" 
                 class="group bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-400/20 transition-all duration-300 relative">
                <div class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button class="add-to-queue-btn p-1.5 bg-black/60 hover:bg-sky-500 rounded-full" title="Add to Queue" data-media-info='${mediaDataString}'>
                        <svg class="w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </button>
                     <button class="copy-link-btn p-1.5 bg-black/60 hover:bg-sky-500 rounded-full" title="Copy Link" data-url="${videoUrl}">
                        <svg class="w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
                <a href="${videoUrl}" target="_blank" class="block search-result-link" data-media-info='${mediaDataString}'>
                    <div class="relative"><img src="${thumbnailUrl}" alt="Video thumbnail" class="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"></div>
                    <div class="p-4">
                        <h3 class="text-md font-bold leading-tight text-gray-200 group-hover:text-sky-400 transition-colors">${title}</h3>
                        <p class="text-sm text-gray-400 mt-2">${channelTitle}</p>
                    </div>
                </a>
            </div>
        `;
    }).join('');
};

const createPlaylistCardsHTML = (items) => {
     return items.map(item => {
        const playlistId = item.id.playlistId;
        const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const { title, channelTitle, thumbnails } = item.snippet;
        const thumbnailUrl = thumbnails.high?.url || thumbnails.medium.url;
        const mediaData = { type: 'playlist', playlistId, title, thumbnailUrl, url: playlistUrl };
        const mediaDataString = JSON.stringify(mediaData).replace(/'/g, "&apos;");

        return `
            <div draggable="true" ondragstart="event.dataTransfer.setData('application/json', '${mediaDataString}')" 
                 class="group bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-400/20 transition-all duration-300 relative">
                <div class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                     <button class="add-to-queue-btn p-1.5 bg-black/60 hover:bg-purple-500 rounded-full" title="Add Playlist to Queue" data-media-info='${mediaDataString}'>
                        <svg class="w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </button>
                    <button class="copy-link-btn p-1.5 bg-black/60 hover:bg-purple-500 rounded-full" title="Copy Link" data-url="${playlistUrl}">
                        <svg class="w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
                <a href="${playlistUrl}" target="_blank" class="block search-result-link" data-media-info='${mediaDataString}'>
                    <div class="relative">
                        <img src="${thumbnailUrl}" alt="Playlist thumbnail" class="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                         <div class="absolute bottom-2 left-3 text-white">
                            <h3 class="text-md font-bold leading-tight drop-shadow-lg">${title}</h3>
                            <p class="text-sm text-gray-300 mt-1 drop-shadow-lg">${channelTitle}</p>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join('');
};

const displayResults = (resultsData, container, isLoadMore = false) => {
    const spinner = videoGrid.querySelector('#load-more-spinner');
    if (spinner) spinner.remove();

    if (!resultsData || !resultsData.items || resultsData.items.length === 0) {
        if (!isLoadMore) container.innerHTML = `<p class="text-gray-400 text-center text-lg">No results found.</p>`;
        return;
    }
    const createCardsFn = uiState.searchType === 'video' ? createVideoCardsHTML : createPlaylistCardsHTML;
    const cardsHTML = createCardsFn(resultsData.items);
    
    if (isLoadMore) {
        let grid = container.querySelector('.grid');
        if (grid) grid.insertAdjacentHTML('beforeend', cardsHTML);
    } else {
        container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">${cardsHTML}</div>`;
    }

    if (resultsData.nextPageToken) {
        container.insertAdjacentHTML('beforeend', `<div id="load-more-spinner" class="spinner w-10 h-10"></div>`);
    }
};

const handleSearch = async (isLoadMore = false) => {
    const searchTerm = isLoadMore ? uiState.currentSearchQuery : searchInput.value.trim();
    if (!searchTerm) return;

    if (!isLoadMore) {
        uiState.currentSearchQuery = searchTerm;
        uiState.nextPageToken = null;
        videoGrid.innerHTML = `<h2 class="text-3xl font-bold mb-6 border-b-2 border-gray-700 pb-2">Search Results for "${searchTerm}"</h2>`;
        const resultsContainer = document.createElement('div');
        videoGrid.appendChild(resultsContainer);
        showLoadingState(resultsContainer);
    }
    
    const resultsContainer = videoGrid.querySelector('div:not(.flex)');
    const spinner = videoGrid.querySelector('#load-more-spinner');
    if (spinner) spinner.classList.add('visible');

    uiState.isLoadingMore = true;
    const resultsData = await fetchFromApi(searchTerm, uiState.searchType, true, false, uiState.nextPageToken);
    uiState.isLoadingMore = false;
    
    if (resultsData) {
        const container = videoGrid.querySelector('div:not(.flex)');
        displayResults(resultsData, container, isLoadMore);
        uiState.nextPageToken = resultsData.nextPageToken;
    }
};

const loadHomepageContent = async () => {
    uiState.currentSearchQuery = '';
    uiState.nextPageToken = null;
    const categories = ['Latest Tech Reviews', 'New Movie Trailers', 'Stand Up Comedy'];
    videoGrid.innerHTML = '';
    for (const category of categories) {
        const categorySection = document.createElement('div');
        categorySection.innerHTML = `<h2 class="text-3xl font-bold mb-6 border-b-2 border-gray-700 pb-2">${category}</h2>`;
        const resultsContainer = document.createElement('div');
        categorySection.appendChild(resultsContainer);
        videoGrid.appendChild(categorySection);
        showLoadingState(resultsContainer);
        const videoData = await fetchFromApi(category, 'video', false);
        if (videoData) { displayResults(videoData, resultsContainer, false); } else { break; }
    }
};

// --- CANVAS RENDERING LOGIC ---
const renderTabs = () => {
    const tabsHtml = state.queues.map(q => `
        <div data-id="${q.id}" draggable="true" class="tab-btn group flex items-center gap-2 whitespace-nowrap text-sm pl-4 pr-2 py-2 rounded-md transition cursor-pointer ${q.id === state.activeQueueId ? 'bg-sky-500 text-white font-bold' : 'bg-gray-700 hover:bg-gray-600'}">
            <span class="tab-name pointer-events-none">${q.name}</span>
            <button class="delete-tab-btn opacity-50 group-hover:opacity-100 text-white hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center text-xs" title="Delete Tab">×</button>
        </div>
    `).join('');
    const addBtnHtml = `<button id="add-tab-btn" class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded-md text-lg transition" title="New Tab">+</button>`;
    tabsContainer.innerHTML = tabsHtml + addBtnHtml;
};

const renderCanvas = () => {
    const queue = getActiveQueue();
    if (!queue) {
        nodesContainer.innerHTML = '<p class="text-gray-500 text-center mt-10">Create a new tab to get started!</p>';
        svgLayer.innerHTML = '';
        return;
    }
    nodesContainer.innerHTML = queue.nodes.map(node => {
        const isConnected = queue.connections.some(c => c.from.id === node.id || c.to.id === node.id);
        const isRecent = (new Date() - new Date(node.createdAt)) < 24 * 60 * 60 * 1000;
        const showBadge = !isConnected && isRecent;

        const isPlaylist = node.type === 'playlist';
        const nodeClasses = `canvas-node bg-gray-900 rounded-md shadow-lg p-2 flex flex-col gap-2 border-l-4 ${node.status === 'played' ? 'played' : (isPlaylist ? 'playlist-node' : 'border-gray-600')} ${isPlaylist ? 'playlist-node' : ''}`;
        
        return `
        <div id="node-${node.id}" class="${nodeClasses}" style="left:${node.x}px; top:${node.y}px;" data-id="${node.id}">
            <div class="relative">
                ${showBadge ? '<span class="new-badge">new</span>' : ''}
                <img src="${node.thumbnailUrl}" class="rounded-sm w-full h-auto object-cover pointer-events-none">
                ${isPlaylist ? `<div class="playlist-badge"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg><span>Playlist</span></div>` : ''}
                <div class="canvas-node-play-button" data-id="${node.id}">
                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                </div>
            </div>
            <p class="text-xs font-semibold leading-tight pointer-events-none">${node.title}</p>
            <div class="flex items-center justify-end text-xs mt-auto">
                <button class="status-toggle p-1 hover:text-green-400" title="Toggle Played/Unplayed">${node.status === 'played' ? '✅' : '⚪'}</button>
                <button class="delete-node-btn p-1 hover:text-red-400" title="Delete Node">🗑️</button>
            </div>
            <div class="connector-dot" data-direction="top" data-id="${node.id}"></div>
            <div class="connector-dot" data-direction="bottom" data-id="${node.id}"></div>
            <div class="connector-dot" data-direction="left" data-id="${node.id}"></div>
            <div class="connector-dot" data-direction="right" data-id="${node.id}"></div>
        </div>
    `}).join('');
    renderConnections();
};


const getConnectorPoint = (nodeId, direction) => {
    const nodeEl = document.getElementById(`node-${nodeId}`);
    if (!nodeEl) return null;
    const x = parseFloat(nodeEl.style.left);
    const y = parseFloat(nodeEl.style.top);
    const w = nodeEl.offsetWidth;
    const h = nodeEl.offsetHeight;
    switch (direction) {
        case 'top': return { x: x + w / 2, y: y };
        case 'bottom': return { x: x + w / 2, y: y + h };
        case 'left': return { x: x, y: y + h / 2 };
        case 'right': return { x: x + w, y: y + h / 2 };
        default: return null;
    }
};

const renderConnections = () => {
    const queue = getActiveQueue();
    if (!queue) return;
    svgLayer.innerHTML = '';
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" /></marker>`;
    svgLayer.appendChild(defs);

    queue.connections.forEach(conn => {
        const p1 = getConnectorPoint(conn.from.id, conn.from.direction);
        const p2 = getConnectorPoint(conn.to.id, conn.to.direction);
        if (!p1 || !p2) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', '#0ea5e9');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrow)');
        line.classList.add('connection-line');
        svgLayer.appendChild(line);

        const hoverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hoverLine.setAttribute('x1', p1.x); hoverLine.setAttribute('y1', p1.y);
        hoverLine.setAttribute('x2', p2.x); hoverLine.setAttribute('y2', p2.y);
        hoverLine.setAttribute('stroke', 'transparent');
        hoverLine.setAttribute('stroke-width', '12');
        hoverLine.style.cursor = 'pointer';
        hoverLine.dataset.connection = JSON.stringify(conn);
        hoverLine.classList.add('connection-hover-target');
        svgLayer.appendChild(hoverLine);
    });
};
const refreshFullCanvas = () => { renderTabs(); renderCanvas(); };

const getNextNodePosition = () => {
    return { x: 50, y: 50 };
};

const addNodeToCanvas = (mediaData, pos, targetQueue) => {
    const queue = targetQueue || getActiveQueue();
    if (!queue) { alert("Please select or create a tab first."); return false; }

    const isDuplicate = queue.nodes.some(n =>
        (n.type === 'video' && n.videoId === mediaData.videoId) ||
        (n.type === 'playlist' && n.playlistId === mediaData.playlistId)
    );

    if (isDuplicate) {
        if (!confirm(`This ${mediaData.type} is already in "${queue.name}". Add another copy?`)) {
            return false;
        }
    }
    
    const newNode = {
        id: `${mediaData.videoId || mediaData.playlistId}_${Date.now()}`,
        type: mediaData.type,
        title: mediaData.title,
        thumbnailUrl: mediaData.thumbnailUrl,
        x: pos.x,
        y: pos.y,
        status: 'unplayed',
        createdAt: new Date().toISOString()
    };
    if (mediaData.type === 'video') {
        newNode.videoId = mediaData.videoId;
    } else {
        newNode.playlistId = mediaData.playlistId;
    }

    queue.nodes.push(newNode);
    return true;
};

// --- CANVAS & GRID INTERACTION LOGIC ---
canvasArea.addEventListener('dragover', (e) => e.preventDefault());
canvasArea.addEventListener('drop', (e) => { e.preventDefault(); try { const mediaData = JSON.parse(e.dataTransfer.getData('application/json')); const rect = canvasArea.getBoundingClientRect(); const zoom = parseFloat(panZoomContainer.style.transform.replace('scale(', '')) || 1; const pos = { x: (e.clientX - rect.left + canvasArea.scrollLeft) / zoom, y: (e.clientY - rect.top + canvasArea.scrollTop) / zoom }; if (addNodeToCanvas(mediaData, pos)) { saveState(); renderCanvas(); } } catch (error) { console.error("Failed to drop node:", error); } });

nodesContainer.addEventListener('mousedown', (e) => {
    const connector = e.target.closest('.connector-dot');
    if (connector) {
        e.stopPropagation();
        uiState.isConnecting = true;
        const nodeId = connector.dataset.id;
        const direction = connector.dataset.direction;
        const startPoint = getConnectorPoint(nodeId, direction);

        const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('id', 'temp-connection-line');
        tempLine.setAttribute('x1', startPoint.x);
        tempLine.setAttribute('y1', startPoint.y);
        tempLine.setAttribute('x2', startPoint.x);
        tempLine.setAttribute('y2', startPoint.y);
        tempLine.setAttribute('stroke', '#facc15');
        tempLine.setAttribute('stroke-width', '2');
        svgLayer.appendChild(tempLine);

        uiState.connectionStart = { element: tempLine, nodeId, direction };
        
        document.querySelectorAll('.canvas-node').forEach(node => {
            if (node.dataset.id !== nodeId) {
                node.classList.add('show-connectors');
            }
        });
        return;
    }
    const nodeEl = e.target.closest('.canvas-node');
    if (nodeEl && !e.target.closest('button, .connector-dot')) {
        uiState.draggedNode.element = nodeEl;
        uiState.draggedNode.wasDragged = false;
        const rect = nodeEl.getBoundingClientRect();
        const zoom = parseFloat(panZoomContainer.style.transform.replace('scale(', '')) || 1;
        uiState.draggedNode.offsetX = e.clientX / zoom - rect.left / zoom;
        uiState.draggedNode.offsetY = e.clientY / zoom - rect.top / zoom;
    }
});

document.addEventListener('mousemove', (e) => {
    if (uiState.isResizing) {
        const dx = e.clientX - uiState.resizeStart.x;
        const newWidth = uiState.resizeStart.width + dx;
        const minWidth = 500;
        if (newWidth > minWidth) {
            canvasSidebar.style.width = newWidth + 'px';
        }
        return;
    }
    
    const zoom = parseFloat(panZoomContainer.style.transform.replace('scale(', '')) || 1;
    const canvasRect = canvasArea.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left + canvasArea.scrollLeft) / zoom;
    const mouseY = (e.clientY - canvasRect.top + canvasArea.scrollTop) / zoom;

    if (uiState.isConnecting) {
        e.preventDefault();
        const line = uiState.connectionStart.element;
        line.setAttribute('x2', mouseX);
        line.setAttribute('y2', mouseY);
    }
    if (uiState.draggedNode.element) {
        uiState.draggedNode.wasDragged = true;
        e.preventDefault();
        const nodeEl = uiState.draggedNode.element;
        let x = mouseX - uiState.draggedNode.offsetX;
        let y = mouseY - uiState.draggedNode.offsetY;
        x = Math.max(0, Math.min(x, 3000 - nodeEl.offsetWidth));
        y = Math.max(0, Math.min(y, 3000 - nodeEl.offsetHeight));
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;
        renderConnections();
    }
});

document.addEventListener('mouseup', (e) => {
    if (uiState.isResizing) {
        uiState.isResizing = false;
        canvasSidebar.classList.remove('no-transition');
    }
    if (uiState.isConnecting) {
        const startInfo = uiState.connectionStart;
        uiState.isConnecting = false;
        startInfo.element.remove();
        document.querySelectorAll('.canvas-node.show-connectors').forEach(node => node.classList.remove('show-connectors'));

        let endNodeEl = null;
        const allNodes = document.querySelectorAll('.canvas-node');
        for (const node of allNodes) {
            const rect = node.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                endNodeEl = node;
                break;
            }
        }

        if (endNodeEl && endNodeEl.dataset.id !== startInfo.nodeId) {
            const endNodeId = endNodeEl.dataset.id;
            const rect = endNodeEl.getBoundingClientRect();
            const zoom = parseFloat(panZoomContainer.style.transform.replace('scale(', '')) || 1;
            const mouseX = (e.clientX - rect.left) / zoom;
            const mouseY = (e.clientY - rect.top) / zoom;
            
            const distances = {
                top: Math.abs(mouseY - 0),
                bottom: Math.abs(mouseY - endNodeEl.offsetHeight),
                left: Math.abs(mouseX - 0),
                right: Math.abs(mouseX - endNodeEl.offsetWidth)
            };
            const endDirection = Object.keys(distances).reduce((a, b) => distances[a] < distances[b] ? a : b);
            
            const queue = getActiveQueue();
            const newConnection = { from: {id: startInfo.nodeId, direction: startInfo.direction}, to: {id: endNodeId, direction: endDirection } };
            const exists = queue.connections.some(c => JSON.stringify(c) === JSON.stringify(newConnection));
            if (!exists) {
                queue.connections.push(newConnection);
                saveState();
                renderCanvas();
            }
        }
    }
    if (uiState.draggedNode.element) {
        const nodeEl = uiState.draggedNode.element;
        const nodeId = nodeEl.dataset.id;
        const queue = getActiveQueue();
        const node = queue.nodes.find(n => n.id === nodeId);
        if (node) {
            node.x = parseFloat(nodeEl.style.left);
            node.y = parseFloat(nodeEl.style.top);
            saveState();
        }
        uiState.draggedNode.element = null;
    }
});

nodesContainer.addEventListener('click', (e) => {
    const queue = getActiveQueue();
    if (!queue) return;
    const nodeId = e.target.closest('[data-id]')?.dataset.id;
    if (!nodeId) return;

    if (e.target.closest('.canvas-node-play-button')) {
        if (uiState.draggedNode.wasDragged) {
            uiState.draggedNode.wasDragged = false; 
            return;
        }
        playNodeInQueue(nodeId);
    } else if (e.target.closest('.status-toggle')) {
        const node = queue.nodes.find(n => n.id === nodeId);
        if(node) {
            node.status = node.status === 'played' ? 'unplayed' : 'played';
            saveState();
            renderCanvas();
        }
    } else if (e.target.closest('.delete-node-btn')) {
        if (confirm("Are you sure you want to delete this node and its connections?")) {
            queue.nodes = queue.nodes.filter(n => n.id !== nodeId);
            queue.connections = queue.connections.filter(c => c.from.id !== nodeId && c.to.id !== nodeId);
            saveState();
            renderCanvas();
        }
    }
});

videoGrid.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-link-btn');
    const addBtn = e.target.closest('.add-to-queue-btn');
    const link = e.target.closest('.search-result-link');

    if (copyBtn) {
        e.preventDefault();
        const url = copyBtn.dataset.url;
        navigator.clipboard.writeText(url).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = `✅`;
            setTimeout(() => { copyBtn.innerHTML = originalIcon; }, 1500);
        });
    } else if (addBtn) {
        e.preventDefault();
        const mediaInfo = JSON.parse(addBtn.dataset.mediaInfo);
        if (state.queues.length === 1) {
            const pos = getNextNodePosition();
            if (addNodeToCanvas(mediaInfo, pos, state.queues[0])) {
                saveState();
                if (state.queues[0].id === state.activeQueueId) { renderCanvas(); }
                openCanvas();
            }
        } else {
            uiState.mediaToAdd = mediaInfo;
            openTabSelectModal();
        }
    } else if (link) {
        const mediaInfo = JSON.parse(link.dataset.mediaInfo);
        state.clickHistory = state.clickHistory.filter(item => item.url !== mediaInfo.url);
        state.clickHistory.unshift({ ...mediaInfo, clickedAt: new Date().toISOString() });
        if(state.clickHistory.length > 100) state.clickHistory.pop();
        saveClickHistory();
    }
});

// --- MODAL & POPUP LOGIC ---
const openTabSelectModal = () => { tabSelectionList.innerHTML = state.queues.map(queue => `<button data-queue-id="${queue.id}" class="tab-select-option w-full text-left p-3 hover:bg-sky-600 rounded-md transition">${queue.name}</button>`).join(''); tabSelectModal.classList.remove('hidden'); };
const closeTabSelectModal = () => { tabSelectModal.classList.add('hidden'); uiState.mediaToAdd = null; };
tabSelectModal.addEventListener('click', (e) => { const targetQueueBtn = e.target.closest('.tab-select-option'); if (targetQueueBtn) { const queueId = targetQueueBtn.dataset.queueId; const targetQueue = state.queues.find(q => q.id === queueId); if (targetQueue && uiState.mediaToAdd) { const pos = getNextNodePosition(); if (addNodeToCanvas(uiState.mediaToAdd, pos, targetQueue)) { saveState(); if (targetQueue.id === state.activeQueueId) { renderCanvas(); } alert(`${uiState.mediaToAdd.type.charAt(0).toUpperCase() + uiState.mediaToAdd.type.slice(1)} added to "${targetQueue.name}"!`); } } closeTabSelectModal(); } });
cancelTabSelectBtn.addEventListener('click', closeTabSelectModal);

// --- TAB & DATA MANAGEMENT ---
tabsContainer.addEventListener('click', (e) => {
    const addBtn = e.target.closest('#add-tab-btn');
    const deleteBtn = e.target.closest('.delete-tab-btn');
    const tabEl = e.target.closest('.tab-btn');
    if (addBtn) { const name = prompt("Enter new tab name:", "New Queue"); if (name && name.trim()) { const newId = `q_${Date.now()}`; state.queues.push({ id: newId, name: name.trim(), nodes: [], connections: [] }); state.activeQueueId = newId; saveState(); refreshFullCanvas(); } } else if (deleteBtn) { if (state.queues.length <= 1) { alert("Cannot delete the last tab."); return; } const queueIdToDelete = deleteBtn.parentElement.dataset.id; const queueToDelete = state.queues.find(q => q.id === queueIdToDelete); if (confirm(`Are you sure you want to delete the "${queueToDelete.name}" tab?`)) { state.queues = state.queues.filter(q => q.id !== queueIdToDelete); if (state.activeQueueId === queueIdToDelete) { state.activeQueueId = state.queues[0]?.id || null; } saveState(); refreshFullCanvas(); } } else if (tabEl) { const newActiveId = tabEl.dataset.id; if (newActiveId !== state.activeQueueId) { state.activeQueueId = newActiveId; saveState(); refreshFullCanvas(); } }
});
tabsContainer.addEventListener('dblclick', (e) => { const tabEl = e.target.closest('.tab-btn'); if (tabEl && !e.target.closest('.delete-tab-btn')) { const queueId = tabEl.dataset.id; const queue = state.queues.find(q => q.id === queueId); if (queue) { const newName = prompt("Enter new name for this tab:", queue.name); if (newName && newName.trim()) { queue.name = newName.trim(); saveState(); renderTabs(); } } } });

tabsContainer.addEventListener('dragstart', e => {
    const tab = e.target.closest('.tab-btn');
    if (tab) {
        tab.classList.add('dragging');
    }
});
tabsContainer.addEventListener('dragend', e => {
    const tab = e.target.closest('.tab-btn');
    if (tab) {
        tab.classList.remove('dragging');
    }
});
tabsContainer.addEventListener('dragover', e => {
    e.preventDefault();
});
tabsContainer.addEventListener('drop', e => {
    e.preventDefault();
    const draggingTab = tabsContainer.querySelector('.dragging');
    const targetTab = e.target.closest('.tab-btn');
    if (!draggingTab || !targetTab || draggingTab === targetTab) return;

    const draggingId = draggingTab.dataset.id;
    const targetId = targetTab.dataset.id;

    const draggingIndex = state.queues.findIndex(q => q.id === draggingId);
    const targetIndex = state.queues.findIndex(q => q.id === targetId);

    if (draggingIndex === -1 || targetIndex === -1) return;

    const [draggedItem] = state.queues.splice(draggingIndex, 1);
    state.queues.splice(targetIndex, 0, draggedItem);
    
    saveState();
    renderTabs();
});


addFromUrlBtn.addEventListener('click', async () => { const url = pasteUrlInput.value.trim(); const videoId = getVideoIdFromUrl(url); if (videoId) { const videoData = await fetchFromApi(videoId, 'video', false, true); if (videoData && videoData.items.length > 0) { const item = videoData.items[0]; const videoDetails = { type: 'video', videoId: item.id, title: item.snippet.title, thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url }; const pos = getNextNodePosition(); if(addNodeToCanvas(videoDetails, pos)) { saveState(); renderCanvas(); pasteUrlInput.value = ''; } } else { alert("Could not fetch video details. Check the URL and your API Key."); } } else { alert("Invalid YouTube URL. Only single video URLs can be pasted here."); } });

// --- EXPORT/IMPORT LOGIC ---
const openExportModal = () => {
    exportTabList.innerHTML = state.queues.map(q => `
        <label class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
            <input type="checkbox" data-queue-id="${q.id}" class="h-4 w-4 rounded bg-gray-600 border-gray-500 text-sky-500 focus:ring-sky-600">
            <span class="text-sm">${q.name}</span>
        </label>
    `).join('');
    exportModal.classList.remove('hidden');
};

const closeExportModal = () => exportModal.classList.add('hidden');
const closeImportModal = () => {
    importModal.classList.add('hidden');
    uiState.stateToImport = null;
    importFileInput.value = '';
};

const triggerDownload = (stateToExport) => {
    const dataStr = JSON.stringify(stateToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `video-canvas-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

exportBtn.addEventListener('click', openExportModal);
cancelExportBtn.addEventListener('click', closeExportModal);
exportSelectAllBtn.addEventListener('click', () => {
    const allChecked = [...exportTabList.querySelectorAll('input[type="checkbox"]')].every(cb => cb.checked);
    exportTabList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = !allChecked);
});
confirmExportBtn.addEventListener('click', () => {
    const selectedIds = [...exportTabList.querySelectorAll('input:checked')].map(cb => cb.dataset.queueId);
    if (selectedIds.length === 0) {
        alert("Please select at least one tab to export.");
        return;
    }
    const selectedQueues = state.queues.filter(q => selectedIds.includes(q.id));
    const activeIdInSelection = selectedIds.includes(state.activeQueueId) ? state.activeQueueId : selectedQueues[0].id;
    const stateToExport = { queues: selectedQueues, activeQueueId: activeIdInSelection };
    triggerDownload(stateToExport);
    closeExportModal();
});

importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedState = JSON.parse(e.target.result);
            if (!importedState || !Array.isArray(importedState.queues)) throw new Error("Invalid file format.");
            uiState.stateToImport = importedState;
            importModal.classList.remove('hidden');
        } catch (error) {
            alert("Error reading or parsing the file: " + error.message);
            console.error("Import error:", error);
            importFileInput.value = '';
        }
    };
    reader.readAsText(file);
});

cancelImportBtn.addEventListener('click', closeImportModal);
importMergeBtn.addEventListener('click', () => {
    const importedState = uiState.stateToImport;
    if (!importedState) return;
    importedState.queues.forEach(incomingQueue => {
        const existingNames = state.queues.map(q => q.name);
        let newName = incomingQueue.name;
        let counter = 1;
        while (existingNames.includes(newName)) {
            newName = `${incomingQueue.name} (${counter++})`;
        }
        incomingQueue.name = newName;
        incomingQueue.id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        state.queues.push(incomingQueue);
    });
    saveState();
    refreshFullCanvas();
    alert("Canvas restored successfully!");
    closeImportModal();
});
importOverwriteBtn.addEventListener('click', () => {
    if (confirm("This will completely replace your current canvas. Are you sure?")) {
        state.queues = uiState.stateToImport.queues;
        state.activeQueueId = uiState.stateToImport.activeQueueId;
        saveState();
        refreshFullCanvas();
        alert("Canvas restored successfully!");
    }
    closeImportModal();
});

// --- YOUTUBE PLAYER LOGIC ---
function onYouTubeIframeAPIReady() { youtubePlayer = new YT.Player('youtube-player-container', { height: '100%', width: '100%', playerVars: { 'autoplay': 1, 'controls': 1, 'rel': 0 }, events: { 'onStateChange': onPlayerStateChange } }); }

function playNodeInQueue(nodeId) {
    branchChoiceOverlay.classList.add('hidden');
    branchChoiceOverlay.classList.remove('flex');
    branchOptionsContainer.innerHTML = '';

    const queue = getActiveQueue();
    const node = queue?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    currentPlayingNodeId = node.id;
    
    // Add to canvas history
    state.canvasHistory = state.canvasHistory.filter(item => !(item.nodeId === node.id && item.queueId === queue.id));
    state.canvasHistory.unshift({
        nodeId: node.id, nodeTitle: node.title, queueId: queue.id,
        queueName: queue.name, type: node.type, thumbnailUrl: node.thumbnailUrl, playedAt: new Date().toISOString()
    });
    if (state.canvasHistory.length > 100) state.canvasHistory.pop();
    saveCanvasHistory();

    if (node.type === 'video') {
        youtubePlayer.loadVideoById(node.videoId);
    } else if (node.type === 'playlist') {
        youtubePlayer.loadPlaylist({
            list: node.playlistId, listType: 'playlist', index: 0, suggestedQuality: 'large'
        });
    }

    playerModal.classList.remove('hidden');
    playerModal.classList.add('flex');
    
    if (node.status !== 'played') {
        node.status = 'played';
        saveState();
        renderCanvas();
    }
}
function onPlayerStateChange(event) { if (event.data === YT.PlayerState.ENDED) { handleQueueAdvancement(); } }
function handleQueueAdvancement() { const queue = getActiveQueue(); if (!queue || !currentPlayingNodeId) return; const nextNodes = queue.connections.filter(c => c.from.id === currentPlayingNodeId).map(c => queue.nodes.find(n => n.id === c.to.id)).filter(Boolean); if (nextNodes.length === 1) { playNodeInQueue(nextNodes[0].id); } else if (nextNodes.length > 1) { branchOptionsContainer.innerHTML = nextNodes.map(v => `<button data-nodeid="${v.id}" class="branch-option-btn bg-gray-700 p-3 rounded-lg hover:bg-sky-600 transition text-left flex items-center gap-3"><img src="${v.thumbnailUrl}" class="w-24 h-16 object-cover rounded"><span class="text-sm font-semibold">${v.title}</span></button>`).join(''); branchChoiceOverlay.classList.remove('hidden'); branchChoiceOverlay.classList.add('flex'); } else { closePlayer(); } }
branchOptionsContainer.addEventListener('click', (e) => { const button = e.target.closest('.branch-option-btn'); if (button) { const nextNodeId = button.dataset.nodeid; branchChoiceOverlay.classList.add('hidden'); branchChoiceOverlay.classList.remove('flex'); playNodeInQueue(nextNodeId); } });
function closePlayer() {
    youtubePlayer.stopVideo();
    playerModal.classList.add('hidden');
    playerModal.classList.remove('flex');
    currentPlayingNodeId = null;

    branchChoiceOverlay.classList.add('hidden');
    branchChoiceOverlay.classList.remove('flex');
    branchOptionsContainer.innerHTML = '';
}
closePlayerBtn.addEventListener('click', closePlayer);

// --- THEME LOGIC ---
const themes = ['default', 'amoled-dark', 'light'];
const themeIcons = {
    'default': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`,
    'amoled-dark': `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`,
    'light': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
};
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggleBtn.innerHTML = themeIcons[theme];
    localStorage.setItem(THEME_STORAGE_KEY, theme);
};
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    applyTheme(themes[nextIndex]);
});


// --- SIDEBAR & CANVAS CONTROLS LOGIC ---
zoomSlider.addEventListener('input', (e) => { panZoomContainer.style.transform = `scale(${e.target.value})`; renderConnections(); });

sidebarResizer.addEventListener('mousedown', (e) => { 
    e.preventDefault();
    canvasSidebar.classList.remove('is-expanded');
    canvasSidebar.classList.add('no-transition');
    canvasSidebar.style.maxWidth = '';
    uiState.isResizing = true; 
    uiState.resizeStart = {
        x: e.clientX,
        width: canvasSidebar.offsetWidth
    };
});
const openSettings = () => { settingsSidebar.classList.remove('translate-x-full'); settingsOverlay.classList.remove('opacity-0', 'pointer-events-none'); };
const closeSettings = () => { settingsSidebar.classList.add('translate-x-full'); settingsOverlay.classList.add('opacity-0', 'pointer-events-none'); };
const openCanvas = () => { canvasSidebar.classList.remove('-translate-x-full'); canvasOverlay.classList.remove('opacity-0', 'pointer-events-none'); };
const closeCanvas = () => { canvasSidebar.classList.add('-translate-x-full'); canvasOverlay.classList.add('opacity-0', 'pointer-events-none'); };

// --- HISTORY LOGIC ---
const openClickHistory = () => { renderClickHistory(); clickHistorySidebar.classList.remove('translate-x-full'); clickHistoryOverlay.classList.remove('opacity-0', 'pointer-events-none'); };
const closeClickHistory = () => { clickHistorySidebar.classList.add('translate-x-full'); clickHistoryOverlay.classList.add('opacity-0', 'pointer-events-none'); };
const openCanvasHistory = () => { renderCanvasHistory(); canvasHistoryModal.classList.remove('hidden'); canvasHistoryModal.classList.add('flex');};
const closeCanvasHistory = () => { canvasHistoryModal.classList.add('hidden'); canvasHistoryModal.classList.remove('flex');};

const renderClickHistory = () => {
    if (state.clickHistory.length === 0) {
        clickHistoryListContainer.innerHTML = `<p class="text-gray-400 text-center p-8">Your click history is empty.</p>`; return;
    }
    clickHistoryListContainer.innerHTML = state.clickHistory.map(item => `
        <a href="${item.url}" target="_blank" class="history-item p-4 border-b border-gray-700 hover:bg-gray-700/50 flex items-center gap-4">
            <img src="${item.thumbnailUrl}" alt="thumbnail">
            <div class="flex-grow min-w-0">
                <p class="font-bold text-sm text-gray-200 truncate">${item.title}</p>
                <p class="text-xs text-gray-400 mt-1">${new Date(item.clickedAt).toLocaleString()}</p>
            </div>
        </a>
    `).join('');
};

const renderCanvasHistory = () => {
    if (state.canvasHistory.length === 0) {
        canvasHistoryListContainer.innerHTML = `<p class="text-gray-400 text-center p-8">Your canvas watch history is empty.</p>`; return;
    }
    canvasHistoryListContainer.innerHTML = state.canvasHistory.map(item => `
        <div class="history-item history-item-clickable p-4 border-b border-gray-700 hover:bg-gray-700/50 flex items-center gap-4" data-queue-id="${item.queueId}" data-node-id="${item.nodeId}">
            <img src="${item.thumbnailUrl}" alt="thumbnail">
            <div class="flex-grow min-w-0">
                <p class="font-bold text-sm text-gray-200 truncate">${item.nodeTitle}</p>
                <div class="text-xs text-gray-400 mt-1 flex justify-between items-center">
                    <span>In: <span class="font-semibold text-gray-300">${item.queueName}</span></span>
                    <span>${new Date(item.playedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    `).join('');
};

clickHistoryBtn.addEventListener('click', openClickHistory);
closeClickHistoryBtn.addEventListener('click', closeClickHistory);
clickHistoryOverlay.addEventListener('click', closeClickHistory);
clearClickHistoryBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your click history?")) {
        state.clickHistory = [];
        saveClickHistory();
        renderClickHistory();
    }
});

canvasHistoryBtn.addEventListener('click', openCanvasHistory);
closeCanvasHistoryBtn.addEventListener('click', closeCanvasHistory);
clearCanvasHistoryBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your canvas watch history?")) {
        state.canvasHistory = [];
        saveCanvasHistory();
        renderCanvasHistory();
    }
});
canvasHistoryListContainer.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item-clickable');
    if (item) {
        const { queueId, nodeId } = item.dataset;
        if (state.activeQueueId !== queueId) {
            state.activeQueueId = queueId;
            refreshFullCanvas();
        }
        playNodeInQueue(nodeId);
        closeCanvasHistory();
    }
});

// --- EVENT LISTENERS & INITIALIZATION ---
const switchSearchType = (type) => {
    const oldType = uiState.searchType;
    uiState.searchType = type;
    if (type === 'video') {
        searchTypeVideoBtn.classList.add('border-sky-500', 'text-white');
        searchTypeVideoBtn.classList.remove('border-transparent', 'text-gray-400');
        searchTypePlaylistBtn.classList.add('border-transparent', 'text-gray-400');
        searchTypePlaylistBtn.classList.remove('border-sky-500', 'text-white');
        searchInput.placeholder = "Search for videos to add to your canvas...";
    } else { // playlist
        searchTypePlaylistBtn.classList.add('border-sky-500', 'text-white');
        searchTypePlaylistBtn.classList.remove('border-transparent', 'text-gray-400');
        searchTypeVideoBtn.classList.add('border-transparent', 'text-gray-400');
        searchTypeVideoBtn.classList.remove('border-sky-500', 'text-white');
        searchInput.placeholder = "Search for playlists to add to your canvas...";
    }
    if (oldType !== type && uiState.currentSearchQuery) {
        handleSearch();
    }
};

searchTypeVideoBtn.addEventListener('click', () => switchSearchType('video'));
searchTypePlaylistBtn.addEventListener('click', () => switchSearchType('playlist'));

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);
canvasBtn.addEventListener('click', openCanvas);
closeCanvasBtn.addEventListener('click', closeCanvas);
canvasOverlay.addEventListener('click', closeCanvas);

expandCanvasBtn.addEventListener('click', () => {
    canvasSidebar.classList.toggle('is-expanded');
    if (canvasSidebar.classList.contains('is-expanded')) {
        canvasSidebar.style.width = '';
    }
});

const updateApiKeyUI = (hasKey) => { apiKeyForm.classList.toggle('hidden', hasKey); apiKeyDisplay.classList.toggle('hidden', !hasKey); apiKeyDisplay.classList.toggle('flex', hasKey); };
saveApiKeyBtn.addEventListener('click', () => { const apiKey = apiKeyInput.value.trim(); if (apiKey) { localStorage.setItem(API_KEY_STORAGE_KEY, apiKey); updateApiKeyUI(true); loadHomepageContent(); setTimeout(closeSettings, 500); } });
editApiKeyBtn.addEventListener('click', () => { apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE_KEY) || ''; updateApiKeyUI(false); });
searchBtn.addEventListener('click', () => handleSearch(false));
searchInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') handleSearch(false); });

deleteAllDataBtn.addEventListener('click', () => {
    if (confirm("ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete your API key, all saved canvases, and all history from this browser. This action cannot be undone.")) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem(CANVAS_STATE_KEY);
        localStorage.removeItem(CLICK_HISTORY_STORAGE_KEY);
        localStorage.removeItem(CANVAS_HISTORY_STORAGE_KEY);
        alert("All data has been deleted. The application will now reload.");
        location.reload();
    }
});

svgLayer.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('connection-hover-target')) {
        const line = e.target;
        uiState.hoverTimeout = setTimeout(() => {
            const connData = JSON.parse(line.dataset.connection);
            uiState.connectionToDelete = connData;
            
            const zoom = parseFloat(panZoomContainer.style.transform.replace('scale(', '')) || 1;
            const x = (parseFloat(line.getAttribute('x1')) + parseFloat(line.getAttribute('x2'))) / 2;
            const y = (parseFloat(line.getAttribute('y1')) + parseFloat(line.getAttribute('y2'))) / 2;
            
            deleteConnectionBtn.style.left = `${(x * zoom) - canvasArea.scrollLeft}px`;
            deleteConnectionBtn.style.top = `${(y * zoom) - canvasArea.scrollTop}px`;
            deleteConnectionBtn.classList.remove('hidden');
        }, 500);
    }
});

svgLayer.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('connection-hover-target')) {
        clearTimeout(uiState.hoverTimeout);
    }
});
deleteConnectionBtn.addEventListener('mouseleave', () => {
    deleteConnectionBtn.classList.add('hidden');
});
deleteConnectionBtn.addEventListener('click', () => {
    if (uiState.connectionToDelete) {
        const queue = getActiveQueue();
        const connStrToDelete = JSON.stringify(uiState.connectionToDelete);
        queue.connections = queue.connections.filter(c => JSON.stringify(c) !== connStrToDelete);
        saveState();
        renderCanvas();
        deleteConnectionBtn.classList.add('hidden');
        uiState.connectionToDelete = null;
    }
});


// --- About Modal Logic ---
aboutBtn.addEventListener('click', () => {
    aboutModalOverlay.classList.remove('hidden');
    aboutModalOverlay.classList.add('flex');
});

aboutModalCloseBtn.addEventListener('click', () => {
    aboutModalOverlay.classList.add('hidden');
    aboutModalOverlay.classList.remove('flex');
});

aboutModalOverlay.addEventListener('click', (e) => {
    if (e.target === aboutModalOverlay) {
        aboutModalOverlay.classList.add('hidden');
        aboutModalOverlay.classList.remove('flex');
    }
});

window.addEventListener('scroll', () => {
    if (uiState.isLoadingMore || !uiState.nextPageToken) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (clientHeight + scrollTop >= scrollHeight - 500) {
        handleSearch(true);
    }
});

document.addEventListener('DOMContentLoaded', () => { 
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY); 
    updateApiKeyUI(!!savedKey); 
    if (savedKey) apiKeyInput.value = savedKey; 

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
    applyTheme(savedTheme);
    
    loadState(); 
    loadClickHistory();
    loadCanvasHistory();
    loadHomepageContent(); 
    refreshFullCanvas(); 
});