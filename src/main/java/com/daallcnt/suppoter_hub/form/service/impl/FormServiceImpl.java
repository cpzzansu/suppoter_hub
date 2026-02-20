package com.daallcnt.suppoter_hub.form.service.impl;

import com.daallcnt.suppoter_hub.common.exception.DuplicationSupporterException;
import com.daallcnt.suppoter_hub.form.entity.SupporterSignupLog;
import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.payload.*;
import com.daallcnt.suppoter_hub.form.repository.SupporterSignupLogRepository;
import com.daallcnt.suppoter_hub.form.repository.SuppoterRepository;
import com.daallcnt.suppoter_hub.form.service.AligoMMSSender;
import com.daallcnt.suppoter_hub.form.service.FormService;
import com.daallcnt.suppoter_hub.form.service.SupporterJoinedEvent;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;


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
    public ResponseEntity<AdminHomeDto> fetchTreeMap(int currentPage) {
        List<Suppoter> rootSupporterList = suppoterRepository.findByRecommend("대표");

        for (Suppoter suppoter : rootSupporterList) {
            log.debug("Found root suppoter: {}", suppoter);
        }

//        List<SuppoterNode> rootNodes = rootSupporterList.stream()
//                .map(r -> toNodeRecursively(r, 0))
//                .toList();

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(SuppoterNode::new)
                .toList();

        return ResponseEntity.ok(AdminHomeDto.builder()
                        .rootNodes(rootNodes)
                        .totalSupportersNumber(suppoterRepository.countByRecommenderIsNotNull())
                        .build());
    }

    @Override
    public ResponseEntity<List<Integer>> fetchPageNumberList() {
        List<Integer> pageNumberList = suppoterRepository.findPageNumberAll();

        return ResponseEntity.ok(pageNumberList);
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchSheetSupporter() {
        List<Suppoter> rootSupporterList = suppoterRepository.findByRecommend("대표");

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(r -> toNodeRecursively(r, 0))
                .toList();

        return ResponseEntity.ok(rootNodes);
    }

    @Override
    public ResponseEntity<SuppoterNode> fetchLeaderNode(Long leaderId) {
        List<SheetTreeRowView> rows = suppoterRepository.findSheetSubtree(leaderId);
        SuppoterNode root = buildTreeFromSheetRows(rows, leaderId);
        return ResponseEntity.ok(root);
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(Long leaderId) {
        // 기존 구현(toNodeRecursively)은 recommendedList(LAZY)로 인해 노드 수만큼 쿼리가 발생(N+1) → 대량에서 매우 느림.
        // 재귀 CTE로 서브트리를 한 번에 가져온 뒤 메모리에서 트리를 구성한다.
        List<SheetTreeRowView> rows = suppoterRepository.findSheetSubtree(leaderId);
        SuppoterNode root = buildTreeFromSheetRows(rows, leaderId);
        return ResponseEntity.ok(root == null ? List.of() : List.of(root));
    }

    @Override
    public ResponseEntity<List<RecommendRankDto>> fetchRanking(boolean includePath) {
        List<RecommendRankView> views = suppoterRepository.findRecommendersRankWithRoot(10);

        // 화면 렌더링용(빠르게): includePath=false면 recommenderPath 계산 생략
        if (!includePath) {
            List<RecommendRankDto> dtos = views.stream()
                    .map(view -> new RecommendRankDto(
                            view.getRanking(),
                            view.getName(),
                            view.getRootName(),
                            view.getId(),
                            view.getRoot_id(),
                            view.getRecommendedCount(),
                            view.getPhone(),
                            null,
                            List.of()
                    ))
                    .toList();
            return ResponseEntity.ok(dtos);
        }

        // includePath=true (엑셀 등): recommenderPath 계산
        Set<Long> need = new HashSet<>();
        for (RecommendRankView view : views) {
            if (view.getRecommender_id() != null) need.add(view.getRecommender_id());
        }

        Map<Long, SuppoterNodeView> nodeMap = new HashMap<>();
        int guard = 0;

        while (!need.isEmpty() && guard++ < 30) {
            List<Long> batch = need.stream().filter(id -> !nodeMap.containsKey(id)).toList();
            if (batch.isEmpty()) break;

            List<SuppoterNodeView> nodes = suppoterRepository.findNodesByIds(batch);

            need.clear();
            for (SuppoterNodeView n : nodes) {
                nodeMap.put(n.getId(), n);
            }
            for (SuppoterNodeView n : nodes) {
                Long parentId = n.getRecommenderId();
                if (parentId != null && !nodeMap.containsKey(parentId)) need.add(parentId);
            }
        }

        List<RecommendRankDto> dtos = new ArrayList<>(views.size());

        for (RecommendRankView view : views) {
            List<String> path = new ArrayList<>();
            Long cur = view.getRecommender_id();
            Set<Long> seen = new HashSet<>();

            while (cur != null && seen.add(cur)) {
                SuppoterNodeView node = nodeMap.get(cur);
                if (node == null) break;
                path.add(node.getName());
                cur = node.getRecommenderId();
            }

            dtos.add(new RecommendRankDto(
                    view.getRanking(),
                    view.getName(),
                    view.getRootName(),
                    view.getId(),
                    view.getRoot_id(),
                    view.getRecommendedCount(),
                    view.getPhone(),
                    null,
                    path
            ));
        }

        return ResponseEntity.ok(dtos);
    }

    @Override
    public ResponseEntity<List<RecommendRankDto>> fetchDirectChildrenRanking(boolean includePath) {
        List<DirectChildrenRankView> views = suppoterRepository.findDirectChildrenRankWithRoot(10);

        if (!includePath) {
            List<RecommendRankDto> dtos = views.stream()
                    .map(v -> new RecommendRankDto(
                            v.getRanking(),
                            v.getName(),
                            v.getRootName(),
                            v.getId(),
                            v.getRoot_id(),
                            v.getRecommendedCount(),
                            v.getPhone(),
                            null,
                            List.of()
                    ))
                    .toList();
            return ResponseEntity.ok(dtos);
        }

        Set<Long> need = new HashSet<>();
        for (DirectChildrenRankView view : views) {
            if (view.getRecommender_id() != null) need.add(view.getRecommender_id());
        }

        Map<Long, SuppoterNodeView> nodeMap = new HashMap<>();
        int guard = 0;
        while (!need.isEmpty() && guard++ < 30) {
            List<Long> batch = need.stream().filter(id -> !nodeMap.containsKey(id)).toList();
            if (batch.isEmpty()) break;
            List<SuppoterNodeView> nodes = suppoterRepository.findNodesByIds(batch);
            need.clear();
            for (SuppoterNodeView n : nodes) {
                nodeMap.put(n.getId(), n);
            }
            for (SuppoterNodeView n : nodes) {
                Long parentId = n.getRecommenderId();
                if (parentId != null && !nodeMap.containsKey(parentId)) need.add(parentId);
            }
        }

        List<RecommendRankDto> dtos = new ArrayList<>(views.size());
        for (DirectChildrenRankView view : views) {
            List<String> path = new ArrayList<>();
            Long cur = view.getRecommender_id();
            Set<Long> seen = new HashSet<>();
            while (cur != null && seen.add(cur)) {
                SuppoterNodeView node = nodeMap.get(cur);
                if (node == null) break;
                path.add(node.getName());
                cur = node.getRecommenderId();
            }
            dtos.add(new RecommendRankDto(
                    view.getRanking(),
                    view.getName(),
                    view.getRootName(),
                    view.getId(),
                    view.getRoot_id(),
                    view.getRecommendedCount(),
                    view.getPhone(),
                    null,
                    path
            ));
        }
        return ResponseEntity.ok(dtos);
    }

    public ResponseEntity<Page<RegionRowDto>> fetchRegion(String region, String keyword, Pageable pageable) {
        String rg = (region == null || region.trim().isEmpty()) ? "전체" : region.trim();
        String kw = (keyword == null || keyword.trim().isEmpty()) ? null : keyword.trim();

        Page<RegionRowView> page = suppoterRepository.findByRegion(rg, kw, pageable);
        List<RegionRowView> content = page.getContent();

        // 이번 페이지에서 시작할 추천자 ids
        Set<Long> need = new HashSet<>();
        for (RegionRowView row : content) {
            if (row.getRecommenderId() != null) need.add(row.getRecommenderId());
        }

        // 조상 노드 전부 모으기
        Map<Long, SuppoterNodeView> nodeMap = new HashMap<>();
        int guard = 0;

        while (!need.isEmpty() && guard++ < 30) { // 깊이 제한(원하면 조정)
            List<Long> batch = need.stream().filter(id -> !nodeMap.containsKey(id)).toList();
            if (batch.isEmpty()) break;

            List<SuppoterNodeView> nodes = suppoterRepository.findNodesByIds(batch);

            need.clear();
            for (SuppoterNodeView n : nodes) {
                nodeMap.put(n.getId(), n);
            }
            for (SuppoterNodeView n : nodes) {
                Long parentId = n.getRecommenderId();
                if (parentId != null && !nodeMap.containsKey(parentId)) need.add(parentId);
            }
        }

        // 각 row별 path 생성
        List<RegionRowDto> dtos = new ArrayList<>(content.size());

        for (RegionRowView row : content) {
            List<String> path = new ArrayList<>();
            Long cur = row.getRecommenderId();
            Set<Long> seen = new HashSet<>(); // 순환 방지

            while (cur != null && seen.add(cur)) {
                SuppoterNodeView node = nodeMap.get(cur);
                if (node == null) break;

                path.add(node.getName());          // ✅ 바로 위부터 순서대로
                cur = node.getRecommenderId();
            }

            dtos.add(new RegionRowDto(
                    row.getId(),
                    row.getName(),
                    row.getPhone(),
                    row.getAddress(),
                    path
            ));
        }

        return ResponseEntity.ok(new PageImpl<>(dtos, pageable, page.getTotalElements()));
    }

    @Override
    public ResponseEntity<List<RegionRowView>> fetchRightMember() {
        return ResponseEntity.ok(suppoterRepository.findRightsMembers());
    }

    @Override
    public ResponseEntity<List<RegionRowView>> fetchRegionExcel(String region, String keyword) {
        return ResponseEntity.ok(suppoterRepository.findExcelBaseByRegionAndKeyword(region,keyword));
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

    private SuppoterNode buildTreeFromSheetRows(List<SheetTreeRowView> rows, Long rootId) {
        if (rows == null || rows.isEmpty() || rootId == null) return null;

        Map<Long, SuppoterNode> nodeMap = new HashMap<>(rows.size() * 2);

        // 1) 노드 생성(필드 채우기 + depth)
        for (SheetTreeRowView r : rows) {
            SuppoterNode n = nodeMap.computeIfAbsent(r.getId(), id -> new SuppoterNode(emptySuppoter(id)));
            n.setName(r.getName());
            n.setPhone(r.getPhone());
            n.setAddress(r.getAddress());
            n.setRecommend(r.getRecommend());
            n.setIsRightsMember(r.getIsRightsMember());
            n.setDepth(r.getDepth() == null ? 0 : r.getDepth());
        }

        // 2) 부모-자식 연결
        for (SheetTreeRowView r : rows) {
            Long parentId = r.getRecommenderId();
            if (parentId == null) continue;
            SuppoterNode parent = nodeMap.get(parentId);
            SuppoterNode child = nodeMap.get(r.getId());
            if (parent != null && child != null) {
                parent.getChildren().add(child);
            }
        }

        SuppoterNode root = nodeMap.get(rootId);
        if (root == null) return null;

        // 3) 누적인원(하위 총합) 계산
        computeDescendantCount(root);
        return root;
    }

    /**
     * SuppoterNode 생성자 시그니처를 유지하기 위한 최소 Suppoter.
     * (성능 최적화된 sheet 트리 조회에서는 엔티티 로딩을 피한다.)
     */
    private static Suppoter emptySuppoter(Long id) {
        return Suppoter.builder().id(id).build();
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

    @Override
    public ResponseEntity<List<MatchedSupporterView>> matchSupporterByPhones(List<String> phoneNumbers) {
        if (phoneNumbers == null || phoneNumbers.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Set<String> normalizedInput = new java.util.HashSet<>();
        for (String p : phoneNumbers) {
            String n = normalizePhone(p);
            if (!n.isEmpty()) {
                normalizedInput.add(n);
            }
        }
        if (normalizedInput.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<MatchedSupporterView> allWithPhone = suppoterRepository.findAllWithPhoneProjection();
        List<MatchedSupporterView> matched = new java.util.ArrayList<>();
        for (MatchedSupporterView s : allWithPhone) {
            String n = normalizePhone(s.phone());
            if (normalizedInput.contains(n)) {
                matched.add(s);
            }
        }
        return ResponseEntity.ok(matched);
    }

    /**
     * 010-0000-0000 형식(숫자만)으로 정규화. +82/82 → 0 시작으로 변환.
     */
    private static String normalizePhone(String value) {
        if (value == null || value.isBlank()) return "";
        String digits = value.replaceAll("\\D", "");
        if (digits.isEmpty()) return "";
        if (digits.startsWith("82") && digits.length() > 2) {
            digits = "0" + digits.substring(2);
        } else if (!digits.startsWith("0") && digits.length() >= 9) {
            digits = "0" + digits;
        }
        return digits;
    }
}
