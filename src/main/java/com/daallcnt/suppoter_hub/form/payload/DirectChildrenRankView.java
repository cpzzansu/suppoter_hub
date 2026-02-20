package com.daallcnt.suppoter_hub.form.payload;

/**
 * 직계자손(직접 추천한 사람 수) 랭킹용 뷰.
 * recommendedCount = 직계 자식 수 (자신을 직접 추천자로 둔 사람 수).
 */
public interface DirectChildrenRankView {
    Long getRanking();
    Long getId();
    Long getRecommender_id();
    String getName();
    String getRootName();
    Long getRoot_id();
    Long getRecommendedCount();
    String getPhone();
}
