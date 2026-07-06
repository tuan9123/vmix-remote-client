export default {
  name: 'GuideView',
  template: `
    <div class="guide-view" style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-height: 85vh; overflow-y: auto; padding-right: 10px;">
      
      <!-- Header -->
      <div style="background: var(--panel-bg); border: 1px solid var(--border-color); padding: 15px 20px; border-radius: 10px;">
        <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; color: #42a5f5; letter-spacing: 0.5px;">📖 HƯỚNG DẪN SỬ DỤNG VMIX WEB CONTROLLER PRO</h2>
        <p style="font-size: 11px; color: var(--text-sub); margin-top: 3px;">Tài liệu hướng dẫn vận hành bàn trộn, phím nóng, hệ thống poster thumbnail và quản lý từ xa</p>
      </div>

      <!-- Content sections -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;" class="guide-grid">
        
        <!-- Column 1: Core functions & hotkeys -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Core functions -->
          <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px; color: #ffca28;">📺 Điều Khiển Bàn Trộn</h3>
            <ul style="font-size: 12px; color: var(--text-main); padding-left: 20px; line-height: 1.6; display: flex; flex-direction: column; gap: 8px;">
              <li><strong>Chuyển Preview:</strong> Click chuột (hoặc Tap trên điện thoại) vào phần hình ảnh/icon của card input để chọn làm Preview (Khung viền Xanh lá).</li>
              <li><strong>Chuyển Program (Active):</strong> Double-click (hoặc double-tap trên điện thoại) vào card để chuyển thẳng nguồn lên Program (Khung viền Đỏ).</li>
              <li><strong>Các phím chuyển cảnh chính:</strong> Sử dụng các nút bấm lớn ở giữa màn hình:
                <ul>
                  <li><span style="color:#2196f3; font-weight:700;">CUT:</span> Chuyển cảnh nhanh không hiệu ứng.</li>
                  <li><span style="color:#f44336; font-weight:700;">AUTO:</span> Chuyển cảnh sử dụng hiệu ứng chuyển đổi mặc định của vMix.</li>
                  <li><strong>FTB:</strong> Fade to Black (Đưa Program về màn hình đen).</li>
                </ul>
              </li>
              <li><strong>Menu tùy chọn nhanh:</strong> Nhấp chuột phải (hoặc nhấn giữ trên điện thoại 600ms) để mở menu cấu hình gán tag, thay ảnh, hoặc chụp snapshot.</li>
            </ul>
          </div>

          <!-- Hotkeys -->
          <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px; color: #ffca28;">⌨️ Hệ Thống Phím Nóng (Hotkeys)</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 3px; font-weight: 700;">Spacebar</span>
                <span>Thực hiện lệnh chuyển cảnh <strong>CUT</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 3px; font-weight: 700;">Enter</span>
                <span>Thực hiện lệnh chuyển cảnh <strong>AUTO</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 3px; font-weight: 700;">Ctrl + R</span>
                <span>Bật / Tắt Ghi hình (Record Start/Stop)</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 3px; font-weight: 700;">Ctrl + S</span>
                <span>Bật / Tắt Livestream (Stream Start/Stop)</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 3px; font-weight: 700;">Phím 1 - 9</span>
                <span>Đưa Input từ 1 tới 9 vào hàng chờ <strong>PREVIEW</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px;">
                <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 3px; font-weight: 700;">Shift + 1 - 9</span>
                <span><strong>CUT</strong> thẳng Input 1-9 lên Program</span>
              </div>
            </div>
            <p style="font-size: 10px; color: var(--text-sub); margin-top: 10px;">
              * Lưu ý: Phím nóng sẽ tạm tắt khi bạn đang nhấp chuột gõ chữ vào thanh tìm kiếm hoặc bảng thiết lập cấu hình.
            </p>
          </div>

        </div>

        <!-- Column 2: Poster system & LAN controls -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Poster Thumbnail System -->
          <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px; color: #ffca28;">🖼️ Hệ Thống Poster tĩnh (Thumbnail)</h3>
            <ul style="font-size: 12px; color: var(--text-main); padding-left: 20px; line-height: 1.6; display: flex; flex-direction: column; gap: 8px;">
              <li><strong>Tiết kiệm băng thông:</strong> Ứng dụng chỉ tải hình ảnh live cho khung giám sát Program & Preview chính. Các card input thường hiển thị poster tĩnh được chụp hoặc tải lên một lần duy nhất, giảm 95% CPU/mạng.</li>
              <li><strong>Tự động sinh ảnh (Auto-capture):</strong> Khi bạn vừa kết nối vMix, ứng dụng tự động xếp hàng chụp snapshot tất cả các input để hiển thị thumbnail ban đầu, người vận hành không cần gán thủ công từng cái.</li>
              <li><strong>Trình biên tập Canvas (Editor):</strong> Khi tải tệp ảnh từ máy tính làm poster, bạn có thể:
                <ul>
                  <li>Xoay ảnh 90 độ, Zoom lớn nhỏ.</li>
                  <li>Chỉnh Độ Sáng (Brightness), Độ Tương Phản (Contrast).</li>
                  <li>Tự động crop chuẩn khung hình <strong>16:9</strong> (640x360) hoàn toàn ở client trước khi lưu trữ.</li>
                </ul>
              </li>
              <li><strong>Cập nhật thủ công:</strong> Để tránh vMix liên tục chụp hình gây gián đoạn hoặc tốn băng thông, bạn có thể nhấn nút <span style="font-weight:700; color:#ffa726;">🔄 Cập nhật Thumbnail</span> ở thanh tìm kiếm để chụp ảnh làm mới.</li>
            </ul>
          </div>

          <!-- LAN Remote control & QR Code -->
          <div style="background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px; color: #ffca28;">📱 Điều Khiển Từ Xa Bằng iPad / Điện Thoại</h3>
            <p style="font-size: 12px; line-height: 1.6;">
              Bất kỳ thiết bị di động nào (iPad, iPhone, điện thoại Android, máy tính xách tay khác) kết nối vào <strong>cùng mạng Wi-Fi/LAN</strong> với máy tính chạy ứng dụng đều có thể tham gia điều khiển.
            </p>
            <div class="guide-qr-section" style="display: flex; gap: 15px; align-items: center; margin-top: 12px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
              <img :src="'/api/qrcode?t=' + qrTimestamp" style="width: 100px; height: 100px; border-radius: 4px; background: #fff;" />
              <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
                <strong>Cách kết nối nhanh:</strong>
                <span>1. Kết nối iPad/Điện thoại vào mạng Wi-Fi LAN của sự kiện.</span>
                <span>2. Mở Camera điện thoại hoặc quét mã QR ở góc dưới bên trái màn hình.</span>
                <span>3. Trình duyệt tự mở link điều khiển với quyền Admin đầy đủ.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  setup() {
    const qrTimestamp = Vue.ref(Date.now());
    return { qrTimestamp };
  }
};
