import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const apiUrl = import.meta.env.VITE_GREEN_API_URL;
const idInstance = import.meta.env.VITE_GREEN_API_ID_INSTANCE;
const apiToken = import.meta.env.VITE_GREEN_API_TOKEN;
const hasApi = Boolean(apiUrl && idInstance && apiToken);

async function sendViaGreenApi(chatId, text) {
  const response = await fetch(
    `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: chatId.trim(),
        message: text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.code) {
    throw new Error(data.description || `SendMessage: ${response.status}`);
  }

  return data;
}

async function receiveFromGreenApi() {
  const response = await fetch(`${apiUrl}/waInstance${idInstance}/receiveNotification/${apiToken}`);
  if (response.status === 200) return response.json();
  if (response.status === 204) return null;
  throw new Error(`ReceiveNotification: ${response.status}`);
}

async function deleteNotification(receiptId) {
  await fetch(`${apiUrl}/waInstance${idInstance}/deleteNotification/${apiToken}/${receiptId}`, { method: 'DELETE' });
}

function App() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(hasApi ? 'API ulangan' : 'Demo rejim');
  const [messages, setMessages] = useState([
    { from: 'system', text: 'MAX chat tayyor. Qabul qiluvchining raqamini kiriting.' },
  ]);

  useEffect(() => {
    if (!hasApi) return undefined;
    let stopped = false;
    async function poll() {
      try {
        const notification = await receiveFromGreenApi();
        if (!stopped && notification) {
          const body = notification.body;
          const text = body?.messageData?.textMessageData?.textMessage || body?.messageData?.extendedTextMessageData?.text;
          if (text) setMessages((items) => [...items, { from: 'them', text }]);
          if (notification.receiptId) await deleteNotification(notification.receiptId);
        }
      } catch (error) {
        if (!stopped) setStatus('API xatosi: kalit yoki sozlamani tekshiring');
      }
    }
    const timer = setInterval(poll, 2500);
    poll();
    return () => { stopped = true; clearInterval(timer); };
  }, []);

  function sendMessage(event) {
    event.preventDefault();
    if (!message.trim()) return;
    const text = message.trim();
    setMessages((items) => [...items, { from: 'me', text }]);
    if (hasApi && phone) {
      sendViaGreenApi(phone, text).then(() => setStatus('Xabar yuborildi')).catch((error) => setStatus(`Yuborishda xato: ${error.message}`));
    }
    setMessage('');
  }

  return (
    <main className="app-shell">
      <section className="setup-card">
        <div className="brand"><span className="brand-mark">M</span><span>MAX Chat</span></div>
        <p className="muted">Green API orqali matnli xabar yuborish</p><p className="status">● {status}</p>
        <label>Qabul qiluvchi telefon raqami</label>
        <div className="phone-row">
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="998901234567" />
          <button type="button" onClick={() => setMessages((items) => [...items, { from: 'system', text: phone ? `Chat yaratildi: +${phone}` : 'Avval raqam kiriting.' }])}>Yangi chat</button>
        </div>
      </section>

      <section className="chat-card">
        <header><div><h1>{phone ? `+${phone}` : 'Yangi suhbat'}</h1><span className="online-dot">● Onlayn</span></div><span className="api-label">GREEN API</span></header>
        <div className="messages">{messages.map((item, index) => <div className={`bubble ${item.from}`} key={`${item.text}-${index}`}>{item.text}</div>)}</div>
        <form className="composer" onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Xabar yozing..." /><button type="submit">Yuborish</button></form>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
