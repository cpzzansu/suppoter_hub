package com.daallcnt.suppoter_hub.common.security;



import com.daallcnt.suppoter_hub.form.entity.Member;
import com.daallcnt.suppoter_hub.form.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Member member = memberRepository.findByMemberId(username).orElseThrow(() ->
                new UsernameNotFoundException("User not found with email:" + username));

        Set<GrantedAuthority> grantedAuthorities = new HashSet<>();

        log.debug(member.getRole().name());

        grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + member.getRole().name()));

        return new User(
                member.getMemberId(),
                "",
                grantedAuthorities
        );

    }
}
