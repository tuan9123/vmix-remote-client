const { ref } = Vue;

export default {
  name: 'Login',
  template: `
    <div class="auth-container">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 400px;">
        
        <!-- LOGIN CARD -->
        <div class="auth-card" style="margin: 0; width: 100%;">
          <img src="assets/icon.ico" alt="Tuấn vMix Control Pro" class="auth-logo" />
          <h1>Tuấn vMix Control Pro</h1>
          <p>Hệ thống điều khiển vMix chuyên nghiệp qua LAN</p>
          
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="username">Tên đăng nhập</label>
              <input 
                type="text" 
                id="username" 
                class="form-input" 
                v-model="username" 
                placeholder="Nhập tên đăng nhập"
                required 
              />
            </div>
            
            <div class="form-group">
              <label for="password">Mật khẩu</label>
              <input 
                type="password" 
                id="password" 
                class="form-input" 
                v-model="password" 
                placeholder="Nhập mật khẩu"
                required 
              />
            </div>
            
            <button type="submit" class="auth-btn" :disabled="loading">
              {{ loading ? 'Đang xác thực...' : 'Đăng Nhập' }}
            </button>
          </form>
          
          <div v-if="error" class="error-msg">
            {{ error }}
          </div>
        </div>

        <!-- LAN QR CODE LOGIN LINK CARD -->
        <div class="qr-login-card" style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 25px 20px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); border: 1px solid var(--border-color);">
          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-main); margin-bottom: 12px;">📱 KẾT NỐI NHANH QUA ĐIỆN THOẠI</h3>
          <div style="background: white; padding: 8px; border-radius: 10px; width: 166px; height: 166px; margin: 0 auto 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
            <img :src="'/api/qrcode?t=' + qrTimestamp" alt="QR Code Link" style="width: 150px; height: 150px; display: block;" />
          </div>
          <p style="font-size: 12px; color: var(--text-sub); line-height: 1.5;">
            Quét mã QR bằng điện thoại hoặc máy tính bảng ở cùng mạng LAN để mở nhanh giao diện điều khiển vMix.
          </p>
        </div>

        <div style="font-size: 11px; color: var(--text-sub); margin-top: 5px; text-align: center; width: 100%;">
          Bản quyền: Nguyễn Tuấn - 08543.08534
        </div>

      </div>
    </div>
  `,
  setup(props, { emit }) {
    const username = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');
    const qrTimestamp = ref(Date.now());

    const triggerVibe = () => {
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    const handleSubmit = async () => {
      loading.value = true;
      error.value = '';
      triggerVibe();

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username.value,
            password: password.value
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          emit('login-success');
        } else {
          error.value = data.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        }
      } catch (err) {
        error.value = 'Không thể kết nối đến máy chủ.';
      } finally {
        loading.value = false;
      }
    };

    return {
      username,
      password,
      loading,
      error,
      qrTimestamp,
      handleSubmit
    };
  }
};
