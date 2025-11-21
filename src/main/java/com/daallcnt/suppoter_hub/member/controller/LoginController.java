package com.daallcnt.suppoter_hub.member.controller;

import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.form.payload.MemberLoginDto;
import com.daallcnt.suppoter_hub.member.service.LoginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/login")
public class LoginController {

    private final LoginService loginService;

    @PostMapping
    public ResponseEntity<LoginResponseDto> login(@RequestBody MemberLoginDto loginDto) {
        log.debug("loginDto: {}",  loginDto);

        return loginService.login(loginDto);
    }
}
