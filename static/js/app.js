document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let releaseEntries = [];
    let selectedUpdate = null;
    let activeFilter = 'all';
    let searchQuery = '';
    
    // DOM Elements
    const feedContainer = document.getElementById('feedContainer');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const emptyState = document.getElementById('emptyState');
    
    const btnRefresh = document.getElementById('btnRefresh');
    const btnRetry = document.getElementById('btnRetry');
    const refreshIcon = document.getElementById('refreshIcon');
    const lastUpdatedVal = document.getElementById('lastUpdated');
    
    // Stats Elements
    const statTotal = document.getElementById('statTotal');
    const statFeatures = document.getElementById('statFeatures');
    const statChanges = document.getElementById('statChanges');
    const statBreaking = document.getElementById('statBreaking');
    const statCards = document.querySelectorAll('.stat-card');
    
    // Search & Filter Elements
    const searchInput = document.getElementById('searchInput');
    const filterPills = document.querySelectorAll('.filter-pill');
    const btnClearFilters = document.getElementById('btnClearFilters');
    
    // Tweet Composer Elements
    const composerInputWrapper = document.getElementById('composerInputWrapper');
    const tweetTextarea = document.getElementById('tweetTextarea');
    const charCount = document.getElementById('charCount');
    const hashtagPills = document.querySelectorAll('.tag-pill');
    const btnCopyTweet = document.getElementById('btnCopyTweet');
    const btnSendTweet = document.getElementById('btnSendTweet');
    const statusText = document.getElementById('statusText');
    
    // Toast Alert
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    
    // Initialize
    fetchReleaseNotes();
    
    // Event Listeners
    btnRefresh.addEventListener('click', () => fetchReleaseNotes(true));
    btnRetry.addEventListener('click', () => fetchReleaseNotes(true));
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderFeed();
    });
    
    // Filter Pills
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.getAttribute('data-filter');
            renderFeed();
        });
    });
    
    // Clicking Stat Cards also Filters Feed
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.getAttribute('data-filter');
            let targetPill;
            
            if (filterType === 'all') {
                targetPill = document.querySelector('.filter-pill[data-filter="all"]');
            } else if (filterType === 'feature') {
                targetPill = document.querySelector('.filter-pill[data-filter="Feature"]');
            } else if (filterType === 'change') {
                targetPill = document.querySelector('.filter-pill[data-filter="Change"]');
            } else if (filterType === 'breaking') {
                targetPill = document.querySelector('.filter-pill[data-filter="Breaking"]');
            }
            
            if (targetPill) {
                targetPill.click();
            }
        });
    });
    
    btnClearFilters.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        const allPill = document.querySelector('.filter-pill[data-filter="all"]');
        if (allPill) allPill.click();
    });
    
    // Tweet Composer Input changes
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Hashtag toggles
    hashtagPills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (!selectedUpdate) return;
            pill.classList.toggle('active');
            recomposeTweet();
        });
    });
    
    btnCopyTweet.addEventListener('click', copyTweetToClipboard);
    btnSendTweet.addEventListener('click', sendTweetToX);

    // API Call: Fetch Data
    async function fetchReleaseNotes(refresh = false) {
        setLoading(true);
        setStatus('Syncing feed from Google Cloud...', 'syncing');
        
        try {
            const response = await fetch(`/api/updates?refresh=${refresh}`);
            const result = await response.json();
            
            if (response.ok && result.status !== 'error') {
                releaseEntries = result.data || [];
                lastUpdatedVal.textContent = result.last_updated || 'Just now';
                
                // If it is a fallback due to error
                if (result.status === 'fallback') {
                    showToast('Sync failed; loaded from local cache.', 'warning');
                    setStatus('Sync failed (offline fallback)', 'offline');
                } else {
                    showToast(refresh ? 'Release feed synchronized!' : 'Release notes loaded.', 'success');
                    setStatus('System Online', 'online');
                }
                
                calculateStats();
                renderFeed();
            } else {
                throw new Error(result.error || 'Unknown server error');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showError(error.message);
            setStatus('Connection Error', 'error');
        } finally {
            setLoading(false);
        }
    }

    // Helper functions for Loading, Error states
    function setLoading(isLoading) {
        if (isLoading) {
            loadingState.classList.remove('hidden');
            feedContainer.classList.add('hidden');
            errorState.classList.add('hidden');
            emptyState.classList.add('hidden');
            refreshIcon.classList.add('anim-spin');
            btnRefresh.disabled = true;
        } else {
            loadingState.classList.add('hidden');
            feedContainer.classList.remove('hidden');
            refreshIcon.classList.remove('anim-spin');
            btnRefresh.disabled = false;
        }
    }
    
    function showError(message) {
        loadingState.classList.add('hidden');
        feedContainer.classList.add('hidden');
        errorState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        errorMessage.textContent = message || 'Could not retrieve data from the Flask API server.';
    }
    
    function setStatus(text, state) {
        statusText.textContent = text;
        const dot = document.querySelector('.status-dot');
        dot.style.background = '#10B981'; // Green
        dot.style.boxShadow = '0 0 8px #10B981';
        
        if (state === 'syncing') {
            dot.style.background = '#3B82F6'; // Blue
            dot.style.boxShadow = '0 0 8px #3B82F6';
        } else if (state === 'error' || state === 'offline') {
            dot.style.background = '#EF4444'; // Red
            dot.style.boxShadow = '0 0 8px #EF4444';
        }
    }

    // Process & Display statistics
    function calculateStats() {
        let total = 0;
        let features = 0;
        let changes = 0;
        let breaking = 0;
        
        releaseEntries.forEach(entry => {
            entry.updates.forEach(update => {
                total++;
                if (update.type === 'Feature') features++;
                else if (update.type === 'Change') changes++;
                else if (update.type === 'Breaking' || update.type === 'Issue') breaking++;
            });
        });
        
        statTotal.textContent = total;
        statFeatures.textContent = features;
        statChanges.textContent = changes;
        statBreaking.textContent = breaking;
    }

    // Render Feed based on Search/Filter
    function renderFeed() {
        feedContainer.innerHTML = '';
        let matchCount = 0;
        
        releaseEntries.forEach(entry => {
            const date = entry.date;
            const link = entry.link;
            
            // Filter the updates in this entry
            const filteredUpdates = entry.updates.filter(update => {
                // Category Filter
                // Note: stat cards filter 'breaking' matches both 'Breaking' and 'Issue'
                const matchCategory = 
                    activeFilter === 'all' || 
                    update.type === activeFilter ||
                    (activeFilter === 'Breaking' && (update.type === 'Breaking' || update.type === 'Issue')) ||
                    (activeFilter === 'Issue' && (update.type === 'Breaking' || update.type === 'Issue'));
                
                // Search query filter
                const matchSearch = 
                    !searchQuery || 
                    update.plain_text.toLowerCase().includes(searchQuery) || 
                    update.type.toLowerCase().includes(searchQuery) ||
                    date.toLowerCase().includes(searchQuery);
                    
                return matchCategory && matchSearch;
            });
            
            if (filteredUpdates.length > 0) {
                matchCount += filteredUpdates.length;
                
                // Create Date Group Element
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                
                // Date Header
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.innerHTML = `
                    <span>${date}</span>
                    <a href="${link}" target="_blank" class="date-anchor-link" title="Open official release notes">
                        <span>Original notes</span>
                        <i data-lucide="external-link"></i>
                    </a>
                `;
                dateGroup.appendChild(dateHeader);
                
                // Updates List for this date
                const updatesList = document.createElement('div');
                updatesList.className = 'updates-list';
                
                filteredUpdates.forEach(update => {
                    const card = document.createElement('div');
                    card.className = `update-card glass-panel`;
                    if (selectedUpdate && selectedUpdate.id === update.id) {
                        card.classList.add('selected');
                    }
                    card.setAttribute('data-id', update.id);
                    card.setAttribute('data-type', update.type);
                    
                    const isSelected = selectedUpdate && selectedUpdate.id === update.id;
                    
                    card.innerHTML = `
                        <div class="card-header">
                            <div class="card-meta-left">
                                <span class="type-pill ${update.type.toLowerCase()}">${update.type}</span>
                            </div>
                            <button class="btn-select-share">
                                <i data-lucide="${isSelected ? 'check' : 'twitter'}"></i>
                                <span>${isSelected ? 'Selected' : 'Select to Tweet'}</span>
                            </button>
                        </div>
                        <div class="card-body">
                            ${update.body}
                        </div>
                    `;
                    
                    // Add click event to card
                    card.addEventListener('click', (e) => {
                        // Avoid triggering if they click inside links directly (let them open links)
                        if (e.target.tagName === 'A' || e.target.closest('a')) {
                            return;
                        }
                        selectUpdate(update, date, link);
                    });
                    
                    updatesList.appendChild(card);
                });
                
                dateGroup.appendChild(updatesList);
                feedContainer.appendChild(dateGroup);
            }
        });
        
        // Re-draw lucide icons inside generated feed
        lucide.createIcons();
        
        // Show empty state if no entries matched
        if (matchCount === 0) {
            emptyState.classList.remove('hidden');
            feedContainer.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            feedContainer.classList.remove('hidden');
        }
    }

    // Select Update for Tweeting
    function selectUpdate(update, date, link) {
        selectedUpdate = {
            id: update.id,
            type: update.type,
            plain_text: update.plain_text,
            date: date,
            link: link
        };
        
        // Update selection UI classes
        const cards = document.querySelectorAll('.update-card');
        cards.forEach(c => {
            c.classList.remove('selected');
            const btn = c.querySelector('.btn-select-share span');
            const icon = c.querySelector('.btn-select-share i');
            if (btn) btn.textContent = 'Select to Tweet';
            if (icon) {
                icon.setAttribute('data-lucide', 'twitter');
            }
        });
        
        const selectedCard = document.querySelector(`.update-card[data-id="${update.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const btn = selectedCard.querySelector('.btn-select-share span');
            const icon = selectedCard.querySelector('.btn-select-share i');
            if (btn) btn.textContent = 'Selected';
            if (icon) {
                icon.setAttribute('data-lucide', 'check');
            }
            lucide.createIcons();
        }
        
        // Enable composer
        composerInputWrapper.classList.remove('disabled');
        tweetTextarea.disabled = false;
        btnCopyTweet.disabled = false;
        btnSendTweet.disabled = false;
        
        recomposeTweet();
        showToast('Update selected! Composer ready.', 'success');
    }

    // Recompose Tweet based on selected update and active tags
    function recomposeTweet() {
        if (!selectedUpdate) return;
        
        const typeEmoji = selectedUpdate.type === 'Feature' ? '🚀' :
                          selectedUpdate.type === 'Change' ? '🔄' :
                          selectedUpdate.type === 'Breaking' ? '⚠️' :
                          selectedUpdate.type === 'Issue' ? '🐛' : '📢';
                          
        const dateStr = selectedUpdate.date;
        let bodyText = selectedUpdate.plain_text;
        
        // Base structure
        // Emoji [Date] [Type]
        const header = `${typeEmoji} Google Cloud BigQuery (${dateStr}): `;
        
        // Active hashtags
        const activeTags = [];
        hashtagPills.forEach(pill => {
            if (pill.classList.contains('active')) {
                activeTags.push(pill.getAttribute('data-tag'));
            }
        });
        const tagsStr = activeTags.length > 0 ? '\n\n' + activeTags.join(' ') : '';
        
        // Max space for body: 280 - header length - tags length - 24 (X link wrapping length)
        const maxBodyLen = 280 - header.length - tagsStr.length - 24;
        
        if (bodyText.length > maxBodyLen) {
            bodyText = bodyText.substring(0, maxBodyLen - 3) + '...';
        }
        
        // Construct full text
        const tweetText = `${header}${bodyText}${tagsStr}`;
        tweetTextarea.value = tweetText;
        updateCharCount();
    }

    // Update character limit counter
    function updateCharCount() {
        const len = tweetTextarea.value.length;
        charCount.textContent = `${len} / 280`;
        
        charCount.classList.remove('warning', 'error');
        btnSendTweet.disabled = false;
        
        if (len > 250 && len <= 280) {
            charCount.classList.add('warning');
        } else if (len > 280) {
            charCount.classList.add('error');
            btnSendTweet.disabled = true;
        }
        
        if (len === 0) {
            btnCopyTweet.disabled = true;
            btnSendTweet.disabled = true;
        } else {
            btnCopyTweet.disabled = false;
        }
    }

    // Action: Copy composed tweet text
    async function copyTweetToClipboard() {
        const text = tweetTextarea.value;
        if (!text) return;
        
        try {
            await navigator.clipboard.writeText(text);
            showToast('Tweet text copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback selection copy
            tweetTextarea.select();
            document.execCommand('copy');
            showToast('Text selected! Copy using Ctrl+C.', 'info');
        }
    }

    // Action: Open Twitter / X Share Intent
    function sendTweetToX() {
        const text = tweetTextarea.value;
        if (!text) return;
        
        // Add URL parameter if selectedUpdate link is available
        const url = selectedUpdate ? selectedUpdate.link : '';
        
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(xUrl, '_blank', 'width=550,height=420');
        showToast('Opening Twitter / X share composer...', 'success');
    }

    // Action Toast Notifications
    let toastTimeout;
    function showToast(msg, type = 'success') {
        clearTimeout(toastTimeout);
        toastMsg.textContent = msg;
        
        const icon = document.getElementById('toastIcon');
        icon.className = ''; // Reset
        
        if (type === 'success') {
            icon.setAttribute('data-lucide', 'check-circle');
            toast.style.borderColor = 'var(--color-feature)';
        } else if (type === 'warning') {
            icon.setAttribute('data-lucide', 'alert-triangle');
            toast.style.borderColor = '#FBBF24';
        } else if (type === 'info') {
            icon.setAttribute('data-lucide', 'info');
            toast.style.borderColor = 'var(--accent-secondary)';
        }
        
        lucide.createIcons();
        
        toast.classList.remove('hidden');
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }
});
