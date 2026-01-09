package com.daallcnt.suppoter_hub.form.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@ToString
@Entity
@Builder
@AllArgsConstructor
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "supporter_signup_log")
public class SupporterSignupLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "suppoter_id")
    private Suppoter suppoter;

    @Column(nullable = false, length = 64)
    private String ip;

    @Column(nullable = false)
    private LocalDate day;

    private LocalDateTime createdAt;

}
