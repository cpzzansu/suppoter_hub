package com.daallcnt.suppoter_hub.common.security;

import com.daallcnt.suppoter_hub.common.exception.APIException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * 대표트리 "공유 링크"용 서명 토큰 발급/검증.
 *
 * - URL에 leaderId(숫자)를 직접 노출하지 않기 위해, leaderId를 담은 JWT를 query param으로 사용한다.
 * - 토큰은 만료(exp)가 있으며, 서명 검증이 통과해야만 leaderId를 얻을 수 있다.
 */
@Component
@Slf4j
public class SheetLinkTokenProvider {

    /**
     * 별도 시크릿이 없으면 기존 JWT 시크릿을 사용 (운영에서는 sheet-link-secret 별도 권장).
     * 기존 JwtTokenProvider와 동일하게 BASE64 디코드 후 HMAC 키로 사용한다.
     */
    @Value("${app.sheet-link-secret:${app.jwt-secret}}")
    private String secret;

    /** 기본 7일 */
    @Value("${app.sheet-link-expiration-milliseconds:12960000000}")
    private long expirationMs;

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public String generateToken(Long leaderId) {
        if (leaderId == null) {
            throw new APIException(HttpStatus.BAD_REQUEST, "leaderId is required");
        }

        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject("sheet-link")
                .claim("leaderId", leaderId)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Long parseLeaderId(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Object v = claims.get("leaderId");
        if (v == null) return null;
        if (v instanceof Long l) return l;
        if (v instanceof Integer i) return i.longValue();
        if (v instanceof String s) return Long.valueOf(s);
        throw new APIException(HttpStatus.UNAUTHORIZED, "invalid token payload");
    }

    public Long validateAndGetLeaderId(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "token is required");
        }
        try {
            return parseLeaderId(token.trim());
        } catch (ExpiredJwtException e) {
            throw new APIException(HttpStatus.UNAUTHORIZED, "token expired");
        } catch (MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            throw new APIException(HttpStatus.UNAUTHORIZED, "invalid token");
        } catch (Exception e) {
            log.warn("Sheet link token parse error", e);
            throw new APIException(HttpStatus.UNAUTHORIZED, "invalid token");
        }
    }
}

