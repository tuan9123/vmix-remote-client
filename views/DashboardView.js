import Dashboard from '../components/Dashboard.js';
import ControlPanel from '../components/ControlPanel.js';
import InputCard from '../components/InputCard.js';
import { useAuthStore } from '../stores/authStore.js';
import { useVmixStore } from '../stores/vmixStore.js';

const { ref, computed, watch, onMounted, onUnmounted } = Vue;

export default {
  name: 'DashboardView',
  components: { Dashboard, ControlPanel, InputCard },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">

      <!-- ── TOP BAR: Operator + Perf Stats + Toolbar ── -->
      <div class="operator-bar">
        <div class="operator-status">
          <span>🔒</span>
          <span v-if="operator" style="font-size: 13px;">
            Operator:
            <span class="status-badge" style="background: rgba(255,45,63,0.15); color: var(--program-color); border-color: rgba(255,45,63,0.25); font-weight: 700;">
              {{ operator }} {{ isOperator ? '(Bạn)' : '' }}
            </span>
          </span>
          <span v-else style="font-size: 13px;">
            Operator:
            <span class="status-badge" style="background: rgba(0,230,118,0.1); color: var(--preview-color); border-color: rgba(0,230,118,0.2); font-weight: 700;">
              Multi-control (Chưa khóa)
            </span>
          </span>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;" v-if="!allowMultiOperator">
          <button v-if="!isOperator && (!operator || isAdmin)" class="btn btn-primary" @click="takeControl" style="height: 32px; padding: 0 16px; font-size: 12px;">
            ⚡ Take Control
          </button>
          <button v-if="isOperator" class="btn btn-danger" @click="releaseControl" style="height: 32px; padding: 0 16px; font-size: 12px;">
            🔓 Release Control
          </button>
        </div>

        <!-- Perf Stats inline -->
        <div v-if="connected" style="display: flex; gap: 6px;">
          <div class="status-badge" style="gap: 5px;">
            <span style="color: #4ade80; font-weight: 700;">{{ performance.cpu }}%</span>
            <span style="font-size: 9px; color: var(--text-sub);">CPU</span>
          </div>
          <div class="status-badge" style="gap: 5px;">
            <span style="color: #60a5fa; font-weight: 700;">{{ performance.ram }}%</span>
            <span style="font-size: 9px; color: var(--text-sub);">RAM</span>
          </div>
          <div class="status-badge" style="gap: 5px;">
            <span style="color: #fbbf24; font-weight: 700;">{{ performance.fps }}</span>
            <span style="font-size: 9px; color: var(--text-sub);">FPS</span>
          </div>
          <div class="status-badge" :style="{ color: hasControl ? 'var(--preview-color)' : 'var(--program-color)' }">
            {{ hasControl ? '✅ Có Quyền' : '🔒 Chỉ Xem' }}
          </div>
        </div>
      </div>

      <!-- ── MAIN 2-COLUMN DASHBOARD LAYOUT ── -->
      <div class="dashboard-layout">

        <!-- ════ LEFT PANEL: Monitors + Controls + Countdown ════ -->
        <div class="dashboard-left-panel">

          <!-- Monitors -->
          <div class="panel" style="padding: 12px;">
            <dashboard
              :program-input="programInput"
              :preview-input="previewInput"
              v-model:search-query="searchQuery"
              v-model:view-mode="viewMode"
              :connected="connected"
              @open-settings="openSettings"
            ></dashboard>
          </div>

          <!-- Countdown Timer -->
          <div class="countdown-widget">
            <div>
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-sub); margin-bottom: 4px;">⏱ Bộ đếm ngược</div>
              <div class="countdown-display" :class="countdownClass">{{ countdownDisplay }}</div>
            </div>
            <div class="countdown-controls">
              <div class="countdown-presets">
                <button v-for="sec in [60, 300, 600, 1800, 3600]" :key="sec" class="btn btn-preset" @click="setCountdown(sec)">
                  {{ sec >= 3600 ? (sec/3600)+'h' : sec >= 60 ? (sec/60)+'m' : sec+'s' }}
                </button>
              </div>
              <button class="btn btn-primary" @click="toggleCountdown" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 700;">
                {{ countdownRunning ? '⏸ Dừng' : '▶ Bắt đầu' }}
              </button>
              <button class="btn" @click="resetCountdown" style="height: 30px; padding: 0 10px; font-size: 11px;">↩</button>
            </div>
          </div>

          <!-- Control Panel (Transitions, Overlays, Rec/Stream) -->
          <control-panel
            :recording="recording"
            :recording-paused="recordingPaused"
            :streaming="streaming"
            :ftb="ftb"
            :preview-input="previewInput"
            @command="handleCommand"
          ></control-panel>

        </div><!-- /.dashboard-left-panel -->

        <!-- ════ RIGHT PANEL: Inputs Grid ════ -->
        <div class="dashboard-right-panel">

          <!-- Toolbar: multiview size + compact mode + refresh -->
          <div class="toolbar-row">
            <span class="toolbar-label">Multiview:</span>
            <div class="toolbar-group">
              <button
                v-for="size in [4, 6, 8, 9, 12, 16, 25, 32]"
                :key="size"
                class="btn btn-size"
                :class="{ 'btn-primary': multiviewSize === size }"
                @click="setMultiviewSize(size)"
              >{{ size }}</button>
              <button
                class="btn btn-size"
                :class="{ 'btn-primary': multiviewSize === 999 }"
                @click="setMultiviewSize(999)"
              >Tất Cả</button>
            </div>
            <div class="toolbar-spacer"></div>
            <button
              class="btn"
              @click="toggleMobileCompact"
              :style="{
                background: isMobileCompact ? 'rgba(251,191,36,0.15)' : 'var(--card-bg)',
                borderColor: isMobileCompact ? 'rgba(251,191,36,0.4)' : 'var(--border-color)',
                color: isMobileCompact ? '#fbbf24' : 'var(--text-main)'
              }"
              style="height: 28px; padding: 0 10px; font-size: 11px; font-weight: 700;"
            >
              📌 Yêu thích
            </button>
            <button
              class="btn"
              @click="refreshAllThumbnails"
              :disabled="isRefreshingThumbs"
              style="height: 28px; padding: 0 10px; font-size: 11px; color: #4ade80; border-color: rgba(74,222,128,0.3);"
            >
              <span :style="{ animation: isRefreshingThumbs ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }">🔄</span>
              {{ isRefreshingThumbs ? 'Đang...' : 'Hình ảnh' }}
            </button>
          </div>

          <!-- Search + View toggle -->
          <div class="deck-header panel panel-sm">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-input"
                placeholder="Tìm kiếm input... (Ví dụ: Cam 1)"
                :value="searchQuery"
                @input="e => searchQuery = e.target.value"
              />
            </div>
            <div class="deck-actions">
              <div class="view-toggle">
                <button class="view-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Lưới">⊞</button>
                <button class="view-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="Danh sách">☰</button>
              </div>
            </div>
          </div>

          <!-- Inputs Grid -->
          <div
            class="inputs-grid"
            :class="{ 'list-view': viewMode === 'list' }"
            style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px; box-sizing: border-box;"
          >
            <div v-if="isMobileCompact && flatInputs.length === 0" style="padding: 40px 20px; text-align: center; color: var(--text-sub); width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px;">
              <div style="font-size: 32px;">📌</div>
              <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin: 0;">Chưa có input yêu thích</h4>
              <p style="font-size: 11px; max-width: 280px; margin: 0; line-height: 1.5;">Nhấn ★ trên các thẻ để ghim vào danh sách yêu thích.</p>
            </div>

            <input-card
              v-else
              v-for="inp in flatInputs"
              :key="inp.key"
              :input="inp"
              :is-favorite="favorites.includes(inp.key)"
              :view-mode="viewMode"
              @command="handleCommand"
              @toggle-favorite="toggleFavorite"
              @drag-drop="onDragDrop"
              @context-menu="openContextMenu"
            ></input-card>

            <div v-if="!isMobileCompact && flatInputs.length === 0" style="padding: 48px; color: var(--text-sub); text-align: center; width: 100%; font-size: 13px;">
              Không có nguồn input nào từ vMix.
            </div>
          </div>

        </div><!-- /.dashboard-right-panel -->
      </div><!-- /.dashboard-layout -->

      <!-- ── CONTEXT MENU DRAWER ── -->
      <div class="context-menu-overlay" v-if="selectedInput" @click.self="selectedInput = null">
        <div class="context-menu-body">
          <div class="context-menu-title">
            📺 Input #{{ selectedInput.number }} — {{ selectedInput.title }}
          </div>
          <div class="context-menu-options" :style="{ gridTemplateColumns: selectedInput.textFields ? '1fr 1fr' : '1fr 1fr' }">
            <button class="context-menu-item" v-if="selectedInput.textFields" @click="openTitleEditor" style="grid-column: span 2; background: rgba(0, 120, 255, 0.15); color: var(--active-blue); border: 1px solid rgba(0, 120, 255, 0.25);">✍️ Sửa Text Title</button>
            <button class="context-menu-item" @click="viewPoster">👁 Xem Poster</button>
            <button class="context-menu-item" @click="downloadPoster">📥 Tải Poster</button>
            <button class="context-menu-item" @click="triggerUpload">📁 Upload Ảnh</button>
            <button class="context-menu-item" @click="capturePoster" :disabled="!connected">📷 Chụp vMix</button>
            <button class="context-menu-item" @click="openTagsManager">🏷 Tags</button>
            <button class="context-menu-item" @click="deletePoster" style="background: rgba(255,45,63,0.08); color: var(--program-color);">🗑 Xóa Poster</button>
          </div>
          <input type="file" ref="fileInput" style="display: none;" accept="image/*" @change="onFileSelected" />
          <button class="btn context-menu-cancel" @click="selectedInput = null" style="width: 100%; margin-top: 14px; justify-content: center; height: 40px; font-weight: 700;">Hủy</button>
        </div>
      </div>

      <!-- ── TITLE TEXT EDITOR MODAL ── -->
      <div class="modal-overlay" v-if="editingTitle" @click.self="editingTitle = null">
        <div class="modal-content" style="max-width: 440px; width: 95%;">
          <div class="modal-header">
            <h3>✍️ Sửa Văn Bản Title</h3>
            <button class="modal-close" @click="editingTitle = null">&times;</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px; max-height: 280px; overflow-y: auto; padding-right: 5px;">
            <div v-for="field in titleFields" :key="field.name" class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 700; color: var(--text-sub);">{{ field.name }}</label>
              <input type="text" class="form-input" v-model="field.value" />
            </div>
          </div>
          <div class="modal-footer" style="margin-top: 20px;">
            <button class="btn" @click="editingTitle = null">Hủy</button>
            <button class="btn btn-primary" @click="saveTitleText">💾 Cập nhật</button>
          </div>
        </div>
      </div>


      <!-- ── POSTER EDITOR MODAL ── -->
      <div class="modal-overlay" v-if="editingImage" @click.self="editingImage = null">
        <div class="modal-content" style="max-width: 480px; width: 95%;">
          <div class="modal-header">
            <h3>🖼 Chỉnh sửa Poster</h3>
            <button class="modal-close" @click="editingImage = null">&times;</button>
          </div>
          <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
            <img :src="editImageSrc"
              :style="{ transform: 'rotate(' + editRotate + 'deg) scale(' + editZoom + ')', filter: 'brightness(' + editBrightness + '%) contrast(' + editContrast + '%)' }"
              style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Zoom: {{ editZoom }}x</label>
              <input type="range" min="1" max="4" step="0.1" v-model.number="editZoom" style="width: 100%;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Xoay: {{ editRotate }}°</label>
              <input type="range" min="0" max="270" step="90" v-model.number="editRotate" style="width: 100%;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Độ sáng: {{ editBrightness }}%</label>
              <input type="range" min="50" max="150" step="5" v-model.number="editBrightness" style="width: 100%;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Tương phản: {{ editContrast }}%</label>
              <input type="range" min="50" max="150" step="5" v-model.number="editContrast" style="width: 100%;" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="editingImage = null">Hủy</button>
            <button class="btn btn-primary" @click="applyImageEdits">💾 Lưu Poster</button>
          </div>
        </div>
      </div>

      <!-- ── TAGS MANAGER MODAL ── -->
      <div class="modal-overlay" v-if="taggingInput" @click.self="taggingInput = null">
        <div class="modal-content" style="max-width: 400px; width: 90%;">
          <div class="modal-header">
            <h3>🏷 Gán Tags</h3>
            <button class="modal-close" @click="taggingInput = null">&times;</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
            <label v-for="tag in availableTags" :key="tag"
              style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.02); padding: 9px; border-radius: 6px; border: 1px solid var(--border-color);">
              <input type="checkbox" :value="tag" v-model="selectedTags" />
              {{ tag }}
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn" @click="taggingInput = null">Hủy</button>
            <button class="btn btn-primary" @click="saveTags">Lưu Tags</button>
          </div>
        </div>
      </div>

      <!-- ── LIGHTBOX POSTER ── -->
      <div class="modal-overlay" v-if="lightboxPosterUrl" @click.self="lightboxPosterUrl = null">
        <div style="max-width: 85vw; max-height: 85vh; position: relative;">
          <img :src="lightboxPosterUrl" style="max-width: 100%; max-height: 85vh; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.9); display: block;" />
          <button @click="lightboxPosterUrl = null"
            style="position: absolute; top: -14px; right: -14px; background: var(--program-color); border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            &times;
          </button>
        </div>
      </div>

    </div>
  `,
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const vmixStore = useVmixStore();
    const router = VueRouter.useRouter();

    // ── State ──
    const multiviewSize = ref(999);
    const selectedInput = ref(null);
    const fileInput = ref(null);
    const availableTags = ['Camera', 'Stage', 'Pastor', 'Band', 'Media', 'Remote', 'Audio', 'Replay', 'Logo', 'Sponsor', 'Lower Third'];
    const taggingInput = ref(null);
    const selectedTags = ref([]);
    const lightboxPosterUrl = ref(null);
    const editingImage = ref(false);
    const editImageSrc = ref('');
    const editFileName = ref('');
    const editZoom = ref(1.0);
    const editRotate = ref(0);
    const editBrightness = ref(100);
    const editContrast = ref(100);
    const isMobileCompact = ref(localStorage.getItem('vmix_mobile_compact') === 'true');
    const isRefreshingThumbs = ref(false);

    // ── Countdown Timer ──
    const countdownTotal = ref(0);
    const countdownLeft  = ref(0);
    const countdownRunning = ref(false);
    let countdownTimer = null;

    const countdownDisplay = computed(() => {
      const s = countdownLeft.value;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
      return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    });

    const countdownClass = computed(() => {
      if (countdownLeft.value === 0 && countdownTotal.value > 0) return 'done';
      if (countdownLeft.value <= 30 && countdownRunning.value) return 'danger';
      if (countdownLeft.value <= 60 && countdownRunning.value) return 'warning';
      return '';
    });

    const setCountdown = (sec) => {
      clearInterval(countdownTimer);
      countdownRunning.value = false;
      countdownTotal.value = sec;
      countdownLeft.value = sec;
    };

    const toggleCountdown = () => {
      if (countdownTotal.value === 0) return;
      if (countdownRunning.value) {
        clearInterval(countdownTimer);
        countdownRunning.value = false;
      } else {
        if (countdownLeft.value === 0) countdownLeft.value = countdownTotal.value;
        countdownRunning.value = true;
        countdownTimer = setInterval(() => {
          if (countdownLeft.value > 0) {
            countdownLeft.value--;
          } else {
            clearInterval(countdownTimer);
            countdownRunning.value = false;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          }
        }, 1000);
      }
    };

    const resetCountdown = () => {
      clearInterval(countdownTimer);
      countdownRunning.value = false;
      countdownLeft.value = countdownTotal.value;
    };

    onUnmounted(() => { clearInterval(countdownTimer); });

    // ── Camera offline alarm ──
    const playAlarmSound = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (err) { /* ignore */ }
    };

    watch(() => vmixStore.inputs, (newInputs, oldInputs) => {
      newInputs.forEach(inp => {
        if (inp.type === 'Camera' || inp.type === 'Capture') {
          const oldInp = oldInputs?.find(oi => oi.key === inp.key);
          if (inp.state === 'Offline' && (!oldInp || oldInp.state !== 'Offline')) {
            playAlarmSound();
          }
        }
      });
    }, { deep: true });

    // ── Smart Audio Matrix Watcher ──
    watch(() => vmixStore.programInput, (newProgramInput) => {
      if (newProgramInput && localStorage.getItem('vmix_smart_audio_matrix') === 'true') {
        console.log(`[Smart Audio Matrix] Automatically triggering AudioOn for input: ${newProgramInput.title}`);
        handleCommand({
          action: 'vmix-command',
          params: { action: 'AudioOn', id: newProgramInput.key }
        });
      }
    });


    // ── Operator ──
    const takeControl = () => window.appSocket.emit('take-control');
    const releaseControl = () => window.appSocket.emit('release-control');

    // ── Commands ──
    const handleCommand = (cmd) => {
      if (!authStore.hasControl) {
        alert('Bạn không có quyền điều khiển.');
        return;
      }
      window.appSocket.emit('vmix-command', cmd);
    };

    // ── Inputs ──
    const flatInputs = computed(() => {
      let list = vmixStore.sortedInputs;
      if (isMobileCompact.value) return list.filter(inp => vmixStore.favorites.includes(inp.key));
      if (multiviewSize.value !== 999) return list.slice(0, multiviewSize.value);
      return list;
    });

    const setMultiviewSize = (size) => {
      if (navigator.vibrate) navigator.vibrate(15);
      multiviewSize.value = size;
    };

    const toggleMobileCompact = () => {
      isMobileCompact.value = !isMobileCompact.value;
      localStorage.setItem('vmix_mobile_compact', String(isMobileCompact.value));
    };

    const refreshAllThumbnails = async () => {
      if (isRefreshingThumbs.value) return;
      isRefreshingThumbs.value = true;
      try { await vmixStore.refreshAllThumbnails(); }
      finally { setTimeout(() => { isRefreshingThumbs.value = false; }, 1500); }
    };

    // ── Poster / Context ──
    const openContextMenu = (inputItem) => { selectedInput.value = inputItem; };
    const triggerUpload = () => { if (fileInput.value) fileInput.value.click(); };

    const onFileSelected = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      editFileName.value = file.name;
      const reader = new FileReader();
      reader.onload = (evt) => {
        editImageSrc.value = evt.target.result;
        editZoom.value = 1.0; editRotate.value = 0; editBrightness.value = 100; editContrast.value = 100;
        selectedInput.value = null;
        editingImage.value = true;
      };
      reader.readAsDataURL(file);
    };

    const applyImageEdits = () => {
      const img = new Image();
      img.src = editImageSrc.value;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 640; canvas.height = 360;
        ctx.clearRect(0, 0, 640, 360);
        ctx.filter = `brightness(${editBrightness.value}%) contrast(${editContrast.value}%)`;
        ctx.translate(320, 180);
        ctx.rotate((editRotate.value * Math.PI) / 180);
        ctx.scale(editZoom.value, editZoom.value);
        const ratio = Math.max(640 / img.width, 360 / img.height);
        ctx.drawImage(img, -(img.width * ratio) / 2, -(img.height * ratio) / 2, img.width * ratio, img.height * ratio);
        uploadPosterBase64(canvas.toDataURL('image/jpeg', 0.85));
      };
    };

    const uploadPosterBase64 = async (base64Data) => {
      const key = selectedInput.value?.key || taggingInput.value?.key;
      if (!key) { alert('Không tìm thấy Input key.'); return; }
      try {
        const res = await fetch('/api/posters/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputKey: key, fileName: editFileName.value, base64Data })
        });
        if (res.ok) { editingImage.value = false; selectedInput.value = null; }
        else { const e = await res.json(); alert('Upload thất bại: ' + e.message); }
      } catch (err) { alert('Lỗi upload: ' + err.message); }
    };

    const deletePoster = async () => {
      if (!selectedInput.value || !confirm('Xóa poster của input này?')) return;
      try {
        await fetch('/api/posters/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputKey: selectedInput.value.key }) });
        selectedInput.value = null;
      } catch (err) { alert('Xóa thất bại: ' + err.message); }
    };

    const capturePoster = async () => {
      if (!selectedInput.value) return;
      try {
        const res = await fetch('/api/posters/capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputKey: selectedInput.value.key }) });
        if (res.ok) selectedInput.value = null;
        else alert('Chụp vMix thất bại.');
      } catch (err) { alert('Lỗi chụp: ' + err.message); }
    };

    const viewPoster = () => {
      if (!selectedInput.value) return;
      const mapped = vmixStore.posters[selectedInput.value.key];
      if (mapped) lightboxPosterUrl.value = `/posters/${mapped}?t=${Date.now()}`;
      else alert('Chưa có poster cho input này.');
    };

    const downloadPoster = () => {
      if (!selectedInput.value) return;
      const mapped = vmixStore.posters[selectedInput.value.key];
      if (mapped) {
        const a = document.createElement('a');
        a.href = `/posters/${mapped}`;
        a.download = `${selectedInput.value.title.replace(/[^a-zA-Z0-9]/g, '_')}_poster.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else alert('Không có poster để tải.');
    };

    const openTagsManager = () => {
      if (!selectedInput.value) return;
      taggingInput.value = selectedInput.value;
      selectedTags.value = [...(vmixStore.tags[selectedInput.value.key] || [])];
      selectedInput.value = null;
    };

    const saveTags = async () => {
      if (!taggingInput.value) return;
      try {
        const res = await fetch('/api/posters/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputKey: taggingInput.value.key, tags: selectedTags.value })
        });
        if (res.ok) { vmixStore.setInputTags(taggingInput.value.key, selectedTags.value); taggingInput.value = null; }
      } catch (err) { alert('Lưu tags thất bại.'); }
    };

    // ── Title Text Editor ──
    const editingTitle = ref(false);
    const titleFields = ref([]);
    const activeEditingInputKey = ref(null);

    const openTitleEditor = () => {
      if (!selectedInput.value || !selectedInput.value.textFields) return;
      activeEditingInputKey.value = selectedInput.value.key;
      titleFields.value = selectedInput.value.textFields.map(f => ({ name: f.name, value: f.value }));
      editingTitle.value = true;
      selectedInput.value = null;
    };

    const saveTitleText = () => {
      if (!activeEditingInputKey.value) return;
      titleFields.value.forEach(field => {
        handleCommand({
          action: 'vmix-command',
          params: {
            action: 'SetText',
            id: activeEditingInputKey.value,
            value: field.value,
            SelectedName: field.name
          }
        });
      });
      editingTitle.value = false;
      activeEditingInputKey.value = null;
    };

    // ── View model wrappers ──
    const searchQuery = computed({
      get: () => vmixStore.searchQuery,
      set: (val) => { vmixStore.searchQuery = val; }
    });
    const viewMode = computed({
      get: () => vmixStore.viewMode,
      set: (val) => { vmixStore.setViewMode(val); }
    });

    const toggleFavorite = (key) => vmixStore.toggleFavorite(key);
    const onDragDrop = (payload) => vmixStore.updateInputOrder(payload.sourceKey, payload.targetKey);
    const openSettings = () => router.push('/settings');

    return {
      connected: computed(() => vmixStore.connected),
      programInput: computed(() => vmixStore.programInput),
      previewInput: computed(() => vmixStore.previewInput),
      recording: computed(() => vmixStore.recording),
      recordingPaused: computed(() => vmixStore.recordingPaused),
      streaming: computed(() => vmixStore.streaming),
      ftb: computed(() => vmixStore.ftb),
      performance: computed(() => vmixStore.performance),
      favorites: computed(() => vmixStore.favorites),
      operator: computed(() => authStore.operator),
      isOperator: computed(() => authStore.isOperator),
      allowMultiOperator: computed(() => window.allowMultiOperator),
      isAdmin: computed(() => authStore.isAdmin),
      hasControl: computed(() => authStore.hasControl),
      searchQuery, viewMode, multiviewSize, flatInputs,
      selectedInput, fileInput, availableTags, taggingInput, selectedTags, lightboxPosterUrl,
      editingImage, editImageSrc, editZoom, editRotate, editBrightness, editContrast,
      // title editor
      editingTitle, titleFields, openTitleEditor, saveTitleText,
      // countdown
      countdownDisplay, countdownClass, countdownRunning,
      setCountdown, toggleCountdown, resetCountdown,
      // actions
      takeControl, releaseControl, handleCommand,
      setMultiviewSize, toggleFavorite, onDragDrop, openSettings,
      isMobileCompact, toggleMobileCompact,
      isRefreshingThumbs, refreshAllThumbnails,
      openContextMenu, triggerUpload, onFileSelected, applyImageEdits,
      deletePoster, capturePoster, viewPoster, downloadPoster,
      openTagsManager, saveTags
    };

  }
};
