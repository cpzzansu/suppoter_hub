package com.daallcnt.suppoter_hub.form.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(name = "suppoter_deletion_log")
public class SuppoterDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long originalId;
    private String name;
    private String phone;
    private String address;
    private String recommend;
    private String recommenderName;
    private Boolean isRightsMember;
    private LocalDateTime originalCreatedAt;
    private LocalDateTime deletedAt;
    private String deletedBy;
    private String reason;
}
