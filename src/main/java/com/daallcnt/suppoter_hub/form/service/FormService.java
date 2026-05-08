package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.entity.SuppoterDeletionLog;
import com.daallcnt.suppoter_hub.form.payload.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.List;

public interface FormService {
    void form(FormDataDto formDataDto, HttpServletRequest request) throws IOException, InterruptedException;

    ResponseEntity<AdminHomeDto> fetchTreeMap(int currentPage);
    ResponseEntity<SupportersTotalCountDto> fetchSupportersTotalCount();

    ResponseEntity<List<Integer>> fetchPageNumberList();

    ResponseEntity<List<SuppoterNode>> fetchSheetSupporter();

    ResponseEntity<SuppoterNode> fetchLeaderNode(Long leaderId);

    ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(Long leaderId);

    ResponseEntity<List<RecommendRankDto>> fetchRanking(boolean includePath);

    default ResponseEntity<List<RecommendRankDto>> fetchRanking() {
        return fetchRanking(false);
    }

    /** 직계자손(직접 추천한 사람 수) 랭킹. 자식 수 10명 이상만. */
    ResponseEntity<List<RecommendRankDto>> fetchDirectChildrenRanking(boolean includePath);

    ResponseEntity<Page<RegionRowDto>> fetchRegion(String region, String keyword, boolean unapplied, Pageable pageable);

    ResponseEntity<List<RegionRowView>> fetchRightMember();

    ResponseEntity<List<RegionRowView>> fetchRegionExcel(String region, String keyword, boolean unapplied);

    /**
     * 전화번호 목록을 받아 해당 번호와 매칭되는 Supporter만 반환.
     * 010-0000-0000 형식으로 정규화 후 매칭.
     */
    ResponseEntity<List<MatchedSupporterView>> matchSupporterByPhones(List<String> phoneNumbers);

    /**
     * 서포터를 삭제하기 전 삭제 로그(audit trail)를 남긴 뒤 hard delete.
     * - 하위 피추천자는 삭제 대상의 상위 추천인(grandparent)으로 재할당 (없으면 null).
     * - 삭제 내역은 suppoter_deletion_log 테이블에 보존된다.
     */
    void deleteSuppoterWithLog(Long id, String reason);

    ResponseEntity<List<SuppoterDeletionLog>> fetchDeletionLog();
}
