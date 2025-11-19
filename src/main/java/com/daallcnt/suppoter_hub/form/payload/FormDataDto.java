package com.daallcnt.suppoter_hub.form.payload;

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
    private Boolean isRightsMember;

    private Long recommendedId;
}
