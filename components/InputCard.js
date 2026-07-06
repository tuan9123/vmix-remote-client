import { useVmixStore } from '../stores/vmixStore.js';

const { ref, computed, watch } = Vue;

export default {
  name: 'InputCard',
  props: {
    input: {
      type: Object,
      required: true
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    viewMode: {
      type: String,
      default: 'grid'
    }
  },
  template: `
    <div 
      class="input-card"
      :class="{ 
        'program': input.isProgram, 
        'preview': input.isPreview,
        'vibrate-active': isShaking,
        'favorite-large': isFavorite && viewMode === 'grid',
        'size-small': cardSize === 'small',
        'size-large': cardSize === 'large',
        'mode-icon': cardDisplayMode === 'icon',
        'mode-poster': cardDisplayMode === 'poster',
        'mode-poster-name': cardDisplayMode === 'poster-name',
        'mode-poster-details': cardDisplayMode === 'poster-details'
      }"
      :draggable="true"
      @click="handleCardClick"
      @dragstart="onDragStart"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @dragend="onDragEnd"
      @contextmenu.prevent="onRightClick"
    >
      <!-- Header Overlay (Star, Number and Status Badge) -->
      <div class="card-header-overlay" v-if="viewMode === 'grid' && cardDisplayMode !== 'icon'">
        <div style="display: flex; align-items: center; gap: 5px;">
          <span class="input-badge">{{ input.number }}</span>
          <span 
            class="status-badge-inline" 
            :class="statusBadgeClass"
            style="font-size: 8px; font-weight: 800; padding: 2px 4px; border-radius: 3px; text-transform: uppercase;"
          >
            {{ statusBadgeText }}
          </span>
        </div>
        <button 
          class="star-btn" 
          :class="{ 'active': isFavorite }" 
          @click.stop="toggleFav"
          title="Yêu thích"
        >
          ★
        </button>
      </div>

      <!-- Thumbnail / Poster Area (Hidden in Icon mode) -->
      <div 
        class="card-aspect-ratio"
        @mousedown="handlePressStart"
        @mouseup="handlePressLeave"
        @mouseleave="handlePressLeave"
        @touchstart="handlePressStart"
        @touchend="handlePressLeave"
        @touchmove="handleTouchMove"
        v-if="cardDisplayMode !== 'icon'"
      >
        <img 
          :src="currentPosterUrl" 
          :alt="input.title" 
          class="card-thumb"
          loading="lazy"
          @error="handleImgError"
          v-if="currentPosterUrl && !imgError"
        />
        
        <div 
          v-else 
          class="card-placeholder"
          style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px;"
        >
          <div v-html="defaultIconSvg"></div>
          <span style="font-size: 8px; color: var(--text-sub); text-transform: uppercase; font-weight: 700;">
            {{ readableTypeName }}
          </span>
        </div>
      </div>

      <!-- Input Details and Action Switchers (Hidden in Poster-only mode) -->
      <div class="card-details" v-if="cardDisplayMode !== 'poster'">
        
        <!-- List View / Icon View metadata prefix -->
        <div v-if="viewMode === 'list' || cardDisplayMode === 'icon'" style="display: flex; align-items: center; gap: 8px; margin-right: 10px;">
          <span class="input-badge">{{ input.number }}</span>
          <span 
            class="status-badge-inline" 
            :class="statusBadgeClass"
            style="font-size: 8px; font-weight: 800; padding: 2px 4px; border-radius: 3px;"
          >
            {{ statusBadgeText }}
          </span>
          <button 
            class="star-btn" 
            :class="{ 'active': isFavorite }" 
            @click.stop="toggleFav"
          >
            ★
          </button>
        </div>

        <!-- Title & description stacked horizontally -->
        <div style="width: 100%; display: flex; flex-direction: column; gap: 4px; min-width: 0;">
          <div class="card-title" :title="input.title" :style="{ fontSize: cardDisplayMode === 'icon' ? '13px' : '10.5px' }" style="width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; margin-bottom: 2px;">
            {{ input.title }}
          </div>
          
          <!-- Overlay controls 1-4 + GO on a separate row -->
          <div class="card-overlay-buttons" style="display: flex; gap: 2px; justify-content: flex-end; width: 100%;" @click.stop v-if="cardDisplayMode !== 'icon'">
            <button 
              v-for="num in [1, 2, 3, 4]" 
              :key="num"
              style="width: 16px; height: 16px; border-radius: 3px; border: 1px solid var(--border-color); font-size: 7.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;"
              :style="{
                background: isOverlayActive(num) ? '#d32f2f' : 'rgba(0,0,0,0.3)',
                color: isOverlayActive(num) ? '#ffffff' : 'var(--text-sub)',
                borderColor: isOverlayActive(num) ? '#d32f2f' : 'var(--border-color)'
              }"
              @click="triggerOverlay(num)"
              :title="'Overlay ' + num"
            >
              {{ num }}
            </button>
            <button 
              style="width: 20px; height: 16px; border-radius: 3px; border: 1px solid #4caf50; background: rgba(76, 175, 80, 0.15); color: #4caf50; font-size: 7.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;"
              @click="triggerQuickPlay"
              title="Phát nhanh nguồn này (Quick Play)"
            >
              GO
            </button>
          </div>
        </div>


        <!-- Metadata & Tags block (Moved below title/overlay row) -->
        <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
          <!-- Metadata details (Visible only in poster-details mode) -->
          <div class="card-metadata" v-if="cardDisplayMode === 'poster-details' || viewMode === 'list' || cardDisplayMode === 'icon'">
            <span class="card-type">{{ readableTypeName }}</span>
            <div class="card-res-fps" v-if="input.resolution || input.fps">
              <span v-if="input.resolution">{{ input.resolution }}</span>
              <span v-if="input.fps">{{ input.fps }} fps</span>
            </div>
          </div>

          <div class="card-tags-list" v-if="inputTags.length > 0" style="display: flex; flex-wrap: wrap; gap: 2px;">
            <span 
              v-for="t in inputTags" 
              :key="t"
              style="font-size: 7px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-sub); padding: 0px 4px; border-radius: 2px;"
            >
              {{ t }}
            </span>
          </div>
        </div>

        <!-- Action Switchers (Visible only in poster-details or list mode) -->
        <div class="card-quick-actions" @click.stop v-if="cardDisplayMode === 'poster-details' || viewMode === 'list'">
          <button class="btn btn-card-ctrl" @click="sendPreview">PRV</button>
          <button class="btn btn-card-ctrl btn-primary" @click="sendCut">CUT</button>
          <button class="btn btn-card-ctrl btn-danger" @click="sendAuto">AUTO</button>
        </div>
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const vmixStore = useVmixStore();
    const imgError = ref(false);
    const isShaking = ref(false);
    
    let pressTimer = null;
    let clickTimeout = null;
    let lastTap = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let isLongPressActive = false;

    // Poster size and display mode binds from Pinia
    const cardSize = computed(() => vmixStore.posterSize);
    const cardDisplayMode = computed(() => vmixStore.posterDisplayMode);

    const currentPosterUrl = ref('');

    const updatePosterUrl = () => {
      imgError.value = false;
      const mapped = vmixStore.posters[props.input.key];
      if (mapped) {
        currentPosterUrl.value = `/posters/${mapped}?t=${vmixStore.posterUpdateTimestamp}`;
      } else {
        currentPosterUrl.value = `/api/thumbnail/${encodeURIComponent(props.input.key)}?t=${vmixStore.thumbnailTimestamp}`;
      }
    };

    watch(() => props.input.key, updatePosterUrl, { immediate: true });
    watch(() => vmixStore.thumbnailTimestamp, () => {
      const mapped = vmixStore.posters[props.input.key];
      if (!mapped) {
        currentPosterUrl.value = `/api/thumbnail/${encodeURIComponent(props.input.key)}?t=${vmixStore.thumbnailTimestamp}`;
      }
    });

    const inputTags = computed(() => {
      return vmixStore.tags[props.input.key] || [];
    });

    const defaultIconSvg = computed(() => {
      const type = (props.input.type || 'default').toLowerCase();
      if (type.includes('camera') || type.includes('capture')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
      }
      if (type.includes('desktop') || type.includes('screen')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#29b6f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
      }
      if (type.includes('browser')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00bcd4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`;
      }
      if (type.includes('video') || type.includes('replay')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ffca28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      }
      if (type.includes('image') || type.includes('photo')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ab47bc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
      }
      if (type.includes('audio') || type.includes('mic')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ec407a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v11"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
      }
      if (type.includes('ndi')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#26a69a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 11 12 7 8 11"/><line x1="12" y1="7" x2="12" y2="15"/></svg>`;
      }
      if (type.includes('title')) {
        return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#e040fb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`;
      }
      return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#90a4ae" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`;
    });

    const readableTypeName = computed(() => {
      const type = (props.input.type || 'default').toLowerCase();
      if (type.includes('camera')) return '📷 Camera';
      if (type.includes('desktop')) return '🖥 Desktop';
      if (type.includes('video')) return '🎬 Video';
      if (type.includes('image') || type.includes('photo')) return '🖼 Image';
      if (type.includes('audio') || type.includes('mic')) return '🎵 Audio';
      if (type.includes('browser')) return '🌐 Browser';
      if (type.includes('title')) return '📄 Title';
      if (type.includes('ndi')) return '📡 NDI';
      return props.input.type || 'Unknown';
    });

    const statusBadgeText = computed(() => {
      if (props.input.state === 'Offline') return 'OFFLINE';
      if (props.input.isProgram) return 'LIVE';
      if (props.input.isPreview) return 'PREVIEW';
      return 'NORMAL';
    });

    const statusBadgeClass = computed(() => {
      if (props.input.state === 'Offline') return 'badge-danger';
      if (props.input.isProgram) return 'badge-program';
      if (props.input.isPreview) return 'badge-preview';
      return 'badge-sub';
    });

    const triggerVibe = (type = 'click') => {
      if (navigator.vibrate) {
        if (type === 'long') {
          navigator.vibrate([60, 40, 60]);
        } else {
          navigator.vibrate(30);
        }
      }
    };

    const toggleFav = () => {
      triggerVibe();
      emit('toggle-favorite', props.input.key);
    };

    const triggerQuickPlay = () => {
      triggerVibe();
      emit('command', { action: 'quickPlay', params: { id: props.input.key } });
    };

    const sendPreview = () => {
      triggerVibe();
      emit('command', { action: 'previewInput', params: { id: props.input.key } });
    };

    const sendCut = () => {
      triggerVibe();
      emit('command', { action: 'activeInput', params: { id: props.input.key } });
    };

    const sendAuto = () => {
      triggerVibe();
      emit('command', { action: 'previewInput', params: { id: props.input.key } });
      setTimeout(() => {
        emit('command', { action: 'auto' });
      }, 50);
    };

    const handlePressStart = (e) => {
      isLongPressActive = false;
      if (e.type === 'touchstart') {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
      pressTimer = setTimeout(() => {
        isLongPressActive = true;
        isShaking.value = true;
        triggerVibe('long');
        setTimeout(() => { isShaking.value = false; }, 300);
        emit('context-menu', props.input);
      }, 650);
    };

    const handleCardClick = (e) => {
      if (pressTimer) clearTimeout(pressTimer);
      if (isLongPressActive) {
        isLongPressActive = false;
        if (e) e.preventDefault();
        return;
      }
      sendPreview();
    };

    const handlePressLeave = () => {
      if (pressTimer) clearTimeout(pressTimer);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const moveX = Math.abs(e.touches[0].clientX - touchStartX);
        const moveY = Math.abs(e.touches[0].clientY - touchStartY);
        if (moveX > 15 || moveY > 15) {
          if (pressTimer) clearTimeout(pressTimer);
        }
      }
    };

    const onRightClick = () => {
      triggerVibe();
      emit('context-menu', props.input);
    };

    const handleImgError = () => {
      const liveUrl = `/api/thumbnail/${encodeURIComponent(props.input.key)}?t=${vmixStore.thumbnailTimestamp}`;
      if (currentPosterUrl.value !== liveUrl) {
        currentPosterUrl.value = liveUrl;
      } else {
        imgError.value = true;
      }
    };

    const onDragStart = (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', props.input.key);
      e.currentTarget.classList.add('dragging');
      emit('drag-start', props.input.key);
    };

    const onDragOver = (e) => {
      e.currentTarget.classList.add('drag-over');
    };

    const onDragLeave = (e) => {
      e.currentTarget.classList.remove('drag-over');
    };

    const onDrop = (e) => {
      e.currentTarget.classList.remove('drag-over');
      const sourceKey = e.dataTransfer.getData('text/plain');
      emit('drag-drop', { sourceKey, targetKey: props.input.key });
    };

    const isOverlayActive = (num) => {
      return vmixStore.overlays[num] === props.input.number;
    };

    const triggerOverlay = (num) => {
      if (navigator.vibrate) navigator.vibrate(20);
      const socket = window.appSocket;
      if (socket && socket.connected) {
        socket.emit('vmix-command', { 
          action: 'overlay', 
          params: { id: props.input.key, number: num } 
        });
      }
    };

    const onDragEnd = (e) => {
      e.currentTarget.classList.remove('dragging');
      emit('drag-end');
    };

    return {
      cardSize,
      cardDisplayMode,
      currentPosterUrl,
      inputTags,
      defaultIconSvg,
      readableTypeName,
      statusBadgeText,
      statusBadgeClass,
      imgError,
      isShaking,
      isOverlayActive,
      triggerOverlay,
      triggerQuickPlay,
      toggleFav,
      sendPreview,
      sendCut,
      sendAuto,
      handlePressStart,
      handleCardClick,
      handlePressLeave,
      handleTouchMove,
      onRightClick,
      handleImgError,
      onDragStart,
      onDragOver,
      onDragLeave,
      onDrop,
      onDragEnd
    };
  }
};
