package com.daallcnt.suppoter_hub.form.payload;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberLoginDto {

    private String memberId;
    private String password;
}
