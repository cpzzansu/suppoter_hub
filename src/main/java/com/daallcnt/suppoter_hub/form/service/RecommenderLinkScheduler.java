package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.repository.SuppoterRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecommenderLinkScheduler {

    private final SuppoterRepository suppoterRepository;

    private static String normalizeName(String s) {
        if (s == null) return null;
        return s.replaceAll("\\s+", "");
    }

    // 매 정각마다 (원하면 fixedRate로 바꿔도 됨)
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void linkRecommenders() {

        List<Suppoter> targets = suppoterRepository
                .findByRecommenderIsNullAndRecommendIsNotNull();

        if (targets.isEmpty()) return;

        // name 정규화 기준으로 추천인 후보 맵 구성
        // (동명이인/공백만 다른 중복 대비해서 List로 받는 게 안전)
        Map<String, List<Suppoter>> byNormName = suppoterRepository.findAll().stream()
                .filter(s -> s.getName() != null)
                .collect(Collectors.groupingBy(s -> normalizeName(s.getName())));

        int linked = 0;
        int updatedRecommend = 0;

        for (Suppoter s : targets) {
            String rawRecommend = s.getRecommend();
            String normRecommend = normalizeName(rawRecommend);

            if (normRecommend == null || normRecommend.isBlank()) continue;

            // (선택) DB에도 공백 제거된 recommend로 저장해두고 싶다면
            if (!Objects.equals(rawRecommend, normRecommend)) {
                s.setRecommend(normRecommend);
                updatedRecommend++;
            }

            List<Suppoter> candidates = byNormName.get(normRecommend);
            if (candidates == null || candidates.isEmpty()) continue;

            // 동명이인(정규화 기준 중복) 처리: 1명일 때만 자동 연결
            if (candidates.size() == 1) {
                Suppoter recommender = candidates.get(0);

                // 자기 자신을 추천인으로 연결하는 걸 막고 싶으면
                if (Objects.equals(s.getId(), recommender.getId())) continue;

                s.setRecommender(recommender);
                linked++;
            } else {
                // 중복이면 로그만 남기고 스킵 (필요 시 추가 규칙 도입)
                log.warn("Recommender name '{}' is ambiguous ({} candidates). targetId={}",
                        normRecommend, candidates.size(), s.getId());
            }
        }

        log.info("Recommender linking done. linked={}, recommendNormalizedUpdated={}", linked, updatedRecommend);
    }
}
