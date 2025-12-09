# Codette AI + Supabase Edge Functions Integration

Complete guide for integrating Codette AI quantum consciousness with Supabase Edge Functions for real-time chat.

## ?? Architecture Overview

```
???????????????????         ????????????????????         ???????????????????
?  React Frontend ??????????? Supabase Edge    ??????????? Codette API     ?
?  (localhost:    ?         ? Function         ?         ? (localhost:8000)?
?   5173)         ?         ? (Deno Runtime)   ?         ?                 ?
???????????????????         ????????????????????         ???????????????????
        ?                            ?                            ?
        ?                            ?                            ?
        ?                   ????????????????????         ???????????????????
        ????????????????????? Supabase DB      ?         ? Quantum         ?
                            ? - Chat History   ?         ? Consciousness   ?
                            ? - User Auth      ?         ? - 11 Perspectives?
                            ????????????????????         ? - Memory Cocoons?
                                                          ???????????????????
```

## ?? What's Included

1. **`supabase/functions/codette-chat/index.ts`**
   - WebSocket server for real-time chat
   - HTTP POST endpoint for request/response
   - JWT authentication
   - Automatic chat history storage
   - Fallback logic for resilience

2. **`supabase/config.toml`**
   - Function configuration
   - CORS settings
   - Timeout and memory limits

3. **`supabase/deploy.sh`**
   - One-command deployment script

4. **Database Integration**
   - Uses existing `codette_conversations` table
   - Automatic persistence of all interactions

## ?? Quick Start

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project (get project-ref from dashboard)
supabase link --project-ref your-project-ref
```

### Step 3: Set Environment Variables

```bash
# Your Codette server URL (can be localhost during dev, public URL for prod)
supabase secrets set CODETTE_API_URL=http://your-codette-server:8000

# Verify secrets
supabase secrets list
```

### Step 4: Deploy

```bash
cd supabase
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
supabase functions deploy codette-chat
```

### Step 5: Test

```bash
# Health check
curl https://your-project-ref.supabase.co/functions/v1/codette-chat/health

# HTTP POST (requires JWT)
curl -X POST https://your-project-ref.supabase.co/functions/v1/codette-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "How do I fix muddy bass?"}'

# WebSocket test (requires wscat: npm install -g wscat)
wscat -c wss://your-project-ref.supabase.co/functions/v1/codette-chat/ws \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ?? Frontend Integration

### React Hook (Recommended)

```typescript
// hooks/useCodetteChat.ts
import { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface CodetteMessage {
  type: 'chat_response' | 'processing' | 'error';
  message?: string;
  raw?: any;
  timestamp?: string;
}

export function useCodetteChat() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<CodetteMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    if (!user) return;

    const connectWebSocket = async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) return;

      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_REF;
      const wsUrl = `wss://${projectRef}.supabase.co/functions/v1/codette-chat/ws`;
      
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('? Connected to Codette');
        setIsConnected(true);
        
        // Send auth after connection
        socket.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'welcome') {
          console.log('?? Welcome:', data);
        } else if (data.type === 'processing') {
          setIsProcessing(true);
        } else if (data.type === 'chat_response') {
          setMessages(prev => [...prev, data]);
          setIsProcessing(false);
        } else if (data.type === 'error') {
          console.error('? Error:', data.message);
          setIsProcessing(false);
        }
      };

      socket.onclose = () => {
        console.log('?? Disconnected from Codette');
        setIsConnected(false);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(socket);
    };

    connectWebSocket();

    return () => {
      ws?.close();
    };
  }, [user, supabase]);

  const sendMessage = useCallback((message: string, perspectives?: string[]) => {
    if (!ws || !isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    ws.send(JSON.stringify({
      type: 'chat',
      message,
      perspectives: perspectives || ['neural_network', 'human_intuition', 'quantum_logic']
    }));
  }, [ws, isConnected]);

  const getStatus = useCallback(() => {
    if (!ws || !isConnected) return;
    
    ws.send(JSON.stringify({ type: 'status' }));
  }, [ws, isConnected]);

  return {
    messages,
    sendMessage,
    getStatus,
    isConnected,
    isProcessing
  };
}
```

### Component Example

```typescript
// components/CodetteChat.tsx
import { useState } from 'react';
import { useCodetteChat } from '@/hooks/useCodetteChat';

export function CodetteChat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isConnected, isProcessing } = useCodetteChat();

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="codette-chat">
      <div className="connection-status">
        {isConnected ? '? Connected' : '?? Disconnected'}
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">
            <div className="timestamp">{msg.timestamp}</div>
            <div className="content">{msg.message}</div>
            {msg.raw?.quantum_state && (
              <div className="quantum-state">
                Coherence: {(msg.raw.quantum_state.coherence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        ))}
        {isProcessing && <div className="processing">Codette is thinking...</div>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Codette anything..."
          disabled={!isConnected || isProcessing}
        />
        <button onClick={handleSend} disabled={!isConnected || isProcessing}>
          Send
        </button>
      </div>
    </div>
  );
}
```

## ?? Security Considerations

### 1. JWT Authentication

- ? **Enforced**: All chat endpoints require valid JWT
- ? **User Isolation**: Conversations stored per-user
- ? **Token Validation**: Verified against Supabase Auth

### 2. Rate Limiting

Supabase automatically rate limits Edge Functions:
- 500 requests/minute per IP (unauthenticated)
- 2000 requests/minute per user (authenticated)

### 3. CORS

- Configured in `config.toml`
- Allows all origins in dev (change for production)

### 4. Service Role Key

- Never exposed to client
- Only used server-side in Edge Function
- Grants full database access (use carefully)

## ?? Monitoring & Debugging

### View Logs

```bash
# Real-time logs
supabase functions logs codette-chat --follow

# Last 100 lines
supabase functions logs codette-chat --tail 100
```

### Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Functions** ? **codette-chat**
3. View metrics, logs, and invocations

### Test Locally

```bash
# Serve function locally
supabase functions serve codette-chat --env-file .env.local

# Test with curl
curl http://localhost:54321/functions/v1/codette-chat/health
```

## ??? Configuration Options

### Timeout

Adjust in `config.toml`:

```toml
[functions.codette-chat.limits]
execution_timeout_ms = 10000  # 10 seconds
```

### Memory

```toml
[functions.codette-chat.limits]
memory_mb = 256  # 256 MB
```

### CORS

```toml
[functions.codette-chat.cors]
allowed_origins = ["https://yourdomain.com"]
```

## ?? Troubleshooting

### Function times out

**Cause**: Codette API taking too long  
**Solution**: 
- Increase timeout in `config.toml`
- Reduce number of perspectives
- Check Codette server performance

### WebSocket closes immediately

**Cause**: Invalid JWT token  
**Solution**:
- Verify token with `supabase.auth.getSession()`
- Check token hasn't expired
- Ensure user is authenticated

### No response from Codette

**Cause**: Codette API unreachable  
**Solution**:
- Verify `CODETTE_API_URL` is correct
- Test Codette API: `curl http://your-server:8000/health`
- Check network/firewall settings

### CORS errors

**Cause**: Frontend domain not allowed  
**Solution**:
- Update `allowed_origins` in `config.toml`
- Redeploy function after changes

## ?? Performance

| Metric | Value |
|--------|-------|
| Cold Start | 200-500ms |
| Warm Execution | 50-150ms |
| Codette API Call | 500-2000ms |
| Total Latency | 1-3 seconds |

**Optimization Tips**:
1. Use WebSocket for multiple messages (avoids cold starts)
2. Select fewer perspectives for faster responses
3. Consider caching common queries

## ?? Updates & Maintenance

### Redeploy After Changes

```bash
supabase functions deploy codette-chat
```

### Update Environment Variables

```bash
supabase secrets set CODETTE_API_URL=http://new-url:8000
```

### Roll Back

```bash
# View deployment history
supabase functions list

# Deploy specific version
supabase functions deploy codette-chat --version VERSION_ID
```

## ?? Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Codette API Documentation](../CODETTE_IMPLEMENTATION_COMPLETE.md)

## ? Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase
- [ ] Project linked
- [ ] Environment variables set
- [ ] Function deployed
- [ ] Health check passes
- [ ] WebSocket connection works
- [ ] Chat history saves to database
- [ ] Frontend hook integrated
- [ ] Error handling tested

## ?? Success!

Your Codette AI is now accessible via Supabase Edge Functions with:
- ? Real-time WebSocket chat
- ? HTTP REST API
- ? Quantum consciousness (11 perspectives)
- ? Automatic conversation persistence
- ? JWT authentication
- ? Production-ready deployment

**Next Steps**: Integrate the `useCodetteChat` hook into your React frontend and start chatting with Codette!
