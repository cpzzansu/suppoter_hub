package com.daallcnt.suppoter_hub.supporterhome.service;

import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.supporterhome.payload.SupporterHomeLoginDto;
import org.springframework.http.ResponseEntity;

public interface SupporterHomeService {
    ResponseEntity<LoginResponseDto> login(SupporterHomeLoginDto loginDto);
}
