import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { matchSupporterByPhonesApi } from '../apis/admin/adminApi.js';

/** Quoted-Printable 디코딩 (안드로이드 VCF 한글 등 =EC=9D=B4 형태) */
function decodeQuotedPrintable(str) {
  if (!str || typeof str !== 'string') return str;
  if (!/=[0-9A-Fa-f]{2}/i.test(str)) return str;
  try {
    let cleaned = str.replace(/=\r?\n/g, '');
    while (
      cleaned.endsWith('=') &&
      cleaned.length > 1 &&
      !/=[0-9A-Fa-f]{2}$/i.test(cleaned)
    ) {
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
          bytes.push(...new TextEncoder().encode(cleaned[i]));
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

  // RFC6350 line folding 대응: 다음 줄이 공백/탭으로 시작하면 이전 줄에 이어붙임
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
    let value = decodeQuotedPrintable(line.slice(idx + 1).trim());

    if (keyPart.startsWith('FN')) {
      current.name = current.name || value;
    } else if (keyPart.startsWith('N') && !current.name) {
      // N:성;이름;... 형태를 간단 조합
      const parts = value.split(';');
      const family = parts[0] ?? '';
      const given = parts[1] ?? '';
      const full = `${family}${given}`.trim();
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

  // +82 / 82 형식 -> 국내 0 시작 형식으로 맞춤
  if (digits.startsWith('82')) {
    digits = digits.slice(2);
    if (digits && !digits.startsWith('0')) {
      digits = `0${digits}`;
    }
  }
  return digits;
}

const PAGE_SIZE = 100;
const DISPLAY_LIMIT = 100; // 가져온 연락처 테이블 최대 렌더 수 (모바일 DOM 부담 방지)

const ContactImportHelper = () => {
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const [supporterPhoneMap, setSupporterPhoneMap] = useState(new Map());
  const [supporterLoading, setSupporterLoading] = useState(false);
  const [supporterError, setSupporterError] = useState('');
  const [page, setPage] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  useEffect(() => {
    if (contacts.length === 0) {
      setSupporterPhoneMap(new Map());
      setSupporterError('');
      return;
    }

    let mounted = true;
    setSupporterLoading(true);
    setSupporterError('');

    const phoneNumbers = contacts.map((c) => c.tel).filter(Boolean);

    const BATCH_SIZE = 300;
    const batches = [];
    for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
      batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
    }

    Promise.all(batches.map((batch) => matchSupporterByPhonesApi(batch)))
      .then((results) => {
        if (!mounted) return;
        const map = new Map();
        const seen = new Set();
        for (const matched of results) {
          const list = Array.isArray(matched) ? matched : [];
          for (const s of list) {
            const normalized = normalizePhone(s?.phone);
            if (!normalized || seen.has(normalized)) continue;
            seen.add(normalized);
            map.set(normalized, [
              { name: s?.name ?? '', phone: s?.phone ?? '' },
            ]);
          }
        }
        setSupporterPhoneMap(map);
      })
      .catch(() => {
        if (mounted) setSupporterError('Supporter 매칭을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (mounted) setSupporterLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [contacts]);

  const handleAndroidPick = async () => {
    try {
      if (!('contacts' in navigator) || !('ContactsManager' in window)) {
        setMessage(
          '이 브라우저는 연락처 선택 API를 지원하지 않습니다. iPhone/기타 기기는 VCF 업로드를 이용하세요.',
        );
        return;
      }

      const props = (await navigator.contacts.getProperties?.()) ?? [
        'name',
        'tel',
        'email',
      ];
      const requested = props.filter((p) =>
        ['name', 'tel', 'email'].includes(p),
      );

      if (requested.length === 0) {
        setMessage(
          '연락처 선택 API는 지원되지만 name/tel/email 필드는 제공되지 않습니다.',
        );
        return;
      }

      const selected = await navigator.contacts.select(requested, {
        multiple: true,
      });

      const mapped = selected.map((c) => ({
        name: Array.isArray(c.name) ? (c.name[0] ?? '') : (c.name ?? ''),
        tel: Array.isArray(c.tel) ? (c.tel[0] ?? '') : (c.tel ?? ''),
        email: Array.isArray(c.email) ? (c.email[0] ?? '') : (c.email ?? ''),
      }));

      setContacts(mapped);
      setMessage(`안드로이드 연락처 ${mapped.length}건을 가져왔습니다.`);
    } catch (e) {
      // 사용자가 취소한 경우도 여기로 옴
      setMessage('연락처 선택이 취소되었거나 실패했습니다.');
    }
  };

  const handleIosVcfClick = () => {
    fileInputRef.current?.click();
  };

  const handleVcfFileChange = async (e) => {
    const input = e?.target;
    const file = input?.files?.[0];
    if (!file) return;

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage(`파일이 너무 큽니다. ${MAX_SIZE_MB}MB 이하로 줄여 주세요.`);
      setTimeout(() => {
        if (input) input.value = '';
      }, 0);
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseVcf(text);
      const count = parsed.length;
      // 안드로이드: 파일 선택 직후 setState 시 removeChild 오류 방지 (다음 틱으로 연기)
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

  const matchedContacts = useMemo(() => {
    return contacts
      .map((c) => {
        const normalized = normalizePhone(c.tel);
        if (!normalized) return null;
        const supporters = supporterPhoneMap.get(normalized);
        if (!supporters || supporters.length === 0) return null;
        return {
          ...c,
          matchedSupporters: supporters,
        };
      })
      .filter(Boolean);
  }, [contacts, supporterPhoneMap]);

  const paginatedContacts = useMemo(() => {
    const start = page * PAGE_SIZE;
    return matchedContacts.slice(start, start + PAGE_SIZE);
  }, [matchedContacts, page]);

  const totalPages = Math.ceil(matchedContacts.length / PAGE_SIZE) || 1;

  useEffect(() => {
    setPage(0);
    setSelectedIndices(new Set());
  }, [matchedContacts.length]);

  const openSms = (phone) => {
    const digits = normalizePhone(phone);
    if (!digits) return;
    window.location.href = `sms:${digits}`;
  };

  const openSmsToMultiple = (phones) => {
    const digitsList = phones.map(normalizePhone).filter(Boolean);
    if (digitsList.length === 0) return;
    window.location.href = `sms:${digitsList.join(',')}`;
  };

  const toggleSelect = (idx) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectPageAll = () => {
    const start = page * PAGE_SIZE;
    const indices = new Set(selectedIndices);
    for (let i = start; i < start + paginatedContacts.length; i++)
      indices.add(i);
    setSelectedIndices(indices);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(matchedContacts.map((_, i) => i)));
  };

  const clearSelection = () => setSelectedIndices(new Set());

  const getSelectedPhones = () =>
    [...selectedIndices]
      .sort((a, b) => a - b)
      .map(
        (i) =>
          matchedContacts[i]?.tel ||
          matchedContacts[i]?.matchedSupporters?.[0]?.phone,
      )
      .filter(Boolean);

  const sendSelected = () => {
    openSmsToMultiple(getSelectedPhones());
  };

  const copySelectedToClipboard = async () => {
    const phones = getSelectedPhones();
    const text = phones.map((p) => normalizePhone(p) || p).join(', ');
    try {
      await navigator.clipboard.writeText(text);
      setMessage(
        `선택한 ${phones.length}명 전화번호가 클립보드에 복사되었습니다.`,
      );
      setTimeout(() => setMessage(''), 2500);
    } catch {
      setMessage('클립보드 복사에 실패했습니다.');
      setTimeout(() => setMessage(''), 2500);
    }
  };

  const selectedCount = selectedIndices.size;
  const pageIndices = new Set(
    Array.from(
      { length: paginatedContacts.length },
      (_, i) => page * PAGE_SIZE + i,
    ),
  );
  const isPageAllSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((_, i) =>
      selectedIndices.has(page * PAGE_SIZE + i),
    );

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '20px 16px 28px',
        boxSizing: 'border-box',
        backgroundColor: '#DFECFF',
      }}
    >
      <h1 style={{ margin: '0 0 8px', fontSize: '1.35rem' }}>
        연락처 가져오기
      </h1>
      <p style={{ margin: '0 0 18px', color: '#666', lineHeight: 1.45 }}>
        안드로이드는 연락처 선택 API를 사용하고, iPhone은 주소록 내보내기(.vcf)
        파일 업로드 방식으로 처리합니다.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type='button'
          onClick={handleAndroidPick}
          style={{
            padding: '11px 16px',
            borderRadius: 10,
            border: '1px solid #2f6fed',
            background: '#2f6fed',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          안드로이드 연락처 선택
        </button>
        <button
          type='button'
          onClick={handleIosVcfClick}
          style={{
            padding: '11px 16px',
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#fff',
            color: '#333',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          iPhone VCF 업로드
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
      </div>

      {message && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#f7f7f7',
            color: '#444',
            fontSize: '0.95rem',
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 8,
          background: '#f7f7f7',
          color: '#444',
          fontSize: '0.9rem',
        }}
      >
        {supporterLoading && '매칭 중...'}
        {!supporterLoading && supporterError && supporterError}
        {!supporterLoading && !supporterError && contacts.length > 0 && (
          <>매칭 완료 ({matchedContacts.length}명)</>
        )}
        {!supporterLoading && !supporterError && contacts.length === 0 && (
          <>연락처를 선택/업로드하면 Supporter와 매칭합니다.</>
        )}
      </div>

      <div
        style={{ marginTop: 18, border: '1px solid #e5e5e5', borderRadius: 10 }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid #eee',
            fontWeight: 700,
            background: '#fafafa',
          }}
        >
          가져온 연락처 ({contacts.length})
        </div>
        {contacts.length === 0 ? (
          <div style={{ padding: '14px 12px', color: '#777' }}>
            아직 가져온 연락처가 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {contacts.length > DISPLAY_LIMIT && (
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color: '#666',
                  background: '#fafafa',
                }}
              >
                표시 제한: 상위 {DISPLAY_LIMIT}건 (전체 {contacts.length}건)
              </div>
            )}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 520,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>이름</th>
                  <th style={th}>전화번호</th>
                  <th style={th}>이메일</th>
                </tr>
              </thead>
              <tbody>
                {contacts.slice(0, DISPLAY_LIMIT).map((c, idx) => (
                  <tr key={`${c.name}-${c.tel}-${idx}`}>
                    <td style={td}>{c.name || '-'}</td>
                    <td style={td}>{c.tel || '-'}</td>
                    <td style={td}>{c.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{ marginTop: 18, border: '1px solid #e5e5e5', borderRadius: 10 }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid #eee',
            fontWeight: 700,
            background: '#fafafa',
          }}
        >
          매칭된 연락처 ({matchedContacts.length})
        </div>
        {matchedContacts.length === 0 ? (
          <div style={{ padding: '14px 12px', color: '#777' }}>
            연락처를 선택/업로드하면 Supporter 전화번호와 비교해 일치 항목을
            보여줍니다.
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, matchedContacts.length)} /{' '}
                {matchedContacts.length}명
              </span>
              {totalPages > 1 && (
                <>
                  <button
                    type='button'
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      ...btnStyle,
                      opacity: page === 0 ? 0.5 : 1,
                      padding: '6px 12px',
                      fontSize: '0.9rem',
                    }}
                  >
                    이전
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    style={{
                      ...btnStyle,
                      opacity: page >= totalPages - 1 ? 0.5 : 1,
                      padding: '6px 12px',
                      fontSize: '0.9rem',
                    }}
                  >
                    다음
                  </button>
                </>
              )}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type='checkbox'
                  checked={isPageAllSelected}
                  onChange={(e) => {
                    if (e.target.checked) selectPageAll();
                    else {
                      setSelectedIndices((prev) => {
                        const next = new Set(prev);
                        pageIndices.forEach((i) => next.delete(i));
                        return next;
                      });
                    }
                  }}
                />
                이 페이지 선택
              </label>
              <button
                type='button'
                onClick={selectAll}
                style={{
                  ...btnStyle,
                  padding: '6px 12px',
                  fontSize: '0.9rem',
                  background: '#555',
                  borderColor: '#555',
                }}
              >
                전체 선택
              </button>
              <button
                type='button'
                onClick={clearSelection}
                style={{
                  ...btnStyle,
                  padding: '6px 12px',
                  fontSize: '0.9rem',
                  background: '#fff',
                  color: '#555',
                  borderColor: '#999',
                }}
              >
                선택 해제
              </button>
              {selectedCount > 0 && (
                <>
                  <button
                    type='button'
                    onClick={sendSelected}
                    style={{
                      ...btnStyle,
                      padding: '6px 14px',
                      fontSize: '0.9rem',
                    }}
                  >
                    선택 {selectedCount}명 문자 보내기
                  </button>
                  <button
                    type='button'
                    onClick={copySelectedToClipboard}
                    style={{
                      ...btnStyle,
                      padding: '6px 14px',
                      fontSize: '0.9rem',
                      background: '#fff',
                      color: '#2f6fed',
                      borderColor: '#2f6fed',
                    }}
                  >
                    선택 명단 복사
                  </button>
                </>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 700,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...th, width: 40 }}>
                      <input
                        type='checkbox'
                        checked={isPageAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) selectPageAll();
                          else {
                            setSelectedIndices((prev) => {
                              const next = new Set(prev);
                              pageIndices.forEach((i) => next.delete(i));
                              return next;
                            });
                          }
                        }}
                      />
                    </th>
                    <th style={th}>연락처 이름</th>
                    <th style={th}>연락처 전화번호</th>
                    <th style={th}>일치한 Supporter</th>
                    <th style={th}>Supporter 전화번호</th>
                    <th style={th}>문자</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContacts.map((c, idx) => {
                    const globalIdx = page * PAGE_SIZE + idx;
                    const names = c.matchedSupporters
                      .map((s) => s.name || '-')
                      .join(', ');
                    const phones = c.matchedSupporters
                      .map((s) => s.phone || '-')
                      .join(', ');
                    const smsPhone = c.tel || c.matchedSupporters[0]?.phone;
                    return (
                      <tr key={`matched-${c.name}-${c.tel}-${globalIdx}`}>
                        <td style={td}>
                          <input
                            type='checkbox'
                            checked={selectedIndices.has(globalIdx)}
                            onChange={() => toggleSelect(globalIdx)}
                          />
                        </td>
                        <td style={td}>{c.name || '-'}</td>
                        <td style={td}>{c.tel || '-'}</td>
                        <td style={td}>{names}</td>
                        <td style={td}>{phones}</td>
                        <td style={td}>
                          <button
                            type='button'
                            onClick={() => openSms(smsPhone)}
                            style={{
                              ...btnStyle,
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                            }}
                          >
                            문자
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const btnStyle = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #2f6fed',
  background: '#2f6fed',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const th = {
  textAlign: 'left',
  padding: '9px 10px',
  borderBottom: '1px solid #ddd',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
  background: '#f6f6f6',
};

const td = {
  textAlign: 'left',
  padding: '9px 10px',
  borderBottom: '1px solid #eee',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
};

export default ContactImportHelper;
