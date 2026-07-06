import { useAuthStore } from '../stores/authStore.js';
import { useVmixStore } from '../stores/vmixStore.js';

const { ref, computed, onMounted } = Vue;

export default {
  name: 'SettingsView',
  template: `
    <div class="settings-view" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
      
      <!-- Header -->
      <div style="background: var(--panel-bg); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 10px;">
        <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚙️ THIẾT LẬP HỆ THỐNG</h2>
        <p style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">Cấu hình liên kết vMix, lập lịch Macro tự động, sao lưu bố cục và quản lý phiên người dùng</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 800px; margin: 0 auto;" class="settings-grid">
        
        <!-- Connection Settings (Admin only) -->
        <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px;">🔗 Kết Nối vMix</h3>
          
          <div class="form-group">
            <label>Địa chỉ IP vMix</label>
            <input type="text" class="form-input" v-model="ip" :disabled="!isAdmin" />
          </div>

          <div class="form-group">
            <label>Cổng kết nối (Port)</label>
            <input type="number" class="form-input" v-model.number="port" :disabled="!isAdmin" />
          </div>

          <div class="form-group" style="margin-top: 10px;">
            <label>Đường dẫn thư mục lưu Thumbnail tĩnh (vMix)</label>
            <div style="display: flex; gap: 8px; width: 100%;">
              <input type="text" class="form-input" v-model="snapshotPath" :disabled="!isAdmin" placeholder="Ví dụ: C:\\vMixThumbnails (để trống sẽ lưu vào thư mục mặc định)" style="flex-grow: 1;" />
              <button v-if="isAdmin" class="btn" @click="browseFolder" style="height: 36px; padding: 0 15px; font-weight: bold; flex-shrink: 0; background: #3e3e3e; border-color: var(--border-color); display: flex; align-items: center; justify-content: center; gap: 5px;">
                📁 Duyệt...
              </button>
            </div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
            <input type="checkbox" id="multi-op-check" v-model="allowMultiOperator" :disabled="!isAdmin" />
            <label for="multi-op-check" style="margin-bottom: 0; cursor: pointer;">
              Cho phép nhiều người cùng điều khiển (Không khóa Operator)
            </label>
          </div>

          <button v-if="isAdmin" class="btn btn-primary" @click="saveConnection" style="margin-top: 15px;">
            Lưu Cấu Hình Kết Nối
          </button>
          <div v-else style="font-size: 11px; color: var(--text-sub); margin-top: 10px;">
            * Chỉ Quản trị viên mới được phép thay đổi thông số mạng.
          </div>
        </div>

        <!-- Visual display custom styles settings -->
        <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px;">🎨 Cấu Hình Hiển Thị Card</h3>
          
          <div class="form-group">
            <label>Kích thước Card Poster</label>
            <select class="form-input" v-model="cardSize">
              <option value="small">Nhỏ (Compact)</option>
              <option value="medium">Vừa (Mặc định)</option>
              <option value="large">Lớn (Dễ quan sát)</option>
            </select>
          </div>

          <div class="form-group" style="margin-top: 15px;">
            <label>Chế độ hiển thị chi tiết Card</label>
            <select class="form-input" v-model="cardDisplayMode">
              <option value="icon">Chỉ Icon loại nguồn (Không ảnh)</option>
              <option value="poster">Chỉ ảnh Poster</option>
              <option value="poster-name">Ảnh Poster + Tên nguồn</option>
              <option value="poster-details">Ảnh Poster + Tên + Chi tiết</option>
            </select>
          </div>
        </div>

        <!-- PRO Features settings (GitHub + Audio Matrix) - HIDDEN BY DEFAULT -->
        <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; display: none;">
          <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px; color: var(--active-blue);">🌐 Điều Khiển Khác Mạng Qua GitHub (PRO)</h3>
          
          <div class="form-group">
            <label>GitHub Personal Access Token (PAT)</label>
            <input type="password" class="form-input" v-model="githubToken" placeholder="ghp_xxxxxxxxxxxx" />
          </div>

          <div class="form-group">
            <label>GitHub Gist ID</label>
            <input type="text" class="form-input" v-model="githubGistId" placeholder="Mã Gist 32 ký tự" />
          </div>

          <div class="form-group">
            <label>Tên miền điều khiển Vercel / Custom (Nếu có)</label>
            <input type="text" class="form-input" v-model="customDeployDomain" placeholder="Ví dụ: https://tuan-vmix-client.vercel.app" />
          </div>

          <div class="form-group">
            <label>Tên định danh máy này (ví dụ: may1, may2, may3)</label>
            <input type="text" class="form-input" v-model="machineName" placeholder="Mặc định: may1" />
          </div>

          <div style="font-size: 11px; color: var(--text-sub); line-height: 1.4; margin-bottom: 15px;">
            * Token, Gist ID, tên miền Vercel và tên máy được lưu an toàn trực tiếp trên thiết bị (localStorage).
            Hãy xem file hướng dẫn <strong>vercel_deployment_guide.md</strong> để biết cách deploy Vercel từ GitHub Private.
          </div>


          <button class="btn btn-primary" @click="saveGithubSettings" style="height: 36px; font-size: 12px; font-weight: 700;">
            💾 Lưu Thiết Lập GitHub
          </button>

        </div>


        <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px; color: var(--active-blue);">🎛️ Tính Năng Tự Động PRO</h3>
          
          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-bottom: 0;">
            <input type="checkbox" id="audio-matrix-check" v-model="smartAudioMatrix" />
            <label for="audio-matrix-check" style="margin-bottom: 0; cursor: pointer; line-height: 1.4;">
              <strong>Smart Audio Matrix</strong>: Tự động bật Audio nguồn Camera khi chuyển cảnh lên Live (Program)
            </label>
          </div>
        </div>

        <!-- Macro Scheduler Manager -->

        <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px;">⏰ Lập Lịch Chạy Macro</h3>
          
          <!-- List of macros -->
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; margin-bottom: 15px;">
            <div 
              v-for="(item, idx) in schedulerList" 
              :key="idx"
              style="background: var(--card-bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 12px;"
            >
              <div>
                <span style="font-weight: 700; color: #ffca28; font-family: monospace; margin-right: 10px;">{{ item.time }}</span>
                <span style="text-transform: uppercase; font-weight: 600;">{{ item.command }}</span>
              </div>
              <button v-if="isAdmin" @click="removeSchedulerItem(idx)" style="background: none; border: none; color: var(--program-color); font-size: 16px; cursor: pointer;">
                &times;
              </button>
            </div>
            <div v-if="schedulerList.length === 0" style="text-align: center; color: var(--text-sub); padding: 15px; font-size: 12px;">
              Chưa có macro nào được lên lịch.
            </div>
          </div>

          <!-- Add new macro form (Admin only) -->
          <div v-if="isAdmin" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 10px;">
              <div style="flex: 1;">
                <label style="font-size: 10px; color: var(--text-sub);">Giờ chạy (HH:MM)</label>
                <input type="time" class="form-input" v-model="newMacro.time" style="height: 36px;" />
              </div>
              <div style="flex: 2;">
                <label style="font-size: 10px; color: var(--text-sub);">Lệnh macro</label>
                <select class="form-input" v-model="newMacro.command" style="height: 36px;">
                  <option value="Start Streaming">📡 Start Streaming</option>
                  <option value="Stop Streaming">⏹ Stop Streaming</option>
                  <option value="Start Recording">🔴 Start Recording</option>
                  <option value="Stop Recording">⬛ Stop Recording</option>
                  <option value="Play Intro">🎬 Play Intro</option>
                  <option value="Overlay ON">❶ Overlay ON</option>
                  <option value="Switch Camera 2">🎥 Switch Camera 2</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" @click="addSchedulerItem" style="height: 34px; font-size: 12px; justify-content: center; font-weight: 700;">
              ➕ Thêm Lịch Chạy
            </button>
          </div>
        </div>

        <!-- Active Users List -->
        <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px;">👥 Người Dùng Online</h3>
          
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
            <div 
              v-for="u in onlineUsers" 
              :key="u.socketId"
              style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 6px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <span style="font-weight: 700;">{{ u.username }}</span>
                <span style="font-size: 10px; margin-left: 8px; padding: 1px 4px; border-radius: 3px; background: rgba(255,255,255,0.08);">
                  {{ u.role }}
                </span>
                <div style="font-size: 10px; color: var(--text-sub); margin-top: 3px;">
                  IP: {{ u.ip }} | Hoạt động: {{ u.lastActive }}
                </div>
              </div>
              <div style="font-size: 18px;" v-if="operator === u.username" title="Operator Lock Active">
                👑
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  setup() {
    const authStore = useAuthStore();
    const vmixStore = useVmixStore();

    const ip = ref('');
    const port = ref(8088);
    const allowMultiOperator = ref(false);
    const exporting = ref(false);
    const snapshotPath = ref('');

    // GitHub Tunnel config
    const githubToken = ref(localStorage.getItem('vmix_github_token') || '');
    const githubGistId = ref(localStorage.getItem('vmix_github_gist_id') || '');
    const customDeployDomain = ref(localStorage.getItem('vmix_custom_deploy_domain') || '');
    const machineName = ref(localStorage.getItem('vmix_machine_name') || 'may1');
    
    const saveGithubSettings = () => {
      if (navigator.vibrate) navigator.vibrate(30);
      localStorage.setItem('vmix_github_token', githubToken.value);
      localStorage.setItem('vmix_github_gist_id', githubGistId.value);
      localStorage.setItem('vmix_custom_deploy_domain', customDeployDomain.value);
      localStorage.setItem('vmix_machine_name', machineName.value);
      
      // Extract github username or Vercel subdomain prefix for QR Code URL
      let extractedUser = 'username';
      if (customDeployDomain.value) {
        if (customDeployDomain.value.includes('.github.io')) {
          const match = customDeployDomain.value.match(/https?:\/\/([^.]+)\.github\.io/);
          if (match) extractedUser = match[1];
        } else {
          // If using Vercel like https://tuan-vmix.vercel.app, extract the first block
          const match = customDeployDomain.value.match(/https?:\/\/([^.]+)\.vercel\.app/);
          if (match) extractedUser = match[1];
        }
      }
      localStorage.setItem('vmix_github_username', extractedUser);

      // Trigger sync immediately if tunnel exists
      if (window.appSocket && window.lastTunnelUrl) {
        window.appSocket.emit('sync-gist-tunnel', {
          token: githubToken.value,
          gistId: githubGistId.value,
          url: window.lastTunnelUrl,
          machineName: machineName.value
        });
      }
      alert('Đã lưu thiết lập GitHub!');
    };



    // Smart Audio Matrix config
    const smartAudioMatrix = ref(localStorage.getItem('vmix_smart_audio_matrix') === 'true');
    const { watch } = Vue;
    watch(smartAudioMatrix, (newVal) => {
      localStorage.setItem('vmix_smart_audio_matrix', String(newVal));
    });

    const schedulerList = ref([]);
    const newMacro = ref({
      time: '09:00',
      command: 'Start Streaming'
    });


    const isAdmin = computed(() => authStore.isAdmin);
    const onlineUsers = computed(() => authStore.onlineUsers);
    const operator = computed(() => authStore.operator);

    // Setup visual binds
    const cardSize = computed({
      get: () => vmixStore.posterSize,
      set: (val) => vmixStore.setPosterSize(val)
    });

    const cardDisplayMode = computed({
      get: () => vmixStore.posterDisplayMode,
      set: (val) => vmixStore.setPosterDisplayMode(val)
    });

    const loadSettings = () => {
      const sessionData = window.appSessionData;
      if (sessionData && sessionData.config) {
        ip.value = sessionData.config.vmixIP;
        port.value = sessionData.config.vmixPort;
        allowMultiOperator.value = sessionData.config.allowMultiOperator;
        snapshotPath.value = sessionData.config.snapshotPath || '';
      }
      const sched = window.macroSchedulerList || [];
      schedulerList.value = sched;
    };

    const saveConnection = () => {
      if (navigator.vibrate) navigator.vibrate(30);
      const socket = window.appSocket;
      if (socket) {
        socket.emit('update-config', {
          vmixIP: ip.value,
          vmixPort: parseInt(port.value, 10),
          allowMultiOperator: allowMultiOperator.value,
          macroScheduler: schedulerList.value,
          snapshotPath: snapshotPath.value
        });
        alert('Cấu hình đã gửi đi thành công.');
      }
    };

    const addSchedulerItem = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      const item = { time: newMacro.value.time, command: newMacro.value.command };
      schedulerList.value.push(item);
      saveConnection();
    };

    const removeSchedulerItem = (idx) => {
      if (navigator.vibrate) navigator.vibrate(20);
      schedulerList.value.splice(idx, 1);
      saveConnection();
    };

    // Backup layouts
    const exportLayout = () => {
      if (navigator.vibrate) navigator.vibrate(30);
      const favs = localStorage.getItem('vmix_favorites') || '[]';
      const order = localStorage.getItem('vmix_input_order') || '[]';
      
      const payload = {
        favorites: JSON.parse(favs),
        order: JSON.parse(order),
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vmix_layout_backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const importLayout = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (data.favorites && data.order) {
            localStorage.setItem('vmix_favorites', JSON.stringify(data.favorites));
            localStorage.setItem('vmix_input_order', JSON.stringify(data.order));
            vmixStore.loadLocalPreferences();
            alert('Đã phục hồi bố cục thành công!');
          } else {
            alert('File sao lưu không đúng định dạng.');
          }
        } catch (err) {
          alert('Đọc file sao lưu thất bại.');
        }
      };
      reader.readAsText(file);
    };

    // Backup & Restore static posters + tags (Base64 file package)
    const exportPosters = async () => {
      if (navigator.vibrate) navigator.vibrate(30);
      exporting.value = true;
      try {
        const response = await fetch('/api/posters/backup');
        if (response.ok) {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vmix_posters_and_tags_backup_${new Date().toISOString().substring(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          alert('Không thể tạo file backup poster.');
        }
      } catch (err) {
        alert('Lỗi export posters: ' + err.message);
      } finally {
        exporting.value = false;
      }
    };

    const importPosters = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm('Nhập gói posters mới sẽ xóa toàn bộ poster hiện tại trên server. Bạn có chắc chắn muốn tiếp tục?')) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const payload = JSON.parse(evt.target.result);
          if (!payload.posterMap || !payload.files) {
            alert('Tệp sao lưu không hợp lệ.');
            return;
          }

          const response = await fetch('/api/posters/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            // Force reload store map
            vmixStore.loadPostersMap();
            alert('Đã phục hồi Posters và phân loại Tags thành công!');
          } else {
            const err = await response.json();
            alert('Restore posters thất bại: ' + err.message);
          }
        } catch (err) {
          alert('Đọc tệp tin thất bại: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    const browseFolder = async () => {
      if (navigator.vibrate) navigator.vibrate(20);
      try {
        const response = await fetch('/api/settings/browse-folder', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.path) {
            snapshotPath.value = data.path;
          }
        }
      } catch (err) {
        console.error("Browse folder failed:", err);
      }
    };

    onMounted(() => {
      loadSettings();
      const socket = window.appSocket;
      if (socket) {
        socket.on('config-update', (data) => {
          ip.value = data.vmixIP;
          port.value = data.vmixPort;
          allowMultiOperator.value = data.allowMultiOperator;
          snapshotPath.value = data.snapshotPath || '';
        });
      }
    });

    return {
      ip,
      port,
      allowMultiOperator,
      snapshotPath,
      schedulerList,
      newMacro,
      isAdmin,
      onlineUsers,
      operator,
      cardSize,
      cardDisplayMode,
      exporting,
      saveConnection,
      addSchedulerItem,
      removeSchedulerItem,
      exportLayout,
      importLayout,
      exportPosters,
      importPosters,
      browseFolder,
      githubToken,
      githubGistId,
      customDeployDomain,
      machineName,
      saveGithubSettings,
      smartAudioMatrix
    };



  }
};
