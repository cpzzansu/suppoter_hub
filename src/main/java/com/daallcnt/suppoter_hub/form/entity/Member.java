package com.daallcnt.suppoter_hub.form.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@ToString
@Entity
@Builder
@AllArgsConstructor
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "member")
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", length = 36, nullable = false, unique = true)
    private String memberId;

    @Column(name = "password", length = 100)
    private String password;

    @Column(name = "name", length = 20)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 50)
    private String email;

    @Column(name = "zonecode", length = 10)
    private String zonecode;

    @Column(name = "address", length = 100)
    private String address;

    @Column(name = "address_detail", length = 100)
    private String addressDetail;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createAt;

    private boolean deleted;
    private LocalDateTime deletedAt;


    public void updateRole(Role role) {
        this.role = role;
    }
}
