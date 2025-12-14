package com.daallcnt.suppoter_hub.supporterhome.payload;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupporterHomeLoginDto {
    private String name;
    private String phone;
}
