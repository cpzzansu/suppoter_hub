package com.daallcnt.suppoter_hub.supporterhome.service.impl;

import com.daallcnt.suppoter_hub.common.security.JwtTokenProvider;
import com.daallcnt.suppoter_hub.form.entity.Member;
import com.daallcnt.suppoter_hub.form.entity.Role;
import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.form.repository.SuppoterRepository;
import com.daallcnt.suppoter_hub.member.repository.MemberRepository;
import com.daallcnt.suppoter_hub.supporterhome.payload.SupporterHomeLoginDto;
import com.daallcnt.suppoter_hub.supporterhome.service.SupporterHomeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SupporterHomeServiceImpl implements SupporterHomeService {

    private final SuppoterRepository suppoterRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public ResponseEntity<LoginResponseDto> login(SupporterHomeLoginDto loginDto) {
        List<Suppoter> suppoterList = suppoterRepository.findByName(loginDto.getName());

        if (suppoterList.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);

        Suppoter suppoter = suppoterList.getFirst();

        if (!suppoter.getPhone().equals(loginDto.getPhone()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        Member member = memberRepository.findByMemberId(loginDto.getName()).orElse(null);

        if (member == null) {
            member = Member.builder()
                    .memberId(loginDto.getName())
                    .password(passwordEncoder.encode(loginDto.getPhone()))
                    .phone(loginDto.getPhone())
                    .name(loginDto.getName())
                    .role(Role.GUEST)
                    .createAt(LocalDateTime.now())
                    .deleted(false)
                    .build();

            member = memberRepository.save(member);
        }

        String token = jwtTokenProvider.generateToken(member);
        LoginResponseDto loginResponseDto = LoginResponseDto.builder()
                .memberId(member.getMemberId())
                .token(token)
                .build();

        return ResponseEntity.ok(loginResponseDto);
    }
}
