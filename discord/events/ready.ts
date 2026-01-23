import { Client, Events } from 'discord.js';
import { deployCommands } from '../utils';
import { LavalinkNodeState } from '../config';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log('✅ Ready! Logged in as ' + (client.user ? client.user.tag : 'unknown'));
    
    // Lavalink 연결 상태 확인
    if (client.shoukaku) {
      const nodes = Array.from(client.shoukaku.nodes.values());
      const connectedNodes = nodes.filter((n) => (n as { state?: number }).state === LavalinkNodeState.CONNECTED);
      
      if (connectedNodes.length > 0) {
        console.log(`✅ Lavalink connected: ${connectedNodes.length} node(s) ready`);
      } else {
        if (nodes.length > 0) {
          const nodeStates = nodes.map((n) => {
            const state = (n as { state?: number }).state;
            const name = (n as { name?: string }).name || 'unknown';
            return `${name}: ${state} (0=DISCONNECTED, 1=CONNECTING, 2=CONNECTED, 3=RECONNECTING)`;
          });
          console.warn('⚠️  Lavalink nodes not connected. Node states:', nodeStates.join(', '));
        } else {
          console.warn('⚠️  No Lavalink nodes configured.');
        }
        console.warn('⚠️  Please ensure Lavalink server is running: java -jar discord/lavalink/Lavalink.jar');
        console.warn('⚠️  Music commands will not work until Lavalink is connected.');
        console.warn('💡 Lavalink will automatically reconnect when available.');
      }
    } else {
      console.warn('⚠️  Lavalink is not initialized. Music commands will not work.');
    }
    
    try {
      await deployCommands(client);
      console.log('✅ Slash commands deployed on ready');
    } catch (error) {
      console.error('❌ Failed to deploy slash commands on ready:', error);
    }
  },
};
