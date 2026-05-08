package com.daallcnt.suppoter_hub.form.controller;

import com.daallcnt.suppoter_hub.common.exception.APIException;
import com.daallcnt.suppoter_hub.common.security.SheetLinkTokenProvider;
import com.daallcnt.suppoter_hub.form.entity.SuppoterDeletionLog;
import com.daallcnt.suppoter_hub.form.payload.*;

import com.daallcnt.suppoter_hub.form.service.FormService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api")
public class FormController {

    private final FormService formService;
    private final SheetLinkTokenProvider sheetLinkTokenProvider;

    @PostMapping("/form")
    public void form(@RequestBody FormDataDto formDataDto, HttpServletRequest request) throws IOException, InterruptedException {
        log.debug("formDataDto: {}, pageNumber: {}", formDataDto);
        formService.form(formDataDto, request);
    }

    @GetMapping("/fetchTreeMap")
    public ResponseEntity<AdminHomeDto> fetchTreeMap(@RequestParam(name = "currentPage") int currentPage) {
        log.debug("fetchTreeMap currentPage: {}", currentPage);
        return formService.fetchTreeMap(currentPage);
    }

    @GetMapping("/fetchSupportersTotalCount")
    public ResponseEntity<SupportersTotalCountDto> fetchSupportersTotalCount() {
        log.debug("fetchSupportersTotalCount");
        return formService.fetchSupportersTotalCount();
    }

    /**
     * 외부 연동용 공개 API.
     * 루트(전체) 서포터즈 총 인원을 반환한다.
     */
    @GetMapping("/public/supporters/count")
    public ResponseEntity<SupportersTotalCountDto> fetchPublicSupportersCount() {
        log.debug("fetchPublicSupportersCount");
        return formService.fetchSupportersTotalCount();
    }

    @GetMapping("/fetchLeaderNode")
    public ResponseEntity<SuppoterNode> fetchLeaderNode(@RequestParam(name = "leaderId") Long leaderId) {
        log.debug("fetchLeaderNode leaderId: {}", leaderId);
        return formService.fetchLeaderNode(leaderId);
    }

    @GetMapping("/fetchPageNumberList")
    public ResponseEntity<List<Integer>> fetchPageNumberList() {
        log.debug("fetchPageNumberList");
        return formService.fetchPageNumberList();
    }

    @GetMapping("/fetchSheetSupporter")
    public ResponseEntity<List<SuppoterNode>> fetchSheetSupporter() {
        log.debug("fetchSheetSupporter");
        return formService.fetchSheetSupporter();
    }

    @GetMapping("/fetchSheetForLeader")
    public ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(@RequestParam Long leaderId) {
        log.debug("fetchSheetForLeader  leaderId: {}", leaderId);
        return formService.fetchSheetForLeader(leaderId);
    }

    /**
     * 대표트리 공유 링크용 토큰 발급 (관리자 화면에서 호출).
     * 응답: 서명된 토큰 문자열
     */
    @GetMapping("/sheetLinkToken")
    public ResponseEntity<String> sheetLinkToken(@RequestParam Long leaderId) {
        log.debug("sheetLinkToken leaderId: {}", leaderId);
        return ResponseEntity.ok(sheetLinkTokenProvider.generateToken(leaderId));
    }

    /**
     * 대표트리 공유 링크용 조회 (공개 URL에서 사용).
     * query param t(토큰)를 검증한 뒤 해당 leaderId 트리를 반환한다.
     */
    @GetMapping("/fetchSheetForLeaderByToken")
    public ResponseEntity<List<SuppoterNode>> fetchSheetForLeaderByToken(@RequestParam(name = "t") String token) {
        Long leaderId = sheetLinkTokenProvider.validateAndGetLeaderId(token);
        if (leaderId == null) {
            throw new APIException(HttpStatus.BAD_REQUEST, "invalid token");
        }
        log.debug("fetchSheetForLeaderByToken leaderId: {}", leaderId);
        return formService.fetchSheetForLeader(leaderId);
    }

    @GetMapping("/fetchRanking")
    public ResponseEntity<List<RecommendRankDto>> fetchRanking(
            @RequestParam(name = "includePath", defaultValue = "false") boolean includePath
    ) {
        log.debug("fetchRanking includePath={}", includePath);
        return formService.fetchRanking(includePath);
    }

    @GetMapping("/fetchDirectChildrenRanking")
    public ResponseEntity<List<RecommendRankDto>> fetchDirectChildrenRanking(
            @RequestParam(name = "includePath", defaultValue = "false") boolean includePath
    ) {
        log.debug("fetchDirectChildrenRanking includePath={}", includePath);
        return formService.fetchDirectChildrenRanking(includePath);
    }

    @GetMapping("/fetchRegion")
    public ResponseEntity<Page<RegionRowDto>> fetchRegion(@RequestParam(name = "region") String region,
                                                        @RequestParam(name = "keyword") String keyword,
                                                        @RequestParam(name = "unapplied", defaultValue = "false") boolean unapplied,
                                                        @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        log.debug("fetchRegion region: {}, keyword: {}, unapplied: {}", region, keyword, unapplied);
        String kw = (keyword == null) ? null : keyword.trim();
        if (kw != null && kw.isEmpty()) kw = null;

        return formService.fetchRegion(region, kw, unapplied, pageable);
    }

    @GetMapping("/fetchRightMember")
    public ResponseEntity<List<RegionRowView>> fetchRightMember() {
        log.debug("fetchRightMember");
        return formService.fetchRightMember();
    }

    @GetMapping("/fetchRegionExcel")
    public ResponseEntity<List<RegionRowView>> fetchRegionExcel(@RequestParam(name = "region") String region,
                                                                @RequestParam(name = "keyword") String keyword,
                                                                @RequestParam(name = "unapplied", defaultValue = "false") boolean unapplied) {

        log.debug("fetchRegionExcel region: {}, keyword: {}, unapplied: {}", region, keyword, unapplied);
        return formService.fetchRegionExcel(region, keyword, unapplied);
    }

    /**
     * 삭제 로그 전체 조회 (관리자 전용).
     */
    @GetMapping("/admin/suppoter/deletion-log")
    public ResponseEntity<List<SuppoterDeletionLog>> fetchDeletionLog() {
        return formService.fetchDeletionLog();
    }

    /**
     * 서포터 삭제 (관리자 전용).
     * 삭제 전 suppoter_deletion_log에 스냅샷을 저장하고, 피추천자는 상위 추천인으로 재할당한다.
     */
    @DeleteMapping("/admin/suppoter/{id}")
    public ResponseEntity<Void> deleteSuppoter(
            @PathVariable Long id,
            @RequestParam(name = "reason", required = false) String reason) {
        log.info("deleteSuppoter id={}, reason={}", id, reason);
        formService.deleteSuppoterWithLog(id, reason);
        return ResponseEntity.noContent().build();
    }

    /**
     * 연락처 가져오기: 전화번호 목록을 보내 매칭된 Supporter만 반환.
     * 010-0000-0000 형식으로 정규화 후 매칭.
     */
    @PostMapping("/matchSupporterByPhones")
    public ResponseEntity<List<MatchedSupporterView>> matchSupporterByPhones(
            @RequestBody MatchSupporterByPhonesRequest request) {
        log.debug("matchSupporterByPhones count: {}", request != null && request.phoneNumbers() != null ? request.phoneNumbers().size() : 0);
        return formService.matchSupporterByPhones(request != null ? request.phoneNumbers() : List.of());
    }
}
