package com.daallcnt.suppoter_hub.form.payload;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponseDto {

    private String token;
    private String memberId;

}

