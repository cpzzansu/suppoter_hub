package com.daallcnt.suppoter_hub.form.payload;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class RecommendRankDto {
    private Long ranking;
    private String name;
    private String rootName;
    @JsonProperty("id")
    private Long id;      // 해당 행의 서포터 ID - 대표트리 시트 URL용 (그 사람 기준 트리)
    private Long rootId;  // 대표(리더) ID
    private Long recommendedCount;
    private String phone;
    private String address;
    private List<String> recommenderPath;
}
