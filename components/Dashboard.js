import { useVmixStore } from '../stores/vmixStore.js';

const { computed } = Vue;

export default {
  name: 'Dashboard',
  props: {
    programInput:  { type: Object,  default: null },
    previewInput:  { type: Object,  default: null },
    searchQuery:   { type: String,  default: '' },
    viewMode:      { type: String,  default: 'grid' },
    connected:     { type: Boolean, default: false }
  },
  emits: ['update:searchQuery', 'update:viewMode', 'open-settings'],
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">

      <!-- ── Preview / Program Monitors ── -->
      <div class="monitor-section">

        <!-- PREVIEW -->
        <div class="monitor-box preview-active">
          <div class="monitor-header">
            <span class="monitor-label">PREVIEW</span>
            <span class="monitor-title">{{ previewInput ? previewInput.title : 'Chưa chọn' }}</span>
          </div>
          <div class="monitor-aspect-ratio">
            <img v-if="previewInput && connected" :src="previewThumbnailUrl" :alt="previewInput.title" class="monitor-thumb" />
            <div class="monitor-fallback" v-else>
              <span style="font-size: 22px;">🎬</span>
              <span>{{ connected ? 'CHƯA CHỌN PREVIEW' : 'CHƯA KẾT NỐI vMix' }}</span>
            </div>
          </div>
        </div>

        <!-- PROGRAM -->
        <div class="monitor-box program-active">
          <div class="monitor-header">
            <span class="monitor-label">PROGRAM</span>
            <span class="monitor-title">{{ programInput ? programInput.title : 'Chưa chọn' }}</span>
          </div>
          <div class="monitor-aspect-ratio">
            <img v-if="programInput && connected" :src="programThumbnailUrl" :alt="programInput.title" class="monitor-thumb" />
            <div class="monitor-fallback" v-else>
              <span style="font-size: 22px;">📺</span>
              <span>{{ connected ? 'CHƯA CHỌN PROGRAM' : 'CHƯA KẾT NỐI vMix' }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  setup(props, { emit }) {
    const vmixStore = useVmixStore();

    const programThumbnailUrl = computed(() => {
      if (!props.programInput) return '';
      return `/api/thumbnail/${encodeURIComponent(props.programInput.key)}?t=${vmixStore.thumbnailTimestamp}`;
    });

    const previewThumbnailUrl = computed(() => {
      if (!props.previewInput) return '';
      return `/api/thumbnail/${encodeURIComponent(props.previewInput.key)}?t=${vmixStore.thumbnailTimestamp}`;
    });

    return { programThumbnailUrl, previewThumbnailUrl };
  }
};
