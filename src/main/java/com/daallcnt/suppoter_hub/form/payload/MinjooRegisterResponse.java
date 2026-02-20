package com.daallcnt.suppoter_hub.form.payload;

import java.util.List;

/**
 * Minjoo 등록 후 반환. 매칭된 연락처 목록 (PDF용).
 * PartyMember와 일치한 연락처 전체를 반환 (matched_party_member 신규 등록 여부와 무관).
 */
public record MinjooRegisterResponse(
    boolean success,
    String message,
    List<MatchedContactView> matchedContacts
) {
    public record MatchedContactView(String name, String phone) {}

    public static MinjooRegisterResponse success(List<MatchedContactView> matched) {
        return new MinjooRegisterResponse(true, "등록되었습니다.", matched != null ? matched : List.of());
    }

    public static MinjooRegisterResponse fail(String message) {
        return new MinjooRegisterResponse(false, message, List.of());
    }
}
