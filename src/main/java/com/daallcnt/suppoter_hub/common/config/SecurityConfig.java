package com.daallcnt.suppoter_hub.common.config;

import com.daallcnt.suppoter_hub.common.security.JwtAuthenticationEntryPoint;
import com.daallcnt.suppoter_hub.common.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    private final JwtAuthenticationFilter authenticationFilter;

    public static final String[] AUTH_WHITELIST = {
            "/",
            "/api/form",
            "/api/login",
            "/actuator/health/login",
    };

    /**
     * 비밀번호 암호화를 위한 PasswordEncoder 빈 정의.
     * BCryptPasswordEncoder를 사용하여 비밀번호를 안전하게 암호화합니다.
     */
    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager 빈 정의.
     * 스프링 시큐리티의 인증 매니저를 빈으로 등록하여 인증 과정을 관리합니다.
     *
     * @param configuration 인증 구성 정보
     * @return AuthenticationManager 인스턴스
     * @throws Exception 예외 발생 시
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * 보안 필터 체인 설정.
     * HTTP 보안 설정을 정의하여 요청에 대한 접근 제어, 예외 처리, 세션 관리 등을 설정합니다.
     *
     * @param http HttpSecurity 인스턴스
     * @return SecurityFilterChain 인스턴스
     * @throws Exception 예외 발생 시
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authorize -> authorize
                    .requestMatchers(AUTH_WHITELIST).permitAll()
                    // API 요청은 인증 처리
                    .requestMatchers("/api/**").authenticated()
                    // 그 외의 GET 요청은 모두 허용 (SPA 정적 자원 및 라우팅)
                    .requestMatchers(HttpMethod.GET, "/**").permitAll()
                    .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .cors(withDefaults());

        http.addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

