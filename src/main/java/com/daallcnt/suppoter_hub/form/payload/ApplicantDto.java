package com.daallcnt.suppoter_hub.form.payload;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplicantDto {

    private Long id;
    private String name;
    private String phone;
    private String address;
    private String recommend;
    private String recommendPhone;
    private String domainName;
    private String pageNumber;

}
