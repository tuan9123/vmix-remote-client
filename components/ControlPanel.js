import { useVmixStore } from '../stores/vmixStore.js';

const { ref, computed, onMounted, onUnmounted } = Vue;

export default {
  name: 'ControlPanel',
  props: {
    recording:       { type: Boolean, default: false },
    recordingPaused: { type: Boolean, default: false },
    streaming:       { type: Boolean, default: false },
    ftb:             { type: Boolean, default: false },
    previewInput:    { type: Object,  default: null }
  },
  emits: ['command'],
  template: `
    <div class="master-controls">

      <!-- ── Row 1: Transition buttons + Speed ── -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <!-- Transitions grid -->
        <div class="control-row control-row-transitions" style="flex: 1;">
          <button class="btn btn-ctrl btn-primary" @click="sendCmd('cut')">CUT</button>
          <button class="btn btn-ctrl btn-danger"  @click="sendCmd('auto')">AUTO</button>
          <button class="btn btn-ctrl"             @click="sendCmd('fade')">FADE</button>
          <button class="btn btn-ctrl"
            :disabled="!previewInput"
            @click="sendCmd('quickPlay', { id: previewInput?.key })"
            title="Phát nhanh nguồn Preview"
          >QUICK</button>
          <button class="btn btn-ctrl"
            @click="sendCmd('ftb')"
            :style="{
              background: ftb ? 'linear-gradient(135deg,#ff2d3f,#ff6b35)' : 'rgba(255,45,63,0.08)',
              color: ftb ? '#fff' : 'var(--program-color)',
              borderColor: ftb ? 'transparent' : 'rgba(255,45,63,0.25)',
              boxShadow: ftb ? '0 0 18px rgba(255,45,63,0.55)' : 'none',
              fontWeight: 'bold'
            }"
          >FTB</button>
        </div>

        <!-- Speed selector -->
        <div class="speed-row">
          <span class="speed-label">⚡ AUTO:</span>
          <div class="speed-btns">
            <button v-for="ms in [250, 500, 1000, 2000]" :key="ms"
              class="btn btn-speed"
              @click="setSpeed(ms)"
              :style="{
                background: speed === ms ? 'var(--active-blue)' : 'var(--card-bg)',
                color: speed === ms ? '#fff' : 'var(--text-sub)',
                borderColor: speed === ms ? 'var(--active-blue)' : 'var(--border-color)',
                boxShadow: speed === ms ? '0 0 8px var(--active-blue-glow)' : 'none',
                fontWeight: speed === ms ? '700' : '500'
              }"
            >{{ ms >= 1000 ? (ms/1000)+'s' : ms+'ms' }}</button>
          </div>
        </div>
      </div>

      <!-- ── Row 2: Overlay buttons ── -->
      <div>
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-sub); margin-bottom: 6px;">Overlay Layers</div>
        <div class="control-row control-row-overlays">
          <button
            v-for="num in [1, 2, 3, 4]"
            :key="num"
            class="btn btn-ctrl"
            :disabled="!previewInput && !isOverlayActive(num)"
            @click="sendOverlay(num)"
            :style="{
              background: isOverlayActive(num) ? 'rgba(0,120,255,0.2)' : 'var(--card-bg)',
              color: isOverlayActive(num) ? 'var(--active-blue)' : 'var(--text-sub)',
              borderColor: isOverlayActive(num) ? 'rgba(0,120,255,0.5)' : 'var(--border-color)',
              boxShadow: isOverlayActive(num) ? '0 0 10px rgba(0,120,255,0.3)' : 'none',
              fontWeight: isOverlayActive(num) ? 'bold' : '500',
              fontSize: '11px'
            }"
          >
            OV {{ num }}
            <span v-if="isOverlayActive(num)" style="font-size: 8px; opacity: 0.8;">#{{ getOverlayInputNumber(num) }}</span>
          </button>
        </div>
      </div>

      <!-- ── Row 3: REC + STREAM ── -->
      <div class="control-row control-row-rec-stream">

        <!-- Recording -->
        <button class="btn btn-ctrl"
          @click="recording ? sendCmd('recordStop') : sendCmd('recordStart')"
          :style="{
            background: recording ? 'linear-gradient(135deg, #ff2d3f, #c01523)' : 'rgba(255,45,63,0.08)',
            color: recording ? '#fff' : 'var(--program-color)',
            borderColor: recording ? 'transparent' : 'rgba(255,45,63,0.2)',
            boxShadow: recording ? '0 0 16px rgba(255,45,63,0.4)' : 'none',
            animation: recording ? 'recPulse 1.8s infinite' : 'none',
            display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center'
          }"
        >
          <span :style="{ color: recording ? '#fff' : 'var(--program-color)' }">🔴</span>
          <span>{{ recording ? 'REC ' + recordingDuration : 'REC START' }}</span>
        </button>

        <!-- Streaming -->
        <button class="btn btn-ctrl"
          @click="streaming ? sendCmd('streamStop') : sendCmd('streamStart')"
          :style="{
            background: streaming ? 'linear-gradient(135deg, #0078ff, #00c4ff)' : 'rgba(0,120,255,0.08)',
            color: streaming ? '#fff' : 'var(--active-blue)',
            borderColor: streaming ? 'transparent' : 'rgba(0,120,255,0.2)',
            boxShadow: streaming ? '0 0 16px rgba(0,120,255,0.4)' : 'none',
            animation: streaming ? 'recPulse 1.8s infinite' : 'none'
          }"
        >
          <span>📡</span>
          <span>{{ streaming ? 'STREAMING...' : 'STREAM START' }}</span>
        </button>
      </div>

    </div>
  `,
  setup(props, { emit }) {
    const vmixStore = useVmixStore();
    const speed = ref(1000);

    // Recording duration timer
    const recSeconds = ref(0);
    let recTimer = null;

    const recordingDuration = computed(() => {
      const s = recSeconds.value;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return h > 0
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
        : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    });

    // Watch recording state to start/stop timer
    const { watch } = Vue;
    watch(() => props.recording, (isRec) => {
      if (isRec) {
        recSeconds.value = 0;
        recTimer = setInterval(() => { recSeconds.value++; }, 1000);
      } else {
        clearInterval(recTimer);
        recSeconds.value = 0;
      }
    });

    onUnmounted(() => { clearInterval(recTimer); });

    const triggerVibe = () => { if (navigator.vibrate) navigator.vibrate(30); };

    const sendCmd = (action, params = {}) => {
      triggerVibe();
      emit('command', { action, params });
    };

    const sendOverlay = (number) => {
      triggerVibe();
      const activeInputNumber = vmixStore.overlays[number];
      let targetKey = props.previewInput?.key;
      if (activeInputNumber) {
        const activeInput = vmixStore.inputs.find(inp => inp.number === activeInputNumber);
        if (activeInput) targetKey = activeInput.key;
      }
      if (!targetKey) return;
      emit('command', { action: 'overlay', params: { id: targetKey, number } });
    };

    const isOverlayActive = (num) => vmixStore.overlays[num] !== null;
    const getOverlayInputNumber = (num) => vmixStore.overlays[num];

    const setSpeed = (ms) => {
      triggerVibe();
      speed.value = ms;
      emit('command', { action: 'vmix-command', params: { action: 'SetTransitionDuration1', value: ms } });
    };

    return { speed, recordingDuration, sendCmd, sendOverlay, isOverlayActive, getOverlayInputNumber, setSpeed };
  }
};
