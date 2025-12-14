package com.daallcnt.suppoter_hub.form.entity;

import com.daallcnt.suppoter_hub.supporterhome.payload.FormDataDto;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ToString(exclude = {"recommender", "recommendedList"})
@Entity
@Builder
@AllArgsConstructor
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "suppoter")
public class Suppoter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String phone;
    private String address;
    private String recommend;
    private String domainName;
    private int pageNumber;
    private Boolean isRightsMember;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommender_id")
    private Suppoter recommender;

    @Builder.Default
    @OneToMany(mappedBy = "recommender", cascade = CascadeType.ALL)
    private List<Suppoter> recommendedList = new ArrayList<>();

    public void modifyForm(FormDataDto formDataDto, Suppoter recommender) {
        this.name = formDataDto.getName();
        this.phone = formDataDto.getPhone();
        this.address = formDataDto.getAddress();
        this.recommend = formDataDto.getRecommend();
        this.recommender = recommender;
    }
}
