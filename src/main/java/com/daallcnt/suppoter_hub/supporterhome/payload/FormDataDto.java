package com.daallcnt.suppoter_hub.supporterhome.payload;

import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FormDataDto {


    private Long id;
    private String name;
    private String phone;
    private String address;
    private String recommend;
    private Long selectedRecommendId;

}
