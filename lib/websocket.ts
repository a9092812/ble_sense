import { auth } from '@/lib/firebase';

export const getWebSocketUrl = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
  const user = auth.currentUser;
  
  if (user) {
    try {
      const token = await user.getIdToken();
      return `${baseUrl}?token=${token}`;
    } catch (e) {
      console.error("Error getting token for WS", e);
    }
  }
  return baseUrl;
};

export class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: (data: any) => void;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private _isConnected = false;

  constructor(url: string, onMessage: (data: any) => void) {
    this.url = url;
    this.onMessage = onMessage;
  }

  get isConnected() {
    return this._isConnected;
  }

  connect() {
    if (this.ws) this.ws.close();

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('✅ Telemetry WebSocket Connected');
      this._isConnected = true;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch {
        // Skip non-JSON messages
      }
    };

    this.ws.onclose = () => {
      console.log('❌ Telemetry WebSocket Disconnected. Reconnecting in 3s...');
      this._isConnected = false;
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    this._isConnected = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }
}
