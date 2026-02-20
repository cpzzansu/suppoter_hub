package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.MatchedPartyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface MatchedPartyMemberRepository extends JpaRepository<MatchedPartyMember, Long> {
    boolean existsByContactIdAndPartyMemberId(Long contactId, Long partyMemberId);

    @Query("SELECT COUNT(m) > 0 FROM MatchedPartyMember m WHERE m.partyMember.id = :partyMemberId AND m.contact.phone = :phone")
    boolean existsByPartyMemberIdAndContactPhone(@Param("partyMemberId") Long partyMemberId, @Param("phone") String phone);

    @Query("SELECT DISTINCT m.contact.phone FROM MatchedPartyMember m WHERE m.contact.phone IN :phones")
    List<String> findExistingMatchedPhones(@Param("phones") Collection<String> phones);
}
