package com.daallcnt.suppoter_hub.form.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class SupporterMmsListener {

    private final AligoMMSSender aligoMMSSender;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onJoined(SupporterJoinedEvent event) {
        try {
            aligoMMSSender.send(event.phone());
        } catch (Exception e) {
            // 실패해도 가입은 성공이므로 여기서만 로그/재시도 처리
            e.printStackTrace();
        }
    }
}
