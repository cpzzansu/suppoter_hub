package com.daallcnt.suppoter_hub.common.config;

import com.daallcnt.suppoter_hub.form.entity.Member;
import com.daallcnt.suppoter_hub.form.entity.Role;
import com.daallcnt.suppoter_hub.form.repository.MemberRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner createTestUser(MemberRepository memberRepo,
                                            PasswordEncoder passwordEncoder) {
        return args -> {
            if (memberRepo.findByMemberId("admin").isEmpty()) {
                String encoded = passwordEncoder.encode("suppoter!@");

                Member m = Member.builder()
                        .memberId("admin")
                        .password(encoded)
                        .role(Role.MANAGER)
                        .createAt(LocalDateTime.now())
                        .build();

                memberRepo.save(m);
            }
        };
    }
}
