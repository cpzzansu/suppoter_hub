package com.daallcnt.suppoter_hub.form.payload;

public interface RecommendRankView {
    Long getRanking();              // 1,2,3...
    String getName();            // 본인 이름
    String getRootName();        // 최상위 supporter 이름
    Long getRecommendedCount();  // 추천받은 수
    String getPhone();
    String getAddress();
}
