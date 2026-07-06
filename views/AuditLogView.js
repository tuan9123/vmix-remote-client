const { ref, computed, onMounted } = Vue;

export default {
  name: 'AuditLogView',
  template: `
    <div class="audit-log-view" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
      
      <!-- Header & CSV Exporter -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--panel-bg); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 10px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📋 NHẬT KÝ HỆ THỐNG (AUDIT LOGS)</h2>
          <p style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">Giám sát các thao tác chuyển cảnh, điều khiển âm thanh và đăng nhập của người dùng</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn" @click="fetchLogs">
            🔄 Làm Mới
          </button>
          <a href="/api/logs/export" download class="btn btn-primary" style="text-decoration: none; align-items: center; justify-content: center; height: 36px; display: inline-flex;">
            📥 Xuất File CSV
          </a>
        </div>
      </div>

      <!-- Filters & Search -->
      <div style="background: var(--panel-bg); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 10px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <span style="font-size: 12px; font-weight: 600; color: var(--text-sub);">Lọc nhanh:</span>
        <input 
          type="text" 
          class="form-input" 
          v-model="searchQuery" 
          placeholder="Tìm theo lệnh, người dùng, IP..." 
          style="max-width: 100%; width: 300px; flex-grow: 1; height: 36px; padding: 0 12px; font-size: 13px;"
        />
      </div>

      <!-- Logs Data Table -->
      <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;">
        <div style="max-height: 480px; overflow-y: auto; overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
          <table style="width: 100%; min-width: 700px; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-color); color: var(--text-sub); text-transform: uppercase; font-size: 11px;">
                <th style="padding: 12px 15px; font-weight: 700;">Thời gian</th>
                <th style="padding: 12px 15px; font-weight: 700;">Tài khoản</th>
                <th style="padding: 12px 15px; font-weight: 700;">Vai trò</th>
                <th style="padding: 12px 15px; font-weight: 700;">IP Client</th>
                <th style="padding: 12px 15px; font-weight: 700;">Thiết bị</th>
                <th style="padding: 12px 15px; font-weight: 700;">Lệnh thực thi</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(log, idx) in filteredLogs" 
                :key="idx"
                style="border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.15s;"
                hover-style="background: rgba(255,255,255,0.01)"
              >
                <td style="padding: 12px 15px; color: var(--text-sub); font-family: monospace;">{{ log.time }}</td>
                <td style="padding: 12px 15px; font-weight: 600;">{{ log.user }}</td>
                <td style="padding: 12px 15px;">
                  <span 
                    class="status-badge" 
                    :style="getRoleBadgeStyle(log.role)"
                    style="border: none; font-size: 10px; font-weight: 700; padding: 2px 6px;"
                  >
                    {{ log.role }}
                  </span>
                </td>
                <td style="padding: 12px 15px; font-family: monospace; color: var(--text-sub);">{{ log.ip }}</td>
                <td style="padding: 12px 15px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-sub);" :title="log.device">
                  {{ log.device }}
                </td>
                <td style="padding: 12px 15px; font-family: monospace; font-weight: 700; color: #ffca28;">
                  {{ log.command }}
                </td>
              </tr>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-sub);">
                  Không tìm thấy nhật ký tương ứng.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  setup() {
    const rawLogs = ref([]);
    const searchQuery = ref('');

    const fetchLogs = () => {
      const socket = window.appSocket;
      if (socket && socket.connected) {
        socket.emit('get-audit-logs');
      }
    };

    const getRoleBadgeStyle = (role) => {
      switch (role) {
        case 'Administrator':
          return 'background: #b71c1c; color: white;';
        case 'Director':
          return 'background: #1b5e20; color: white;';
        case 'Audio':
          return 'background: #0288d1; color: white;';
        case 'PTZ':
          return 'background: #f57f17; color: white;';
        default:
          return 'background: #3e3e3e; color: #ccc;';
      }
    };

    const filteredLogs = computed(() => {
      if (!searchQuery.value) return rawLogs.value;
      const q = searchQuery.value.toLowerCase();
      return rawLogs.value.filter(log => {
        return log.user.toLowerCase().includes(q) ||
               log.role.toLowerCase().includes(q) ||
               log.ip.toLowerCase().includes(q) ||
               log.command.toLowerCase().includes(q) ||
               log.device.toLowerCase().includes(q);
      });
    });

    onMounted(() => {
      fetchLogs();

      // Listen for socket log updates
      const socket = window.appSocket;
      if (socket) {
        socket.on('audit-logs', (logs) => {
          rawLogs.value = logs;
        });
      }
    });

    return {
      searchQuery,
      filteredLogs,
      fetchLogs,
      getRoleBadgeStyle
    };
  }
};
