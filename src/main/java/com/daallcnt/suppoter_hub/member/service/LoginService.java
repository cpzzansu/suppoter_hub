package com.daallcnt.suppoter_hub.member.service;

import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.form.payload.MemberLoginDto;
import org.springframework.http.ResponseEntity;

public interface LoginService {
    ResponseEntity<LoginResponseDto> login(MemberLoginDto loginDto);
}
