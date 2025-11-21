package com.daallcnt.suppoter_hub.member.service.impl;

import com.daallcnt.suppoter_hub.common.security.JwtTokenProvider;
import com.daallcnt.suppoter_hub.form.entity.Member;
import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.form.payload.MemberLoginDto;
import com.daallcnt.suppoter_hub.member.repository.MemberRepository;
import com.daallcnt.suppoter_hub.member.service.LoginService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LoginServiceImpl implements LoginService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public ResponseEntity<LoginResponseDto> login(MemberLoginDto loginDto) {
        Member member = memberRepository.findByMemberId(loginDto.getMemberId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(loginDto.getPassword(), member.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong password");
        }

        String token = jwtTokenProvider.generateToken(member);

        LoginResponseDto loginResponseDto = LoginResponseDto.builder()
                .memberId(member.getMemberId())
                .token(token)
                .build();

        return ResponseEntity.ok(loginResponseDto);
    }
}
