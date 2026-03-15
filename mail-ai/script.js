const GEMINI_API_KEY = 'AIzaSyBKmlUH9QxWiZZQYVaTe9NTI9ycnKl38FQ';

// Tone selection
let selectedTone = 'Chuyên nghiệp';
document.querySelectorAll('.tone-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.tone-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedTone = pill.dataset.tone;
  });
});

async function generateEmail() {

  const goal = document.getElementById('emailGoal').value;
  const customerName = document.getElementById('customerName').value.trim();
  const productName = document.getElementById('productName').value.trim();
  const senderName = document.getElementById('senderName').value.trim();
  const details = document.getElementById('details').value.trim();
  const language = document.getElementById('language').value;

  if (!goal) {
    alert('Vui lòng chọn mục tiêu email');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.querySelector('.btn-text').textContent = 'Đang tạo email…';

  const outputCard = document.getElementById('outputCard');
  const errorBox = document.getElementById('errorBox');

  outputCard.classList.remove('hidden');
  errorBox.style.display = 'none';

  document.getElementById('subjectContent').textContent = '';
  document.getElementById('bodyContent').textContent = '';

  const prompt = `Bạn là chuyên gia viết email marketing và chăm sóc khách hàng.

Hãy viết một email hoàn chỉnh theo thông tin sau:

- Mục tiêu: ${goal}
- Tên khách hàng: ${customerName || 'Quý khách'}
- Sản phẩm/Dịch vụ: ${productName || 'không xác định'}
- Người gửi: ${senderName || 'Đội ngũ hỗ trợ'}
- Giọng điệu: ${selectedTone}
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
    errorBox.style.display = 'block';
    errorBox.textContent = '❌ Hết quota hoặc model lỗi. Vui lòng thử lại sau.';
    return;
  }
  console.log(data);

  try {

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

  } catch (err) {

    errorBox.style.display = 'block';
    errorBox.textContent = '❌ Lỗi: ' + err.message;

    document.getElementById('subjectSection').style.display = 'none';
    document.getElementById('bodySection').style.display = 'none';
  }

  finally {

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
  });
}