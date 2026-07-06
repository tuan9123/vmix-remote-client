import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
import StreamDeckView from './views/StreamDeckView.js';
import MixerView from './views/MixerView.js';
import AuditLogView from './views/AuditLogView.js';
import SettingsView from './views/SettingsView.js';
import GuideView from './views/GuideView.js';
import TallyView from './views/TallyView.js';
import { useAuthStore } from './stores/authStore.js';
import { useVmixStore } from './stores/vmixStore.js';


const { createApp, ref, computed, onMounted, watch } = Vue;

const app = createApp({
  setup() {
    // Detect Electron environment
    const isElectron = window.navigator.userAgent.indexOf('Electron') > -1;
    if (isElectron) {
      document.body.classList.add('is-electron');
    }

    // ── CẤU HÌNH GITHUB PRO MẶC ĐỊNH (Điền thông tin của bạn vào đây trước khi build) ──
    const DEFAULT_GITHUB_TOKEN = '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';
    const DEFAULT_GIST_ID = '6d4e1a1a34c9c3182fb1aace5de7bf3c';
    const DEFAULT_VERCEL_DOMAIN = 'https://tuan-vmix-client.vercel.app';
    const DEFAULT_GITHUB_USERNAME = 'tuan9123';

    // Tự động nạp đè cấu hình nếu chưa có hoặc đang chứa giá trị mẫu/rỗng
    const storedToken = localStorage.getItem('vmix_github_token');
    if (!storedToken || storedToken.trim() === '' || storedToken.includes('ghp_xxxx') || storedToken.includes('ghp_xxxxxxxxxxxxxxxxxxxx')) {
      localStorage.setItem('vmix_github_token', DEFAULT_GITHUB_TOKEN);
    }
    const storedGist = localStorage.getItem('vmix_github_gist_id');
    if (!storedGist || storedGist.trim() === '' || storedGist.includes('xxxx') || storedGist.includes('xxxxxxxxxxxxxxxxxxxx')) {
      localStorage.setItem('vmix_github_gist_id', DEFAULT_GIST_ID);
    }
    const storedDomain = localStorage.getItem('vmix_custom_deploy_domain');
    if (!storedDomain || storedDomain.trim() === '' || storedDomain.includes('xxxx') || storedDomain.includes('vercel.app') && storedDomain.includes('xxxx')) {
      localStorage.setItem('vmix_custom_deploy_domain', DEFAULT_VERCEL_DOMAIN);
    }
    const storedUser = localStorage.getItem('vmix_github_username');
    if (!storedUser || storedUser.trim() === '' || storedUser.includes('xxxx') || storedUser.includes('nguyentuan')) {
      localStorage.setItem('vmix_github_username', DEFAULT_GITHUB_USERNAME);
    }
    
    // Tự động sinh tên định danh máy ngẫu nhiên không trùng lặp (ví dụ: vmix-4872)
    if (!localStorage.getItem('vmix_machine_name') || localStorage.getItem('vmix_machine_name') === 'may1') {
      const randomMachineName = 'vmix-' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('vmix_machine_name', randomMachineName);
    }

    const authStore = useAuthStore();
    const vmixStore = useVmixStore();
    const router = VueRouter.useRouter();

    // Floating notifications
    const notifications = ref([]);




    // Sidebar collapse state (persisted)
    const sidebarCollapsed = ref(localStorage.getItem('vmix_sidebar_collapsed') === 'true');
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
      localStorage.setItem('vmix_sidebar_collapsed', String(sidebarCollapsed.value));
    };

    // Floating QR display states
    const showQrFloat = ref(localStorage.getItem('vmix_show_qr_float') !== 'false');
    const showQrModal = ref(false);

    const toggleQrFloat = () => {
      showQrFloat.value = !showQrFloat.value;
      localStorage.setItem('vmix_show_qr_float', String(showQrFloat.value));
    };

    const authenticated  = computed(() => authStore.authenticated);
    const checkingSession = computed(() => authStore.checkingSession);
    const connected      = computed(() => vmixStore.connected);
    const currentRoute   = computed(() => router.currentRoute.value.path);
    const onlineCount    = computed(() => authStore.onlineUsers?.length ?? 0);
    const isAdmin        = computed(() => authStore.isAdmin);

    const qrTimestamp = ref(Date.now());

    const qrCodeUrl = computed(() => {
      const gistId = localStorage.getItem('vmix_github_gist_id') || '';
      const token = localStorage.getItem('vmix_github_token') || '';
      const customDomain = localStorage.getItem('vmix_custom_deploy_domain') || '';
      const machineName = localStorage.getItem('vmix_machine_name') || 'may1';
      if (gistId && token) {
        if (customDomain) {
          return `/api/qrcode?gist=${encodeURIComponent(gistId)}&domain=${encodeURIComponent(customDomain)}&may=${encodeURIComponent(machineName)}&t=${qrTimestamp.value}`;
        }
        const githubUser = localStorage.getItem('vmix_github_username') || 'username';
        return `/api/qrcode?gist=${encodeURIComponent(gistId)}&user=${encodeURIComponent(githubUser)}&may=${encodeURIComponent(machineName)}&t=${qrTimestamp.value}`;
      }
      return `/api/qrcode?t=${qrTimestamp.value}`;
    });




    const handleLogout = async () => {
      if (navigator.vibrate) navigator.vibrate(30);
      try {
        await fetch('/api/logout', { method: 'POST' });
        authStore.setUser(null);
        if (window.appSocket) {
          window.appSocket.disconnect();
        }
        router.push('/login');
      } catch (err) {
        console.error('Logout error:', err);
      }
    };

    const removeNotification = (idx) => {
      notifications.value.splice(idx, 1);
    };

    onMounted(() => {
      vmixStore.loadLocalPreferences();
      vmixStore.loadPostersMap();
    });

    return {
      authenticated,
      checkingSession,
      connected,
      currentRoute,
      notifications,
      qrTimestamp,
      qrCodeUrl,
      sidebarCollapsed,
      toggleSidebar,
      onlineCount,
      isAdmin,
      showQrFloat,
      showQrModal,
      toggleQrFloat,
      handleLogout,
      removeNotification
    };

  }
});


// Setup Pinia
const pinia = Pinia.createPinia();
app.use(pinia);

// Routes
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: LoginView },
  { path: '/dashboard', component: DashboardView },
  { path: '/streamdeck', component: StreamDeckView },
  { path: '/mixer', component: MixerView },
  { path: '/logs', component: AuditLogView },
  { path: '/guide', component: GuideView },
  { path: '/settings', component: SettingsView },
  { path: '/tally', component: TallyView }
];


const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
});

// Helper to parse query parameters from URL
function getQueryParam(name) {
  const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.href);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// Socket.io Client initialization helper
async function initSocket() {
  if (window.appSocket) return;

  const authStore = useAuthStore();
  const vmixStore = useVmixStore();

  let socketUrl = undefined;
  
  const gistId = getQueryParam('gist') || localStorage.getItem('vmix_github_gist_id');
  const machineName = getQueryParam('may') || localStorage.getItem('vmix_machine_name') || 'may1';

  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.') && gistId) {
    try {
      console.log(`[GitHub Connect] Fetching tunnel coordinate for ${machineName} from Gist ${gistId}...`);
      const response = await fetch(`https://api.github.com/gists/${gistId}`);
      if (response.ok) {
        const gistData = await response.json();
        
        // 1. Try reading the multi-machine tunnels list
        const tunnelsConfigObj = gistData.files['vmix_tunnels.json'];
        if (tunnelsConfigObj && tunnelsConfigObj.content) {
          const tunnelsConfig = JSON.parse(tunnelsConfigObj.content);
          const targetConfig = tunnelsConfig[machineName] || {};
          if (targetConfig.url) {
            socketUrl = targetConfig.url;
            console.log(`[GitHub Connect] Routing Socket.io to ${machineName}: ${socketUrl}`);
          }
        }
        
        // 2. Fallback to old format if not found
        if (!socketUrl) {
          const legacyConfigObj = gistData.files['vmix_tunnel.json'];
          if (legacyConfigObj && legacyConfigObj.content) {
            const legacyConfig = JSON.parse(legacyConfigObj.content);
            if (legacyConfig.url) {
              socketUrl = legacyConfig.url;
              console.log(`[GitHub Connect Fallback] Routing Socket.io to: ${socketUrl}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('[GitHub Connect Error] Failed to fetch gist:', err);
    }
  }
  
  window.appSocket = io(socketUrl);



  window.appSocket.on('connect', () => {
    console.log('Socket.io client connected.');
  });

  window.appSocket.on('unauthorized', () => {
    authStore.setUser(null);
    if (window.appSocket) {
      window.appSocket.disconnect();
      window.appSocket = null;
    }
    router.push('/login');
  });

  window.appSocket.on('vmix-state', (state) => {
    vmixStore.updateState(state);
  });

  window.appSocket.on('config-update', (data) => {
    window.allowMultiOperator = data.allowMultiOperator;
    window.macroSchedulerList = data.macroScheduler;
  });

  window.appSocket.on('online-users', (data) => {
    authStore.setOnlineUsers(data.users, data.operator);
  });

  window.appSocket.on('tunnel-url', (url) => {
    window.lastTunnelUrl = url;
    const token = localStorage.getItem('vmix_github_token');
    const gistId = localStorage.getItem('vmix_github_gist_id');
    const machineName = localStorage.getItem('vmix_machine_name') || 'may1';
    if (token && gistId && url) {
      console.log(`[GitHub Tunnel Sync] Triggering Gist sync for machine ${machineName} with tunnel: ${url}`);
      window.appSocket.emit('sync-gist-tunnel', { token, gistId, url, machineName });
    }
  });



  window.appSocket.on('notification', (notif) => {
    const newNotif = { ...notif, id: Date.now() + Math.random() };
    const toasts = app._instance?.ctx?.notifications;
    if (toasts) {
      toasts.value.push(newNotif);
      setTimeout(() => {
        const idx = toasts.value.findIndex(n => n.id === newNotif.id);
        if (idx !== -1) toasts.value.splice(idx, 1);
      }, 4500);
    }
  });

  window.appSocket.on('poster-updated', (data) => {
    vmixStore.setPosterMapping(data.inputKey, data.posterUrl ? data.posterUrl.substring(10) : null);
  });

  window.appSocket.on('tags-updated', (data) => {
    vmixStore.setInputTags(data.inputKey, data.tags);
  });

  window.appSocket.on('posters-reloaded', (data) => {
    vmixStore.posters = data.posters || {};
    vmixStore.tags = data.tags || {};
  });

  window.appSocket.on('thumbnail-refresh', (timestamp) => {
    vmixStore.thumbnailTimestamp = timestamp || Date.now();
  });
}

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname.startsWith('192.168.');

  if (authStore.checkingSession) {
    try {
      const response = await fetch('/api/session');
      if (response.ok) {
        const data = await response.json();
        authStore.setCheckingSession(false);
        if (data.authenticated) {
          authStore.setUser(data.user);
          window.appSessionData = data;
          window.allowMultiOperator = data.config.allowMultiOperator;
          initSocket();
        }
      } else {
        throw new Error('Not local server');
      }
    } catch (err) {
      authStore.setCheckingSession(false);
      console.log('Session check failed or remote environment detected.');
      
      // Auto-authenticate remote Vercel clients to bypass local login wall
      if (!isLocal) {
        console.log('Bypassing local login screen for remote connection.');
        authStore.setUser({ username: 'admin', role: 'admin' });
        initSocket();
      }
    }
  }

  if (to.path !== '/login' && !authStore.authenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.authenticated) {
    next('/dashboard');

  } else {
    next();
  }
});

// Global keyboard shortcuts
window.addEventListener('keydown', (e) => {
  const authStore = useAuthStore();
  const vmixStore = useVmixStore();
  if (!authStore.authenticated || !authStore.hasControl) return;

  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) return;

  const socket = window.appSocket;
  if (!socket || !socket.connected) return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(30);
    socket.emit('vmix-command', { action: 'cut' });
  } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(30);
    socket.emit('vmix-command', { action: 'auto' });
  } else if (e.ctrlKey && e.code === 'KeyR') {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(35);
    const action = vmixStore.recording ? 'recordStop' : 'recordStart';
    socket.emit('vmix-command', { action });
  } else if (e.ctrlKey && e.code === 'KeyS') {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(35);
    const action = vmixStore.streaming ? 'streamStop' : 'streamStart';
    socket.emit('vmix-command', { action });
  } else if (e.code.startsWith('Digit')) {
    const digit = parseInt(e.code.substring(5), 10);
    if (digit >= 1 && digit <= 9) {
      e.preventDefault();
      if (navigator.vibrate) navigator.vibrate(25);
      const targetInput = vmixStore.inputs.find(inp => inp.number === digit);
      if (targetInput) {
        if (e.shiftKey) {
          socket.emit('vmix-command', { action: 'activeInput', params: { id: targetInput.key } });
        } else {
          socket.emit('vmix-command', { action: 'previewInput', params: { id: targetInput.key } });
        }
      }
    }
  }
});

app.use(router);
app.mount('#app');
