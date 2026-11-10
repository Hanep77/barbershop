import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosInstance from './axios';

const key = import.meta.env.VITE_PUSHER_APP_KEY;

window.Pusher = Pusher;

// Realtime notifications are optional. Without a Pusher key the bell still
// fetches notifications over HTTP instead of crashing the application.
const echo: Echo<'pusher'> | null = key
  ? new Echo({
      broadcaster: 'pusher',
      key,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
      enabledTransports: ['ws', 'wss'],
      authorizer: (channel: any, options: any) => {
        return {
          authorize: (socketId: string, callback: any) => {
            axiosInstance
              .post('/api/broadcasting/auth', {
                socket_id: socketId,
                channel_name: channel.name,
              })
              .then((response) => {
                callback(false, response.data);
              })
              .catch((error) => {
                callback(true, error);
              });
          },
        };
      },
    })
  : null;

export default echo;
