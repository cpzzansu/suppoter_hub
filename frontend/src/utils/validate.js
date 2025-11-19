export function validatePhoneNumber(formatted) {
  // 000-0000-0000 형태인지
  const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
  return phoneRegex.test(formatted);
}

export const validateForm = (formData, isPrivacyAgree) => {
  if (formData.name.length === 0) {
    alert('이름을 입력해주세요.');
    return false;
  }
  if (
    formData.phone.length === 0 ||
    validatePhoneNumber(formData.phone) === false
  ) {
    alert('전화번호를 제대로 입력해주세요.');
    return false;
  }
  if (formData.address.length === 0) {
    alert('지역을 입력해주세요.');
    return false;
  }
  if (isPrivacyAgree === false) {
    alert('개인정보활용에 동의해주세요.');
    return false;
  }

  if (formData.recommend.length === 0) {
    alert('추천인 이름을 입력해주세요.');
    return false;
  }

  return true;
};

export const checkModifyValue = ({ formData, selectedNode }) => {
  let valueEqual = true;

  if (formData.name !== selectedNode.name) valueEqual = false;
  if (formData.phone !== selectedNode.phone) valueEqual = false;
  if (formData.address !== selectedNode.address) valueEqual = false;
  if (formData.recommend !== selectedNode.recommend) valueEqual = false;
  if (formData.recommendPhone !== selectedNode.recommendPhone)
    valueEqual = false;

  return valueEqual;
};
