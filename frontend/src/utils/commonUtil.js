export function formatPhoneNumber(value) {
  // 숫자만 추출해서 최대 11자리로 제한
  const digits = value.replace(/\D/g, '').slice(0, 11);

  // 3-4-4 형태로 매칭
  const match = digits.match(/^(\d{3})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  // 아직 11자리가 안 차면 그냥 숫자 리턴
  return digits;
}

export function formatFourDigits(value) {
  // 숫자만 남기고, 최대 4자리로 자르기
  return value.replace(/\D/g, '').slice(0, 4);
}
