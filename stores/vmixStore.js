const { defineStore } = Pinia;

export const useVmixStore = defineStore('vmix', {
  state: () => ({
    connected: false,
    inputs: [],
    activeIndex: null,
    previewIndex: null,
    recording: false,
    streaming: false,
    performance: { cpu: 0, ram: 0, fps: 50 },
    searchQuery: '',
    viewMode: 'grid',
    favorites: [],
    inputOrder: [],
    
    // Poster system
    posters: {}, // inputKey -> filename
    tags: {},    // inputKey -> Array of string tags
    posterSize: 'medium', // 'small' | 'medium' | 'large'
    posterDisplayMode: 'poster-name', // 'icon' | 'poster' | 'poster-name' | 'poster-details'
    posterUpdateTimestamp: Date.now(),
    thumbnailTimestamp: Date.now(),
    overlays: { 1: null, 2: null, 3: null, 4: null },
    ftb: false,
    recordingPaused: false
  }),
  getters: {
    programInput: (state) => {
      return state.inputs.find(inp => inp.isProgram) || null;
    },
    previewInput: (state) => {
      return state.inputs.find(inp => inp.isPreview) || null;
    },
    sortedInputs: (state) => {
      let list = [...state.inputs];

      // 1. Search filter (Name, Type, Tag, Input Number)
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter(inp => {
          const nameMatch = inp.title.toLowerCase().includes(q);
          const typeMatch = inp.type.toLowerCase().includes(q);
          const numMatch = inp.number.toString().includes(q);
          
          const inputTags = state.tags[inp.key] || [];
          const tagMatch = inputTags.some(t => t.toLowerCase().includes(q));

          return nameMatch || typeMatch || numMatch || tagMatch;
        });
      }

      // 2. Sort by custom drag-drop order
      if (state.inputOrder.length > 0) {
        list.sort((a, b) => {
          let idxA = state.inputOrder.indexOf(a.key);
          let idxB = state.inputOrder.indexOf(b.key);
          if (idxA === -1) idxA = 9999;
          if (idxB === -1) idxB = 9999;
          return idxA - idxB;
        });
      }

      // 3. Pin Favorites to the top
      const favsList = list.filter(inp => state.favorites.includes(inp.key));
      const normalsList = list.filter(inp => !state.favorites.includes(inp.key));

      return [...favsList, ...normalsList];
    }
  },
  actions: {
    updateState(stateData) {
      const oldActive = this.activeIndex;
      this.connected = stateData.connected;
      if (stateData.connected) {
        this.inputs = stateData.inputs;
        this.activeIndex = stateData.active;
        this.previewIndex = stateData.preview;
        this.recording = stateData.recording;
        this.recordingPaused = stateData.recordingPaused || false;
        this.streaming = stateData.streaming;
        this.ftb = stateData.ftb || false;
        this.overlays = stateData.overlays || { 1: null, 2: null, 3: null, 4: null };
        if (stateData.perf) {
          this.performance = stateData.perf;
        }
        this.syncOrder();
        
        // Auto trigger AFV automation on Program Switch
        if (this.activeIndex !== oldActive && oldActive !== null) {
          this.handleAfvAutomation(this.activeIndex, oldActive);
        }
      } else {
        this.inputs = [];
        this.activeIndex = null;
        this.previewIndex = null;
        this.recording = false;
        this.recordingPaused = false;
        this.streaming = false;
        this.ftb = false;
        this.overlays = { 1: null, 2: null, 3: null, 4: null };
      }
    },
    handleAfvAutomation(newActiveIndex, oldActiveIndex) {
      try {
        const stored = localStorage.getItem('vmix_audio_afv') || '[]';
        const afvKeys = JSON.parse(stored);
        if (afvKeys.length === 0) return;

        const newActiveInput = this.inputs.find(inp => inp.number === newActiveIndex);
        
        // 1. If new Program input has AFV active, unmute it
        if (newActiveInput && afvKeys.includes(newActiveInput.key)) {
          if (newActiveInput.muted) {
            window.appSocket.emit('vmix-command', {
              action: 'vmix-command',
              params: { action: 'AudioOn', id: newActiveInput.key }
            });
          }
        }

        // 2. Mute other inputs that have AFV active but are no longer Program
        this.inputs.forEach(inp => {
          if (inp.number !== newActiveIndex && afvKeys.includes(inp.key)) {
            if (!inp.muted) {
              window.appSocket.emit('vmix-command', {
                action: 'vmix-command',
                params: { action: 'AudioOff', id: inp.key }
              });
            }
          }
        });
      } catch (err) {
        console.error('Error in AFV automation:', err);
      }
    },
    async loadPostersMap() {
      try {
        const response = await fetch('/api/posters/map');
        if (response.ok) {
          const data = await response.json();
          this.posters = data.posters || {};
          this.tags = data.tags || {};
        }
      } catch (err) {
        console.error('Failed to load posters map:', err);
      }
    },
    loadLocalPreferences() {
      try {
        const storedFavs = localStorage.getItem('vmix_favorites');
        if (storedFavs) this.favorites = JSON.parse(storedFavs);
        
        const storedOrder = localStorage.getItem('vmix_input_order');
        if (storedOrder) this.inputOrder = JSON.parse(storedOrder);

        const storedView = localStorage.getItem('vmix_view_mode');
        if (storedView) this.viewMode = storedView;

        const storedSize = localStorage.getItem('vmix_poster_size');
        if (storedSize) this.posterSize = storedSize;

        const storedDisplay = localStorage.getItem('vmix_poster_display_mode');
        if (storedDisplay) this.posterDisplayMode = storedDisplay;
      } catch (err) {
        console.error('Error loading local preferences:', err);
      }
    },
    toggleFavorite(key) {
      const idx = this.favorites.indexOf(key);
      if (idx !== -1) {
        this.favorites.splice(idx, 1);
      } else {
        this.favorites.push(key);
      }
      localStorage.setItem('vmix_favorites', JSON.stringify(this.favorites));
    },
    updateInputOrder(sourceKey, targetKey) {
      const workingOrder = [...this.inputOrder];
      const srcIdx = workingOrder.indexOf(sourceKey);
      const tgtIdx = workingOrder.indexOf(targetKey);
      
      if (srcIdx !== -1 && tgtIdx !== -1) {
        const [moved] = workingOrder.splice(srcIdx, 1);
        workingOrder.splice(tgtIdx, 0, moved);
        this.inputOrder = workingOrder;
        localStorage.setItem('vmix_input_order', JSON.stringify(workingOrder));
      }
    },
    syncOrder() {
      if (this.inputs.length === 0) return;
      const currentKeys = this.inputs.map(inp => inp.key);
      let filteredOrder = this.inputOrder.filter(key => currentKeys.includes(key));
      currentKeys.forEach(key => {
        if (!filteredOrder.includes(key)) {
          filteredOrder.push(key);
        }
      });
      this.inputOrder = filteredOrder;
    },
    setViewMode(mode) {
      this.viewMode = mode;
      localStorage.setItem('vmix_view_mode', mode);
    },
    setPosterSize(size) {
      this.posterSize = size;
      localStorage.setItem('vmix_poster_size', size);
    },
    setPosterDisplayMode(mode) {
      this.posterDisplayMode = mode;
      localStorage.setItem('vmix_poster_display_mode', mode);
    },
    setPosterMapping(inputKey, filename) {
      if (filename) {
        this.posters[inputKey] = filename;
      } else {
        delete this.posters[inputKey];
      }
      this.posterUpdateTimestamp = Date.now();
    },
    setInputTags(inputKey, tags) {
      this.tags[inputKey] = tags;
    },
    refreshThumbnails() {
      this.thumbnailTimestamp = Date.now();
    },
    async refreshAllThumbnails() {
      try {
        const resp = await fetch('/api/refresh-thumbnails', { method: 'POST' });
        if (resp.ok) {
          this.thumbnailTimestamp = Date.now();
        }
      } catch (err) {
        console.error('Refresh thumbnails failed:', err);
      }
    }
  }
});
