let GEMINI_API_KEY = '';
try {

  GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
} catch {

  GEMINI_API_KEY = window.VITE_GEMINI_API_KEY || window.GEMINI_API_KEY || '';
}

const STORAGE_KEY = 'mailai.form.v1';
let saveTimer = null;

function getSelectedTones() {
  const inputs = Array.from(document.querySelectorAll('#toneGroup .tone-input'));
  const selected = inputs.filter(i => i.checked).map(i => i.value.trim()).filter(Boolean);
  return selected.length ? selected : ['Chuyên nghiệp'];
}

function setSelectedTones(tones) {
  const set = new Set((tones || []).map(t => String(t).trim()).filter(Boolean));
  const inputs = Array.from(document.querySelectorAll('#toneGroup .tone-input'));
  inputs.forEach(i => {
    i.checked = set.size ? set.has(i.value) : (i.value === 'Chuyên nghiệp');
  });
}

function showToast(message, type = 'info') {
  const host = document.getElementById('toastHost');
  if (!host) return;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  host.appendChild(el);

  requestAnimationFrame(() => el.classList.add('toast--in'));

  setTimeout(() => {
    el.classList.remove('toast--in');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 2400);
}

function getFormState() {
  return {
    emailGoal: document.getElementById('emailGoal')?.value ?? '',
    customerName: document.getElementById('customerName')?.value ?? '',
    productName: document.getElementById('productName')?.value ?? '',
    senderName: document.getElementById('senderName')?.value ?? '',
    details: document.getElementById('details')?.value ?? '',
    language: document.getElementById('language')?.value ?? 'Tiếng Việt',
    tones: getSelectedTones(),
  };
}

function applyFormState(state) {
  if (!state || typeof state !== 'object') return;
  if (typeof state.emailGoal === 'string') document.getElementById('emailGoal').value = state.emailGoal;
  if (typeof state.customerName === 'string') document.getElementById('customerName').value = state.customerName;
  if (typeof state.productName === 'string') document.getElementById('productName').value = state.productName;
  if (typeof state.senderName === 'string') document.getElementById('senderName').value = state.senderName;
  if (typeof state.details === 'string') document.getElementById('details').value = state.details;
  if (typeof state.language === 'string') document.getElementById('language').value = state.language;
  if (Array.isArray(state.tones)) setSelectedTones(state.tones);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormState()));
    } catch { }
  }, 250);
}

function initFormPersistence() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) applyFormState(JSON.parse(raw));
  } catch { }

  const ids = ['emailGoal', 'customerName', 'productName', 'senderName', 'details', 'language'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', scheduleSave));
  document.querySelectorAll('#toneGroup .tone-input').forEach(i => i.addEventListener('change', scheduleSave));
}

async function generateEmail() {

  const goal = document.getElementById('emailGoal').value;
  const customerName = document.getElementById('customerName').value.trim();
  const productName = document.getElementById('productName').value.trim();
  const senderName = document.getElementById('senderName').value.trim();
  const details = document.getElementById('details').value.trim();
  const language = document.getElementById('language').value;
  const selectedTones = getSelectedTones();
  const toneText = selectedTones.join(' + ');

  if (!goal) {
    showToast('Vui lòng chọn mục tiêu email', 'warn');
    return;
  }

  const btn = document.getElementById('generateBtn');
  const outputCard = document.getElementById('outputCard');
  const errorBox = document.getElementById('errorBox');
  const subjectSection = document.getElementById('subjectSection');
  const bodySection = document.getElementById('bodySection');

  if (!GEMINI_API_KEY) {
    outputCard.classList.remove('hidden');
    errorBox.style.display = 'block';
    errorBox.textContent = '❌ Thiếu API key. Hãy tạo file .env trong thư mục mail-ai/ với VITE_GEMINI_API_KEY=... rồi chạy lại.';
    subjectSection.style.display = '';
    bodySection.style.display = '';
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  btn.querySelector('.btn-text').textContent = 'Đang tạo email…';

  try {
    outputCard.classList.remove('hidden');
    errorBox.style.display = 'none';
    subjectSection.style.display = '';
    bodySection.style.display = '';

    document.getElementById('subjectContent').textContent = '';
    document.getElementById('bodyContent').textContent = '';

    const prompt = `Bạn là chuyên gia viết email marketing và chăm sóc khách hàng.

Hãy viết một email hoàn chỉnh theo thông tin sau:

- Mục tiêu: ${goal}
- Tên khách hàng: ${customerName || 'Quý khách'}
- Sản phẩm/Dịch vụ: ${productName || 'không xác định'}
- Người gửi: ${senderName || 'Đội ngũ hỗ trợ'}
- Giọng điệu (có thể mix nhiều): ${toneText}
- Ngôn ngữ: ${language}
- Thông tin cụ thể: ${details || 'Không có thêm thông tin'}

Yêu cầu:
1. Viết email theo ngôn ngữ "${language}".
2. Phải có Call To Action (CTA) rõ ràng ở cuối.
3. Trả về duy nhất một JSON object hợp lệ, phải đóng đủ dấu ngoặc.
4. KHÔNG markdown, KHÔNG backtick, KHÔNG text ngoài JSON.
5. Xuống dòng trong JSON phải dùng \\n.
6. Luôn kết thúc đầy đủ: đóng chuỗi body và dấu } cuối object.

Định dạng bắt buộc:
{"subject":"Tiêu đề email","body":"Dòng 1\\nDòng 2\\nDòng 3"}
`;

    const MODELS = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest'
    ];

    let data = null;
    let lastError = null;

    for (const model of MODELS) {

      try {

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{ text: prompt }]
              }],

              generationConfig: {
                temperature: 0.8,
                // Tăng token để email dài (tiếng Việt, nhiều đoạn) không bị cắt giữa chừng
                maxOutputTokens: 4096,
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!res.ok) {

          let errData = {};
          try {
            errData = await res.json();
          } catch { }

          const msg = errData?.error?.message || `HTTP ${res.status}`;

          if (res.status === 429 || msg.toLowerCase().includes('quota')) {
            lastError = msg;
            continue;
          }

          throw new Error(msg);
        }

        data = await res.json();
        break;

      } catch (e) {

        if (e.message.includes('quota') || e.message.includes('429')) {
          lastError = e.message;
          continue;
        }

        throw e;
      }
    }

    if (!data) {
      const msg = lastError
        ? `❌ Hết quota hoặc model lỗi: ${lastError}`
        : '❌ Hết quota hoặc model lỗi. Vui lòng thử lại sau.';
      throw new Error(msg);
    }

    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      throw new Error("Gemini không trả về nội dung.");
    }

    raw = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      raw = jsonMatch[0];
    }

    if (!raw.endsWith("}")) {
      throw new Error("AI trả JSON chưa hoàn chỉnh.");
    }

    const parsed = JSON.parse(raw);

    const bodyText = (parsed.body || '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');

    document.getElementById('subjectContent').textContent = parsed.subject || '';
    document.getElementById('bodyContent').textContent = bodyText;

    showToast('Đã tạo email xong', 'success');
    scheduleSave();

  } catch (err) {
    errorBox.style.display = 'block';
    errorBox.textContent = String(err?.message || err || 'Có lỗi xảy ra.');

    subjectSection.style.display = 'none';
    bodySection.style.display = 'none';
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.querySelector('.btn-text').textContent = '✨ Tạo Email Ngay';

    outputCard.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}


function copySection(type) {

  const el = type === 'subject'
    ? document.getElementById('subjectContent')
    : document.getElementById('bodyContent');

  const btnTextId = type === 'subject'
    ? 'copySubjectText'
    : 'copyBodyText';

  navigator.clipboard.writeText(el.textContent).then(() => {

    const btn = document.getElementById(btnTextId);
    const parent = btn.closest('.copy-btn');

    btn.textContent = 'Đã copy!';
    parent.classList.add('copied');

    setTimeout(() => {
      btn.textContent = 'Copy';
      parent.classList.remove('copied');
    }, 2000);

    showToast(type === 'subject' ? 'Đã copy Subject' : 'Đã copy nội dung', 'success');
  });
}


function copyAll() {

  const subject = document.getElementById('subjectContent').textContent;
  const body = document.getElementById('bodyContent').textContent;

  const full = `Subject: ${subject}\n\n${body}`;

  navigator.clipboard.writeText(full).then(() => {

    const btn = document.querySelector('.copy-all-btn');
    const orig = btn.textContent;

    btn.textContent = '✅ Đã sao chép toàn bộ!';

    setTimeout(() => {
      btn.textContent = orig;
    }, 2500);

    showToast('Đã copy toàn bộ email', 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFormPersistence();

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateEmail();
    }
  });
});
window.generateEmail = generateEmail;
window.copySection = copySection;
window.copyAll = copyAll;