package com.daallcnt.suppoter_hub.form.service.impl;

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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FormServiceImpl implements FormService {

    private final SuppoterRepository suppoterRepository;

    @Override
    public void form(FormDataDto formDataDto, int pageNumber) {
        Suppoter recommender = resolveRecommender(formDataDto.getRecommend());

        Suppoter suppoter = buildSuppoter(formDataDto, recommender, pageNumber);
        suppoterRepository.save(suppoter);
    }

    @Override
    public ResponseEntity<List<SuppoterNode>> fetchTreeMap(int currentPage) {
        List<Suppoter> rootSupporterList =  suppoterRepository.findByPageNumberAndRecommenderIsNull(currentPage);

        List<SuppoterNode> rootNodes = rootSupporterList.stream()
                .map(this::toNodeRecursively)
                .toList();

        for (SuppoterNode suppoterNode : rootNodes) {
            computeDescendantCount(suppoterNode);
        }

        return ResponseEntity.ok(rootNodes);
    }

    @Override
    public ResponseEntity<List<Integer>> fetchPageNumberList() {
        List<Integer> pageNumberList = suppoterRepository.findPageNumberAll();

        return ResponseEntity.ok(pageNumberList);
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

    private Suppoter buildSuppoter(FormDataDto formDataDto, Suppoter recommender, int pageNumber) {
        return Suppoter.builder()
                .pageNumber(pageNumber)
                .name(formDataDto.getName())
                .phone(formDataDto.getPhone())
                .address(formDataDto.getAddress())
                .recommend(formDataDto.getRecommend())
                .recommender(recommender)
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

    private SuppoterNode toNodeRecursively(Suppoter entity) {
        SuppoterNode node = new SuppoterNode(entity);

        if (entity.getRecommendedList() != null && !entity.getRecommendedList().isEmpty()) {
            for (Suppoter child : entity.getRecommendedList()) {
                SuppoterNode childNode = toNodeRecursively(child);
                node.getChildren().add(childNode);
            }
        }

        return node;
    }
}
