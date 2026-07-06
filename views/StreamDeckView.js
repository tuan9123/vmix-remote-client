const { ref, onMounted } = Vue;

export default {
  name: 'StreamDeckView',
  template: `
    <div class="stream-deck-view" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
      
      <!-- View Title & Quick Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--panel-bg); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 10px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🖥️ STREAM DECK MODE</h2>
          <p style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">Cấu hình phím bấm điều khiển nhanh macro/phím cảnh</p>
        </div>
        <button class="btn btn-primary" @click="resetDeck">
          Reset Mặc Định
        </button>
      </div>

      <!-- Main Deck Grid Workspace -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; width: 100%;">
        <div 
          v-for="(btn, idx) in buttons" 
          :key="idx"
          class="deck-key-btn"
          :style="{ 
            background: btn.color || 'var(--card-bg)',
            border: '2px solid ' + (btn.active ? 'var(--program-color)' : 'var(--border-color)'),
            boxShadow: btn.active ? '0 0 10px var(--program-glow)' : 'none'
          }"
          @click="executeKey(btn)"
          @contextmenu.prevent="editKey(idx)"
          style="position: relative; padding-top: 100%; border-radius: 12px; cursor: pointer; transition: all 0.2s; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center;"
        >
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 6px; padding: 10px;">
            <!-- Icon -->
            <span style="font-size: 28px;">{{ btn.icon || '⬛' }}</span>
            <!-- Name Label -->
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%;">
              {{ btn.name || 'Phím trống' }}
            </span>
          </div>

          <!-- Small Configuration Edit Gear -->
          <button 
            @click.stop="editKey(idx)"
            style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.5); border: none; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; font-size: 11px; opacity: 0.7;"
            title="Sửa phím"
          >
            ⚙
          </button>
        </div>
      </div>

      <div style="font-size: 12px; color: var(--text-sub); text-align: center; margin-top: 10px;">
        💡 Mẹo: Nhấp chuột trái để Kích hoạt lệnh, Nhấp chuột phải (hoặc bấm bánh răng) để Chỉnh sửa cấu hình phím bấm.
      </div>

      <!-- Key Config Editor Panel Overlay Modal -->
      <div class="modal-overlay" v-if="editingIdx !== null" @click.self="editingIdx = null">
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3>Cấu hình nút bấm #{{ editingIdx + 1 }}</h3>
            <button class="modal-close" @click="editingIdx = null">&times;</button>
          </div>

          <div class="form-group">
            <label>Tên phím hiển thị</label>
            <input type="text" class="form-input" v-model="editForm.name" placeholder="Tên phím" />
          </div>

          <div class="form-group">
            <label>Biểu tượng (Icon Emoji)</label>
            <input type="text" class="form-input" v-model="editForm.icon" placeholder="Ví dụ: 🔴, 🎬, 🎙" />
          </div>

          <div class="form-group">
            <label>Màu sắc</label>
            <select class="form-input" v-model="editForm.color">
              <option value="#2d2d2d">Xám tối (Mặc định)</option>
              <option value="#b71c1c">Đỏ (Program/Rec)</option>
              <option value="#1b5e20">Xanh lá (Preview)</option>
              <option value="#0d47a1">Xanh dương (Overlay)</option>
              <option value="#e65100">Cam (Stream)</option>
              <option value="#f57f17">Vàng (FTB)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Chức năng thực thi</label>
            <select class="form-input" v-model="editForm.command">
              <option value="none">Trống (Không thực hiện)</option>
              <option value="cut">CUT</option>
              <option value="auto">AUTO</option>
              <option value="ftb">Fade To Black (FTB)</option>
              <option value="recordStart">Ghi hình: Bắt Đầu</option>
              <option value="recordStop">Ghi hình: Dừng</option>
              <option value="streamStart">Livestream: Bắt Đầu</option>
              <option value="streamStop">Livestream: Dừng</option>
              <option value="overlay1">Overlay 1</option>
              <option value="overlay2">Overlay 2</option>
              <option value="overlay3">Overlay 3</option>
              <option value="overlay4">Overlay 4</option>
            </select>
          </div>

          <div class="form-group" v-if="editForm.command.startsWith('overlay')">
            <label>Nguồn Input (Key)</label>
            <input type="text" class="form-input" v-model="editForm.param" placeholder="Nhập Key/GUID của input" />
          </div>

          <div class="modal-footer">
            <button class="btn" @click="editingIdx = null">Hủy</button>
            <button class="btn btn-primary" @click="saveKey">Lưu Phím</button>
          </div>
        </div>
      </div>

    </div>
  `,
  setup() {
    const buttons = ref([]);
    const editingIdx = ref(null);
    
    const editForm = ref({
      name: '',
      icon: '',
      color: '#2d2d2d',
      command: 'none',
      param: ''
    });

    const defaultButtons = [
      { name: 'CUT', icon: '⚡', color: '#0d47a1', command: 'cut', param: '' },
      { name: 'AUTO', icon: '🎬', color: '#1b5e20', command: 'auto', param: '' },
      { name: 'FTB', icon: '⬛', color: '#f57f17', command: 'ftb', param: '' },
      { name: 'REC START', icon: '🔴', color: '#2d2d2d', command: 'recordStart', param: '' },
      { name: 'REC STOP', icon: '⬜', color: '#2d2d2d', command: 'recordStop', param: '' },
      { name: 'STREAM START', icon: '📡', color: '#2d2d2d', command: 'streamStart', param: '' },
      { name: 'STREAM STOP', icon: '⏹', color: '#2d2d2d', command: 'streamStop', param: '' },
      { name: 'OVERLAY 1', icon: '❶', color: '#2d2d2d', command: 'overlay1', param: '' },
      { name: 'OVERLAY 2', icon: '❷', color: '#2d2d2d', command: 'overlay2', param: '' },
      { name: 'OVERLAY 3', icon: '❸', color: '#2d2d2d', command: 'overlay3', param: '' },
      { name: 'OVERLAY 4', icon: '❹', color: '#2d2d2d', command: 'overlay4', param: '' },
      { name: 'TRỐNG', icon: '', color: '#2d2d2d', command: 'none', param: '' },
      { name: 'TRỐNG', icon: '', color: '#2d2d2d', command: 'none', param: '' },
      { name: 'TRỐNG', icon: '', color: '#2d2d2d', command: 'none', param: '' },
      { name: 'TRỐNG', icon: '', color: '#2d2d2d', command: 'none', param: '' }
    ];

    const loadDeck = () => {
      try {
        const storedDeck = localStorage.getItem('vmix_streamdeck_buttons');
        if (storedDeck) {
          buttons.value = JSON.parse(storedDeck);
        } else {
          buttons.value = JSON.parse(JSON.stringify(defaultButtons));
        }
      } catch (err) {
        buttons.value = JSON.parse(JSON.stringify(defaultButtons));
      }
    };

    const saveDeck = () => {
      localStorage.setItem('vmix_streamdeck_buttons', JSON.stringify(buttons.value));
    };

    const resetDeck = () => {
      if (confirm('Bạn có chắc muốn đặt lại cấu hình phím mặc định?')) {
        buttons.value = JSON.parse(JSON.stringify(defaultButtons));
        saveDeck();
      }
    };

    const editKey = (idx) => {
      editingIdx.value = idx;
      const target = buttons.value[idx];
      editForm.value = {
        name: target.name || '',
        icon: target.icon || '',
        color: target.color || '#2d2d2d',
        command: target.command || 'none',
        param: target.param || ''
      };
    };

    const saveKey = () => {
      if (editingIdx.value !== null) {
        buttons.value[editingIdx.value] = {
          name: editForm.value.name,
          icon: editForm.value.icon,
          color: editForm.value.color,
          command: editForm.value.command,
          param: editForm.value.param
        };
        saveDeck();
        editingIdx.value = null;
      }
    };

    const executeKey = (btn) => {
      if (!btn.command || btn.command === 'none') return;
      if (navigator.vibrate) navigator.vibrate([40]);
      
      const socket = window.appSocket;
      if (!socket || !socket.connected) return;

      const action = btn.command;
      
      // Determine proper command maps
      if (action.startsWith('overlay')) {
        const num = parseInt(action.substring(7), 10);
        socket.emit('vmix-command', { action: 'overlay', params: { id: btn.param, number: num } });
      } else {
        socket.emit('vmix-command', { action, params: {} });
      }
    };

    onMounted(() => {
      loadDeck();
    });

    return {
      buttons,
      editingIdx,
      editForm,
      resetDeck,
      editKey,
      saveKey,
      executeKey
    };
  }
};
