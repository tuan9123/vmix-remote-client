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
    // ── CẤU HÌNH GITHUB PRO MẶC ĐỊNH (Điền thông tin của bạn vào đây trước khi build) ──
    const DEFAULT_GITHUB_TOKEN = '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';
    const DEFAULT_GIST_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const DEFAULT_VERCEL_DOMAIN = 'https://tuan-vmix-client.vercel.app';
    const DEFAULT_GITHUB_USERNAME = 'nguyentuan';

    // Tự động nạp cấu hình nếu chưa được lưu trữ
    if (!localStorage.getItem('vmix_github_token')) {
      localStorage.setItem('vmix_github_token', DEFAULT_GITHUB_TOKEN);
    }
    if (!localStorage.getItem('vmix_github_gist_id')) {
      localStorage.setItem('vmix_github_gist_id', DEFAULT_GIST_ID);
    }
    if (!localStorage.getItem('vmix_custom_deploy_domain')) {
      localStorage.setItem('vmix_custom_deploy_domain', DEFAULT_VERCEL_DOMAIN);
    }
    if (!localStorage.getItem('vmix_github_username')) {
      localStorage.setItem('vmix_github_username', DEFAULT_GITHUB_USERNAME);
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
      if (gistId && token) {
        if (customDomain) {
          return `/api/qrcode?gist=${encodeURIComponent(gistId)}&domain=${encodeURIComponent(customDomain)}&t=${qrTimestamp.value}`;
        }
        const githubUser = localStorage.getItem('vmix_github_username') || 'username';
        return `/api/qrcode?gist=${encodeURIComponent(gistId)}&user=${encodeURIComponent(githubUser)}&t=${qrTimestamp.value}`;
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
  
  // If running outside LAN and Gist ID is available, fetch tunnel address from GitHub Gist
  const gistId = getQueryParam('gist') || localStorage.getItem('vmix_github_gist_id');
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.') && gistId) {
    try {
      console.log(`[GitHub Connect] Fetching tunnel coordinate from Gist ${gistId}...`);
      const response = await fetch(`https://api.github.com/gists/${gistId}`);
      if (response.ok) {
        const gistData = await response.json();
        const tunnelConfig = JSON.parse(gistData.files['vmix_tunnel.json']?.content || '{}');
        if (tunnelConfig.url) {
          socketUrl = tunnelConfig.url;
          console.log(`[GitHub Connect] Routing Socket.io connection to: ${socketUrl}`);
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
    if (token && gistId && url) {
      console.log(`[GitHub Tunnel Sync] Triggering Gist sync for tunnel: ${url}`);
      window.appSocket.emit('sync-gist-tunnel', { token, gistId, url });
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

  if (authStore.checkingSession) {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      authStore.setCheckingSession(false);
      if (data.authenticated) {
        authStore.setUser(data.user);
        window.appSessionData = data;
        window.allowMultiOperator = data.config.allowMultiOperator;
        initSocket();
      }
    } catch (err) {
      authStore.setCheckingSession(false);
      console.error('Session check failed:', err);
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
