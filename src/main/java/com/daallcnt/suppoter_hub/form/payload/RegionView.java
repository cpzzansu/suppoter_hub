package com.daallcnt.suppoter_hub.form.payload;

public interface RegionView {
    String getName();              // 본인
    String getRecommenderName();   // 추천자 이름(없으면 null)
    String getPhone();
    String getAddress();
}
