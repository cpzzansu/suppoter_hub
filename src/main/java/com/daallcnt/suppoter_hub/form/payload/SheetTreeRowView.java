package com.daallcnt.suppoter_hub.form.payload;

/**
 * 대표(leader) 공유 시트(/sheet) 전용 트리 조회 프로젝션.
 * native recursive CTE 결과 컬럼 alias 와 getter 이름을 맞춰야 한다.
 */
public interface SheetTreeRowView {
    Long getId();
    Long getRecommenderId();
    String getName();
    String getPhone();
    String getAddress();
    String getRecommend();
    Boolean getIsRightsMember();
    Integer getDepth();
}

