package com.daallcnt.suppoter_hub.form.payload;

import java.util.List;

/**
 * 연락처 가져오기에서 전화번호 목록을 서버로 보내 매칭된 Supporter를 조회할 때 사용.
 */
public record MatchSupporterByPhonesRequest(List<String> phoneNumbers) {
}
