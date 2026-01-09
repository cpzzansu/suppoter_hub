package com.daallcnt.suppoter_hub.form.service;

import com.daallcnt.suppoter_hub.form.payload.FormDataDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.List;

public interface FormService {
    void form(FormDataDto formDataDto, HttpServletRequest request) throws IOException, InterruptedException;

    ResponseEntity<List<SuppoterNode>> fetchTreeMap(int currentPage);

    ResponseEntity<List<Integer>> fetchPageNumberList();

    ResponseEntity<List<SuppoterNode>> fetchSheetSupporter();

    ResponseEntity<SuppoterNode> fetchLeaderNode(Long leaderId);

    ResponseEntity<List<SuppoterNode>> fetchSheetForLeader(Long leaderId);
}
