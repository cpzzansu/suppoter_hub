package com.daallcnt.suppoter_hub.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * JWT 인증 실패 시 동작을 정의하는 엔트리 포인트 클래스
 *
 * 이 클래스는 사용자가 인증되지 않은 상태로 보호된 리소스에 접근하려 할 때,
 * 401 Unauthorized 오류를 반환하여 클라이언트에게 인증이 필요함을 알립니다.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JwtAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // 응답 설정
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 에러 메시지 작성
        ErrorResponse errorResponse = new ErrorResponse("Unauthorized", authException.getMessage());

        // JSON으로 응답 작성
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    // 내부 클래스로 간단한 에러 응답 구조 정의
    static class ErrorResponse {
        private String error;
        private String message;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }

        // Getters and setters
        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
