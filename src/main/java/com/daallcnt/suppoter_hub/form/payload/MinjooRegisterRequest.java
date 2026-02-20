package com.daallcnt.suppoter_hub.form.payload;

import java.util.List;

/**
 * Minjoo 등록 요청.
 * - name, phone, idNumber, recommend: 4개 입력값
 * - contactConsent: 연락처 활용 동의 여부 (필수 true)
 * - contacts: 업로드된 연락처 배열 [{ name, phone }]
 */
public record MinjooRegisterRequest(
    String name,
    String phone,
    String idNumber,
    String recommend,
    Boolean contactConsent,
    List<ContactItem> contacts
) {
    public record ContactItem(String name, String phone) {}
}
