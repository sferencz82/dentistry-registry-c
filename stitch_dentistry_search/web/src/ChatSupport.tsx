import { FormEvent, useMemo, useState } from 'react';
import { ApiClient, ChatMessage, ChatRequest } from './api';

type DisplayMessage = ChatMessage & { id: string };

type ChatSupportProps = {
  api: Pick<ApiClient, 'sendChatMessage'>;
  sessionId?: string;
};

const quickReplies: { id: string; label: string; text: string }[] = [
  { id: 'hours', label: 'What are your hours?', text: 'What are your hours?' },
  { id: 'insurance', label: 'Insurance options', text: 'Do you accept Delta Dental and other major insurance?' },
  { id: 'services', label: 'Service list', text: 'Which services are available this week?' },
  { id: 'book', label: 'Book for me', text: 'Can you book for me?' }
];

export const ChatSupport = ({ api, sessionId = 'web-chat-session' }: ChatSupportProps) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'greeting',
      author: 'assistant',
      text: "Hi! I'm the AI receptionist. Ask a question or pick quick replies to get started.",
      type: 'assistant'
    }
  ]);
  const [input, setInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const renderLabel = useMemo(
    () => ({
      assistant: 'AI Assistant',
      user: 'You',
      system: 'System'
    }),
    []
  );

  const appendMessages = (newMessages: ChatMessage[]) => {
    setMessages((prev) => [
      ...prev,
      ...newMessages.map((message, index) => ({
        ...message,
        id: message.id || `${Date.now()}-${index}`
      }))
    ]);
  };

  const pushBookingUpdate = (details: string, status?: string, confirmationNumber?: string) => {
    const formatted = [details, confirmationNumber ? `Confirmation: ${confirmationNumber}` : null]
      .filter(Boolean)
      .join(' — ');
    appendMessages([
      {
        id: `booking-${Date.now()}`,
        author: 'system',
        text: formatted,
        type: status === 'confirmed' ? 'confirmation' : 'status'
      }
    ]);
  };

  const sendRequest = async (payload: ChatRequest) => {
    setSending(true);
    setStatusMessage(null);
    try {
      const response = await api.sendChatMessage(payload);
      appendMessages(response.messages || []);
      if (response.bookingUpdate) {
        pushBookingUpdate(
          response.bookingUpdate.details,
          response.bookingUpdate.status,
          response.bookingUpdate.confirmationNumber
        );
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    appendMessages([{ id: `local-${Date.now()}`, author: 'user', text }]);
    setInput('');
    await sendRequest({ sessionId, text });
  };

  const handleQuickReply = async (replyText: string) => {
    appendMessages([{ id: `quick-${Date.now()}`, author: 'user', text: replyText }]);
    await sendRequest({ sessionId, quickReply: replyText });
  };

  return (
    <section aria-label="ai chat" style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Patient chat</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>Live receptionist updates, booking confirmations, and FAQs.</p>
        </div>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Live</span>
      </header>

      <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 360, overflowY: 'auto', padding: '0.5rem', background: '#f9fafb', borderRadius: 10 }}>
        {messages.map((message) => (
          <div key={message.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{renderLabel[message.author]}</span>
            <div
              style={{
                background:
                  message.author === 'user'
                    ? '#2563eb'
                    : message.type === 'confirmation'
                      ? '#ecfeff'
                      : '#ffffff',
                color: message.author === 'user' ? '#ffffff' : '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '0.5rem 0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
              }}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
        {quickReplies.map((reply) => (
          <button
            key={reply.id}
            type="button"
            onClick={() => handleQuickReply(reply.text)}
            disabled={sending}
            style={{
              borderRadius: 9999,
              padding: '0.35rem 0.9rem',
              border: '1px solid #2563eb',
              background: '#eef2ff',
              color: '#1d4ed8',
              cursor: 'pointer'
            }}
          >
            {reply.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          aria-label="Message text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={sending}
          style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
          placeholder="Ask a question or request a booking"
        />
        <button type="submit" disabled={sending || !input.trim()} style={{ padding: '0.6rem 1rem' }}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {statusMessage && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: '0.5rem' }}>
          {statusMessage}
        </p>
      )}
    </section>
  );
};

export default ChatSupport;
