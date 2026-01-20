package com.daallcnt.suppoter_hub.form.payload;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminHomeDto {

    List<SuppoterNode> rootNodes;
    long totalSupportersNumber;
}
