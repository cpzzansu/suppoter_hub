import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { minjooRegisterApi } from '../apis/admin/adminApi.js';

/** Quoted-Printable 디코딩 (안드로이드 VCF 한글 등 =EC=9D=B4 형태) */
function decodeQuotedPrintable(str) {
  if (!str || typeof str !== 'string') return str;
  if (!/=[0-9A-Fa-f]{2}/i.test(str)) return str;
  try {
    let cleaned = str.replace(/=\r?\n/g, '');
    while (cleaned.endsWith('=') && cleaned.length > 1 && !/=[0-9A-Fa-f]{2}$/i.test(cleaned)) {
      cleaned = cleaned.slice(0, -1);
    }
    const bytes = [];
    let i = 0;
    while (i < cleaned.length) {
      if (
        cleaned[i] === '=' &&
        i + 2 < cleaned.length &&
        /^[0-9A-Fa-f]{2}$/i.test(cleaned.slice(i + 1, i + 3))
      ) {
        bytes.push(parseInt(cleaned.slice(i + 1, i + 3), 16));
        i += 3;
      } else {
        const code = cleaned.charCodeAt(i);
        if (code <= 0x7f) {
          bytes.push(code);
        } else {
          const enc = new TextEncoder().encode(cleaned[i]);
          bytes.push(...enc);
        }
        i += 1;
      }
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    return str;
  }
}

function parseVcf(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const unfolded = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length) {
      let prev = unfolded[unfolded.length - 1];
      if (prev.endsWith('=')) prev = prev.slice(0, -1);
      unfolded[unfolded.length - 1] = prev + line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  const contacts = [];
  let current = null;
  for (const raw of unfolded) {
    const line = raw.trim();
    if (!line) continue;
    if (line.toUpperCase() === 'BEGIN:VCARD') {
      current = { name: '', tel: '', email: '' };
      continue;
    }
    if (line.toUpperCase() === 'END:VCARD') {
      if (current) contacts.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const keyPart = line.slice(0, idx).toUpperCase();
    let value = line.slice(idx + 1).trim();
    value = decodeQuotedPrintable(value);
    if (keyPart.startsWith('FN')) {
      current.name = current.name || value;
    } else if (keyPart.startsWith('N') && !current.name) {
      const parts = value.split(';');
      const full = `${parts[0] ?? ''}${parts[1] ?? ''}`.trim();
      if (full) current.name = full;
    } else if (keyPart.startsWith('TEL') && !current.tel) {
      current.tel = value;
    } else if (keyPart.startsWith('EMAIL') && !current.email) {
      current.email = value;
    }
  }
  return contacts;
}

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('82')) {
    digits = digits.slice(2);
    if (digits && !digits.startsWith('0')) digits = `0${digits}`;
  }
  return digits;
}

const btnBase = {
  padding: '3.6vw 0',
  borderRadius: '4vw',
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
  border: '1px solid #ddd',
  fontSize: '4.4vw',
};

const inputStyle = {
  width: '100%',
  height: '14vw',
  padding: '4vw 5vw',
  fontSize: '3.6vw',
  border: '1px solid #AAAAAA',
  boxSizing: 'border-box',
};

const formatPhoneDisplay = (digits) => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const Theminjoo = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // 숫자만 저장 (최대 11자리)
  const [phoneError, setPhoneError] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [recommend, setRecommend] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [serverMatchedContacts, setServerMatchedContacts] = useState([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMatchedList, setShowMatchedList] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef(null);

  const matchedContacts = serverMatchedContacts;

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
    if (digits.length >= 3 && digits.slice(0, 3) !== '010') {
      setPhoneError('전화번호는 010으로 시작해야 합니다.');
    } else {
      setPhoneError('');
    }
  };

  const handleRegister = async () => {
    const payload = {
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      idNumber: idNumber.trim(),
      recommend: recommend.trim(),
      contactConsent,
      contacts: contacts
        .map((c) => ({ name: c.name ?? '', phone: c.tel ?? '' }))
        .filter((c) => c.phone),
    };
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits) {
      setMessage('전화번호를 입력해 주세요.');
      return;
    }
    if (phoneDigits.length !== 11 || phoneDigits.slice(0, 3) !== '010') {
      setMessage('전화번호는 010으로 시작하는 11자리여야 합니다.');
      return;
    }
    if (!payload.idNumber) {
      setMessage('식별번호를 입력해 주세요.');
      return;
    }
    if (!payload.contactConsent) {
      setMessage('연락처 활용 동의가 필요합니다.');
      return;
    }
    setRegisterLoading(true);
    setMessage('찾는 중...');
    try {
      const res = await minjooRegisterApi(payload);
      if (res?.success) {
        setServerMatchedContacts(res.matchedContacts ?? []);
        setMessage(res.message ?? '당원을 찾았습니다.');
      } else {
        setMessage(res?.message ?? '당원 찾기에 실패했습니다.');
        setServerMatchedContacts([]);
      }
    } catch {
      setMessage('당원을 찾는데 실패했습니다.');
      setServerMatchedContacts([]);
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    if (contacts.length > 0) {
      handleRegister();
    }
  }, [contacts]);

  const handleVcfClick = () => {
    fileInputRef.current?.click();
  };

  const handleVcfFileChange = async (e) => {
    const input = e?.target;
    const file = input?.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage('파일이 너무 큽니다. 5MB 이하로 줄여 주세요.');
      setTimeout(() => {
        if (input) input.value = '';
      }, 0);
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseVcf(text);
      const count = parsed.length;
      setTimeout(() => {
        setContacts(parsed);
        setMessage(`VCF에서 연락처 ${count}건을 읽었습니다.`);
      }, 0);
    } catch {
      setMessage('VCF 파일 읽기에 실패했습니다.');
    } finally {
      setTimeout(() => {
        if (input) input.value = '';
      }, 0);
    }
  };

  const handleDownloadPdf = async () => {
    if (matchedContacts.length === 0) {
      setMessage('매칭된 연락처가 없습니다.');
      return;
    }
    setPdfLoading(true);
    setMessage('');
    const ROWS_PER_PAGE = 35;
    const pages = [];
    for (let i = 0; i < matchedContacts.length; i += ROWS_PER_PAGE) {
      pages.push(matchedContacts.slice(i, i + ROWS_PER_PAGE));
    }
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    for (let p = 0; p < pages.length; p++) {
      const rows = pages[p];
      const div = document.createElement('div');
      div.style.cssText = `
        position: fixed; left: -9999px; top: 0; z-index: -1;
        width: 700px; padding: 16px; font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
        font-size: 12px; color: #000; background: #fff; box-sizing: border-box;
      `;
      div.innerHTML = `
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">당원 명단</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
          <thead>
            <tr style="background: #f5f5f5; border: 1px solid #333;">
              <th style="padding: 8px 10px; text-align: center; border: 1px solid #333; width: 15%;">번호</th>
              <th style="padding: 8px 10px; text-align: center; border: 1px solid #333;">이름</th>
              <th style="padding: 8px 10px; text-align: center; border: 1px solid #333;">전화번호</th>
              <th style="padding: 8px 10px; text-align: center; border: 1px solid #333;">비고</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (c, i) => `
              <tr>
                <td style="padding: 6px 10px; border: 1px solid #333; text-align: center;">${p * ROWS_PER_PAGE + i + 1}</td>
                <td style="padding: 6px 10px; border: 1px solid #333;">${(c.name ?? '-').replace(/</g, '&lt;').replace(/&/g, '&amp;')}</td>
                <td style="padding: 6px 10px; border: 1px solid #333;">${(c.phone ?? c.tel ?? '-').replace(/</g, '&lt;').replace(/&/g, '&amp;')}</td>
                <td style="padding: 6px 10px; border: 1px solid #333;"></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      `;
      document.body.appendChild(div);
      try {
        const canvas = await html2canvas(div, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        document.body.removeChild(div);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (p > 0) doc.addPage();
        const imgH = (canvas.height / canvas.width) * (pageW - 10);
        doc.addImage(
          imgData,
          'JPEG',
          5,
          5,
          pageW - 10,
          Math.min(imgH, pageH - 10),
        );
      } catch (err) {
        document.body.contains(div) && document.body.removeChild(div);
        setMessage('PDF 생성에 실패했습니다.');
        setPdfLoading(false);
        return;
      }
    }
    doc.save('당원명단.pdf');
    setPdfLoading(false);
  };

  return (
    <div
      style={{
        padding: '16vw 10% 40px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '2vw',
        backgroundColor: '#DFECFF',
      }}
    >
      <img
        src='/assets/images/theminjoo_logo.png'
        alt='로고'
        style={{ width: '100%', display: 'block', marginBottom: '10vw' }}
      />

      <input
        type='text'
        placeholder='이름'
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        type='tel'
        placeholder='전화번호 (010-0000-0000)'
        value={formatPhoneDisplay(phone)}
        onChange={handlePhoneChange}
        maxLength={13}
        inputMode='numeric'
        autoComplete='tel'
        style={{
          ...inputStyle,
          ...(phoneError ? { borderColor: '#c00', outlineColor: '#c00' } : {}),
        }}
      />
      {phoneError ? (
        <span style={{ color: '#c00', fontSize: '3.2vw', marginTop: '-1vw' }}>
          {phoneError}
        </span>
      ) : null}
      <input
        type='text'
        placeholder='식별번호'
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
        style={inputStyle}
      />
      <input
        type='text'
        placeholder='추천인'
        value={recommend}
        onChange={(e) => setRecommend(e.target.value)}
        style={inputStyle}
      />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2vw',
          marginTop: '0.8vw',
          fontSize: '3.4vw',
          color: '#222',
        }}
      >
        <input
          type='checkbox'
          checked={contactConsent}
          onChange={(e) => setContactConsent(e.target.checked)}
          style={{ width: '4.5vw', height: '4.5vw' }}
        />
        연락처 활용에 동의합니다. (필수)
      </label>

      <button
        type='button'
        onClick={handleVcfClick}
        style={{
          ...btnBase,
          background: '#003B96',
          color: '#fff',
          marginTop: '2vw',
          marginBottom: '2.6vw',
        }}
      >
        연락처 당원찾기
      </button>
      {typeof document !== 'undefined' &&
        createPortal(
          <input
            ref={fileInputRef}
            type='file'
            accept='.vcf,text/vcard'
            onChange={handleVcfFileChange}
            style={{ display: 'none' }}
          />,
          document.body,
        )}

      <button
        type='button'
        onClick={() => setShowMatchedList((s) => !s)}
        style={{
          ...btnBase,
          background: contacts.length === 0 ? '#999' : '#fff',
          color: contacts.length === 0 ? '#fff' : '#000',
        }}
      >
        내 연락처 {contacts.length > 0 ? `(${contacts.length}명)` : ''}
      </button>

      <button
        type='button'
        onClick={handleDownloadPdf}
        disabled={pdfLoading || matchedContacts.length === 0}
        style={{
          ...btnBase,
          background:
            contacts.length === 0 || pdfLoading || matchedContacts.length === 0
              ? '#999'
              : '#006465',
          color: '#fff',
          opacity: pdfLoading ? 0.8 : 1,
        }}
      >
        {pdfLoading
          ? 'PDF 생성 중...'
          : `당원 명단 다운로드 ${matchedContacts.length > 0 ? `(${matchedContacts.length}명)` : ''}`}
      </button>

      {message && (
        <div
          style={{
            padding: 10,
            background: '#f7f7f7',
            borderRadius: 8,
            fontSize: '0.9rem',
            color: '#444',
          }}
        >
          {message}
        </div>
      )}

      {showMatchedList && matchedContacts.length > 0 && (
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 10,
            overflow: 'hidden',
            marginTop: 8,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              background: '#fafafa',
              fontWeight: 600,
            }}
          >
            매칭된 연락처 ({matchedContacts.length}명)
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr style={{ background: '#f6f6f6' }}>
                  <th
                    style={{
                      padding: 8,
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    이름
                  </th>
                  <th
                    style={{
                      padding: 8,
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    전화번호
                  </th>
                </tr>
              </thead>
              <tbody>
                {matchedContacts.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{c.name || '-'}</td>
                    <td style={{ padding: 8 }}>{c.phone || c.tel || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Theminjoo;
