const { ref, computed, watch, onMounted, onUnmounted } = Vue;
import { useVmixStore } from '../stores/vmixStore.js';

export default {
  name: 'TallyView',
  template: `
    <div :style="tallyStyle" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: fixed; inset: 0; z-index: 9999; transition: background-color 0.15s ease-out; font-family: sans-serif; user-select: none;">
      
      <!-- Tally Main Text Label -->
      <div style="font-size: 84px; font-weight: 900; letter-spacing: 4px; text-shadow: 0 4px 15px rgba(0,0,0,0.6); text-align: center;">
        {{ tallyStatusText }}
      </div>

      <!-- Selected Input Title -->
      <div style="font-size: 22px; font-weight: 700; opacity: 0.85; margin-top: 20px; text-align: center; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        {{ selectedInput ? selectedInput.title : 'Chưa chọn Input' }}
      </div>

      <!-- Config panel bottom -->
      <div style="position: absolute; bottom: 30px; display: flex; flex-direction: column; gap: 8px; align-items: center; background: rgba(0,0,0,0.7); padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 85%; max-width: 320px; backdrop-filter: blur(10px);">
        <label style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #aaa; letter-spacing: 0.8px;">Chọn Nguồn Camera</label>
        
        <select v-model="selectedInputKey" style="width: 100%; height: 36px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; padding: 0 10px; font-size: 14px; outline: none; font-weight: 600;">
          <option value="">-- Click để chọn --</option>
          <option v-for="inp in cameraInputs" :key="inp.key" :value="inp.key">
            #{{ inp.number }} - {{ inp.title }}
          </option>
        </select>

        <div style="display: flex; gap: 15px; margin-top: 5px; font-size: 11px; color: #888;">
          <span>vMix: <strong :style="{ color: connected ? '#00e676' : '#ff3344' }">{{ connected ? 'Live' : 'Mất kết nối' }}</strong></span>
          <span>•</span>
          <a href="#/dashboard" style="color: #0084ff; text-decoration: none; font-weight: 600;">Về Bàn Trộn</a>
        </div>
      </div>

    </div>
  `,
  setup() {
    const vmixStore = useVmixStore();
    const selectedInputKey = ref(localStorage.getItem('vmix_tally_input_key') || '');

    // Save selection
    watch(selectedInputKey, (newVal) => {
      localStorage.setItem('vmix_tally_input_key', newVal);
    });

    const connected = computed(() => vmixStore.connected);

    // Filter only cameras / capture or all inputs for flexibility
    const cameraInputs = computed(() => {
      return vmixStore.inputs;
    });

    const selectedInput = computed(() => {
      return vmixStore.inputs.find(i => i.key === selectedInputKey.value);
    });

    // Determine state
    const isLive = computed(() => selectedInput.value?.isProgram ?? false);
    const isPreview = computed(() => selectedInput.value?.isPreview ?? false);

    // Phone vibration trigger when switching to Live/Program
    watch(isLive, (newLiveState) => {
      if (newLiveState && navigator.vibrate) {
        // Vibrate pattern: 200ms on, 100ms off, 200ms on
        navigator.vibrate([200, 100, 200]);
      }
    });

    // UI Styles based on state
    const tallyStyle = computed(() => {
      if (!connected.value) return { backgroundColor: '#212121', color: '#ff3344' };
      if (!selectedInputKey.value) return { backgroundColor: '#121212', color: '#9e9ea7' };
      if (isLive.value) return { backgroundColor: '#ff2d3f', color: '#ffffff' };
      if (isPreview.value) return { backgroundColor: '#00e676', color: '#000000' };
      return { backgroundColor: '#263238', color: '#eceff1' };
    });

    const tallyStatusText = computed(() => {
      if (!connected.value) return 'MẤT KẾT NỐI';
      if (!selectedInputKey.value) return 'CHỌN NGUỒN';
      if (isLive.value) return 'LIVE (PROGRAM)';
      if (isPreview.value) return 'PREVIEW';
      return 'STANDBY';
    });

    return {
      connected,
      selectedInputKey,
      cameraInputs,
      selectedInput,
      tallyStyle,
      tallyStatusText
    };
  }
};
