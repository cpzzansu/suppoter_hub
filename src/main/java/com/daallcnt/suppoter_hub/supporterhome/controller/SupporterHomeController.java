package com.daallcnt.suppoter_hub.supporterhome.controller;

import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.supporterhome.payload.SupporterHomeLoginDto;
import com.daallcnt.suppoter_hub.supporterhome.service.SupporterHomeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/supporterHome")
public class SupporterHomeController {

    private final SupporterHomeService supporterHomeService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody SupporterHomeLoginDto loginDto) {
        log.debug("loginDto: {}",  loginDto);
        return supporterHomeService.login(loginDto);
    }
}
