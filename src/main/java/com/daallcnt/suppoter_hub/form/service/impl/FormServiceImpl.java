package com.daallcnt.suppoter_hub.form.service.impl;

import com.daallcnt.suppoter_hub.common.exception.DuplicationSupporterException;
import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import com.daallcnt.suppoter_hub.form.repository.SuppoterRepository;
import com.daallcnt.suppoter_hub.form.service.FormService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FormServiceImpl implements FormService {

    private final SuppoterRepository suppoterRepository;

    @Override
    public void form(FormDataDto formDataDto) {
        if (suppoterRepository.existsByPhone(formDataDto.getPhone())){
            throw new DuplicationSupporterException("이미 등록되어 있어요.");
        }

        Suppoter recommender = resolveRecommender(formDataDto.getRecommend());

        Suppoter suppoter = buildSuppoter(formDataDto, recommender);
        suppoterRepository.save(suppoter);
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchTreeMap(int currentPage) {
        log.debug("Fetching tree map");
        List<Suppoter> rootSupporterList = suppoterRepository.findByRecommendContaining("대표");

        for (Suppoter suppoter : rootSupporterList) {
            log.debug("Found root suppoter: {}", suppoter);
        }

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(r -> toNodeRecursively(r, 0))
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
}
