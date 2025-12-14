package com.daallcnt.suppoter_hub.supporterhome.service;

import com.daallcnt.suppoter_hub.form.payload.LoginResponseDto;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNode;
import com.daallcnt.suppoter_hub.supporterhome.payload.FormDataDto;
import com.daallcnt.suppoter_hub.supporterhome.payload.SupporterHomeLoginDto;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface SupporterHomeService {
    ResponseEntity<LoginResponseDto> login(SupporterHomeLoginDto loginDto);

    ResponseEntity<SuppoterNode> getModifyInfo(long id);

    ResponseEntity<List<SuppoterNode>> findRecommend(String recommend);

    void modifyForm(FormDataDto formDataDto);

    ResponseEntity<List<SuppoterNode>> fetchRecommendMissing();
}
