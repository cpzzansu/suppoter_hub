package com.daallcnt.suppoter_hub.form.payload;

/**
 * 전화번호 매칭 결과로 반환하는 Supporter 정보 (id, name, phone).
 */
public record MatchedSupporterView(Long id, String name, String phone) {
}
