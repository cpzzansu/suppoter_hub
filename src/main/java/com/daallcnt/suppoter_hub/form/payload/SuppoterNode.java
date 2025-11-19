package com.daallcnt.suppoter_hub.form.payload;

import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
public class SuppoterNode {

    private Long id;
    private String name;
    private String phone;
    private String address;
    private String recommend;
    private String recommendPhone;
    private List<SuppoterNode> children = new ArrayList<>();

    private int totalDescendantCount;

    public SuppoterNode(Suppoter e) {
       this.id = e.getId();
       this.name = e.getName();
       this.phone = e.getPhone();
       this.address = e.getAddress();
       this.recommend = e.getRecommend();
    }
}
