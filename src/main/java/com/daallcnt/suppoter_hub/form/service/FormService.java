package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.payload.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.List;

public interface FormService {
    void form(FormDataDto formDataDto, HttpServletRequest request) throws IOException, InterruptedException;

    ResponseEntity<AdminHomeDto> fetchTreeMap(int currentPage);

    ResponseEntity<List<Integer>> fetchPageNumberList();

    ResponseEntity<List<SuppoterNode>> fetchSheetSupporter();

    ResponseEntity<SuppoterNode> fetchLeaderNode(Long leaderId);

    ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(Long leaderId);

    ResponseEntity<List<RecommendRankView>> fetchRanking();

    ResponseEntity<List<RegionView>> fetchRegion(String region);

    ResponseEntity<List<RegionView>> fetchRightMember();
}
