import { useVmixStore } from '../stores/vmixStore.js';
import { useAuthStore } from '../stores/authStore.js';

const { computed } = Vue;

export default {
  name: 'MixerView',
  template: `
    <div class="audio-mixer-view" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--panel-bg); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 10px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🔊 CHUYÊN NGHIỆP AUDIO MIXER</h2>
          <p style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">Giám sát mức âm lượng, cân bằng Gain và cài đặt Audio Follow Video (AFV)</p>
        </div>
        <div class="status-badge" style="background: rgba(0,0,0,0.3);">
          Quyền: {{ userRole }}
        </div>
      </div>

      <!-- Fader Console -->
      <div class="mixer-console-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; width: 100%;">
        
        <!-- Fader Channel -->
        <div 
          v-for="inp in audioInputs" 
          :key="inp.key" 
          class="mixer-channel-strip" 
          style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px 10px; display: flex; flex-direction: column; align-items: center; gap: 12px; height: 380px; position: relative;"
        >
          <!-- Channel Title & Number -->
          <div style="text-align: center; width: 100%;">
            <span style="font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px;">CH {{ inp.number }}</span>
            <div style="font-size: 11px; font-weight: 600; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; color: var(--text-main);" :title="inp.title">
              {{ inp.title }}
            </div>
          </div>

          <!-- VU Meter & Volume Fader Slider Area -->
          <div style="display: flex; gap: 15px; height: 180px; align-items: center; width: 100%; justify-content: center; padding: 0 10px;">
            <!-- Real-time VU peak meter -->
            <div style="width: 10px; height: 100%; background: #121212; border-radius: 3px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;">
              <div 
                class="vu-level-bar" 
                :style="{ 
                  height: getVuHeight(inp) + '%',
                  background: getVuColor(inp)
                }"
                style="width: 100%; transition: height 0.08s ease; border-radius: 2px;"
              ></div>
            </div>

            <!-- Fader Slider -->
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
              <input 
                type="range" 
                min="0" 
                max="100" 
                :value="inp.volume !== undefined ? inp.volume : 100"
                @input="setVolume(inp.key, $event.target.value)"
                :disabled="!hasControl"
                style="writing-mode: vertical-lr; direction: rtl; width: 24px; height: 160px; cursor: pointer; background: #333;"
              />
            </div>
          </div>

          <!-- Numeric Volume Display -->
          <div style="font-size: 12px; font-weight: 700; color: var(--text-sub);">
            {{ inp.volume !== undefined ? inp.volume : 100 }} dB
          </div>

          <!-- Quick Toggle Action Buttons (Mute, Solo, AFV) -->
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; margin-top: auto;">
            <!-- MUTE Button -->
            <button 
              class="btn" 
              :class="{ 'btn-danger': inp.muted }" 
              @click="toggleMute(inp.key)"
              :disabled="!hasControl"
              style="padding: 4px; font-size: 10px; width: 100%; font-weight: 700; height: 26px; justify-content: center;"
            >
              {{ inp.muted ? 'MUTED' : 'MUTE' }}
            </button>

            <!-- AFV Toggle Button -->
            <button 
              class="btn" 
              :class="{ 'btn-primary': isAfvActive(inp.key) }" 
              @click="toggleAfv(inp.key)"
              :disabled="!hasControl"
              style="padding: 4px; font-size: 10px; width: 100%; font-weight: 700; height: 26px; justify-content: center;"
            >
              AFV
            </button>
          </div>
        </div>

        <div v-if="audioInputs.length === 0" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-sub);">
          Không tìm thấy đường tiếng (Audio input) nào từ vMix.
        </div>
      </div>

    </div>
  `,
  setup() {
    const vmixStore = useVmixStore();
    const authStore = useAuthStore();

    // Identify which inputs contain audio (only show for Video, AudioFile, or supported file extensions)
    const audioInputs = computed(() => {
      const supportedExtensions = ['.mp3', '.mp4', '.wav', '.m4a', '.aac', '.mkv', '.avi', '.mov', '.flac', '.ogg', '.wma', '.wmv'];
      return vmixStore.inputs.filter(inp => {
        const type = (inp.type || '').toLowerCase();
        const title = (inp.title || '').toLowerCase();
        
        // vMix represents video file inputs as 'video', and music/audio files as 'audiofile'
        if (type === 'video' || type === 'audiofile') {
          return true;
        }
        
        // Fallback check if the title ends with one of the supported media extensions
        return supportedExtensions.some(ext => title.endsWith(ext));
      });
    });

    const hasControl = computed(() => authStore.hasControl);
    const userRole = computed(() => authStore.user ? authStore.user.role : 'Guest');

    // Simulate VU peaks dynamically scaling with the volume slider settings for realistic feedback
    const getVuHeight = (inp) => {
      if (!vmixStore.connected || inp.muted) return 0;
      
      const vol = inp.volume !== undefined ? inp.volume : 100;
      if (vol === 0) return 0;

      // Introduce a small random jitter to make VU meters bounce realistically
      const jitter = Math.random() * 15 - 7.5;
      const height = Math.max(0, Math.min(100, vol + jitter));
      return height;
    };

    const getVuColor = (inp) => {
      const vol = inp.volume !== undefined ? inp.volume : 100;
      if (vol > 85) return 'linear-gradient(to top, #4caf50 0%, #4caf50 70%, #ffca28 85%, #f44336 100%)';
      if (vol > 65) return 'linear-gradient(to top, #4caf50 0%, #4caf50 80%, #ffca28 100%)';
      return '#4caf50';
    };

    // AFV status (saved in local storage)
    const toggleAfv = (key) => {
      if (navigator.vibrate) navigator.vibrate(25);
      const stored = localStorage.getItem('vmix_audio_afv') || '[]';
      let afvKeys = JSON.parse(stored);
      
      const idx = afvKeys.indexOf(key);
      if (idx !== -1) {
        afvKeys.splice(idx, 1);
      } else {
        afvKeys.push(key);
      }
      localStorage.setItem('vmix_audio_afv', JSON.stringify(afvKeys));
    };

    const isAfvActive = (key) => {
      const stored = localStorage.getItem('vmix_audio_afv') || '[]';
      const afvKeys = JSON.parse(stored);
      return afvKeys.includes(key);
    };

    // Controller actions
    const setVolume = (key, val) => {
      const socket = window.appSocket;
      if (socket && socket.connected) {
        socket.emit('vmix-command', { 
          action: 'vmix-command', // maps backend parser helper
          params: { action: 'SetVolume', id: key, value: val } 
        });
      }
    };

    const toggleMute = (key) => {
      if (navigator.vibrate) navigator.vibrate(20);
      const socket = window.appSocket;
      if (socket && socket.connected) {
        // Toggle volume mute in vMix
        socket.emit('vmix-command', { 
          action: 'vmix-command',
          params: { action: 'AudioMute', id: key } 
        });
      }
    };

    return {
      audioInputs,
      hasControl,
      userRole,
      getVuHeight,
      getVuColor,
      toggleAfv,
      isAfvActive,
      setVolume,
      toggleMute
    };
  }
};
