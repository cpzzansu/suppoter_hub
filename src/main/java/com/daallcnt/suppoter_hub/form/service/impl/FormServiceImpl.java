package com.daallcnt.suppoter_hub.form.service.impl;

import com.daallcnt.suppoter_hub.common.exception.DuplicationSupporterException;
import com.daallcnt.suppoter_hub.form.entity.SupporterSignupLog;
import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.payload.RecommendRankView;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import com.daallcnt.suppoter_hub.form.repository.SupporterSignupLogRepository;
import com.daallcnt.suppoter_hub.form.repository.SuppoterRepository;
import com.daallcnt.suppoter_hub.form.service.AligoMMSSender;
import com.daallcnt.suppoter_hub.form.service.FormService;
import com.daallcnt.suppoter_hub.form.service.SupporterJoinedEvent;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;



@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FormServiceImpl implements FormService {

    private final SuppoterRepository suppoterRepository;
    private final SupporterSignupLogRepository supporterSignupLogRepository;
    private final ApplicationEventPublisher publisher;

    @Override
    public void form(FormDataDto formDataDto, HttpServletRequest request) throws IOException, InterruptedException {
        String ip = getClientIp(request);

        LocalDate today = LocalDate.now();

        boolean loggedToday = supporterSignupLogRepository.existsByIpAndDay(ip, today);

        if (loggedToday) {
            throw new DuplicationSupporterException("같은 기기로 하루에 두번 제출이 불가능 합니다.");
        }


        if (suppoterRepository.existsByPhone(formDataDto.getPhone())){
            throw new DuplicationSupporterException("이미 가입된 전화번호 입니다.");
        }

        Suppoter recommender = resolveRecommender(formDataDto.getRecommend());

        Suppoter suppoter = buildSuppoter(formDataDto, recommender);
        suppoterRepository.save(suppoter);

        SupporterSignupLog supporterSignupLog = SupporterSignupLog.builder()
                .ip(ip)
                .day(today)
                .suppoter(suppoter)
                .createdAt(LocalDateTime.now())
                .build();
        supporterSignupLogRepository.save(supporterSignupLog);

        publisher.publishEvent(new SupporterJoinedEvent(formDataDto.getPhone()));
    }

    private String getClientIp(HttpServletRequest request) {
        // 프록시/로드밸런서 환경이면 X-Forwarded-For에 원본 IP가 들어오는 경우가 많음
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // "client, proxy1, proxy2" 형태일 수 있어서 첫 번째가 원본
            String first = xff.split(",")[0].trim();
            if (!first.isBlank()) return first;
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();

        return request.getRemoteAddr();
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchTreeMap(int currentPage) {
        List<Suppoter> rootSupporterList = suppoterRepository.findByRecommendContaining("대표");

        for (Suppoter suppoter : rootSupporterList) {
            log.debug("Found root suppoter: {}", suppoter);
        }

//        List<SuppoterNode> rootNodes = rootSupporterList.stream()
//                .map(r -> toNodeRecursively(r, 0))
//                .toList();

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(SuppoterNode::new)
                .toList();

        return ResponseEntity.ok(rootNodes);
    }

    @Override
    public ResponseEntity<List<Integer>> fetchPageNumberList() {
        List<Integer> pageNumberList = suppoterRepository.findPageNumberAll();

        return ResponseEntity.ok(pageNumberList);
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchSheetSupporter() {
        List<Suppoter> rootSupporterList = suppoterRepository.findByRecommendContaining("대표");

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(r -> toNodeRecursively(r, 0))
                .toList();

        return ResponseEntity.ok(rootNodes);
    }

    @Override
    public ResponseEntity<SuppoterNode> fetchLeaderNode(Long leaderId) {
        Suppoter leaderSupporter = suppoterRepository.findById(leaderId).orElseThrow();

        SuppoterNode leaderNode = toNodeRecursively(leaderSupporter, 0);

        return ResponseEntity.ok(leaderNode);
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(Long leaderId) {
        Suppoter leaderSupporter = suppoterRepository.findById(leaderId).orElseThrow();

        List<Suppoter> rootSupporterList = List.of(leaderSupporter);

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(r -> toNodeRecursively(r, 0))
                .toList();

        return ResponseEntity.ok(rootNodes);
    }

    @Override
    public ResponseEntity<List<RecommendRankView>> fetchRanking() {
        return ResponseEntity.ok(suppoterRepository.findRecommendersRankWithRoot(10));
    }

    private Suppoter resolveRecommender(String recommendName) {
        if (recommendName == null || recommendName.isBlank()) {
            return null;
        }

        List<Suppoter> candidates = suppoterRepository.findByName(recommendName);

        if (candidates.size() == 1) {
            return candidates.getFirst();
        }

        return null;
    }

    private Suppoter buildSuppoter(FormDataDto formDataDto, Suppoter recommender) {
        return Suppoter.builder()
                .name(formDataDto.getName())
                .phone(formDataDto.getPhone())
                .address(formDataDto.getAddress())
                .recommend(formDataDto.getRecommend())
                .recommender(recommender)
                .isRightsMember(formDataDto.getIsRightsMember())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private int computeDescendantCount(SuppoterNode node) {
        int count = 0;
        for (SuppoterNode child : node.getChildren()) {
            count += 1 + computeDescendantCount(child);
        }
        node.setTotalDescendantCount(count);
        return count;
    }

    private SuppoterNode toNodeRecursively(Suppoter entity, int depth) {
        SuppoterNode node = new SuppoterNode(entity);
        node.setDepth(depth); // SuppoterNode에 depth 필드 추가

        int descendants = 0;
        List<Suppoter> children = entity.getRecommendedList();
        if (children != null && !children.isEmpty()) {
            for (Suppoter child : children) {
                SuppoterNode childNode = toNodeRecursively(child, depth + 1);
                node.getChildren().add(childNode);
                descendants += 1 + childNode.getTotalDescendantCount();
            }
        }

        node.setTotalDescendantCount(descendants);
        return node;
    }

    private static String normalizeName(String s) {
        if (s == null) return null;
        return s.replaceAll("\\s+", ""); // 모든 공백 제거
    }
}
