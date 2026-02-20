package com.daallcnt.suppoter_hub.form.payload;

public interface RecommendRankView {
    Long getRanking();              // 1,2,3...
    /** 해당 행의 서포터(본인) ID - 대표트리 시트 URL용. 네이티브 쿼리 컬럼 id 매핑 */
    Long getId();
    /** 본인의 추천인(부모) ID - recommender_id 컬럼 매핑 */
    Long getRecommender_id();
    String getName();            // 본인 이름
    String getRootName();        // 최상위 supporter 이름
    /** 대표(리더) ID. 네이티브 쿼리 매핑을 위해 root_id 컬럼명 사용 */
    Long getRoot_id();
    Long getRecommendedCount();  // 추천받은 수
    String getPhone();
    String getAddress();
}
